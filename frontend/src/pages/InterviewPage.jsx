import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

function InterviewPage() {
  const { sessionId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { welcomeMessage, candidateEmail } = location.state || {};

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
        timeout: 3000000
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