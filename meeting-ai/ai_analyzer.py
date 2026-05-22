"""
AI 分析模組
使用 Anthropic Claude API 分析逐字稿，回傳摘要、待問問題、行動項目。
"""

import json
import os
import time
from datetime import datetime
from typing import Optional

import anthropic
from dotenv import load_dotenv

load_dotenv()

# 系統提示詞（針對 IT/MES/製造業會議優化）
_SYSTEM_PROMPT = """你是一位專業的 IT 與製造業會議助理，專注於 MES（製造執行系統）、ERP、品質管理、供應鏈等領域。

請根據提供的會議逐字稿，以繁體中文完成以下分析：

1. **重點摘要**：條列式列出最重要的 3-5 個討論重點
2. **待釐清問題**：列出目前仍未解決或需要跟進的問題
3. **行動項目**：明確的待辦事項，若有提到負責人請一併列出

請以 JSON 格式回應，格式如下：
{
  "summary": ["重點1", "重點2", "重點3"],
  "pending_questions": ["待釐清問題1", "待釐清問題2"],
  "action_items": ["行動項目1（負責人：XXX）", "行動項目2"],
  "timestamp": "HH:MM:SS"
}

注意事項：
- 若逐字稿為空或內容不足，在對應欄位回傳空陣列
- 保持客觀中立，忠實反映會議內容
- 技術術語保留原文（如 MES、ERP、API 等）
- timestamp 填入當前分析時間"""

_client: Optional[anthropic.Anthropic] = None


def _get_client() -> anthropic.Anthropic:
    """取得（或建立）Anthropic 客戶端。"""
    global _client
    if _client is None:
        api_key = os.getenv("ANTHROPIC_API_KEY")
        if not api_key or api_key == "your_key_here":
            raise ValueError("請在 .env 檔案中設定有效的 ANTHROPIC_API_KEY")
        _client = anthropic.Anthropic(api_key=api_key)
    return _client


def analyze_transcript(transcript_entries: list[dict], max_retries: int = 3) -> dict:
    """
    分析逐字稿列表，回傳結構化 JSON 分析結果。

    Args:
        transcript_entries: 逐字稿條目列表，每項含 timestamp 與 text
        max_retries: API 失敗最多重試次數

    Returns:
        含 summary / pending_questions / action_items / timestamp 的 dict
    """
    now = datetime.now().strftime("%H:%M:%S")

    # 組合逐字稿文字
    if not transcript_entries:
        return {
            "summary": [],
            "pending_questions": [],
            "action_items": [],
            "timestamp": now,
        }

    transcript_text = "\n".join(
        f"[{entry['timestamp']}] {entry['text']}"
        for entry in transcript_entries
    )

    user_message = f"以下是最新的會議逐字稿，請進行分析：\n\n{transcript_text}"

    # 重試機制
    last_error = None
    for attempt in range(1, max_retries + 1):
        try:
            client = _get_client()
            message = client.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=1024,
                system=_SYSTEM_PROMPT,
                messages=[{"role": "user", "content": user_message}],
            )

            raw = message.content[0].text.strip()

            # 嘗試從回應中提取 JSON
            json_start = raw.find("{")
            json_end = raw.rfind("}") + 1
            if json_start >= 0 and json_end > json_start:
                raw = raw[json_start:json_end]

            result = json.loads(raw)

            # 確保所有欄位存在
            result.setdefault("summary", [])
            result.setdefault("pending_questions", [])
            result.setdefault("action_items", [])
            result["timestamp"] = now

            return result

        except anthropic.RateLimitError:
            wait = 2 ** attempt
            print(f"[AI 分析] Rate limit，{wait} 秒後重試（第 {attempt}/{max_retries} 次）")
            time.sleep(wait)
            last_error = "超過 API 速率限制"

        except anthropic.APIError as e:
            wait = 2 ** attempt
            print(f"[AI 分析錯誤] API 錯誤：{e}，{wait} 秒後重試（第 {attempt}/{max_retries} 次）")
            time.sleep(wait)
            last_error = str(e)

        except json.JSONDecodeError as e:
            print(f"[AI 分析錯誤] JSON 解析失敗：{e}")
            last_error = f"回應格式錯誤：{e}"
            break  # JSON 錯誤不重試

        except Exception as e:
            print(f"[AI 分析錯誤] 未預期錯誤：{e}")
            last_error = str(e)
            break

    # 所有重試失敗
    return {
        "summary": [f"分析失敗：{last_error}"],
        "pending_questions": [],
        "action_items": [],
        "timestamp": now,
        "error": last_error,
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
        f"[{entry['timestamp']}] {entry['text']}"
        for entry in transcript_entries
    )

    hours, remainder = divmod(duration_seconds, 3600)
    minutes, seconds = divmod(remainder, 60)
    duration_str = f"{hours:02d}:{minutes:02d}:{seconds:02d}"
    start_time = transcript_entries[0]["timestamp"] if transcript_entries else "N/A"
    end_time = transcript_entries[-1]["timestamp"] if transcript_entries else "N/A"

    system_prompt = """你是專業的會議記錄員。請根據完整逐字稿產生詳細的 Markdown 格式會議紀錄，以繁體中文撰寫。

會議紀錄必須包含以下章節：
1. 會議基本資訊（時間、時長）
2. 完整逐字稿（原文保留）
3. 重點摘要（條列式）
4. 決議事項
5. 行動項目（含負責人，若逐字稿中有提及）

格式要求：使用標準 Markdown，標題用 #/##/###，清單用 -"""

    user_message = f"""請根據以下資訊產生完整的會議紀錄：

**會議時間：** {start_time} ~ {end_time}
**總時長：** {duration_str}

**完整逐字稿：**
{transcript_text}"""

    try:
        client = _get_client()
        message = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=4096,
            system=system_prompt,
            messages=[{"role": "user", "content": user_message}],
        )
        return message.content[0].text
    except Exception as e:
        print(f"[會議紀錄錯誤] {e}")
        # 降級：用簡單格式輸出
        lines = [
            f"# 會議紀錄",
            f"",
            f"**會議時間：** {start_time} ~ {end_time}",
            f"**總時長：** {duration_str}",
            f"",
            f"## 完整逐字稿",
            f"",
            transcript_text,
            f"",
            f"---",
            f"*AI 摘要產生失敗：{e}*",
        ]
        return "\n".join(lines)
