#!/bin/bash
echo -n "Enter your Exa API Key: "
read EXA_API_KEY

echo -n "Enter your Ninja API Key: "
read NINJA_API_KEY

if [ -z "$EXA_API_KEY" ] || [ -z "$NINJA_API_KEY" ]; then
    echo "Error: Both API keys are required"
    exit 1
fi

docker build -f setup.Dockerfile -t setup-container .
docker run --rm -v "$(pwd):/host" setup-container "$EXA_API_KEY" "$NINJA_API_KEY"

docker-compose up --build -d