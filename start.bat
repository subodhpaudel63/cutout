@echo off
cd /d "%~dp0"
set PYCMD=python
where py >nul 2>nul && set PYCMD=py -3
%PYCMD% launch.py
if errorlevel 1 (
  echo.
  echo Could not start. Install Python 3.9 or newer from python.org and tick Add Python to PATH.
  pause
)
