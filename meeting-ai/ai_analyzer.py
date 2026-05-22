"""
AI 分析模組
透過 `claude -p` CLI（pipe 模式）分析逐字稿，不需要 Anthropic API Key。
前提：已安裝 Claude Code CLI 且已登入（claude.ai 帳號）。
"""

import json
import os
import subprocess
import sys
import time
from datetime import datetime

# 針對 IT/MES/製造業會議優化的分析指令
_ANALYZE_PROMPT_TEMPLATE = """你是一位專業的 IT 與製造業會議助理，專注於 MES（製造執行系統）、ERP、品質管理、供應鏈等領域。

請根據以下會議逐字稿，以繁體中文完成分析，並**只輸出 JSON**，不要輸出其他文字。

輸出格式：
{{
  "summary": ["重點1", "重點2", "重點3"],
  "pending_questions": ["待釐清問題1", "待釐清問題2"],
  "action_items": ["行動項目1（負責人：XXX）", "行動項目2"],
  "timestamp": "{timestamp}"
}}

規則：
- 若內容不足，對應欄位回傳空陣列 []
- 保持客觀，忠實反映會議內容
- 技術術語保留原文（MES、ERP、API 等）
- 只輸出 JSON，不要加說明文字

逐字稿：
{transcript}"""

_MINUTES_PROMPT_TEMPLATE = """你是專業的會議記錄員，請根據以下逐字稿產生詳細的 Markdown 格式會議紀錄（繁體中文）。

會議時間：{start_time} ~ {end_time}
總時長：{duration}

必須包含章節：
1. 會議基本資訊
2. 完整逐字稿（原文保留）
3. 重點摘要（條列）
4. 決議事項
5. 行動項目（含負責人，若有提及）

逐字稿：
{transcript}"""


def _run_claude(prompt: str, timeout: int = 120, max_retries: int = 3) -> str:
    """
    呼叫 `claude -p` 並回傳輸出文字。
    Windows 上 claude CLI 通常位於 PATH 中（Claude Code 安裝後自動加入）。
    """
    # Windows 上可能需要 claude.cmd 或 claude.exe
    cmd = ["claude", "-p", prompt]

    last_error = None
    for attempt in range(1, max_retries + 1):
        try:
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=timeout,
                encoding="utf-8",
            )
            if result.returncode != 0:
                err = result.stderr.strip() or f"exit code {result.returncode}"
                raise RuntimeError(f"claude -p 回傳錯誤：{err}")
            return result.stdout.strip()

        except FileNotFoundError:
            raise RuntimeError(
                "找不到 claude 指令。請確認 Claude Code CLI 已安裝並加入 PATH。\n"
                "安裝說明：https://claude.ai/code"
            )
        except subprocess.TimeoutExpired:
            wait = 2 ** attempt
            print(f"[AI 分析] 逾時，{wait} 秒後重試（第 {attempt}/{max_retries} 次）")
            time.sleep(wait)
            last_error = "claude -p 執行逾時"
        except RuntimeError as e:
            wait = 2 ** attempt
            print(f"[AI 分析錯誤] {e}，{wait} 秒後重試（第 {attempt}/{max_retries} 次）")
            time.sleep(wait)
            last_error = str(e)
        except Exception as e:
            print(f"[AI 分析錯誤] 未預期錯誤：{e}")
            last_error = str(e)
            break

    raise RuntimeError(last_error or "claude -p 呼叫失敗")


def _extract_json(raw: str) -> dict:
    """從輸出中提取 JSON 物件（Claude 有時會加上說明文字）。"""
    start = raw.find("{")
    end = raw.rfind("}") + 1
    if start >= 0 and end > start:
        return json.loads(raw[start:end])
    raise json.JSONDecodeError("找不到 JSON 物件", raw, 0)


def analyze_transcript(transcript_entries: list[dict], max_retries: int = 3) -> dict:
    """
    分析逐字稿列表，回傳結構化 JSON 分析結果。

    Args:
        transcript_entries: 逐字稿條目列表，每項含 timestamp 與 text
        max_retries: 失敗最多重試次數

    Returns:
        含 summary / pending_questions / action_items / timestamp 的 dict
    """
    now = datetime.now().strftime("%H:%M:%S")

    if not transcript_entries:
        return {"summary": [], "pending_questions": [], "action_items": [], "timestamp": now}

    transcript_text = "\n".join(
        f"[{e['timestamp']}] {e['text']}" for e in transcript_entries
    )
    prompt = _ANALYZE_PROMPT_TEMPLATE.format(timestamp=now, transcript=transcript_text)

    try:
        raw = _run_claude(prompt, timeout=90, max_retries=max_retries)
        result = _extract_json(raw)
        result.setdefault("summary", [])
        result.setdefault("pending_questions", [])
        result.setdefault("action_items", [])
        result["timestamp"] = now
        return result
    except json.JSONDecodeError as e:
        print(f"[AI 分析錯誤] JSON 解析失敗：{e}")
        return {
            "summary": ["AI 回應格式錯誤，請重試"],
            "pending_questions": [],
            "action_items": [],
            "timestamp": now,
            "error": str(e),
        }
    except Exception as e:
        print(f"[AI 分析錯誤] {e}")
        return {
            "summary": [f"分析失敗：{e}"],
            "pending_questions": [],
            "action_items": [],
            "timestamp": now,
            "error": str(e),
        }


def generate_full_minutes(transcript_entries: list[dict], duration_seconds: int) -> str:
    """
    使用完整逐字稿產生 Markdown 格式會議紀錄。

    Args:
        transcript_entries: 完整逐字稿列表
        duration_seconds: 會議總時長（秒）

    Returns:
        Markdown 格式字串
    """
    if not transcript_entries:
        return "# 會議紀錄\n\n（無逐字稿內容）"

    transcript_text = "\n".join(
        f"[{e['timestamp']}] {e['text']}" for e in transcript_entries
    )
    h, rem = divmod(duration_seconds, 3600)
    m, s = divmod(rem, 60)
    duration_str = f"{h:02d}:{m:02d}:{s:02d}"
    start_time = transcript_entries[0]["timestamp"]
    end_time = transcript_entries[-1]["timestamp"]

    prompt = _MINUTES_PROMPT_TEMPLATE.format(
        start_time=start_time,
        end_time=end_time,
        duration=duration_str,
        transcript=transcript_text,
    )

    try:
        return _run_claude(prompt, timeout=180, max_retries=2)
    except Exception as e:
        print(f"[會議紀錄錯誤] {e}")
        return "\n".join([
            "# 會議紀錄",
            "",
            f"**會議時間：** {start_time} ~ {end_time}",
            f"**總時長：** {duration_str}",
            "",
            "## 完整逐字稿",
            "",
            transcript_text,
            "",
            "---",
            f"*AI 摘要產生失敗：{e}*",
        ])
