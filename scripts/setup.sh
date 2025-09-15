#!/bin/bash
# AI Excel Interviewer - Setup Script
# This script sets up the complete project using free services

set -e  # Exit on any error

echo "🚀 Setting up AI Excel Interviewer Project"
echo "==========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if required tools are installed
check_dependencies() {
    echo -e "${BLUE}Checking dependencies...${NC}"
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        echo -e "${RED}Error: Node.js is not installed. Please install Node.js 18+ from https://nodejs.org${NC}"
        exit 1
    fi
    
    # Check Python
    if ! command -v python3 &> /dev/null; then
        echo -e "${RED}Error: Python 3 is not installed. Please install Python 3.9+ from https://python.org${NC}"
        exit 1
    fi
    
    # Check Git
    if ! command -v git &> /dev/null; then
        echo -e "${RED}Error: Git is not installed. Please install Git from https://git-scm.com${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✓ All dependencies found${NC}"
}

# Create project structure
create_structure() {
    echo -e "${BLUE}Creating project structure...${NC}"
    
    mkdir -p frontend/src/{components,utils,styles,pages}
    mkdir -p frontend/public
    mkdir -p backend/app/{models,services,api/routes,core,utils}
    mkdir -p database/migrations
    mkdir -p docs
    mkdir -p scripts
    
    echo -e "${GREEN}✓ Project structure created${NC}"
}

# Setup backend
setup_backend() {
    echo -e "${BLUE}Setting up backend...${NC}"
    
    cd backend
    
    # Create virtual environment
    python3 -m venv venv
    
    # Activate virtual environment
    if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]]; then
        source venv/Scripts/activate  # Windows Git Bash
    else
        source venv/bin/activate      # macOS/Linux
    fi
    
    # Install dependencies
    pip install --upgrade pip
    pip install -r requirements.txt
    
    echo -e "${GREEN}✓ Backend setup complete${NC}"
    
    cd ..
}

# Setup frontend
setup_frontend() {
    echo -e "${BLUE}Setting up frontend...${NC}"
    
    cd frontend
    
    # Install dependencies
    npm install
    
    echo -e "${GREEN}✓ Frontend setup complete${NC}"
    
    cd ..
}

# Initialize Git repository
init_git() {
    echo -e "${BLUE}Initializing Git repository...${NC}"
    
    # Create .gitignore if it doesn't exist
    if [ ! -f .gitignore ]; then
        cat > .gitignore << EOF
# Dependencies
node_modules/
venv/
__pycache__/

# Environment files
.env
.env.local
.env.production

# Build outputs
dist/
build/

# Database
*.db
*.sqlite

# Logs
*.log
logs/

# OS files
.DS_Store
Thumbs.db

# IDE files
.vscode/
.idea/
*.swp
*.swo

# Python specific
*.pyc
*.pyo
*.pyd
__pycache__/
.pytest_cache/

# Coverage reports
htmlcov/
.coverage

# Temporary files
*.tmp
*.temp
EOF
    fi
    
    # Initialize git if not already initialized
    if [ ! -d .git ]; then
        git init
        git add .
        git commit -m "Initial commit: AI Excel Interviewer project setup"
    fi
    
    echo -e "${GREEN}✓ Git repository initialized${NC}"
}

# Install Ollama (if not present)
install_ollama() {
    echo -e "${BLUE}Checking Ollama installation...${NC}"
    
    if ! command -v ollama &> /dev/null; then
        echo -e "${YELLOW}Ollama not found. Installing...${NC}"
        
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS
            if command -v brew &> /dev/null; then
                brew install ollama
            else
                echo -e "${RED}Please install Homebrew first, then run: brew install ollama${NC}"
                exit 1
            fi
        elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
            # Linux
            curl -fsSL https://ollama.ai/install.sh | sh
        else
            echo -e "${YELLOW}Please install Ollama manually from https://ollama.ai${NC}"
            echo -e "${YELLOW}Then run: ollama pull llama3.1:8b${NC}"
            return
        fi
    fi
    
    # Pull the model
    echo -e "${BLUE}Pulling Llama model (this may take a few minutes)...${NC}"
    ollama pull llama3.1:8b
    
    echo -e "${GREEN}✓ Ollama setup complete${NC}"
}

# Create environment file
create_env() {
    echo -e "${BLUE}Creating environment configuration...${NC}"
    
    if [ ! -f .env ]; then
        cp .env.example .env
        echo -e "${YELLOW}⚠️  Please edit .env file with your actual configuration values:${NC}"
        echo -e "   - Supabase connection details"
        echo -e "   - API keys (if using OpenAI)"
        echo -e "   - Other service credentials"
    fi
    
    echo -e "${GREEN}✓ Environment file created${NC}"
}

# Display next steps
show_next_steps() {
    echo -e "\n${GREEN}🎉 Setup Complete!${NC}"
    echo -e "=================="
    echo -e "\n${YELLOW}Next Steps:${NC}"
    echo -e "1. Configure your .env file with actual service credentials"
    echo -e "2. Set up your Supabase database:"
    echo -e "   - Go to https://supabase.com"
    echo -e "   - Create a new project"
    echo -e "   - Run the SQL schema from database/init.sql"
    echo -e "   - Update DATABASE_URL in .env"
    echo -e "\n3. Start the development servers:"
    echo -e "   ${BLUE}# Terminal 1 - Backend${NC}"
    echo -e "   cd backend && source venv/bin/activate && python main.py"
    echo -e "\n   ${BLUE}# Terminal 2 - Frontend${NC}"
    echo -e "   cd frontend && npm run dev"
    echo -e "\n4. Visit http://localhost:5173 to test the application"
    echo -e "\n${YELLOW}For deployment instructions, see docs/DEPLOYMENT.md${NC}"
    echo -e "\n${GREEN}Good luck with your AI Excel Interviewer! 🚀${NC}"
}

# Main execution
main() {
    echo -e "${GREEN}Starting setup process...${NC}\n"
    
    check_dependencies
    create_structure
    setup_backend
    setup_frontend
    init_git
    install_ollama
    create_env
    show_next_steps
}

# Run main function
main