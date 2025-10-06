# Frontend-Backend CORS & Integration Fix

## 🔍 Problem Analysis

**Issue**: `OPTIONS /api/interviews/start HTTP/1.1" 400 Bad Request`

This is a **CORS preflight failure**. The frontend is trying to make a POST request, but the browser's preflight OPTIONS request is failing.

**Root Causes**:
1. CORS configuration in backend not properly handling OPTIONS requests
2. Frontend missing proper API configuration  
3. Missing React components that App.jsx is trying to import
4. Potential network/proxy configuration issues

## 🛠️ Complete Fix Implementation

### Step 1: Fix Backend CORS Configuration

Update your `backend/main.py` CORS middleware:

```python
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
```

### Step 2: Create Missing Frontend Components

Create the missing React components that App.jsx is trying to import:

**Create `frontend/src/pages/HomePage.jsx`**:
```jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

function HomePage() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleStartInterview = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      console.log('Starting interview with:', { email, name });
      console.log('API URL:', `${API_BASE_URL}/api/interviews/start`);

      const response = await axios.post(`${API_BASE_URL}/api/interviews/start`, {
        candidate_email: email,
        candidate_name: name || 'Test Candidate'
      }, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000
      });

      console.log('Interview started:', response.data);
      
      // Navigate to interview page with session data
      navigate('/interview', { 
        state: { 
          sessionId: response.data.session_id,
          welcomeMessage: response.data.welcome_message,
          candidateEmail: email
        }
      });

    } catch (err) {
      console.error('Error starting interview:', err);
      setError(
        err.response?.data?.detail || 
        err.message || 
        'Failed to start interview. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      maxWidth: '600px', 
      margin: '0 auto', 
      padding: '2rem',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1 style={{ textAlign: 'center', color: '#2c3e50' }}>
        AI Excel Interviewer
      </h1>
      
      <p style={{ textAlign: 'center', color: '#7f8c8d', marginBottom: '2rem' }}>
        Test your Excel skills with our AI-powered interviewer
      </p>

      <form onSubmit={handleStartInterview} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div>
          <label htmlFor="email" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
            Email Address *
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="your.email@example.com"
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #bdc3c7',
              borderRadius: '4px',
              fontSize: '1rem'
            }}
          />
        </div>

        <div>
          <label htmlFor="name" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
            Full Name (Optional)
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your Full Name"
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #bdc3c7',
              borderRadius: '4px',
              fontSize: '1rem'
            }}
          />
        </div>

        {error && (
          <div style={{ 
            color: '#e74c3c', 
            padding: '0.75rem', 
            backgroundColor: '#fadbd8', 
            border: '1px solid #e74c3c',
            borderRadius: '4px',
            fontSize: '0.9rem'
          }}>
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !email}
          style={{
            backgroundColor: loading ? '#bdc3c7' : '#3498db',
            color: 'white',
            padding: '0.75rem 1.5rem',
            border: 'none',
            borderRadius: '4px',
            fontSize: '1rem',
            cursor: loading ? 'not-allowed' : 'pointer',
            marginTop: '1rem'
          }}
        >
          {loading ? 'Starting Interview...' : 'Start Excel Interview'}
        </button>
      </form>

      <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#ecf0f1', borderRadius: '4px' }}>
        <h3 style={{ margin: '0 0 1rem 0', color: '#2c3e50' }}>What to Expect:</h3>
        <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#34495e' }}>
          <li>Interactive Excel questions and scenarios</li>
          <li>Real-time feedback on your responses</li>
          <li>Assessment of formulas, pivot tables, and data analysis</li>
          <li>Personalized recommendations for improvement</li>
        </ul>
      </div>
    </div>
  );
}

export default HomePage;
```

**Create `frontend/src/pages/InterviewPage.jsx`**:
```jsx
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

function InterviewPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { sessionId, welcomeMessage, candidateEmail } = location.state || {};

  const [messages, setMessages] = useState([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!sessionId) {
      navigate('/');
      return;
    }

    // Add welcome message
    if (welcomeMessage) {
      setMessages([{
        type: 'ai',
        content: welcomeMessage,
        timestamp: new Date().toISOString()
      }]);
    }
  }, [sessionId, welcomeMessage, navigate]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!currentMessage.trim() || loading) return;

    const userMessage = currentMessage.trim();
    setCurrentMessage('');
    setLoading(true);
    setError('');

    // Add user message to chat
    const newUserMessage = {
      type: 'user',
      content: userMessage,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, newUserMessage]);

    try {
      console.log('Sending message:', { sessionId, message: userMessage });
      
      const response = await axios.post(`${API_BASE_URL}/api/interviews/chat/message`, {
        session_id: sessionId,
        message: userMessage
      }, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 30000
      });

      console.log('AI response:', response.data);

      // Add AI response to chat
      const aiMessage = {
        type: 'ai',
        content: response.data.response,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, aiMessage]);

    } catch (err) {
      console.error('Error sending message:', err);
      setError(
        err.response?.data?.detail || 
        err.message || 
        'Failed to send message. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const finishInterview = () => {
    navigate('/results', { 
      state: { 
        sessionId,
        candidateEmail 
      }
    });
  };

  if (!sessionId) {
    return <div>Loading...</div>;
  }

  return (
    <div style={{ 
      maxWidth: '800px', 
      margin: '0 auto', 
      padding: '1rem',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <header style={{ 
        padding: '1rem 0', 
        borderBottom: '1px solid #ecf0f1',
        marginBottom: '1rem'
      }}>
        <h2 style={{ margin: 0, color: '#2c3e50' }}>Excel Skills Interview</h2>
        <p style={{ margin: '0.5rem 0 0 0', color: '#7f8c8d' }}>
          Session: {sessionId.substring(0, 8)}...
        </p>
      </header>

      <div style={{ 
        flex: 1, 
        overflowY: 'auto', 
        padding: '1rem',
        border: '1px solid #ecf0f1',
        borderRadius: '8px',
        marginBottom: '1rem'
      }}>
        {messages.map((message, index) => (
          <div
            key={index}
            style={{
              marginBottom: '1rem',
              padding: '1rem',
              borderRadius: '8px',
              backgroundColor: message.type === 'ai' ? '#e8f4fd' : '#f8f9fa',
              border: `1px solid ${message.type === 'ai' ? '#3498db' : '#dee2e6'}`
            }}
          >
            <div style={{ 
              fontWeight: 'bold', 
              marginBottom: '0.5rem',
              color: message.type === 'ai' ? '#2980b9' : '#495057'
            }}>
              {message.type === 'ai' ? '🤖 AI Interviewer' : '👤 You'}
            </div>
            <div style={{ 
              whiteSpace: 'pre-wrap',
              lineHeight: '1.5'
            }}>
              {message.content}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ 
            padding: '1rem', 
            textAlign: 'center', 
            color: '#7f8c8d' 
          }}>
            AI is thinking...
          </div>
        )}
      </div>

      {error && (
        <div style={{ 
          color: '#e74c3c', 
          padding: '0.75rem', 
          backgroundColor: '#fadbd8', 
          border: '1px solid #e74c3c',
          borderRadius: '4px',
          marginBottom: '1rem'
        }}>
          {error}
        </div>
      )}

      <form onSubmit={sendMessage} style={{ display: 'flex', gap: '0.5rem' }}>
        <input
          type="text"
          value={currentMessage}
          onChange={(e) => setCurrentMessage(e.target.value)}
          placeholder="Type your response here..."
          disabled={loading}
          style={{
            flex: 1,
            padding: '0.75rem',
            border: '1px solid #bdc3c7',
            borderRadius: '4px',
            fontSize: '1rem'
          }}
        />
        <button
          type="submit"
          disabled={loading || !currentMessage.trim()}
          style={{
            backgroundColor: loading ? '#bdc3c7' : '#3498db',
            color: 'white',
            padding: '0.75rem 1.5rem',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          Send
        </button>
        <button
          type="button"
          onClick={finishInterview}
          style={{
            backgroundColor: '#27ae60',
            color: 'white',
            padding: '0.75rem 1rem',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Finish
        </button>
      </form>
    </div>
  );
}

export default InterviewPage;
```

**Create `frontend/src/pages/ResultsPage.jsx`**:
```jsx
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

function ResultsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { sessionId, candidateEmail } = location.state || {};

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!sessionId) {
      navigate('/');
      return;
    }

    fetchReport();
  }, [sessionId, navigate]);

  const fetchReport = async () => {
    try {
      console.log('Fetching report for session:', sessionId);
      
      const response = await axios.get(`${API_BASE_URL}/api/interviews/report/${sessionId}`);
      console.log('Report data:', response.data);
      
      setReport(response.data);
    } catch (err) {
      console.error('Error fetching report:', err);
      setError(
        err.response?.data?.detail || 
        err.message || 
        'Failed to load interview report.'
      );
    } finally {
      setLoading(false);
    }
  };

  const startNewInterview = () => {
    navigate('/');
  };

  if (!sessionId) {
    return <div>Loading...</div>;
  }

  if (loading) {
    return (
      <div style={{ 
        maxWidth: '600px', 
        margin: '0 auto', 
        padding: '2rem',
        textAlign: 'center'
      }}>
        <h2>Generating Your Report...</h2>
        <p>Please wait while we analyze your interview responses.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        maxWidth: '600px', 
        margin: '0 auto', 
        padding: '2rem'
      }}>
        <h2 style={{ color: '#e74c3c' }}>Error</h2>
        <p>{error}</p>
        <button 
          onClick={startNewInterview}
          style={{
            backgroundColor: '#3498db',
            color: 'white',
            padding: '0.75rem 1.5rem',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Start New Interview
        </button>
      </div>
    );
  }

  return (
    <div style={{ 
      maxWidth: '800px', 
      margin: '0 auto', 
      padding: '2rem'
    }}>
      <h1 style={{ textAlign: 'center', color: '#2c3e50' }}>
        Interview Results
      </h1>
      
      <div style={{ 
        padding: '1.5rem', 
        backgroundColor: '#f8f9fa', 
        borderRadius: '8px',
        marginBottom: '2rem'
      }}>
        <h3 style={{ margin: '0 0 1rem 0' }}>Session Details</h3>
        <p><strong>Email:</strong> {candidateEmail}</p>
        <p><strong>Session ID:</strong> {sessionId}</p>
        <p><strong>Status:</strong> {report?.status || 'Completed'}</p>
      </div>

      <div style={{ 
        padding: '1.5rem', 
        backgroundColor: '#ffffff', 
        border: '1px solid #ecf0f1',
        borderRadius: '8px',
        marginBottom: '2rem'
      }}>
        <h3 style={{ margin: '0 0 1rem 0', color: '#2c3e50' }}>Assessment Report</h3>
        <div style={{ 
          whiteSpace: 'pre-wrap',
          lineHeight: '1.6',
          color: '#34495e'
        }}>
          {report?.report || 'Report content not available.'}
        </div>
      </div>

      <div style={{ textAlign: 'center' }}>
        <button 
          onClick={startNewInterview}
          style={{
            backgroundColor: '#3498db',
            color: 'white',
            padding: '0.75rem 2rem',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '1rem'
          }}
        >
          Start New Interview
        </button>
      </div>
    </div>
  );
}

export default ResultsPage;
```

**Create `frontend/src/styles/App.css`**:
```css
* {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background-color: #f8f9fa;
}

#root {
  min-height: 100vh;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

button:hover {
  opacity: 0.9;
  transform: translateY(-1px);
  transition: all 0.2s ease;
}

input:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
}
```

### Step 3: Add Environment Configuration

Create `frontend/.env.development`:
```env
VITE_API_URL=http://localhost:8000
```

Create `frontend/.env.production`:
```env
VITE_API_URL=http://localhost:8000
```

### Step 4: Update Vite Config for Better Proxying

Update your `frontend/vite.config.js`:
```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    watch: {
      usePolling: true,
    },
    // Add proxy configuration for development
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
})
```

## 🚀 Deployment Steps

### Step 1: Deploy Backend Fix
```bash
# Stop containers
docker-compose down

# Update your backend main.py with the CORS fix above

# Restart backend
docker-compose up -d backend

# Check logs
docker-compose logs -f backend
```

### Step 2: Deploy Frontend Fix
```bash
# Create the missing component files above
mkdir -p frontend/src/pages
mkdir -p frontend/src/styles

# Add the component files (HomePage.jsx, InterviewPage.jsx, ResultsPage.jsx, App.css)

# Restart frontend
docker-compose restart frontend

# Check frontend logs  
docker-compose logs -f frontend
```

### Step 3: Test the Complete Flow

```bash
# Test CORS directly
curl -X OPTIONS http://localhost:8000/api/interviews/start \
  -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type"

# Should return 200 OK, not 400 Bad Request

# Test actual API call
curl -X POST http://localhost:8000/api/interviews/start \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:3000" \
  -d '{"candidate_email": "test@example.com"}'
```

## ✅ Expected Results

After applying these fixes:

1. ✅ **CORS preflight succeeds** (no more 400 Bad Request on OPTIONS)
2. ✅ **Frontend loads properly** with all components available
3. ✅ **API calls work** from frontend to backend
4. ✅ **Complete interview flow** functional end-to-end
5. ✅ **Error handling** for network issues

## 🔍 Troubleshooting

If you still get errors:

```bash
# Check if both services are running
docker-compose ps

# Check frontend can reach backend
docker-compose exec frontend curl http://backend:8000/health

# Check browser network tab for specific CORS errors
# Open browser dev tools -> Network tab -> try starting interview

# Check backend logs for CORS details
docker-compose logs backend | grep -i cors
```

The main issue was that your CORS preflight OPTIONS requests were failing, preventing any POST requests from succeeding. The enhanced CORS configuration and complete frontend components should resolve this completely!