#!/bin/bash

# Tennis Predictions Metabase - Start Script

set -e

echo "🚀 Starting Tennis Predictions Metabase..."

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found!"
    echo "Please create .env from .env.example and configure your database credentials"
    exit 1
fi

# Detect container runtime (Docker or Podman)
if command -v docker > /dev/null 2>&1 && docker info > /dev/null 2>&1; then
    CONTAINER_CMD="docker"
    COMPOSE_CMD="docker-compose"
elif command -v podman > /dev/null 2>&1; then
    CONTAINER_CMD="podman"
    COMPOSE_CMD="podman-compose"
    # If podman-compose not available, use docker-compose with podman socket
    if ! command -v podman-compose > /dev/null 2>&1; then
        export DOCKER_HOST="unix://$XDG_RUNTIME_DIR/podman/podman.sock"
        COMPOSE_CMD="docker-compose"
    fi
else
    echo "❌ Error: Neither Docker nor Podman is available!"
    echo "Please install Docker or Podman and try again"
    exit 1
fi

echo "Using: $CONTAINER_CMD with $COMPOSE_CMD"

# Pull latest Metabase image
echo "📦 Pulling latest Metabase image..."
$COMPOSE_CMD pull

# Start Metabase
echo "▶️  Starting Metabase container..."
$COMPOSE_CMD up -d

# Wait for container to be healthy
echo "⏳ Waiting for Metabase to be ready..."
echo "This may take 1-2 minutes on first startup..."

MAX_WAIT=120
ELAPSED=0
INTERVAL=5

while [ $ELAPSED -lt $MAX_WAIT ]; do
    if $CONTAINER_CMD exec tennis-metabase curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
        echo ""
        echo "✅ Metabase is ready!"
        echo ""
        echo "🌐 Access Metabase at: http://localhost:3000"
        echo ""
        echo "📚 Next steps:"
        echo "  1. Navigate to http://localhost:3000"
        echo "  2. Complete the setup wizard"
        echo "  3. Add your Tennis Predictions database"
        echo "  4. See README.md for configuration details"
        echo ""
        exit 0
    fi

    sleep $INTERVAL
    ELAPSED=$((ELAPSED + INTERVAL))
    echo -n "."
done

echo ""
echo "⚠️  Metabase is still starting up..."
echo "Check logs with: $CONTAINER_CMD logs tennis-metabase"
echo "Or wait a bit longer and try accessing http://localhost:3000"
