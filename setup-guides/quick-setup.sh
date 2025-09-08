#!/bin/bash

# 🚀 DirectoryBolt Quick Setup Script
# This script helps you set up the development environment

echo "🚀 DirectoryBolt Development Setup"
echo "=================================="

# Check Node.js version
echo "📋 Checking Node.js version..."
node_version=$(node --version 2>/dev/null)
if [ $? -eq 0 ]; then
    echo "✅ Node.js found: $node_version"
else
    echo "❌ Node.js not found. Please install Node.js 20.18.1 or higher"
    echo "   Download from: https://nodejs.org/"
    exit 1
fi

# Check npm version
npm_version=$(npm --version 2>/dev/null)
echo "✅ npm found: $npm_version"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "❌ .env.local file not found"
    echo "   Please create .env.local with your API keys"
    exit 1
else
    echo "✅ .env.local file found"
fi

# Check for required environment variables
echo "🔑 Checking environment variables..."

# Check OpenAI API key
if grep -q "OPENAI_API_KEY=sk-" .env.local; then
    echo "✅ OpenAI API key configured"
else
    echo "⚠️  OpenAI API key not configured"
    echo "   Please add: OPENAI_API_KEY=sk-proj-YOUR_KEY"
fi

# Check Stripe keys
if grep -q "STRIPE_SECRET_KEY=sk_test_" .env.local; then
    echo "✅ Stripe test keys configured"
else
    echo "⚠️  Stripe keys not configured"
    echo "   Please add Stripe test keys"
fi

# Install ngrok if not present
if ! command -v ngrok &> /dev/null; then
    echo "📡 Installing ngrok..."
    npm install -g ngrok
    echo "✅ ngrok installed"
else
    echo "✅ ngrok already installed"
fi

# Build the project
echo "🔨 Building project..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful"
else
    echo "❌ Build failed. Please check for errors above."
    exit 1
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Configure your API keys in .env.local"
echo "2. Start development server: npm run dev"
echo "3. Start ngrok tunnel: ngrok http 3000"
echo "4. Run tests: npm run test:ai"
echo ""
echo "📚 See setup guides in ./setup-guides/ for detailed instructions"