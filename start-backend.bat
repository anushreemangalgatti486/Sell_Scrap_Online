@echo off
title ScrapBazaar Backend
echo.
echo  ==========================================
echo   ScrapBazaar Backend Starting...
echo  ==========================================
echo.
cd /d "%~dp0backend"
node server.js
pause
