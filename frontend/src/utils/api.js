const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

class APIError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      throw new APIError(
        `HTTP error! status: ${response.status}`,
        response.status
      );
    }

    return await response.json();
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    throw new APIError('Network error occurred', 0);
  }
};

export const startInterview = async (candidateData) => {
  return apiRequest('/api/interviews/start', {
    method: 'POST',
    body: JSON.stringify(candidateData),
  });
};

export const getQuestion = async (sessionId) => {
  return apiRequest(`/api/interviews/${sessionId}/question`);
};

export const submitAnswer = async (sessionId, questionId, answer) => {
  return apiRequest(`/api/interviews/${sessionId}/answer`, {
    method: 'POST',
    body: JSON.stringify({
      questionId,
      answer,
    }),
  });
};

export const getSessionStatus = async (sessionId) => {
  return apiRequest(`/api/interviews/${sessionId}/status`);
};

export const getSessionResults = async (sessionId) => {
  return apiRequest(`/api/interviews/${sessionId}/results`);
};