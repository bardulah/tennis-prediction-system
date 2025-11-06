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

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Error: Docker is not running!"
    echo "Please start Docker and try again"
    exit 1
fi

# Pull latest Metabase image
echo "📦 Pulling latest Metabase image..."
docker-compose pull

# Start Metabase
echo "▶️  Starting Metabase container..."
docker-compose up -d

# Wait for container to be healthy
echo "⏳ Waiting for Metabase to be ready..."
echo "This may take 1-2 minutes on first startup..."

MAX_WAIT=120
ELAPSED=0
INTERVAL=5

while [ $ELAPSED -lt $MAX_WAIT ]; do
    if docker exec tennis-metabase curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
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
echo "Check logs with: docker logs tennis-metabase"
echo "Or wait a bit longer and try accessing http://localhost:3000"
