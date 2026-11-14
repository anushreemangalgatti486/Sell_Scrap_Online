@echo off
title ScrapBazaar Frontend
echo.
echo  ==========================================
echo   ScrapBazaar Frontend Starting...
echo  ==========================================
echo.
cd /d "%~dp0frontend"
node node_modules/vite/bin/vite.js --port 5173 --force
pause
