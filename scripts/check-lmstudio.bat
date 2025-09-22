@echo off
echo 🔍 Diagnosi LMStudio Server
echo ==========================

set LMSTUDIO_URL=http://localhost:1234

echo.
echo 1. Verifica se la porta 1234 è in ascolto...
netstat -an | findstr :1234
if %errorlevel%==0 (
    echo ✓ Porta 1234 in ascolto
) else (
    echo ✗ Porta 1234 non in ascolto
    echo ℹ Assicurati che LMStudio sia avviato
)

echo.
echo 2. Test connessione HTTP...
curl -s -I %LMSTUDIO_URL% >nul 2>&1
if %errorlevel%==0 (
    echo ✓ Server HTTP risponde
) else (
    echo ✗ Server HTTP non risponde
    echo ℹ Verifica che LMStudio sia in esecuzione
    goto end
)

echo.
echo 3. Test endpoint models...
curl -s %LMSTUDIO_URL%/v1/models
if %errorlevel%==0 (
    echo ✓ Endpoint models raggiungibile
) else (
    echo ✗ Endpoint models non risponde
)

echo.
echo 4. Verifica processi LMStudio...
tasklist | findstr /i lmstudio
if %errorlevel%==0 (
    echo ✓ Processo LMStudio trovato
) else (
    echo ✗ Processo LMStudio non trovato
)

:end
echo.
echo 🎯 Per testare manualmente: curl %LMSTUDIO_URL%/v1/models
echo ✅ Diagnosi completata!
pause