import React, { useState, useEffect } from 'react'
import { Send, Loader2 } from 'lucide-react'
import { toast } from 'react-hot-toast'

const InterviewChat = () => {
  const [messages, setMessages] = useState([])
  const [inputMessage, setInputMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [sessionId, setSessionId] = useState(null)

  const startInterview = async () => {
    try {
      const response = await fetch('/api/interview/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidate_email: 'test@example.com' })
      })
      const data = await response.json()
      setSessionId(data.session_id)
      setMessages([{ sender: 'agent', message: data.welcome_message }])
    } catch (error) {
      toast.error('Failed to start interview')
    }
  }

  const sendMessage = async () => {
    if (!inputMessage.trim() || loading) return

    const userMessage = { sender: 'user', message: inputMessage }
    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setLoading(true)

    try {
      const response = await fetch('/api/chat/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          message: inputMessage
        })
      })
      const data = await response.json()
      setMessages(prev => [...prev, { sender: 'agent', message: data.response }])
    } catch (error) {
      toast.error('Failed to send message')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    startInterview()
  }, [])

  return (
    <div className="flex flex-col h-96 border rounded-lg bg-white">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, index) => (
          <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
              msg.sender === 'user' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-200 text-gray-800'
            }`}>
              {msg.message}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-200 px-4 py-2 rounded-lg">
              <Loader2 className="animate-spin h-4 w-4" />
            </div>
          </div>
        )}
      </div>
      
      <div className="border-t p-4 flex space-x-2">
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Type your answer..."
          className="flex-1 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={loading}
        />
        <button
          onClick={sendMessage}
          disabled={loading || !inputMessage.trim()}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

export default InterviewChat