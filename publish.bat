@echo off
setlocal
set REPO_URL=%~1
if "%REPO_URL%"=="" (
  echo Usage: publish.bat https://github.com/USERNAME/REPO.git
  exit /b 1
)

where git >nul 2>nul
if errorlevel 1 (
  echo Git was not found on PATH.
  exit /b 1
)

git remote remove origin 2>nul
git remote add origin "%REPO_URL%"
git branch -M main
git push -u origin main
