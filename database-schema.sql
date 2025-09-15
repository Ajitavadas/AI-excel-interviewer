-- Initialize database with pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE interview_status AS ENUM ('pending', 'in_progress', 'completed', 'cancelled');
CREATE TYPE question_type AS ENUM ('mcq', 'text', 'excel_task', 'scenario');
CREATE TYPE difficulty_level AS ENUM ('beginner', 'intermediate', 'advanced', 'expert');

-- Candidates table
CREATE TABLE candidates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    experience_years INTEGER DEFAULT 0,
    position_applied VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Interview sessions table
CREATE TABLE interview_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    candidate_id UUID REFERENCES candidates(id) ON DELETE CASCADE,
    status interview_status DEFAULT 'pending',
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    total_duration_minutes INTEGER DEFAULT 0,
    overall_score DECIMAL(5,2) DEFAULT 0.0,
    max_possible_score DECIMAL(5,2) DEFAULT 100.0,
    feedback_report TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Question bank table
CREATE TABLE questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(500) NOT NULL,
    description TEXT NOT NULL,
    question_type question_type NOT NULL,
    difficulty difficulty_level NOT NULL,
    category VARCHAR(100) NOT NULL, -- e.g., 'formulas', 'pivot_tables', 'data_analysis'
    subcategory VARCHAR(100), -- e.g., 'vlookup', 'sumif', 'charts'
    expected_answer TEXT,
    grading_rubric JSONB,
    test_data JSONB, -- For Excel tasks
    time_limit_minutes INTEGER DEFAULT 10,
    points DECIMAL(5,2) DEFAULT 10.0,
    is_active BOOLEAN DEFAULT TRUE,
    usage_count INTEGER DEFAULT 0,
    success_rate DECIMAL(5,2) DEFAULT 0.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Interview responses table
CREATE TABLE interview_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES interview_sessions(id) ON DELETE CASCADE,
    question_id UUID REFERENCES questions(id),
    candidate_answer TEXT,
    file_attachments JSONB DEFAULT '[]', -- For Excel file uploads
    response_time_seconds INTEGER,
    score DECIMAL(5,2) DEFAULT 0.0,
    max_score DECIMAL(5,2) DEFAULT 10.0,
    feedback TEXT,
    grading_details JSONB,
    is_correct BOOLEAN,
    answered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chat messages table for conversational flow
CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES interview_sessions(id) ON DELETE CASCADE,
    sender VARCHAR(20) NOT NULL, -- 'agent' or 'candidate'
    message TEXT NOT NULL,
    message_type VARCHAR(50) DEFAULT 'text', -- 'text', 'question', 'evaluation', 'system'
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Vector embeddings for semantic search
CREATE TABLE question_embeddings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
    embedding vector(1536), -- OpenAI embedding dimension
    model_name VARCHAR(100) DEFAULT 'text-embedding-ada-002',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Interview session state management
CREATE TABLE session_state (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES interview_sessions(id) ON DELETE CASCADE,
    current_phase VARCHAR(50) DEFAULT 'introduction', -- 'introduction', 'questions', 'wrap_up'
    current_question_id UUID,
    questions_asked JSONB DEFAULT '[]',
    questions_remaining JSONB DEFAULT '[]',
    conversation_context JSONB DEFAULT '{}',
    adaptive_difficulty difficulty_level DEFAULT 'intermediate',
    performance_trend JSONB DEFAULT '[]',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Performance analytics table
CREATE TABLE performance_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES interview_sessions(id) ON DELETE CASCADE,
    category VARCHAR(100) NOT NULL,
    subcategory VARCHAR(100),
    score DECIMAL(5,2) NOT NULL,
    max_score DECIMAL(5,2) NOT NULL,
    percentile DECIMAL(5,2),
    time_spent_seconds INTEGER,
    attempts INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_candidates_email ON candidates(email);
CREATE INDEX idx_interview_sessions_candidate ON interview_sessions(candidate_id);
CREATE INDEX idx_interview_sessions_status ON interview_sessions(status);
CREATE INDEX idx_questions_category ON questions(category, difficulty);
CREATE INDEX idx_questions_type ON questions(question_type);
CREATE INDEX idx_responses_session ON interview_responses(session_id);
CREATE INDEX idx_chat_messages_session ON chat_messages(session_id);
CREATE INDEX idx_embeddings_vector ON question_embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Updated at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_candidates_updated_at BEFORE UPDATE ON candidates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_interview_sessions_updated_at BEFORE UPDATE ON interview_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_questions_updated_at BEFORE UPDATE ON questions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_session_state_updated_at BEFORE UPDATE ON session_state FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();