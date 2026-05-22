"""
Flask 主程式
提供 Web 介面、SocketIO 即時推送，協調音訊截取與 AI 分析。
"""

import os
import threading
import time
from datetime import datetime

from dotenv import load_dotenv
from flask import Flask, render_template_string, jsonify, request
from flask_socketio import SocketIO, emit

import audio_capture
import ai_analyzer
import export_minutes as exporter

# 優先載入 .env
load_dotenv()

app = Flask(__name__)
app.config["SECRET_KEY"] = os.getenv("FLASK_SECRET_KEY", "meeting-ai-secret-2024")
socketio = SocketIO(app, cors_allowed_origins="*", async_mode="eventlet")

# 設定
ANALYZE_INTERVAL = int(os.getenv("ANALYZE_INTERVAL", "60"))
FLASK_HOST = os.getenv("FLASK_HOST", "127.0.0.1")
FLASK_PORT = int(os.getenv("FLASK_PORT", "5000"))

# 最新 AI 分析結果（供新連線的客戶端立即取得）
_latest_analysis: dict = {}
_analysis_lock = threading.Lock()


# ── 音訊截取回呼 ──────────────────────────────────────
def _on_new_transcript(entry: dict):
    """新逐字稿產生時，透過 SocketIO 推送給所有客戶端。"""
    socketio.emit("new_transcript", entry)


# ── 定時 AI 分析執行緒 ────────────────────────────────
def _analysis_loop():
    """每隔 ANALYZE_INTERVAL 秒，對累積的逐字稿進行 AI 分析。"""
    while True:
        time.sleep(ANALYZE_INTERVAL)
        _trigger_analysis()


def _trigger_analysis():
    """立即執行 AI 分析並推送結果。"""
    global _latest_analysis

    with audio_capture._buffer_lock:
        # 取得目前所有逐字稿（分析最近 30 條以避免 token 過長）
        entries = list(audio_capture.transcript_buffer[-30:])

    if not entries:
        print("[AI 分析] 逐字稿為空，跳過本次分析")
        return

    print(f"[AI 分析] 開始分析 {len(entries)} 條逐字稿...")
    result = ai_analyzer.analyze_transcript(entries)

    with _analysis_lock:
        _latest_analysis = result

    socketio.emit("ai_analysis", result)
    print(f"[AI 分析] 完成，時間：{result.get('timestamp')}")


# ── Flask 路由 ────────────────────────────────────────
@app.route("/")
def index():
    """提供 dashboard.html 介面。"""
    dashboard_path = os.path.join(os.path.dirname(__file__), "dashboard.html")
    with open(dashboard_path, "r", encoding="utf-8") as f:
        html = f.read()
    return html


@app.route("/api/status")
def api_status():
    """回傳目前錄音狀態與已錄時長。"""
    return jsonify({
        "is_recording": audio_capture.is_recording(),
        "duration_seconds": audio_capture.get_recording_duration(),
        "transcript_count": len(audio_capture.transcript_buffer),
    })


@app.route("/api/analysis")
def api_analysis():
    """回傳最新 AI 分析結果。"""
    with _analysis_lock:
        return jsonify(_latest_analysis)


@app.route("/export", methods=["POST"])
def export():
    """觸發完整會議紀錄匯出。"""
    with audio_capture._buffer_lock:
        entries = list(audio_capture.transcript_buffer)
    duration = audio_capture.get_recording_duration()

    def _do_export():
        try:
            filepath = exporter.export_to_markdown(entries, duration)
            socketio.emit("export_done", {"filepath": filepath, "success": True})
            print(f"[匯出] 會議紀錄已儲存：{filepath}")
        except Exception as e:
            socketio.emit("export_done", {"error": str(e), "success": False})
            print(f"[匯出錯誤] {e}")

    threading.Thread(target=_do_export, daemon=True).start()
    return jsonify({"message": "匯出中，請稍候..."})


@app.route("/api/analyze", methods=["POST"])
def manual_analyze():
    """手動觸發 AI 分析。"""
    threading.Thread(target=_trigger_analysis, daemon=True).start()
    return jsonify({"message": "AI 分析已觸發"})


# ── SocketIO 事件 ─────────────────────────────────────
@socketio.on("connect")
def handle_connect():
    """客戶端連線時，推送目前狀態與最新分析。"""
    print(f"[SocketIO] 客戶端連線")

    # 推送目前所有逐字稿
    with audio_capture._buffer_lock:
        for entry in audio_capture.transcript_buffer:
            emit("new_transcript", entry)

    # 推送最新 AI 分析
    with _analysis_lock:
        if _latest_analysis:
            emit("ai_analysis", _latest_analysis)

    # 推送錄音狀態
    emit("status_update", {
        "is_recording": audio_capture.is_recording(),
        "duration_seconds": audio_capture.get_recording_duration(),
    })


@socketio.on("disconnect")
def handle_disconnect():
    print(f"[SocketIO] 客戶端斷線")


@socketio.on("request_analysis")
def handle_request_analysis():
    """客戶端請求立即分析。"""
    threading.Thread(target=_trigger_analysis, daemon=True).start()


# ── 主程式入口 ────────────────────────────────────────
def main():
    device_index = os.getenv("AUDIO_DEVICE_INDEX")

    if device_index is not None:
        device_index = int(device_index)
    else:
        device_index = audio_capture.select_device_interactive()

    # 啟動定時分析執行緒
    analysis_thread = threading.Thread(target=_analysis_loop, daemon=True)
    analysis_thread.start()

    # 狀態推送執行緒（每秒更新錄音時長）
    def _status_loop():
        while True:
            time.sleep(1)
            socketio.emit("status_update", {
                "is_recording": audio_capture.is_recording(),
                "duration_seconds": audio_capture.get_recording_duration(),
            })

    threading.Thread(target=_status_loop, daemon=True).start()

    # 啟動音訊截取執行緒（非阻塞）
    def _start_audio():
        audio_capture.start_capture(
            device_index=device_index,
            on_transcript=_on_new_transcript,
        )

    audio_thread = threading.Thread(target=_start_audio, daemon=True)
    audio_thread.start()

    print(f"\n[伺服器] 啟動中... 請開啟瀏覽器訪問 http://{FLASK_HOST}:{FLASK_PORT}")
    print(f"[設定] AI 分析間隔：{ANALYZE_INTERVAL} 秒")

    # 啟動 Flask（使用 eventlet）
    socketio.run(
        app,
        host=FLASK_HOST,
        port=FLASK_PORT,
        debug=os.getenv("FLASK_DEBUG", "false").lower() == "true",
    )


if __name__ == "__main__":
    main()
