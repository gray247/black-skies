@echo off
setlocal

set "HOOK_DIR=%~dp0"
for %%I in ("%HOOK_DIR%..\..") do set "REPO_ROOT=%%~fI"

set "PYTHON_BIN=%PYTHON_BIN%"
if not defined PYTHON_BIN set "PYTHON_BIN=python"

"%PYTHON_BIN%" "%REPO_ROOT%\scripts\check_repo_hygiene.py" --staged
