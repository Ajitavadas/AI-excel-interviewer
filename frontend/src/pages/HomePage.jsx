import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { startInterview } from '../utils/api';
import { User, Mail, Play } from 'lucide-react';

const HomePage = () => {
  const [candidateData, setCandidateData] = useState({
    name: '',
    email: ''
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    setCandidateData({
      ...candidateData,
      [e.target.name]: e.target.value
    });
  };

  const handleStartInterview = async (e) => {
    e.preventDefault();
    if (!candidateData.name || !candidateData.email) {
      alert('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const response = await startInterview(candidateData);
      navigate(`/interview/${response.sessionId}`);
    } catch (error) {
      console.error('Failed to start interview:', error);
      alert('Failed to start interview. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="home-container">
      <div className="hero-section">
        <h1 className="hero-title">AI Excel Interviewer</h1>
        <p className="hero-subtitle">
          Test your Excel skills with our AI-powered interview system
        </p>
      </div>

      <div className="form-container">
        <form onSubmit={handleStartInterview} className="interview-form">
          <h2>Start Your Interview</h2>

          <div className="form-group">
            <label htmlFor="name">
              <User size={20} />
              Full Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={candidateData.name}
              onChange={handleInputChange}
              placeholder="Enter your full name"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">
              <Mail size={20} />
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={candidateData.email}
              onChange={handleInputChange}
              placeholder="Enter your email address"
              required
            />
          </div>

          <button 
            type="submit" 
            className="start-button"
            disabled={loading}
          >
            <Play size={20} />
            {loading ? 'Starting...' : 'Start Interview'}
          </button>
        </form>
      </div>

      <div className="info-section">
        <div className="info-card">
          <h3>What to Expect</h3>
          <ul>
            <li>Interactive Excel questions</li>
            <li>Real-time AI evaluation</li>
            <li>Detailed feedback on your performance</li>
            <li>Questions covering formulas, pivot tables, and data analysis</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default HomePage;