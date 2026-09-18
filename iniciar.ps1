# Campus Virtual Centuria - Servidor Local Estático
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  CAMPUS VIRTUAL CENTURIA" -ForegroundColor Cyan
Write-Host "  Instituto Superior Centuria" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "[OK] Modo 100% Estático (Servidor Cloud + GitHub Pages)" -ForegroundColor Green
Write-Host "[OK] Iniciando servidor web local en http://127.0.0.1:8080..." -ForegroundColor Green
Write-Host ""
Write-Host "  Abre en tu navegador:"
Write-Host "  http://127.0.0.1:8080" -ForegroundColor Green
Write-Host ""
Write-Host "  Para detener: presiona Ctrl+C o cierra esta ventana"
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

Start-Process "http://127.0.0.1:8080"
python -m http.server 8080 --bind 127.0.0.1
