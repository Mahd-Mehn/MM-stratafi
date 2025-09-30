#!/bin/bash

# StrataFi Development Startup Script
# This script starts both the Helios AI agent and the frontend

echo "🚀 Starting StrataFi Development Environment..."

# Function to cleanup on exit
cleanup() {
    echo "\n🛑 Shutting down services..."
    kill $HELIOS_PID $FRONTEND_PID 2>/dev/null
    exit
}

trap cleanup EXIT INT TERM

# Start Helios AI Agent
echo "🤖 Starting Helios AI Agent..."
cd apps/helios-agent
python main.py &
HELIOS_PID=$!
echo "   ✅ Helios AI Agent running on http://localhost:8000"

# Wait a moment for Helios to start
sleep 2

# Start Frontend
echo "🎨 Starting Frontend..."
cd ../../apps/frontend
npm run dev &
FRONTEND_PID=$!
echo "   ✅ Frontend starting on http://localhost:3000"

echo ""
echo "========================================="
echo "✨ StrataFi is running!"
echo "========================================="
echo ""
echo "📌 Services:"
echo "   • Frontend: http://localhost:3000"
echo "   • Helios AI API: http://localhost:8000"
echo "   • API Docs: http://localhost:8000/docs"
echo ""
echo "📝 To stop all services, press Ctrl+C"
echo ""

# Keep script running
wait
