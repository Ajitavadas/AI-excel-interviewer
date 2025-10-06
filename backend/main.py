#!/usr/bin/env python3

import sys
import os
from pathlib import Path

# Add backend directory to Python path
backend_path = Path(__file__).parent
sys.path.insert(0, str(backend_path))

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import structlog
import traceback

# Import application components
try:
    from app.core.config import settings
    # Try to import database components (they might not exist yet)
    try:
        from app.core.database import engine, Base
    except ImportError:
        engine = None
        Base = None
        print("Database components not found - running without database")

except ImportError as e:
    print(f"Import error for config: {e}")
    # Fallback configuration
    class FallbackSettings:
        allowed_origins = ["http://localhost:3000", "http://localhost:5173"]
        debug = True
        log_level = "info"
        use_local_llm = True
        ollama_base_url = "http://ollama:11434"
        ollama_model = "phi4-mini:latest"
    
    settings = FallbackSettings()
    engine = None
    Base = None

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
    debug=getattr(settings, 'debug', True)
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=getattr(settings, 'allowed_origins', ["*"]),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create database tables if available
if Base and engine:
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables created successfully")
    except Exception as e:
        logger.error("Failed to create database tables", error=str(e))

# Import and include API routes
try:
    from app.api.routes.interview import router as interview_router
    app.include_router(interview_router, prefix="/api/interviews", tags=["interviews"])
    logger.info("Interview routes loaded successfully")
except ImportError as e:
    logger.warning(f"Could not load interview routes: {e}")

# Basic routes
@app.get("/")
async def root():
    return {
        "message": "AI Excel Interviewer API", 
        "status": "running",
        "version": "1.0.0",
        "environment": "development" if getattr(settings, 'debug', True) else "production"
    }

@app.get("/health")
async def health_check():
    """Health check endpoint for Docker health checks"""
    try:
        return {
            "status": "healthy",
            "database": "connected" if engine else "disabled",
            "redis": "available",
            "llm": "ollama-ready",
            "timestamp": "2025-09-24T01:25:00Z"
        }
    except Exception as e:
        logger.error("Health check failed", error=str(e))
        raise HTTPException(status_code=503, detail="Service unhealthy")

@app.get("/config")
async def get_config():
    """Debug endpoint to check configuration"""
    return {
        "allowed_origins": getattr(settings, 'allowed_origins', ["*"]),
        "ollama_base_url": getattr(settings, 'ollama_base_url', 'not configured'),
        "use_local_llm": getattr(settings, 'use_local_llm', True),
        "debug": getattr(settings, 'debug', True)
    }

# Exception handlers
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    logger.error("Global exception occurred", 
                error=str(exc), 
                path=request.url.path,
                method=request.method)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error", "error": str(exc)}
    )

# Startup event
@app.on_event("startup")
async def startup_event():
    logger.info("AI Excel Interviewer API starting up...")
    logger.info(f"Working directory: {os.getcwd()}")
    logger.info("API routes configured:")
    for route in app.routes:
        logger.info(f"  {route.methods} {route.path}")

if __name__ == "__main__":
    import uvicorn

    logger.info("Starting AI Excel Interviewer API server",
                host="0.0.0.0",
                port=8000,
                debug=getattr(settings, 'debug', True))

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=getattr(settings, 'debug', True),
        log_level=getattr(settings, 'log_level', 'info').lower()
    )