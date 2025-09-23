import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getSessionResults } from '../utils/api';
import { Award, TrendingUp, RotateCcw, Home } from 'lucide-react';

const ResultsPage = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadResults();
  }, [sessionId]);

  const loadResults = async () => {
    try {
      const data = await getSessionResults(sessionId);
      setResults(data);
    } catch (error) {
      console.error('Failed to load results:', error);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (percentage) => {
    if (percentage >= 80) return 'excellent';
    if (percentage >= 60) return 'good';
    if (percentage >= 40) return 'average';
    return 'needs-improvement';
  };

  if (loading) {
    return (
      <div className="results-container">
        <div className="loading-card">
          <div className="spinner"></div>
          <p>Loading your results...</p>
        </div>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="results-container">
        <div className="error-card">
          <h2>Results Not Available</h2>
          <p>Unable to load your interview results.</p>
          <button onClick={() => navigate('/')}>
            <Home size={16} />
            Go Home
          </button>
        </div>
      </div>
    );
  }

  const scorePercentage = Math.round((results.totalScore / results.maxScore) * 100);

  return (
    <div className="results-container">
      <div className="results-header">
        <Award size={48} className="results-icon" />
        <h1>Interview Results</h1>
        <p>Here's how you performed in the Excel interview</p>
      </div>

      <div className="score-summary">
        <div className={`score-circle ${getScoreColor(scorePercentage)}`}>
          <div className="score-value">
            <span className="percentage">{scorePercentage}%</span>
            <span className="score-text">
              {results.totalScore} / {results.maxScore} points
            </span>
          </div>
        </div>

        <div className="performance-level">
          <h3>Performance Level</h3>
          <p className={getScoreColor(scorePercentage)}>
            {scorePercentage >= 80 && 'Excellent'}
            {scorePercentage >= 60 && scorePercentage < 80 && 'Good'}
            {scorePercentage >= 40 && scorePercentage < 60 && 'Average'}
            {scorePercentage < 40 && 'Needs Improvement'}
          </p>
        </div>
      </div>

      {results.responses && results.responses.length > 0 && (
        <div className="detailed-results">
          <h2>Question-by-Question Breakdown</h2>

          {results.responses.map((response, index) => (
            <div key={response.questionId} className="response-card">
              <div className="response-header">
                <h3>Question {index + 1}</h3>
                <span className="response-score">
                  {response.score || 0} / {response.maxPoints || 10} points
                </span>
              </div>

              <div className="response-content">
                <div className="question-title">
                  <strong>{response.questionTitle}</strong>
                </div>

                <div className="user-answer">
                  <h4>Your Answer:</h4>
                  <p>{response.userResponse}</p>
                </div>

                {response.feedback && (
                  <div className="ai-feedback">
                    <h4>AI Feedback:</h4>
                    <p>{response.feedback}</p>
                  </div>
                )}

                {response.expectedAnswer && (
                  <div className="expected-answer">
                    <h4>Expected Answer:</h4>
                    <p>{response.expectedAnswer}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="results-actions">
        <button onClick={() => navigate('/')} className="home-button">
          <Home size={16} />
          Back to Home
        </button>

        <button 
          onClick={() => window.location.reload()} 
          className="retry-button"
        >
          <RotateCcw size={16} />
          View Results Again
        </button>
      </div>
    </div>
  );
};

export default ResultsPage;