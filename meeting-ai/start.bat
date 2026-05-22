@echo off
chcp 65001 >nul
title 會議 AI 助理
cd /d "%~dp0"

:: 確認已安裝
if not exist "venv\Scripts\python.exe" (
    echo [錯誤] 尚未安裝，請先雙擊執行 setup.bat
    pause
    exit /b 1
)

:: 確認 .env 存在
if not exist ".env" (
    copy .env.example .env >nul
    echo [提示] 已建立 .env，請填入設定後重新啟動
    notepad .env
    pause
    exit /b 0
)

:: 取得本機 IP 顯示給使用者
echo ================================================
echo   會議 AI 助理 啟動中...
echo ================================================
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4"') do (
    set IP=%%a
    goto :show_ip
)
:show_ip
set IP=%IP: =%
echo.
echo   電腦瀏覽器：http://localhost:5000
echo   手機瀏覽器：http://%IP%:5000
echo.
echo   [提示] 請確認手機與電腦在同一個 Wi-Fi
echo   [提示] 按 Ctrl+C 或關閉此視窗停止程式
echo ================================================
echo.

:: 啟動
call venv\Scripts\activate.bat
python app.py

echo.
echo [程式已停止]
pause
