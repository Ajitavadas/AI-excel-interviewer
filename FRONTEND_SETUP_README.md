# AI Excel Interviewer Frontend Setup

## Quick Fix for Docker Build Error

Your Docker build is failing because the `InterviewPage` component is missing. Here's the complete solution:

### 1. Directory Structure
```
ai-excel-interviewer/
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── HomePage.jsx
│   │   │   ├── InterviewPage.jsx
│   │   │   └── ResultsPage.jsx
│   │   ├── utils/
│   │   │   └── api.js
│   │   ├── styles/
│   │   │   ├── index.css
│   │   │   └── App.css
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── public/
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   ├── Dockerfile.dev
│   ├── Dockerfile
│   └── .dockerignore
├── docker-compose.yml
└── docker-compose.override.yml
```

### 2. Installation Steps

1. **Create the frontend directory structure:**
   ```bash
   mkdir -p frontend/src/{pages,utils,styles}
   mkdir -p frontend/public
   ```

2. **Copy all the generated files to their proper locations**

3. **Install dependencies:**
   ```bash
   cd frontend
   npm install
   ```

4. **Build and run with Docker:**
   ```bash
   cd ..
   docker compose up -d
   ```

### 3. Key Files Created

- **React Components**: HomePage, InterviewPage, ResultsPage
- **API Utils**: Complete API integration with backend
- **Styling**: Modern, responsive CSS
- **Docker Config**: Both development and production setups
- **Vite Config**: Optimized build configuration

### 4. Features Included

- 🎯 Complete interview flow
- 🎨 Modern, responsive UI
- ⚡ Real-time question loading
- 📊 Detailed results page
- 🔄 API integration ready
- 🐳 Docker containerized
- 🔧 Development hot reload

### 5. Environment Variables

Make sure your `.env` file includes:
```
VITE_API_URL=http://localhost:8000
```

### 6. Backend API Endpoints Expected

The frontend expects these backend endpoints:
- `POST /api/interviews/start`
- `GET /api/interviews/{sessionId}/question`
- `POST /api/interviews/{sessionId}/answer`
- `GET /api/interviews/{sessionId}/status`
- `GET /api/interviews/{sessionId}/results`

### 7. Troubleshooting

If you still get build errors:

1. **Clear Docker cache:**
   ```bash
   docker system prune -a
   ```

2. **Rebuild containers:**
   ```bash
   docker compose build --no-cache
   ```

3. **Check file permissions:**
   ```bash
   chmod -R 755 frontend/
   ```

### 8. Development Mode

For hot reload during development:
```bash
docker compose -f docker-compose.yml -f docker-compose.override.yml up -d
```

The frontend will be available at:
- Development: http://localhost:5173
- Production: http://localhost:3000 (or port 80)

Your Docker error should now be resolved!
