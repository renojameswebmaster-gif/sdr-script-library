@echo off
cd /d "C:\Users\Reno James\timezone-map-site"
"C:\PROGRA~1\Git\cmd\git.exe" add index.html script.js styles.css
"C:\PROGRA~1\Git\cmd\git.exe" commit -m Add_customer_local_time_alert
"C:\PROGRA~1\Git\cmd\git.exe" push origin main
echo COMPLETE
