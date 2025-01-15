#!/bin/sh
if [ -z "$1" ] || [ -z "$2" ]; then
    echo "Error: Both API keys are required"
    echo "Usage: $0 <EXA_API_KEY> <NINJA_API_KEY>"
    exit 1
fi

EXA_API_KEY=$1
NINJA_API_KEY=$2

echo "EXA_API_KEY=$EXA_API_KEY" > /host/.env
echo "NINJA_API_KEY=$NINJA_API_KEY" >> /host/.env

echo "API keys have been saved successfully to .env file"