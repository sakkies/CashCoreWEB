#!/bin/bash

# CashCore View Count System Setup Script
echo "🚀 Setting up CashCore View Count System..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ Node.js and npm are installed"

# Install new dependencies
echo "📦 Installing new dependencies..."
npm install node-fetch@^3.3.2

if [ $? -eq 0 ]; then
    echo "✅ Dependencies installed successfully"
else
    echo "❌ Failed to install dependencies"
    exit 1
fi

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Creating from template..."
    cp env_example.txt .env
    echo "📝 Please update your .env file with your API keys"
else
    echo "✅ .env file exists"
fi

# Check for required environment variables
echo "🔍 Checking environment variables..."

if grep -q "YOUTUBE_API_KEY=" .env; then
    echo "✅ YouTube API key found in .env"
else
    echo "⚠️  YouTube API key not found in .env"
    echo "📝 Please add your YouTube API key to the .env file"
fi

# Test the bot
echo "🧪 Testing bot startup..."
timeout 10s node index.js > /dev/null 2>&1

if [ $? -eq 0 ] || [ $? -eq 124 ]; then
    echo "✅ Bot starts successfully"
else
    echo "❌ Bot failed to start. Check your configuration."
    exit 1
fi

echo ""
echo "🎉 CashCore View Count System setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Update your .env file with your YouTube API key"
echo "2. Deploy your commands: npm run deploy"
echo "3. Test the new commands:"
echo "   - /update-view-counts (for users)"
echo "   - /quota-status (for admins)"
echo ""
echo "📚 Documentation: VIEW_COUNT_SYSTEM.md"
echo "🔧 Configuration: env_example.txt"
echo ""
echo "🚀 Your bot is now ready to handle view counts for YouTube, TikTok, and Instagram!"

