#!/usr/bin/env bash
# DagBot — Start Script
# Checks prerequisites, installs dependencies, and starts backend + frontend.

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🦖 DagBot — Multi-Provider AI Chatbot${NC}"
echo "=========================================="

# --- Prerequisites Check ---
echo -e "\n${BLUE}Checking prerequisites...${NC}"

# Python
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}✗ Python 3 is required but not installed.${NC}"
    exit 1
fi
PYTHON_VERSION=$(python3 -c 'import sys; print(f"{sys.version_info.major}.{sys.version_info.minor}")')
echo -e "${GREEN}✓ Python ${PYTHON_VERSION}${NC}"

# Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}✗ Node.js is required but not installed.${NC}"
    exit 1
fi
NODE_VERSION=$(node -v)
echo -e "${GREEN}✓ Node.js ${NODE_VERSION}${NC}"

# npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}✗ npm is required but not installed.${NC}"
    exit 1
fi
echo -e "${GREEN}✓ npm $(npm -v)${NC}"

# --- .env Check ---
if [ ! -f "$PROJECT_ROOT/.env" ]; then
    echo -e "${RED}✗ .env file not found at project root.${NC}"
    echo "  Please create it with your API keys."
    exit 1
fi
echo -e "${GREEN}✓ .env file found${NC}"

# --- Python Virtual Environment ---
echo -e "\n${BLUE}Setting up Python virtual environment...${NC}"
VENV_DIR="$PROJECT_ROOT/Code/Backend/.venv"
if [ ! -d "$VENV_DIR" ]; then
    python3 -m venv "$VENV_DIR"
    echo -e "${GREEN}✓ Created virtual environment${NC}"
fi
source "$VENV_DIR/bin/activate"
pip install -q -r "$PROJECT_ROOT/Code/Backend/requirements.txt"
echo -e "${GREEN}✓ Python dependencies installed${NC}"

# --- Frontend Dependencies ---
echo -e "\n${BLUE}Setting up frontend dependencies...${NC}"
cd "$PROJECT_ROOT/Code/Frontend"
if [ ! -d "node_modules" ]; then
    npm install --silent
fi
echo -e "${GREEN}✓ Frontend dependencies ready${NC}"

# --- Start Backend ---
echo -e "\n${BLUE}Starting backend server (port 8000)...${NC}"
cd "$PROJECT_ROOT/Code/Backend"
source "$VENV_DIR/bin/activate"
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload --log-level info &
BACKEND_PID=$!
echo -e "${GREEN}✓ Backend started (PID: ${BACKEND_PID})${NC}"

# Wait for backend to be ready
sleep 2

# --- Start Frontend ---
echo -e "\n${BLUE}Starting frontend dev server (port 5173)...${NC}"
cd "$PROJECT_ROOT/Code/Frontend"
npm run dev &
FRONTEND_PID=$!
echo -e "${GREEN}✓ Frontend started (PID: ${FRONTEND_PID})${NC}"

# Wait for frontend to be ready
sleep 3

# --- Open in Browser ---
echo -e "\n${GREEN}🚀 DagBot is running!${NC}"
echo "  Backend:  http://localhost:8000"
echo "  Frontend: http://localhost:5173"
echo ""

# Try to open in Chrome
if command -v open &> /dev/null; then
    open -a "Google Chrome" "http://localhost:5173" 2>/dev/null || open "http://localhost:5173"
fi

echo "Press Ctrl+C to stop both servers."

# Trap Ctrl+C to kill both processes
trap 'echo -e "\n${BLUE}Shutting down...${NC}"; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0' INT TERM

# Wait for processes
wait
