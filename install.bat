@echo off
set PATH=C:\Program Files\nodejs;%PATH%
cd /d C:\Users\Pit\Projects_VS\ScoreBoard
if exist node_modules rmdir /s /q node_modules
npm install
