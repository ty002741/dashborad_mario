# Windows 本地會議 AI 助理

在 Teams 語音/視訊會議進行中，即時截取系統音訊 → Whisper 轉錄逐字稿 → Claude API 分析 → 瀏覽器即時顯示摘要與待問問題。

---

## 環境需求

- Windows 10 / 11（64-bit）
- Python 3.11
- 麥克風或 Stereo Mix（用於截取系統聲音）
- Anthropic API Key

---

## 安裝步驟

### 1. 安裝 FFmpeg（Whisper 依賴）

開啟 **PowerShell（系統管理員）** 執行：

```powershell
winget install Gyan.FFmpeg
```

安裝完成後關閉並重新開啟 PowerShell，確認：

```powershell
ffmpeg -version
```

### 2. 啟用 Stereo Mix（WASAPI Loopback）

Stereo Mix 可截取電腦播放的所有聲音，包含 Teams 遠端音訊。

1. 右鍵點擊工作列音量圖示 → **聲音設定**
2. 點擊 **更多聲音設定**（或 控制台 > 聲音）
3. 切換到 **錄製** 分頁
4. 在空白處右鍵 → 勾選 **顯示停用的裝置**
5. 找到 **Stereo Mix** → 右鍵 → **啟用**
6. 右鍵 → **設定為預設裝置**（選用）

> **注意：** 部分音效卡不支援 Stereo Mix。若找不到，可使用虛擬音訊線（如 [VB-Cable](https://vb-audio.com/Cable/)）替代。

### 3. 建立虛擬環境並安裝套件

```powershell
cd meeting-ai
python -m venv venv
.\venv\Scripts\Activate.ps1

pip install --upgrade pip
pip install -r requirements.txt
```

> **GPU 加速（選用）：** 若有 NVIDIA GPU，可將 `requirements.txt` 中 `faster-whisper` 安裝後另執行：
> ```powershell
> pip install ctranslate2 --extra-index-url https://download.pytorch.org/whl/cu121
> ```

### 4. 設定環境變數

複製範本並填入 API Key：

```powershell
copy .env.example .env
notepad .env
```

編輯 `.env` 內容：

```env
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxxxxxxxxxxxx
ANALYZE_INTERVAL=60
WHISPER_MODEL=medium
```

- `ANTHROPIC_API_KEY`：從 [Anthropic Console](https://console.anthropic.com/) 取得
- `ANALYZE_INTERVAL`：AI 自動分析間隔（秒），預設 60 秒
- `WHISPER_MODEL`：`tiny`（快速）/ `base` / `small` / `medium`（建議）/ `large-v2`（最精確）

---

## 啟動

```powershell
# 確保虛擬環境已啟動
.\venv\Scripts\Activate.ps1

# 啟動主程式（互動選擇音訊裝置）
python app.py

# 或直接指定裝置編號（略過互動選擇）
set AUDIO_DEVICE_INDEX=3
python app.py
```

啟動後開啟瀏覽器訪問：

```
http://127.0.0.1:5000
```

---

## 使用說明

| 功能 | 操作 |
|------|------|
| 即時逐字稿 | 自動顯示於左欄，含時間戳 |
| 自動 AI 分析 | 每 60 秒（可調整）自動觸發 |
| 手動 AI 分析 | 點擊右上角「⚡ 立即分析」 |
| 匯出會議紀錄 | 點擊右下角「📄 匯出會議紀錄」，產生 `minutes_YYYYMMDD_HHMM.md` |
| 停止錄音 | 在終端機按 Ctrl+C |

### 只列出裝置（不啟動錄音）

```powershell
python audio_capture.py --device 99  # 輸入不存在的編號會列出裝置
```

### 從現有逐字稿匯出（命令列）

```powershell
python export_minutes.py --input transcript.json --duration 3600
```

---

## 常見問題排除

### Q1：找不到 Stereo Mix / 無法截取 Teams 聲音

**解法：**
- 確認已依上述步驟啟用 Stereo Mix
- 若音效卡不支援，安裝 [VB-Cable](https://vb-audio.com/Cable/) 後將 Teams 音訊輸出設為 VB-Cable，再選 VB-Cable 作為輸入裝置
- 在 Teams → 設定 → 裝置，確認喇叭選擇的是 VB-Cable

### Q2：Whisper 轉錄準確度低

**解法：**
- 改用較大模型：在 `.env` 設定 `WHISPER_MODEL=large-v2`
- 確認音訊品質夠好（無嚴重雜音）
- `medium` 模型已支援中英混合自動偵測

### Q3：`faster-whisper` 安裝失敗

**解法：**
```powershell
pip install --upgrade setuptools wheel
pip install faster-whisper
```

如仍失敗，嘗試：
```powershell
pip install faster-whisper --no-binary :all:
```

### Q4：Flask 啟動後瀏覽器無法連線

**解法：**
- 確認防火牆未阻擋 port 5000
- 嘗試更換 port：在 `.env` 設定 `FLASK_PORT=5001`
- 確認 eventlet 已正確安裝：`pip install eventlet`

### Q5：`python-dotenv` 找不到 / API Key 未載入

**解法：**
- 確認 `.env` 檔案在執行目錄下（`meeting-ai/` 資料夾）
- 確認 `.env` 不含多餘空格：`ANTHROPIC_API_KEY=sk-ant-xxx`（等號兩側無空格）

### Q6：AI 分析顯示「Rate limit」

**解法：**
- 增加分析間隔：`.env` 設定 `ANALYZE_INTERVAL=120`
- 確認 Anthropic 帳戶有足夠額度

---

## 專案結構

```
meeting-ai/
├── requirements.txt      # Python 依賴套件
├── .env.example          # 環境變數範本
├── .env                  # 實際設定（不納入版控）
├── audio_capture.py      # 音訊截取 + Whisper 轉錄
├── ai_analyzer.py        # Claude API 分析邏輯
├── app.py                # Flask 主程式 + SocketIO
├── dashboard.html        # 前端即時介面
├── export_minutes.py     # 會議結束後匯出完整會議紀錄
└── README.md             # 本說明文件
```

---

## 安全注意事項

- `.env` 檔案包含 API Key，**請勿上傳至 Git**（`.gitignore` 已預設排除）
- API Key 請定期輪換
- 會議錄音內容可能包含敏感資訊，請遵守公司資訊安全政策
