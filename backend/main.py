from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.routes import interview, chat, evaluation, reports

app = FastAPI(
    title="AI Excel Interviewer API",
    description="Backend API for AI-powered Excel skill assessment",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(interview.router, prefix="/api/interview", tags=["interview"])
app.include_router(chat.router, prefix="/api/chat", tags=["chat"])
app.include_router(evaluation.router, prefix="/api/evaluation", tags=["evaluation"])
app.include_router(reports.router, prefix="/api/reports", tags=["reports"])

@app.get("/")
async def root():
    return {"message": "AI Excel Interviewer API", "status": "running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)