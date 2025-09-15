
import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import InterviewPage from './pages/InterviewPage'
import ReportPage from './pages/ReportPage'
import './styles/index.css'

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          <Route path="/" element={<InterviewPage />} />
          <Route path="/report/:sessionId" element={<ReportPage />} />
        </Routes>
        <Toaster position="top-right" />
      </div>
    </Router>
  )
}

export default App

