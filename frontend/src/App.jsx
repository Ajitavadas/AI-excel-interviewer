import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import InterviewPage from './pages/InterviewPage';
import ResultsPage from './pages/ResultsPage';
import './styles/App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/interview/:sessionId" element={<InterviewPage />} />
          <Route path="/results/:sessionId" element={<ResultsPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;