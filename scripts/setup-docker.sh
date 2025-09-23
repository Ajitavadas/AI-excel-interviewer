#!/bin/bash

echo "🚀 Setting up AI Excel Interviewer with Docker..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop."
    exit 1
fi

# Create .env if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cp .env.example .env
    echo "✅ Please edit .env file with your configuration"
fi

# Build and start services
echo "🔨 Building Docker images..."
docker-compose build

echo "🚀 Starting services..."
docker-compose up -d

# Wait for services to be healthy
echo "⏳ Waiting for services to be ready..."
sleep 30

# Pull Ollama model
echo "🤖 Setting up Ollama LLM..."
docker-compose exec ollama ollama pull phi4-mini:latest

# Test services
echo "🧪 Testing services..."
echo "Backend Health Check:"
curl -f http://localhost:8000/health || echo "❌ Backend not ready"

echo "Database Connection:"
docker-compose exec postgres pg_isready -U postgres -d ai_excel_interviewer || echo "❌ Database not ready"

echo "✅ Setup complete!"
echo "📱 Frontend: http://localhost:3000"
echo "🔧 Backend API: http://localhost:8000"
echo "📊 API Docs: http://localhost:8000/docs"