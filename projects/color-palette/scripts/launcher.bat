@echo off
chcp 936 >nul
title 配色工坊 v1 - 一键打开
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 goto nonode

node -e "require('http').get('http://localhost:4180/',function(r){process.exit(r.statusCode===200?0:1)}).on('error',function(){process.exit(1)})"
if errorlevel 1 goto startserver

echo.
echo 检测到预览服务已在运行，直接打开浏览器...
goto open

:startserver
echo.
echo 正在启动本地预览服务...
start "配色工坊 v1 预览（关闭此窗口即停止）" cmd /k node serve.mjs
timeout /t 3 /nobreak >nul

:open
start "" "http://localhost:4180/"
exit /b 0

:nonode
echo.
echo 没有找到 Node.js，无法启动本地预览。
echo 请先安装 Node.js（https://nodejs.org/）后重试。
echo.
pause
exit /b 1