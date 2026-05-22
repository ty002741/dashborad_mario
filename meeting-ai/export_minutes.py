"""
會議紀錄匯出模組
將完整逐字稿送給 Claude API 產生 Markdown 格式會議紀錄，並儲存為檔案。
"""

import os
from datetime import datetime

from dotenv import load_dotenv

import ai_analyzer

load_dotenv()


def export_to_markdown(
    transcript_entries: list[dict],
    duration_seconds: int,
    output_dir: str = ".",
) -> str:
    """
    產生並儲存 Markdown 格式會議紀錄。

    Args:
        transcript_entries: 完整逐字稿列表
        duration_seconds: 會議總時長（秒）
        output_dir: 輸出目錄，預設為當前目錄

    Returns:
        儲存的檔案路徑
    """
    print(f"[匯出] 開始產生會議紀錄（共 {len(transcript_entries)} 條逐字稿）")

    # 呼叫 AI 產生完整會議紀錄
    markdown_content = ai_analyzer.generate_full_minutes(transcript_entries, duration_seconds)

    # 檔名包含日期時間
    now = datetime.now()
    filename = f"minutes_{now.strftime('%Y%m%d_%H%M')}.md"
    filepath = os.path.join(output_dir, filename)

    os.makedirs(output_dir, exist_ok=True)

    with open(filepath, "w", encoding="utf-8") as f:
        f.write(markdown_content)

    print(f"[匯出] 完成：{filepath}")
    return filepath


# ── 命令列模式（從 JSON 檔案匯入後匯出）─────────────────
if __name__ == "__main__":
    import argparse
    import json

    parser = argparse.ArgumentParser(description="從逐字稿 JSON 匯出 Markdown 會議紀錄")
    parser.add_argument("--input", type=str, required=True, help="逐字稿 JSON 檔案路徑")
    parser.add_argument("--duration", type=int, default=0, help="會議時長（秒）")
    parser.add_argument("--output-dir", type=str, default=".", help="輸出目錄")
    args = parser.parse_args()

    with open(args.input, "r", encoding="utf-8") as f:
        entries = json.load(f)

    filepath = export_to_markdown(entries, args.duration, args.output_dir)
    print(f"會議紀錄已匯出至：{filepath}")
