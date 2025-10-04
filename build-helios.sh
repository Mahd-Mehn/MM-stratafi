#!/bin/bash

# Build script for Helios Agent
# This ensures the Docker build runs from the correct context

echo "Building Helios Agent Docker image..."

# Build from repository root with correct context
docker build -f apps/helios-agent/Dockerfile -t helios-agent .

echo "Build complete!"
