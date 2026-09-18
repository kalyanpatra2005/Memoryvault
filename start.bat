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
echo ========================================================
echo Application is launched!
echo.
echo 💻 On this Laptop: Open http://localhost:5173
echo 📱 On your Mobile Phone (Same Wi-Fi): Open http://192.168.0.36:5173
echo.
echo Any photo or diary uploaded on your phone will immediately
echo appear on your laptop because both connect to the same vault!
echo ========================================================
pause
