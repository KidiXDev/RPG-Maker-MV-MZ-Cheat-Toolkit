@echo off
setlocal
node "%~dp0install.mjs" %*
if %ERRORLEVEL% neq 0 pause
