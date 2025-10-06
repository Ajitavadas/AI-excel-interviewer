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