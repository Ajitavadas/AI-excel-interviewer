#!/bin/bash

echo "Setting up AI Excel Interviewer Frontend..."
echo "=" * 50

# Create frontend directory structure
echo "Creating directory structure..."
mkdir -p frontend/src/{pages,utils,styles}
mkdir -p frontend/public
mkdir -p docker

echo "✓ Directory structure created"

# Create package.json
cat > frontend/package.json << 'EOF'
{
  "name": "ai-excel-interviewer-frontend",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.8.1",
    "axios": "^1.3.4",
    "lucide-react": "^0.344.0"
  },
  "devDependencies": {
    "@types/react": "^18.0.28",
    "@types/react-dom": "^18.0.11",
    "@vitejs/plugin-react": "^3.1.0",
    "vite": "^4.1.0"
  }
}
EOF

echo "✓ package.json created"

# Create vite config
cat > frontend/vite.config.js << 'EOF'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    watch: {
      usePolling: true,
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
})
EOF

echo "✓ vite.config.js created"

# Create index.html
cat > frontend/index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>AI Excel Interviewer</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
EOF

echo "✓ index.html created"

# Create Dockerfiles
cat > frontend/Dockerfile.dev << 'EOF'
# Development Dockerfile for Frontend
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy frontend source
COPY . ./

# Expose port
EXPOSE 5173

# Start development server
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
EOF

cat > frontend/Dockerfile << 'EOF'
# Production Dockerfile for Frontend
FROM node:18-alpine as build-stage

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy frontend source
COPY . ./

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built files from build stage
COPY --from=build-stage /app/dist /usr/share/nginx/html

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
EOF

cat > frontend/.dockerignore << 'EOF'
node_modules
npm-debug.log
.git
.gitignore
README.md
.env
.nyc_output
coverage
.docker
Dockerfile*
docker-compose*
EOF

echo "✓ Docker files created"

echo "Setup complete! Now copy the React component files to their respective locations."
echo "Then run: docker compose up -d"
