# AI Excel Interviewer - Backend Dev Container

FROM python:3.10-slim

# Set work directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*

# Create virtual environment
RUN python -m venv /venv
ENV VIRTUAL_ENV=/venv
ENV PATH="/venv/bin:$PATH"

# Copy requirements and install
COPY backend/requirements.txt ./backend/requirements.txt
RUN pip install --upgrade pip && pip install -r ./backend/requirements.txt

# Copy backend code
COPY backend /app/backend

# Set default command
CMD ["python", "/app/backend/main.py"]
