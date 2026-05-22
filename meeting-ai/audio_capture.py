"""
音訊截取模組
使用 sounddevice WASAPI loopback 截取系統音訊，再透過 faster-whisper 轉錄逐字稿。
"""

import argparse
import os
import queue
import threading
import time
from datetime import datetime
from typing import Callable, Optional

import numpy as np
import sounddevice as sd
from faster_whisper import WhisperModel
from dotenv import load_dotenv

load_dotenv()

# 全域逐字稿緩衝區
transcript_buffer: list[dict] = []
_buffer_lock = threading.Lock()

# 音訊佇列（截取執行緒 → 轉錄執行緒）
_audio_queue: queue.Queue = queue.Queue()

# 狀態旗標
_is_recording = False
_start_time: Optional[float] = None


def list_audio_devices() -> list[dict]:
    """列出所有可用音訊裝置，標示 WASAPI loopback 支援。"""
    devices = sd.query_devices()
    result = []
    for idx, dev in enumerate(devices):
        if dev["max_input_channels"] > 0:
            result.append({
                "index": idx,
                "name": dev["name"],
                "channels": dev["max_input_channels"],
                "sample_rate": int(dev["default_samplerate"]),
            })
    return result


def select_device_interactive() -> int:
    """互動式選擇音訊裝置，回傳裝置編號。"""
    devices = list_audio_devices()
    print("\n=== 可用音訊輸入裝置 ===")
    for dev in devices:
        tag = " [WASAPI Loopback 建議]" if "stereo mix" in dev["name"].lower() or "loopback" in dev["name"].lower() else ""
        print(f"  [{dev['index']}] {dev['name']} (聲道:{dev['channels']}, 取樣率:{dev['sample_rate']}Hz){tag}")
    print()

    while True:
        try:
            choice = input("請輸入裝置編號（建議選擇 Stereo Mix 或 Loopback 裝置）: ").strip()
            idx = int(choice)
            if any(d["index"] == idx for d in devices):
                return idx
            print("錯誤：請輸入清單中的有效編號")
        except (ValueError, KeyboardInterrupt):
            print("錯誤：請輸入數字")


def _audio_callback(indata: np.ndarray, frames: int, time_info, status):
    """sounddevice 音訊回呼，將原始音訊放入佇列。"""
    if status:
        print(f"[音訊警告] {status}")
    # 複製一份避免緩衝區被覆寫
    _audio_queue.put(indata.copy())


def _transcription_worker(
    model: WhisperModel,
    chunk_seconds: int,
    sample_rate: int,
    on_transcript: Optional[Callable[[dict], None]],
):
    """
    轉錄工作執行緒：
    累積 chunk_seconds 秒的音訊 → 送 Whisper 轉錄 → 存入 buffer。
    """
    samples_per_chunk = sample_rate * chunk_seconds
    accumulated = np.array([], dtype=np.float32)

    while _is_recording or not _audio_queue.empty():
        try:
            chunk = _audio_queue.get(timeout=1.0)
            # 轉為單聲道 float32
            mono = chunk.mean(axis=1) if chunk.ndim > 1 else chunk.flatten()
            accumulated = np.concatenate([accumulated, mono])

            # 累積夠長才轉錄
            if len(accumulated) < samples_per_chunk:
                continue

            audio_chunk = accumulated[:samples_per_chunk].astype(np.float32)
            accumulated = accumulated[samples_per_chunk:]

            # 靜音偵測：RMS 過低就跳過
            rms = np.sqrt(np.mean(audio_chunk ** 2))
            if rms < 0.001:
                continue

            # Whisper 轉錄（language=None 自動偵測中英文）
            segments, info = model.transcribe(
                audio_chunk,
                language=None,
                beam_size=5,
                vad_filter=True,
                vad_parameters={"min_silence_duration_ms": 500},
            )

            text = " ".join(seg.text for seg in segments).strip()
            if not text:
                continue

            timestamp = datetime.now().strftime("%H:%M:%S")
            elapsed = int(time.time() - _start_time) if _start_time else 0

            entry = {
                "timestamp": timestamp,
                "elapsed_seconds": elapsed,
                "text": text,
                "language": info.language,
            }

            # 加入全域緩衝區（執行緒安全）
            with _buffer_lock:
                transcript_buffer.append(entry)

            print(f"[{timestamp}] {text}")

            # 通知呼叫方（例如 SocketIO emit）
            if on_transcript:
                on_transcript(entry)

        except queue.Empty:
            continue
        except Exception as e:
            print(f"[轉錄錯誤] {e}")


def start_capture(
    device_index: int,
    on_transcript: Optional[Callable[[dict], None]] = None,
    chunk_seconds: Optional[int] = None,
    model_size: Optional[str] = None,
):
    """
    啟動音訊截取與轉錄。
    此函式會阻塞直到 stop_capture() 被呼叫。
    """
    global _is_recording, _start_time

    chunk_seconds = chunk_seconds or int(os.getenv("CHUNK_SECONDS", "5"))
    model_size = model_size or os.getenv("WHISPER_MODEL", "medium")

    print(f"[初始化] 載入 Whisper 模型：{model_size}（首次載入需要時間）")
    model = WhisperModel(model_size, device="cpu", compute_type="int8")
    print("[初始化] Whisper 模型載入完成")

    # 取得裝置取樣率
    device_info = sd.query_devices(device_index)
    sample_rate = int(device_info["default_samplerate"])
    channels = min(int(device_info["max_input_channels"]), 2)

    print(f"[開始錄音] 裝置：{device_info['name']} | 取樣率：{sample_rate}Hz | 聲道：{channels}")

    _is_recording = True
    _start_time = time.time()

    # 啟動轉錄執行緒
    t = threading.Thread(
        target=_transcription_worker,
        args=(model, chunk_seconds, sample_rate, on_transcript),
        daemon=True,
    )
    t.start()

    # 開始截取系統音訊（WASAPI loopback 需以 extra_settings 啟用）
    try:
        with sd.InputStream(
            device=device_index,
            channels=channels,
            samplerate=sample_rate,
            dtype="float32",
            callback=_audio_callback,
            latency="low",
        ):
            print("[錄音中] 按 Ctrl+C 停止...")
            while _is_recording:
                time.sleep(0.1)
    except KeyboardInterrupt:
        pass
    except Exception as e:
        print(f"[音訊截取錯誤] {e}")
    finally:
        stop_capture()
        t.join(timeout=10)
        print("[錄音結束]")


def stop_capture():
    """停止音訊截取。"""
    global _is_recording
    _is_recording = False


def get_recording_duration() -> int:
    """回傳已錄音秒數。"""
    if _start_time is None:
        return 0
    return int(time.time() - _start_time)


def is_recording() -> bool:
    return _is_recording


# ── 命令列模式（測試用）──────────────────────────────
if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="音訊截取 + Whisper 轉錄")
    parser.add_argument("--device", type=int, default=None, help="音訊裝置編號")
    parser.add_argument("--model", type=str, default=None, help="Whisper 模型大小")
    parser.add_argument("--chunk", type=int, default=None, help="音訊塊長度（秒）")
    args = parser.parse_args()

    device = args.device if args.device is not None else select_device_interactive()
    start_capture(device, chunk_seconds=args.chunk, model_size=args.model)
