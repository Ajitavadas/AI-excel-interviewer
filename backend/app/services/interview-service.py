# AI Excel Interviewer Backend Service
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
import uuid
from datetime import datetime

from ..core.database import get_db
from ..services.llm_service import llm_service
from ..models.interview import InterviewSession, ChatMessage, InterviewResponse
from ..utils.question_bank import get_next_question, evaluate_answer

router = APIRouter()

# Interview Management
@router.post("/start")
async def start_interview(
    candidate_email: str,
    candidate_name: str = "Test Candidate",
    db: Session = Depends(get_db)
):
    """Start a new interview session"""
    try:
        # Create new interview session
        session = InterviewSession(
            id=str(uuid.uuid4()),
            candidate_email=candidate_email,
            candidate_name=candidate_name,
            status="in_progress",
            started_at=datetime.utcnow()
        )
        
        # Generate welcome message using LLM
        welcome_prompt = f"""
        You are an AI interviewer conducting an Excel skills assessment. 
        Greet the candidate {candidate_name} professionally and explain:
        1. This is a technical interview focused on Excel skills
        2. The interview will take about 20-30 minutes
        3. They'll answer questions and complete practical Excel tasks
        4. Ask if they're ready to begin
        
        Keep it warm but professional, under 100 words.
        """
        
        welcome_message = await llm_service.generate_response(welcome_prompt)
        
        # Save initial chat message
        chat_msg = ChatMessage(
            session_id=session.id,
            sender="agent",
            message=welcome_message,
            message_type="introduction"
        )
        
        # Save to database (pseudo-code - implement with your ORM)
        # db.add(session)
        # db.add(chat_msg)
        # db.commit()
        
        return {
            "session_id": session.id,
            "status": "started",
            "welcome_message": welcome_message
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to start interview: {str(e)}"
        )

@router.post("/chat/message")
async def handle_chat_message(
    session_id: str,
    message: str,
    db: Session = Depends(get_db)
):
    """Handle chat messages during interview"""
    try:
        # Save user message
        user_msg = ChatMessage(
            session_id=session_id,
            sender="candidate",
            message=message,
            message_type="response"
        )
        
        # Get session state to determine next action
        # session_state = get_session_state(session_id, db)
        
        # Determine if this is an answer to a question or general chat
        # For now, simulate getting next question
        next_question = get_next_question("intermediate", "formulas")
        
        # Generate contextual response using LLM
        response_prompt = f"""
        You are interviewing a candidate for Excel skills. 
        
        Previous context: The candidate just said: "{message}"
        
        Now present this next question professionally:
        {next_question['description']}
        
        Instructions: {next_question.get('instructions', '')}
        
        Be encouraging and clear. If they seem stuck, offer a small hint.
        """
        
        ai_response = await llm_service.generate_response(response_prompt)
        
        # Save AI response
        ai_msg = ChatMessage(
            session_id=session_id,
            sender="agent", 
            message=ai_response,
            message_type="question"
        )
        
        # Save to database
        # db.add(user_msg)
        # db.add(ai_msg)
        # db.commit()
        
        return {
            "response": ai_response,
            "question_id": next_question['id'],
            "requires_excel_task": next_question['type'] == 'excel_task'
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process message: {str(e)}"
        )

@router.post("/evaluate")
async def evaluate_response(
    session_id: str,
    question_id: str,
    answer: str,
    answer_type: str = "text",
    db: Session = Depends(get_db)
):
    """Evaluate candidate's answer"""
    try:
        # Get question details
        # question = get_question_by_id(question_id, db)
        
        # Use LLM to evaluate the answer
        evaluation_prompt = f"""
        Evaluate this Excel interview answer:
        
        Question Type: {answer_type}
        Candidate Answer: {answer}
        
        Provide:
        1. Score (0-10)
        2. Brief feedback (2-3 sentences)
        3. What was good/what needs improvement
        
        Be fair but thorough. Focus on technical accuracy.
        """
        
        evaluation = await llm_service.generate_response(evaluation_prompt)
        
        # Parse evaluation response (simplified)
        # In production, use structured prompting or function calling
        score = 7.5  # Extract from LLM response
        feedback = evaluation
        
        # Save response and evaluation
        response_record = InterviewResponse(
            session_id=session_id,
            question_id=question_id,
            candidate_answer=answer,
            score=score,
            max_score=10.0,
            feedback=feedback,
            is_correct=score >= 6.0
        )
        
        # Save to database
        # db.add(response_record)
        # db.commit()
        
        return {
            "score": score,
            "max_score": 10.0,
            "feedback": feedback,
            "is_correct": score >= 6.0,
            "next_action": "continue"  # or "complete" if interview is done
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to evaluate response: {str(e)}"
        )

@router.get("/report/{session_id}")
async def generate_report(session_id: str, db: Session = Depends(get_db)):
    """Generate final interview report"""
    try:
        # Get all responses for session
        # responses = get_session_responses(session_id, db)
        
        # Calculate overall performance
        # overall_score = calculate_overall_score(responses)
        
        # Generate comprehensive report using LLM
        report_prompt = f"""
        Generate a comprehensive Excel skills assessment report:
        
        Session ID: {session_id}
        Overall Score: 75/100
        
        Categories covered:
        - Formulas & Functions: 8/10
        - Data Analysis: 7/10
        - Charts & Visualization: 6/10
        
        Provide:
        1. Executive Summary
        2. Strengths
        3. Areas for Improvement
        4. Specific Recommendations
        5. Overall Recommendation (Hire/No Hire/Interview Again)
        
        Be professional and constructive.
        """
        
        report_content = await llm_service.generate_response(report_prompt)
        
        # Update session as completed
        # update_session_status(session_id, "completed", db)
        
        return {
            "session_id": session_id,
            "overall_score": 75,
            "max_score": 100,
            "report": report_content,
            "recommendation": "hire",
            "generated_at": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate report: {str(e)}"
        )

# Utility functions (implement based on your needs)
def get_session_state(session_id: str, db: Session):
    """Get current session state"""
    pass

def get_next_question(difficulty: str, category: str) -> dict:
    """Get next appropriate question"""
    return {
        "id": str(uuid.uuid4()),
        "title": "VLOOKUP Task",
        "description": "Create a VLOOKUP formula to find employee salaries",
        "type": "excel_task",
        "difficulty": difficulty,
        "category": category,
        "instructions": "Use the data in columns A-B to lookup values in column D"
    }

def calculate_overall_score(responses: list) -> float:
    """Calculate weighted overall score"""
    if not responses:
        return 0.0
    
    total_score = sum(r.score for r in responses)
    max_possible = sum(r.max_score for r in responses)
    
    return (total_score / max_possible) * 100 if max_possible > 0 else 0.0