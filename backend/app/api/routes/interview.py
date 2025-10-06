from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import uuid
from datetime import datetime
import structlog
from app.core.config import settings
# Import the LLM service
from app.services.llm_service import llm_service

logger = structlog.get_logger()

router = APIRouter()

# In-memory storage for now (replace with database later)
active_sessions = {}
chat_history = {}

class StartInterviewRequest(BaseModel):
    candidate_email: str
    candidate_name: Optional[str] = "Test Candidate"

class ChatMessageRequest(BaseModel):
    session_id: str
    message: str

@router.post("/start")
async def start_interview(request: StartInterviewRequest):
    """Start a new interview session"""
    try:
        session_id = str(uuid.uuid4())
        
        # Create session
        session_data = {
            "session_id": session_id,
            "candidate_email": request.candidate_email,
            "candidate_name": request.candidate_name,
            "status": "active",
            "started_at": datetime.now().isoformat(),
            "current_question": 0
        }
        
        active_sessions[session_id] = session_data
        chat_history[session_id] = []
        
        # Generate welcome message using LLM
        welcome_prompt = f"""
        You are an AI interviewer conducting an Excel skills assessment.
        Greet the candidate {request.candidate_name} professionally and explain:
        1. This is a technical interview focused on Excel skills
        2. The interview will take about 20-30 minutes  
        3. They'll answer questions and complete practical Excel tasks
        4. Ask if they're ready to begin
        Keep it warm but professional, under 100 words.
        """
        
        welcome_message = await llm_service.generate_response(welcome_prompt)
        
        logger.info(f"Started interview session {session_id} for {request.candidate_email}")
        
        return {
            "session_id": session_id,
            "status": "started", 
            "welcome_message": welcome_message,
            "candidate_email": request.candidate_email
        }
        
    except Exception as e:
        logger.error(f"Error starting interview: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to start interview: {str(e)}")

@router.post("/chat/message")
async def handle_chat_message(request: ChatMessageRequest):
    """Handle chat messages during interview"""
    try:
        if request.session_id not in active_sessions:
            raise HTTPException(status_code=404, detail="Session not found")
        
        session = active_sessions[request.session_id]
        
        # Add user message to history
        chat_history[request.session_id].append({
            "role": "user",
            "message": request.message,
            "timestamp": datetime.now().isoformat()
        })
        
        # Generate contextual response using LLM
        response_prompt = f"""
        You are interviewing a candidate for Excel skills.
        Previous context: The candidate just said: "{request.message}"
        
        Based on their response, provide:
        1. Brief acknowledgment of their answer
        2. The next appropriate Excel question
        3. Clear instructions for what they should explain or demonstrate
        
        Keep responses professional and encouraging. Progress through different Excel topics like formulas, pivot tables, charts, data validation, etc.
        """
        
        ai_response = await llm_service.generate_response(response_prompt)
        
        # Add AI response to history  
        chat_history[request.session_id].append({
            "role": "assistant", 
            "message": ai_response,
            "timestamp": datetime.now().isoformat()
        })
        
        session["current_question"] += 1
        
        logger.info(f"Processed message for session {request.session_id}")
        
        return {
            "response": ai_response,
            "session_id": request.session_id,
            "question_number": session["current_question"]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing chat message: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to process message: {str(e)}")

@router.get("/status/{session_id}")
async def get_interview_status(session_id: str):
    """Get interview session status"""
    if session_id not in active_sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session = active_sessions[session_id]
    messages = chat_history.get(session_id, [])
    
    return {
        "session_id": session_id,
        "status": session["status"],
        "progress": {
            "current_question": session["current_question"],
            "total_questions": 5,
            "completion_percentage": min(100, (session["current_question"] / 5) * 100)
        },
        "started_at": session["started_at"],
        "candidate_email": session["candidate_email"],
        "message_count": len(messages)
    }

@router.get("/report/{session_id}")
async def generate_report(session_id: str):
    """Generate final interview report"""
    if session_id not in active_sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session = active_sessions[session_id]
    messages = chat_history.get(session_id, [])
    
    # Generate report using LLM
    report_prompt = f"""
    Generate a comprehensive Excel skills assessment report:
    
    Candidate: {session['candidate_email']}
    Session Duration: {session['current_question']} questions answered
    
    Based on the interview conversation, provide:
    1. Executive Summary (2-3 sentences)
    2. Technical Skills Assessment (strengths observed)  
    3. Areas for Improvement
    4. Overall Recommendation (Strong/Moderate/Needs Development)
    5. Specific Excel topics to focus on for improvement
    
    Be professional and constructive in your assessment.
    """
    
    report_content = await llm_service.generate_response(report_prompt)
    
    # Mark session as completed
    session["status"] = "completed"
    session["completed_at"] = datetime.now().isoformat()
    
    return {
        "session_id": session_id,
        "candidate_email": session["candidate_email"],
        "status": "completed",
        "report": report_content,
        "questions_answered": session["current_question"],
        "generated_at": datetime.now().isoformat()
    }