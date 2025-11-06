#!/bin/bash

# Tennis Predictions Metabase - Stop Script

set -e

echo "🛑 Stopping Tennis Predictions Metabase..."

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
    exit 1
fi

# Check if container exists
if ! $CONTAINER_CMD ps -a --format '{{.Names}}' | grep -q '^tennis-metabase$'; then
    echo "⚠️  Metabase container is not running"
    exit 0
fi

# Stop container
echo "▶️  Stopping Metabase container..."
$COMPOSE_CMD down

echo "✅ Metabase stopped successfully"
echo ""
echo "📁 Data persisted in: ./metabase-data/"
echo "🚀 Start again with: ./start.sh"
