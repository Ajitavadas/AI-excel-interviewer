import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getQuestion, submitAnswer, getSessionStatus } from '../utils/api';
import { Clock, Send, CheckCircle } from 'lucide-react';

const InterviewPage = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [sessionComplete, setSessionComplete] = useState(false);

  useEffect(() => {
    loadNextQuestion();
    const timer = setInterval(() => {
      setTimeElapsed(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [sessionId]);

  const loadNextQuestion = async () => {
    try {
      setLoading(true);
      const question = await getQuestion(sessionId);

      if (question) {
        setCurrentQuestion(question);
        setAnswer('');
      } else {
        // No more questions, interview is complete
        setSessionComplete(true);
      }
    } catch (error) {
      console.error('Failed to load question:', error);
      // Check if session is complete
      try {
        const status = await getSessionStatus(sessionId);
        if (status.status === 'completed') {
          setSessionComplete(true);
        }
      } catch (statusError) {
        console.error('Failed to check session status:', statusError);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAnswer = async (e) => {
    e.preventDefault();
    if (!answer.trim()) {
      alert('Please provide an answer');
      return;
    }

    setSubmitting(true);
    try {
      await submitAnswer(sessionId, currentQuestion.id, answer);
      // Load next question
      await loadNextQuestion();
    } catch (error) {
      console.error('Failed to submit answer:', error);
      alert('Failed to submit answer. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCompleteInterview = () => {
    navigate(`/results/${sessionId}`);
  };

  if (sessionComplete) {
    return (
      <div className="interview-container">
        <div className="completion-card">
          <CheckCircle size={64} className="completion-icon" />
          <h2>Interview Complete!</h2>
          <p>Thank you for completing the AI Excel Interview.</p>
          <p>Time taken: {formatTime(timeElapsed)}</p>
          <button 
            onClick={handleCompleteInterview}
            className="results-button"
          >
            View Results
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="interview-container">
        <div className="loading-card">
          <div className="spinner"></div>
          <p>Loading your next question...</p>
        </div>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="interview-container">
        <div className="error-card">
          <h2>Question Not Available</h2>
          <p>Unable to load the next question. Please try refreshing the page.</p>
          <button onClick={() => window.location.reload()}>
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="interview-container">
      <div className="interview-header">
        <div className="session-info">
          <h1>Excel Interview</h1>
          <div className="timer">
            <Clock size={16} />
            {formatTime(timeElapsed)}
          </div>
        </div>
      </div>

      <div className="question-card">
        <div className="question-header">
          <h2>{currentQuestion.title}</h2>
          <div className="question-meta">
            <span className="difficulty">{currentQuestion.difficulty}</span>
            <span className="category">{currentQuestion.category}</span>
            <span className="points">{currentQuestion.points} points</span>
          </div>
        </div>

        <div className="question-content">
          <p>{currentQuestion.description}</p>
        </div>

        <form onSubmit={handleSubmitAnswer} className="answer-form">
          <div className="form-group">
            <label htmlFor="answer">Your Answer:</label>
            <textarea
              id="answer"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Enter your answer here..."
              rows={6}
              required
            />
          </div>

          <button 
            type="submit" 
            className="submit-button"
            disabled={submitting}
          >
            <Send size={16} />
            {submitting ? 'Submitting...' : 'Submit Answer'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default InterviewPage;