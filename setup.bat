@echo off
set /p EXA_API_KEY="Enter your Exa API Key: "
set /p NINJA_API_KEY="Enter your Ninja API Key: "

if "%EXA_API_KEY%"=="" (
    echo Error: Exa API Key is required
    exit /b 1
)
if "%NINJA_API_KEY%"=="" (
    echo Error: Ninja API Key is required
    exit /b 1
)

docker build -f setup.Dockerfile -t setup-container .
docker run --rm -v "%cd%:/host" setup-container "%EXA_API_KEY%" "%NINJA_API_KEY%"

docker-compose up --build -d
pause