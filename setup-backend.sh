#!/bin/bash

echo "🚀 Setting up CV Builder Backend..."
echo ""

# Navigate to backend directory
cd "$(dirname "$0")/backend"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

echo "✅ Node.js $(node --version) detected"

# Install dependencies
echo ""
echo "📦 Installing backend dependencies..."
npm install

# Check if .env exists
if [ ! -f .env ]; then
    echo ""
    echo "⚠️  .env file not found"
    echo "📝 Creating .env from template..."
    cp .env.example .env
    echo ""
    echo "⚠️  IMPORTANT: Edit backend/.env and add your OpenAI API key!"
    echo "   Get your key from: https://platform.openai.com/api-keys"
    echo ""
else
    echo ""
    echo "✅ .env file exists"
fi

echo ""
echo "✅ Backend setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit backend/.env and add your OPENAI_API_KEY"
echo "2. Run: cd backend && npm run dev"
echo "3. Backend will start on http://localhost:3001"
echo ""
