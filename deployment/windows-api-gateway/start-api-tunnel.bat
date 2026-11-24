@echo off
"C:\Cloudflared\cloudflared.exe" tunnel --config "%USERPROFILE%\.cloudflared\config.yml" run vdc-booking-api
