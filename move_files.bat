@echo off
cd /d "T:\Cadet's Compass"

REM Move server contents to backend
xcopy /E /I /Y server backend
rmdir /S /Q server

REM Move frontend folders
move views frontend
move public frontend
move config frontend
move package.json frontend
move package-lock.json frontend

echo Files moved successfully!
