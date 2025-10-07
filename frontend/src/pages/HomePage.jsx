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
        timeout: 120000
      });

      console.log('Interview started:', response.data);
      
      // Navigate to interview page with session data
      navigate(`/interview/${response.data.session_id}`, { 
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