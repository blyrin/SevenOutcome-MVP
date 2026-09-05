```bat
@chcp 65001 >nul
@echo off
setlocal enabledelayedexpansion

where ffmpeg >nul 2>nul
if errorlevel 1 (
    echo [ERROR] FFmpeg not found in PATH.
    exit /b 1
)

if "%~1"=="" (
    exit /b 0
)

:loop
if "%~1"=="" goto done

echo "%~nx1"

ffmpeg -y -v error -i "%~f1" ^
    -map 0:a:0 ^
    -vn ^
    -c:a libopus -b:a 128k ^
    -map_metadata -1 ^
    -map_chapters -1 ^
    -fflags +bitexact ^
    -flags:a +bitexact ^
    "%~dpn1.ogg"

if errorlevel 1 (
    echo   -^> error: "%~nx1"
) else (
    echo   -^> ok: "%~dpn1.ogg"
)
echo.

shift
goto loop

:done
echo down
```
