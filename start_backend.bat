@echo off
echo ===================================================
echo Starting Nexgile-DecarbX FastAPI Backend Server...
echo ===================================================
cd backend
python seed.py
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
pause
