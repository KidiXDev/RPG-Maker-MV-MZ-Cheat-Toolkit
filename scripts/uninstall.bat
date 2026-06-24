@echo off
setlocal
node "%~dp0uninstall.mjs" %*
if %ERRORLEVEL% neq 0 pause
