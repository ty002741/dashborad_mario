@echo off
chcp 65001 >nul
title 會議 AI 助理 - 首次安裝
cd /d "%~dp0"

echo ================================================
echo   會議 AI 助理 - 首次安裝
echo ================================================
echo.

:: 確認 Python 存在
python --version >nul 2>&1
if errorlevel 1 (
    echo [錯誤] 找不到 Python，請先安裝 Python 3.11
    echo        下載：https://www.python.org/downloads/
    pause
    exit /b 1
)

:: 建立虛擬環境
if exist "venv\Scripts\python.exe" (
    echo [跳過] 虛擬環境已存在
) else (
    echo [1/3] 建立虛擬環境...
    python -m venv venv
    if errorlevel 1 (
        echo [錯誤] 建立虛擬環境失敗
        pause
        exit /b 1
    )
    echo       完成
)

:: 安裝套件
echo [2/3] 安裝套件（首次需要 3-5 分鐘）...
call venv\Scripts\activate.bat
python -m pip install --upgrade pip -q
pip install -r requirements.txt
if errorlevel 1 (
    echo [錯誤] 套件安裝失敗，請確認網路連線
    pause
    exit /b 1
)
echo       完成

:: 建立 .env
echo [3/3] 設定環境變數...
if not exist ".env" (
    copy .env.example .env >nul
    echo       已建立 .env，請確認設定
    echo.
    echo [提示] 用記事本開啟 .env 確認設定後，關閉記事本繼續
    notepad .env
) else (
    echo       .env 已存在，跳過
)

echo.
echo ================================================
echo   安裝完成！請雙擊 start.bat 啟動程式
echo ================================================
pause
