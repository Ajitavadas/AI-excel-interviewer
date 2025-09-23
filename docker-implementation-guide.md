# AI Excel Interviewer - Docker Implementation Guide

This guide provides a complete Docker-based implementation that eliminates Python virtual environment issues and ensures consistent deployment across all environments.

## 🐳 Docker Architecture Overview

The system uses Docker Compose to orchestrate multiple services:
- **Backend**: Python 3.10 FastAPI application
- **Frontend**: Node.js React + Vite application (separate container)
- **PostgreSQL**: Database with pgvector extension
- **Redis**: Session storage and caching
- **Ollama**: Local LLM service

## 📋 Prerequisites

- Docker Desktop (or Docker Engine + Docker Compose)
- Git
- 8GB+ RAM recommended
- 10GB+ free disk space

## 🚀 Quick Start (5 Minutes)

### Step 1: Clone/Setup Project Structure
```bash
# Create project directory
mkdir ai-excel-interviewer
cd ai-excel-interviewer

# Create directory structure
mkdir -p backend/app/{models,services,api/routes,core,utils}
mkdir -p frontend/src/{components,utils,styles,pages}
mkdir -p frontend/public
mkdir -p database/init
mkdir -p docker/development
```

### Step 2: Create Docker Configuration Files

#### Main Dockerfile (Root Directory)
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

# Create non-root user for security
RUN adduser --disabled-password --gecos '' appuser && \
    chown -R appuser:appuser /app
USER appuser

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Default command
CMD ["python", "backend/main.py"]
```

#### Frontend Dockerfile
```dockerfile
# Frontend Dockerfile
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY frontend/package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy frontend source
COPY frontend/ ./

# Build the application
RUN npm run build

# Use nginx to serve built files
FROM nginx:alpine
COPY --from=0 /app/dist /usr/share/nginx/html
COPY docker/nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

#### Updated docker-compose.yml
```yaml
version: '3.8'

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
      - DATABASE_URL=postgresql://postgres:postgres@postgres:5432/ai_excel_interviewer
      - REDIS_URL=redis://redis:6379
      - OLLAMA_BASE_URL=http://ollama:11434
      - USE_LOCAL_LLM=true
      - OLLAMA_MODEL=llama3.1:8b
      - SECRET_KEY=your-secret-key-change-in-production
      - ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
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

  # Frontend Service
  frontend:
    build:
      context: ./frontend
      dockerfile: ../docker/Dockerfile.frontend
    container_name: ai-excel-interviewer-frontend
    restart: unless-stopped
    ports:
      - "3000:80"
    environment:
      - VITE_API_URL=http://localhost:8000
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
      - "11434:11434"
    volumes:
      - ollama_data:/root/.ollama
    networks:
      - ai-excel-network
    environment:
      - OLLAMA_KEEP_ALIVE=24h
    # Note: Model pulling handled in init script

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

#### Development docker-compose.override.yml
```yaml
version: '3.8'

services:
  backend:
    volumes:
      - ./backend:/app/backend
      - ./logs:/app/logs
    environment:
      - DEBUG=true
      - LOG_LEVEL=debug
    command: ["python", "backend/main.py", "--reload"]

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

### Step 3: Create Environment Configuration

#### .env.example
```env
# Database Configuration
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/ai_excel_interviewer

# Redis Configuration
REDIS_URL=redis://redis:6379

# LLM Configuration
USE_LOCAL_LLM=true
OLLAMA_BASE_URL=http://ollama:11434
OLLAMA_MODEL=llama3.1:8b
OPENAI_API_KEY=

# Application Configuration
SECRET_KEY=your-super-secret-key-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173,http://localhost:8080

# Development Settings
DEBUG=true
LOG_LEVEL=info

# Frontend Configuration
VITE_API_URL=http://localhost:8000
```

#### .env (Copy from .env.example and customize)
```bash
cp .env.example .env
```

### Step 4: Backend Requirements
Create `backend/requirements.txt`:
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
```

### Step 5: Database Initialization
Create `database/init/01-init.sql`:
```sql
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create tables
CREATE TABLE IF NOT EXISTS candidates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS interview_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    candidate_id UUID REFERENCES candidates(id),
    status VARCHAR(50) DEFAULT 'active',
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    total_score DECIMAL(5,2),
    max_score DECIMAL(5,2),
    metadata JSONB
);

CREATE TABLE IF NOT EXISTS questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    question_type VARCHAR(50) NOT NULL,
    difficulty VARCHAR(50) NOT NULL,
    category VARCHAR(100) NOT NULL,
    subcategory VARCHAR(100),
    expected_answer TEXT,
    grading_rubric JSONB,
    points INTEGER DEFAULT 10,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS interview_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES interview_sessions(id),
    question_id UUID REFERENCES questions(id),
    user_response TEXT,
    ai_evaluation JSONB,
    score DECIMAL(5,2),
    feedback TEXT,
    response_time INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample questions
INSERT INTO questions (title, description, question_type, difficulty, category, subcategory, expected_answer, grading_rubric, points) VALUES
('Basic VLOOKUP', 'Create a VLOOKUP formula to find employee salary from another sheet', 'excel_task', 'intermediate', 'formulas', 'vlookup', '=VLOOKUP(A2,Sheet2!A:B,2,FALSE)', '{"criteria": ["correct_formula", "proper_references", "exact_match"], "points_per_criteria": 3}', 10),
('Pivot Table Creation', 'Create a pivot table to summarize sales data by region and product', 'excel_task', 'intermediate', 'data_analysis', 'pivot_tables', 'Properly configured pivot table', '{"criteria": ["correct_fields", "proper_aggregation", "formatting"], "points_per_criteria": 3}', 15),
('Data Validation Concept', 'Explain when and how you would use data validation in Excel', 'text', 'beginner', 'data_management', 'validation', 'Data validation ensures data quality by restricting input to valid values', '{"key_points": ["data_quality", "input_restriction", "examples"], "points_per_point": 3}', 10);

-- Create indexes for performance
CREATE INDEX idx_interview_sessions_candidate ON interview_sessions(candidate_id);
CREATE INDEX idx_interview_responses_session ON interview_responses(session_id);
CREATE INDEX idx_questions_category ON questions(category, difficulty);
```

### Step 6: Startup Scripts

#### scripts/setup-docker.sh
```bash
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
docker-compose exec ollama ollama pull llama3.1:8b

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
```

#### scripts/dev-start.sh
```bash
#!/bin/bash

echo "🚀 Starting development environment..."

# Start all services in development mode
docker-compose -f docker-compose.yml -f docker-compose.override.yml up -d

# Show logs
echo "📋 Showing logs (Ctrl+C to stop)..."
docker-compose logs -f backend frontend
```

### Step 7: Launch the Application

```bash
# Make scripts executable
chmod +x scripts/*.sh

# Run setup
./scripts/setup-docker.sh

# For development with hot reload
./scripts/dev-start.sh
```

## 🔧 Development Workflow

### Daily Development
```bash
# Start development environment
docker-compose up -d

# View logs
docker-compose logs -f backend

# Execute commands in containers
docker-compose exec backend python backend/manage.py migrate
docker-compose exec postgres psql -U postgres -d ai_excel_interviewer

# Stop services
docker-compose down
```

### Code Changes
- **Backend**: Changes in `./backend/` are automatically reflected (volume mount)
- **Frontend**: Changes in `./frontend/src/` trigger hot reload
- **Database**: Schema changes require container restart

### Adding New Dependencies

**Backend (Python)**:
```bash
# Add to requirements.txt
echo "new-package==1.0.0" >> backend/requirements.txt

# Rebuild container
docker-compose build backend
docker-compose up -d backend
```

**Frontend (Node.js)**:
```bash
# Enter frontend container
docker-compose exec frontend sh

# Install package
npm install new-package

# Or rebuild container
docker-compose build frontend
```

## 🚀 Production Deployment

### Step 1: Production docker-compose.prod.yml
```yaml
version: '3.8'

services:
  backend:
    build:
      context: .
      dockerfile: Dockerfile
      target: production
    restart: always
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
      - SECRET_KEY=${SECRET_KEY}
      - USE_LOCAL_LLM=false
      - OPENAI_API_KEY=${OPENAI_API_KEY}
    volumes:
      - ./logs:/app/logs
    networks:
      - ai-excel-network

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.prod
    restart: always
    ports:
      - "80:80"
    environment:
      - VITE_API_URL=${API_URL}
    depends_on:
      - backend
    networks:
      - ai-excel-network

  # Remove local postgres, redis, ollama
  # Use managed services in production

networks:
  ai-excel-network:
    driver: bridge
```

### Step 2: Deploy to Cloud

**Option A: Deploy to Railway/Render**
```bash
# Create railway.toml
echo "[build]
builder = \"nixpacks\"

[deploy]
startCommand = \"docker-compose -f docker-compose.prod.yml up\"" > railway.toml
```

**Option B: Deploy to DigitalOcean App Platform**
```yaml
# .do/app.yaml
name: ai-excel-interviewer
services:
- name: backend
  source_dir: /
  dockerfile_path: Dockerfile
  github:
    repo: your-username/ai-excel-interviewer
    branch: main
  http_port: 8000
  environment_slug: docker
  instance_count: 1
  instance_size_slug: basic-xxs
  env:
  - key: DATABASE_URL
    value: ${DATABASE_URL}
```

## 📊 Monitoring & Debugging

### Container Health Monitoring
```bash
# Check container health
docker-compose ps

# View resource usage
docker stats

# Check logs for specific service
docker-compose logs backend --tail=50 -f

# Execute commands in running containers
docker-compose exec backend bash
docker-compose exec postgres psql -U postgres -d ai_excel_interviewer
```

### Performance Optimization
```yaml
# docker-compose.yml optimizations
services:
  backend:
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: '0.5'
        reservations:
          memory: 256M
          cpus: '0.25'
```

### Backup & Recovery
```bash
# Backup database
docker-compose exec postgres pg_dump -U postgres ai_excel_interviewer > backup.sql

# Restore database
docker-compose exec -T postgres psql -U postgres ai_excel_interviewer < backup.sql

# Backup volumes
docker run --rm -v ai-excel-interviewer_postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/postgres-backup.tar.gz /data
```

## 🔒 Security Considerations

### Production Security Updates

1. **Use secrets management**:
```yaml
# docker-compose.prod.yml
services:
  backend:
    environment:
      - DATABASE_URL_FILE=/run/secrets/database_url
    secrets:
      - database_url

secrets:
  database_url:
    external: true
```

2. **Non-root user**:
```dockerfile
# In Dockerfile
RUN adduser --disabled-password --gecos '' appuser
USER appuser
```

3. **Security scanning**:
```bash
# Scan images for vulnerabilities
docker scout cves ai-excel-interviewer_backend
```

## 🎯 Next Steps

1. **Complete Setup** (Today):
   - Run `./scripts/setup-docker.sh`
   - Verify all services are running
   - Test the interview flow

2. **Development** (This Week):
   - Customize questions in database
   - Modify frontend components
   - Add new API endpoints

3. **Production** (Next Week):
   - Set up managed database (Supabase)
   - Deploy to cloud platform
   - Configure monitoring

4. **Enhancement** (Ongoing):
   - Add advanced Excel features
   - Implement real-time collaboration
   - Add video recording capabilities

## 📚 Additional Resources

- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [FastAPI in Docker](https://fastapi.tiangolo.com/deployment/docker/)
- [React Docker Best Practices](https://nodejs.org/en/docs/guides/nodejs-docker-webapp/)
- [PostgreSQL Docker](https://hub.docker.com/_/postgres)
- [Ollama Docker](https://hub.docker.com/r/ollama/ollama)

---

**🎉 You now have a completely containerized AI Excel Interviewer system that eliminates all Python version conflicts and provides consistent deployment across all environments!**

**Key Benefits of This Docker Approach:**
- ✅ No Python virtual environment issues
- ✅ Consistent development and production environments
- ✅ Easy scaling and deployment
- ✅ Isolated services with proper networking
- ✅ One-command setup and deployment
- ✅ Built-in health checks and monitoring
- ✅ Volume persistence for data
- ✅ Hot reload for development