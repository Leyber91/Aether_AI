#!/bin/bash

# Aether AI DEAC Setup Script
# This script sets up the DEAC environment on your local machine

set -e  # Exit on any error

echo "🚀 Setting up Aether AI DEAC Environment"
echo "========================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check system requirements
print_status "Checking system requirements..."

# Check for Docker
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi

# Check for Docker Compose
if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Check for Node.js
if ! command -v node &> /dev/null; then
    print_warning "Node.js not found. Installing Node.js..."
    # Add Node.js installation commands for different platforms
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
        sudo apt-get install -y nodejs
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        brew install node
    else
        print_error "Please install Node.js manually from https://nodejs.org/"
        exit 1
    fi
fi

# Check for Python
if ! command -v python3 &> /dev/null; then
    print_error "Python 3 is not installed. Please install Python 3.8+ first."
    exit 1
fi

# Check Python version
PYTHON_VERSION=$(python3 -c 'import sys; print(".".join(map(str, sys.version_info[:2])))')
REQUIRED_VERSION="3.8"
if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$PYTHON_VERSION" | sort -V | head -n1)" != "$REQUIRED_VERSION" ]; then
    print_error "Python 3.8+ is required. Found: $PYTHON_VERSION"
    exit 1
fi

print_status "System requirements check passed ✅"

# Create project directories
print_status "Creating DEAC project structure..."

# Backend directories
mkdir -p backend/services/deac_services
mkdir -p backend/models/deac_models
mkdir -p backend/api/routes/deac_routes
mkdir -p backend/api/websockets
mkdir -p backend/database/{postgres,vector,redis}

# Frontend directories  
mkdir -p frontend/src/components/DEAC
mkdir -p frontend/src/components/StemConglomerate
mkdir -p frontend/src/components/Collaboration
mkdir -p frontend/src/hooks/deac_hooks
mkdir -p frontend/src/services/deac_services
mkdir -p frontend/src/contexts/deac_contexts

# Infrastructure directories
mkdir -p infrastructure/docker
mkdir -p infrastructure/nginx
mkdir -p infrastructure/monitoring/{prometheus,grafana}

# Data directories
mkdir -p data/{vectors,deacs,evolution}
mkdir -p data/vectors/{chromadb,embeddings}
mkdir -p data/deacs/{mv_deacs,conglomerates}
mkdir -p data/evolution/{generations,metrics}

# Scripts directories
mkdir -p scripts/{setup,deac}

# Documentation directories
mkdir -p docs/{deac,deployment}

print_status "Project structure created ✅"

# Update requirements.txt with DEAC dependencies
print_status "Updating Python dependencies..."

cat >> requirements.txt << 'EOF'

# DEAC Dependencies
chromadb>=0.4.0
redis>=4.5.0
websockets>=11.0
psycopg2-binary>=2.9.0
celery>=5.3.0
prometheus-client>=0.17.0
python-multipart>=0.0.6
sqlalchemy>=2.0.0
alembic>=1.12.0
numpy>=1.24.0
scikit-learn>=1.3.0
sentence-transformers>=2.2.0
asyncpg>=0.28.0
aioredis>=2.0.0
tenacity>=8.2.0
EOF

print_status "Updated requirements.txt ✅"

# Update package.json with DEAC dependencies
print_status "Updating Node.js dependencies..."

# Check if package.json exists
if [ -f "package.json" ]; then
    # Add new dependencies to existing package.json
    npm install @reduxjs/toolkit socket.io-client three @react-three/fiber d3 recharts ws
    print_status "Updated package.json ✅"
else
    print_warning "package.json not found. Please run 'npm install' in your frontend directory."
fi

# Create environment configuration
print_status "Creating environment configuration..."

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    cp .env.example .env || cat > .env << 'EOF'
# Database Configuration
DATABASE_URL=postgresql://aether_user:aether_pass@localhost:5432/aether_db
REDIS_URL=redis://localhost:6379/0
VECTOR_DB_URL=http://localhost:8001

# AI Model Configuration  
OLLAMA_URL=http://localhost:11434
GROQ_API_KEY=your_groq_api_key_here

# DEAC Configuration
DEAC_MAX_ACTIVE=10
DEAC_EVOLUTION_ENABLED=true
DEAC_MEMORY_ENABLED=true

# WebSocket Configuration
WS_HOST=0.0.0.0
WS_PORT=8000

# Monitoring
PROMETHEUS_ENABLED=true
GRAFANA_ENABLED=true

# Development
DEBUG=true
LOG_LEVEL=INFO
EOF
    print_status "Created .env file ✅"
    print_warning "Please update .env with your actual API keys and configuration."
fi

# Create Docker files
print_status "Creating Docker configuration..."

# Backend Dockerfile
cat > infrastructure/docker/Dockerfile.backend << 'EOF'
FROM python:3.11-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY backend/ ./backend/
COPY data/ ./data/

# Expose port
EXPOSE 8000

# Run the application
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
EOF

# Frontend Dockerfile
cat > infrastructure/docker/Dockerfile.frontend << 'EOF'
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY frontend/ ./

# Build the application
RUN npm run build

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
EOF

print_status "Created Docker configuration ✅"

# Create basic NGINX configuration
cat > infrastructure/nginx/nginx.conf << 'EOF'
events {
    worker_connections 1024;
}

http {
    upstream backend {
        server backend:8000;
    }
    
    upstream frontend {
        server frontend:3000;
    }

    server {
        listen 80;
        
        location /api/ {
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }
        
        location /ws/ {
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
        }
        
        location / {
            proxy_pass http://frontend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }
    }
}
EOF

print_status "Created NGINX configuration ✅"

# Create Prometheus configuration
cat > infrastructure/monitoring/prometheus.yml << 'EOF'
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'aether-backend'
    static_configs:
      - targets: ['backend:8000']
    metrics_path: '/metrics'
    
  - job_name: 'aether-redis'
    static_configs:
      - targets: ['redis:6379']
      
  - job_name: 'aether-postgres'
    static_configs:
      - targets: ['postgres:5432']
EOF

print_status "Created monitoring configuration ✅"

# Install Python dependencies
print_status "Installing Python dependencies..."
pip3 install -r requirements.txt

print_status "Python dependencies installed ✅"

# Create initial DEAC migration
print_status "Creating database schema..."

cat > backend/database/postgres/schemas.py << 'EOF'
from sqlalchemy import Column, String, DateTime, Boolean, Integer, Float, JSON, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.dialects.postgresql import UUID
import uuid

Base = declarative_base()

class DEACEntity(Base):
    __tablename__ = "deacs"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    base_model = Column(String(255), nullable=False)
    current_model = Column(String(255))
    
    state = Column(String(50), default="initializing")
    config = Column(JSON, default={})
    capabilities = Column(JSON, default={})
    
    created_at = Column(DateTime, nullable=False)
    last_modified = Column(DateTime, nullable=False)
    last_active = Column(DateTime)
    
    total_interactions = Column(Integer, default=0)
    successful_tasks = Column(Integer, default=0)
    evolution_generations = Column(Integer, default=0)

class DEACEvolution(Base):
    __tablename__ = "deac_evolution"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    deac_id = Column(UUID(as_uuid=True), nullable=False)
    step_id = Column(Integer, nullable=False)
    
    timestamp = Column(DateTime, nullable=False)
    description = Column(Text)
    changes = Column(JSON, default={})
    metrics = Column(JSON, default={})
    success = Column(Boolean, default=True)
EOF

print_status "Database schema created ✅"

# Success message
echo ""
echo -e "${GREEN}🎉 DEAC Environment Setup Complete! 🎉${NC}"
echo ""
echo "Next steps:"
echo "1. Update .env file with your configuration"
echo "2. Start the services: docker-compose up -d"
echo "3. Access the application at http://localhost:3000"
echo "4. Access the API at http://localhost:8000"
echo "5. Monitor with Grafana at http://localhost:3001"
echo ""
echo "Quick start commands:"
echo "  docker-compose up -d          # Start all services"
echo "  docker-compose logs -f        # View logs"
echo "  docker-compose down           # Stop services"
echo ""
echo -e "${BLUE}Happy DEAC building! 🤖✨${NC}"