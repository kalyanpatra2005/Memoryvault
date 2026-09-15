@echo off
echo ========================================================
echo Starting The Memory Vault & Tragic Diary Application...
echo ========================================================
echo Starting Backend Server on http://localhost:5000...
start cmd /k "cd server && npm start"
timeout /t 2 /nobreak >nul
echo Starting Frontend Client on http://localhost:5173...
start cmd /k "cd client && npm run dev"
echo.
echo Application is launched!
echo Open your browser at: http://localhost:5173
echo ========================================================
pause
