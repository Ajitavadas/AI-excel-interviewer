# AI-Powered Excel Mock Interviewer

A comprehensive AI system for conducting automated Excel skill assessments using free services.

## 🚀 Features

- **Multi-turn Interview Simulation**: Conversational AI that conducts structured Excel interviews
- **Intelligent Answer Evaluation**: Automated grading of text responses and Excel tasks
- **Real-time Excel Playground**: Browser-based spreadsheet for hands-on tasks
- **Comprehensive Reporting**: Detailed feedback reports with improvement recommendations
- **Scalable Architecture**: Built with modern web technologies using free services

## 🛠️ Tech Stack

### Frontend
- **React 18** with Vite for fast development
- **Tailwind CSS** for responsive UI
- **Lucide React** for icons
- **React Hot Toast** for notifications
- **Handsontable Community** for Excel-like interface

### Backend
- **FastAPI** with async support
- **SQLAlchemy** with PostgreSQL
- **pgvector** for vector embeddings
- **Ollama** for local LLM (free alternative)
- **Pydantic** for data validation

### Database & Storage
- **Supabase PostgreSQL** (free tier)
- **pgvector extension** for embeddings
- **Supabase Storage** for file handling

### Deployment (Free Tiers)
- **Vercel** for frontend hosting
- **Railway** for backend hosting
- **Supabase** for database and storage

## 📋 Prerequisites

- Node.js 18+
- Python 3.9+
- PostgreSQL (via Supabase)
- Ollama (for local LLM)

## 🔧 Quick Start

### 1. Clone Repository
```bash
git clone &lt;repository-url&gt;
cd ai-excel-interviewer
```

### 2. Setup Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 3. Setup Frontend
```bash
cd ../frontend
npm install
```

### 4. Configure Environment
```bash
cp .env.example .env
# Edit .env with your Supabase and other service credentials
```

### 5. Initialize Database
```bash
# Run database migrations (see IMPLEMENTATION_GUIDE.md)
```

### 6. Start Development
```bash
# Terminal 1: Backend
cd backend && python main.py

# Terminal 2: Frontend  
cd frontend && npm run dev
```

## 📚 Documentation

- [Implementation Guide](docs/IMPLEMENTATION_GUIDE.md) - Step-by-step setup
- [API Documentation](docs/API.md) - REST API endpoints
- [Deployment Guide](docs/DEPLOYMENT.md) - Production deployment

## 🎯 Free Service Limits

- **Supabase**: 500MB database, 1GB storage, 2 free projects
- **Railway**: 500 hours/month, 1GB RAM, $5 credit monthly
- **Vercel**: Unlimited personal projects, 100GB bandwidth
- **Ollama**: Completely free for local LLM inference

## 🤝 Contributing

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- OpenAI for GPT models
- Supabase for database and storage
- Railway for backend hosting
- Vercel for frontend hosting
- Ollama for local LLM capabilities