@echo off
cd /d "C:\Users\Reno James\timezone-map-site"
"C:\Program Files\Git\cmd\git.exe" status --short
"C:\Program Files\Git\cmd\git.exe" add index.html script.js styles.css
"C:\Program Files\Git\cmd\git.exe" commit -m "Add customer local-time lunch alert for 12:00-12:30 PM"
"C:\Program Files\Git\cmd\git.exe" push origin main
echo DONE
