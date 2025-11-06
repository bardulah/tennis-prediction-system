#!/bin/bash

# Tennis Predictions Metabase - Stop Script

set -e

echo "🛑 Stopping Tennis Predictions Metabase..."

# Check if container exists
if ! docker ps -a --format '{{.Names}}' | grep -q '^tennis-metabase$'; then
    echo "⚠️  Metabase container is not running"
    exit 0
fi

# Stop container
echo "▶️  Stopping Metabase container..."
docker-compose down

echo "✅ Metabase stopped successfully"
echo ""
echo "📁 Data persisted in: ./metabase-data/"
echo "🚀 Start again with: ./start.sh"
