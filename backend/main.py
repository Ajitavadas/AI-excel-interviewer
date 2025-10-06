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
from app.core.config import settings

# Import application components with fallback
try:
    from app.core.config import settings
except ImportError as e:
    print(f"Import error for config: {e}")
    class FallbackSettings:
        allowed_origins = [
            "http://localhost:3000", 
            "http://localhost:5173",
            "http://127.0.0.1:3000",
            "http://127.0.0.1:5173"
        ]
        debug = True
        log_level = "info"
        use_local_llm = True
        ollama_base_url = "http://ollama:11434"
        ollama_model = "phi4-mini:latest"
    
    settings = FallbackSettings()

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

# CRITICAL: Enhanced CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173", 
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "http://ai-excel-interviewer-frontend:80"
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"]
)

# Import and include API routes
try:
    from app.api.routes.interview import router as interview_router
    app.include_router(interview_router, prefix="/api/interviews", tags=["interviews"])
    logger.info("Interview routes loaded successfully")
except ImportError as e:
    logger.warning(f"Could not load interview routes: {e}")
    # Add inline routes as fallback
    from pydantic import BaseModel
    from typing import Optional
    import uuid
    from datetime import datetime
    
    class StartInterviewRequest(BaseModel):
        candidate_email: str
        candidate_name: Optional[str] = "Test Candidate"
    
    @app.post("/api/interviews/start")
    async def start_interview_fallback(request: StartInterviewRequest):
        session_id = str(uuid.uuid4())
        return {
            "session_id": session_id,
            "status": "started",
            "welcome_message": "Welcome to the AI Excel Interviewer! Let's begin with your first question.",
            "candidate_email": request.candidate_email
        }

# Basic routes
@app.get("/")
async def root():
    return {
        "message": "AI Excel Interviewer API", 
        "status": "running",
        "version": "1.0.0"
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "cors": "enabled",
        "timestamp": "2025-09-24T02:06:00Z"
    }

# CRITICAL: Add explicit OPTIONS handler for troubleshooting
@app.options("/api/interviews/start")
async def options_start_interview():
    return {"status": "ok"}

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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)