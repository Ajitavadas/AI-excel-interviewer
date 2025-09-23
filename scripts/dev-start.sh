#!/bin/bash

echo "🚀 Starting development environment..."

# Start all services in development mode
docker-compose -f docker-compose.yml -f docker-compose.override.yml up -d

# Show logs
echo "📋 Showing logs (Ctrl+C to stop)..."
docker-compose logs -f backend frontend