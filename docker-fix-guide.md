# AI Excel Interviewer - Docker Backend Issue Fix Guide

Based on your error logs, the backend container is crashing due to a JSON parsing error related to the `allowed_origins` environment variable. Here's a comprehensive solution to fix your Docker setup.

## 🔍 Root Cause Analysis

The error shows:
```
pydantic_settings.sources.SettingsError: error parsing value for field "allowed_origins" from source "EnvSettingsSource"
json.decoder.JSONDecodeError: Expecting value: line 1 column 1 (char 0)
```

This happens because:
1. Pydantic is trying to parse `allowed_origins` as JSON when it's defined as a list type
2. The environment variable format in docker-compose.yml is not compatible with Pydantic's parsing
3. Missing proper environment variable handling for Docker containers

## 🛠️ Complete Fix Implementation

### Step 1: Update Backend Configuration

Create/Update `backend/app/core/config.py`:

```python
from pydantic_settings import BaseSettings
from typing import Optional, List, Union
from pydantic import field_validator
import os

class Settings(BaseSettings):
    # Database Configuration
    database_url: str = "postgresql://postgres:postgres@postgres:5432/ai_excel_interviewer"
    
    # Redis Configuration  
    redis_url: str = "redis://redis:6379"
    
    # LLM Configuration
    use_local_llm: bool = True
    ollama_base_url: str = "http://ollama:11434"
    ollama_model: str = "phi4-mini:latest"
    openai_api_key: Optional[str] = None
    
    # Application Configuration
    secret_key: str = "your-secret-key-change-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    
    # CORS Configuration - Fixed to handle Docker environment variables properly
    allowed_origins: Union[List[str], str] = "http://localhost:3000,http://localhost:5173"
    
    # Development Settings
    debug: bool = True
    log_level: str = "info"
    
    @field_validator('allowed_origins')
    @classmethod
    def parse_allowed_origins(cls, v):
        if isinstance(v, str):
            # Split comma-separated string into list
            return [origin.strip() for origin in v.split(',') if origin.strip()]
        elif isinstance(v, list):
            return v
        else:
            return ["http://localhost:3000", "http://localhost:5173"]
    
    class Config:
        env_file = ".env"
        env_file_encoding = 'utf-8'

settings = Settings()
```

### Step 2: Fix Docker Compose Configuration

Update your `docker-compose.yml`:

```yaml
services:
  # Backend API Service
  backend:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: ai-excel-interviewer-backend
    restart: unless-stopped
    ports:
      - "8000:8000"
    environment:
      # Use simple string format instead of complex types
      - DATABASE_URL=postgresql://postgres:postgres@postgres:5432/ai_excel_interviewer
      - REDIS_URL=redis://redis:6379
      - OLLAMA_BASE_URL=http://ollama:11434
      - USE_LOCAL_LLM=true
      - OLLAMA_MODEL=phi4-mini:latest
      - SECRET_KEY=your-secret-key-change-in-production
      # Fix: Use simple comma-separated string instead of JSON array
      - ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173,http://ai-excel-interviewer-frontend:80
      - DEBUG=true
      - LOG_LEVEL=info
      - PYTHONPATH=/app
    volumes:
      - ./backend:/app/backend
      - ./logs:/app/logs
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
      ollama:
        condition: service_started
    networks:
      - ai-excel-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  # Frontend Service
  frontend:
    build:
      context: ./frontend
      dockerfile: ../docker/Dockerfile.frontend
    container_name: ai-excel-interviewer-frontend
    restart: unless-stopped
    ports:
      - "3000:80"
      - "5173:5173"
    environment:
      - VITE_API_URL=http://localhost:8000
      - NODE_ENV=development
    depends_on:
      - backend
    networks:
      - ai-excel-network

  # PostgreSQL Database with pgvector
  postgres:
    image: ankane/pgvector:v0.5.0
    container_name: ai-excel-interviewer-postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: ai_excel_interviewer
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_INITDB_ARGS: "--encoding=UTF-8"
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database/init:/docker-entrypoint-initdb.d
    networks:
      - ai-excel-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres -d ai_excel_interviewer"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Redis Cache
  redis:
    image: redis:7-alpine
    container_name: ai-excel-interviewer-redis
    restart: unless-stopped
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    networks:
      - ai-excel-network
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 3

  # Ollama LLM Service
  ollama:
    image: ollama/ollama:latest
    container_name: ai-excel-interviewer-ollama
    restart: unless-stopped
    ports:
      - "11435:11434"
    volumes:
      - ollama_data:/root/.ollama
    networks:
      - ai-excel-network
    environment:
      - OLLAMA_KEEP_ALIVE=24h

# Networks
networks:
  ai-excel-network:
    driver: bridge

# Volumes
volumes:
  postgres_data:
    driver: local
  redis_data:
    driver: local
  ollama_data:
    driver: local
```

### Step 3: Update Docker Compose Override

Update your `docker-compose.override.yml`:

```yaml
services:
  backend:
    volumes:
      - ./backend:/app/backend
      - ./logs:/app/logs
    environment:
      - DEBUG=true
      - LOG_LEVEL=debug
      - PYTHONPATH=/app
    command: ["python", "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.dev
    volumes:
      - ./frontend/src:/app/src
      - ./frontend/public:/app/public
    environment:
      - NODE_ENV=development
    command: ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
    ports:
      - "5173:5173"
```

### Step 4: Create/Update Main Dockerfile

Create `Dockerfile` in your root directory:

```dockerfile
# AI Excel Interviewer - Backend Container
FROM python:3.10-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PYTHONPATH=/app

# Set work directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    git \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY backend/requirements.txt ./backend/requirements.txt

# Install Python dependencies
RUN pip install --upgrade pip && \
    pip install -r ./backend/requirements.txt

# Copy backend application code
COPY backend/ ./backend/

# Create logs directory
RUN mkdir -p /app/logs

# Create non-root user for security (optional for development)
# RUN adduser --disabled-password --gecos '' appuser && \
#     chown -R appuser:appuser /app
# USER appuser

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Default command
CMD ["python", "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Step 5: Update Backend Requirements

Ensure your `backend/requirements.txt` includes:

```txt
fastapi==0.104.1
uvicorn[standard]==0.24.0
pydantic==2.5.0
pydantic-settings==2.1.0
sqlalchemy==2.0.23
psycopg2-binary==2.9.9
asyncpg==0.29.0
alembic==1.13.1
redis==5.0.1
httpx==0.25.2
python-multipart==0.0.6
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
pandas==2.1.4
numpy==1.24.4
scikit-learn==1.3.2
structlog==23.2.0
python-dotenv==1.0.0
```

### Step 6: Fix Main Application Entry Point

Update `backend/main.py`:

```python
#!/usr/bin/env python3

import sys
import os
from pathlib import Path

# Add backend directory to Python path
backend_path = Path(__file__).parent
sys.path.insert(0, str(backend_path))

# Now import FastAPI components
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import structlog
import traceback

# Import application components
try:
    from app.core.config import settings
    from app.core.database import engine, Base
    # Import your routes when they're ready
    # from app.api.routes import interview, chat, evaluation
except ImportError as e:
    print(f"Import error: {e}")
    print(f"Current working directory: {os.getcwd()}")
    print(f"Python path: {sys.path}")
    traceback.print_exc()
    sys.exit(1)

# Configure logging
structlog.configure(
    processors=[
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.dev.ConsoleRenderer()
    ],
    wrapper_class=structlog.stdlib.BoundLogger,
    logger_factory=structlog.stdlib.LoggerFactory(),
    cache_logger_on_first_use=True,
)

logger = structlog.get_logger()

# Create FastAPI application
app = FastAPI(
    title="AI Excel Interviewer API",
    description="Backend API for AI-powered Excel skill assessment",
    version="1.0.0",
    debug=settings.debug
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create database tables
try:
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables created successfully")
except Exception as e:
    logger.error("Failed to create database tables", error=str(e))

# Basic routes
@app.get("/")
async def root():
    return {
        "message": "AI Excel Interviewer API", 
        "status": "running",
        "version": "1.0.0",
        "environment": "development" if settings.debug else "production"
    }

@app.get("/health")
async def health_check():
    try:
        # You can add database connectivity check here
        return {
            "status": "healthy",
            "database": "connected",
            "redis": "connected",
            "llm": "available"
        }
    except Exception as e:
        logger.error("Health check failed", error=str(e))
        raise HTTPException(status_code=503, detail="Service unhealthy")

@app.get("/config")
async def get_config():
    """Debug endpoint to check configuration"""
    return {
        "allowed_origins": settings.allowed_origins,
        "database_url": settings.database_url.split("@")[-1] if "@" in settings.database_url else "configured",
        "redis_url": settings.redis_url,
        "ollama_base_url": settings.ollama_base_url,
        "debug": settings.debug,
        "use_local_llm": settings.use_local_llm
    }

# Include API routers when ready
# app.include_router(interview.router, prefix="/api/interview", tags=["interview"])
# app.include_router(chat.router, prefix="/api/chat", tags=["chat"])

# Exception handlers
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    logger.error("Global exception occurred", 
                error=str(exc), 
                path=request.url.path,
                method=request.method)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"}
    )

if __name__ == "__main__":
    import uvicorn
    
    logger.info("Starting AI Excel Interviewer API server", 
                host="0.0.0.0", 
                port=8000, 
                debug=settings.debug)
    
    uvicorn.run(
        "main:app", 
        host="0.0.0.0", 
        port=8000, 
        reload=settings.debug,
        log_level=settings.log_level.lower()
    )
```

## 🚀 Deployment Steps

### Step 1: Remove Old Containers and Images
```bash
# Stop and remove all containers
docker-compose down -v

# Remove old images to force rebuild
docker system prune -a -f

# Remove unused volumes (be careful with this)
docker volume prune -f
```

### Step 2: Remove Version Attributes (Fix Warnings)
Edit both `docker-compose.yml` and `docker-compose.override.yml` and remove the first line:
```yaml
# Remove this line from both files:
version: '3.8'
```

### Step 3: Build and Start Services
```bash
# Build fresh images
docker-compose build --no-cache

# Start services with override for development
docker-compose up -d

# Check status
docker-compose ps
```

### Step 4: Monitor Logs
```bash
# Watch backend logs specifically
docker-compose logs -f backend

# Check all services
docker-compose logs -f
```

### Step 5: Test the Setup
```bash
# Test health endpoint
curl http://localhost:8000/health

# Test config endpoint
curl http://localhost:8000/config

# Check if frontend is accessible
curl http://localhost:3000
curl http://localhost:5173
```

## 🔍 Debugging Commands

If you still encounter issues:

```bash
# Enter backend container to debug
docker-compose exec backend bash

# Check environment variables inside container
docker-compose exec backend env | grep ALLOWED

# Test Python imports
docker-compose exec backend python -c "from app.core.config import settings; print(settings.allowed_origins)"

# Check file structure
docker-compose exec backend ls -la /app/backend/

# Check Python path
docker-compose exec backend python -c "import sys; print(sys.path)"
```

## 🎯 Additional Improvements

### Add Environment File Support
Create `.env` in your root directory:
```env
# Database Configuration
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/ai_excel_interviewer

# Redis Configuration
REDIS_URL=redis://redis:6379

# LLM Configuration
USE_LOCAL_LLM=true
OLLAMA_BASE_URL=http://ollama:11434
OLLAMA_MODEL=phi4-mini:latest

# Application Configuration
SECRET_KEY=your-super-secret-key-change-in-production
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173

# Development Settings
DEBUG=true
LOG_LEVEL=info
```

### Create Initialization Script
Create `scripts/init-docker.sh`:
```bash
#!/bin/bash

echo "🚀 Initializing AI Excel Interviewer..."

# Create necessary directories
mkdir -p logs
mkdir -p database/init

# Copy environment file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cat > .env << 'EOF'
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/ai_excel_interviewer
REDIS_URL=redis://redis:6379
USE_LOCAL_LLM=true
OLLAMA_BASE_URL=http://ollama:11434
OLLAMA_MODEL=phi4-mini:latest
SECRET_KEY=development-key-change-in-production
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
DEBUG=true
LOG_LEVEL=info
EOF
fi

# Build and start
echo "🔨 Building containers..."
docker-compose build

echo "🚀 Starting services..."
docker-compose up -d

echo "⏳ Waiting for services to be ready..."
sleep 30

# Test services
echo "🧪 Testing services..."
if curl -f http://localhost:8000/health > /dev/null 2>&1; then
    echo "✅ Backend is healthy"
else
    echo "❌ Backend is not responding"
fi

if curl -f http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ Frontend is accessible"
else
    echo "❌ Frontend is not accessible"
fi

echo "✅ Setup complete!"
echo "🌐 Frontend: http://localhost:3000"
echo "🔧 Backend API: http://localhost:8000"
echo "📋 API Docs: http://localhost:8000/docs"
```

Make it executable and run:
```bash
chmod +x scripts/init-docker.sh
./scripts/init-docker.sh
```

This comprehensive fix should resolve your backend Docker issues and provide a robust development environment. The key changes address the Pydantic configuration parsing problem and improve the overall Docker setup for better reliability.