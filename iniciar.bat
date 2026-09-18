@echo off
title Campus Virtual Centuria - Servidor Local
echo ============================================
echo   CAMPUS VIRTUAL CENTURIA
echo   Instituto Superior Centuria
echo ============================================
echo.

:: Liberar puerto 8080 si habia un proceso php anterior
taskkill /F /IM php.exe >nul 2>&1

echo [OK] Modo 100%% Estatico (Servidor Cloud + GitHub Pages)
echo [OK] Iniciando servidor web local en http://127.0.0.1:8080
echo.
echo ============================================
echo   Abre en tu navegador:
echo   http://127.0.0.1:8080
echo.
echo   Para detener: cierra esta ventana
echo ============================================
echo.

:: Abrir navegador automaticamente
start http://127.0.0.1:8080

:: Servir archivos estaticos con Python o npx si estan disponibles
python -m http.server 8080 --bind 127.0.0.1 2>nul
if errorlevel 1 (
    npx -y serve -l 8080 . 2>nul
)

pause
