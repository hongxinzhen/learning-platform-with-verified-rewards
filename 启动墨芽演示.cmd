@echo off
cd /d "%~dp0"
set PORT=4174
set MOYA_DEMO=1
set MOYA_DATA_DIR=%~dp0data\qa-2026-10-29
node server.cjs
pause
