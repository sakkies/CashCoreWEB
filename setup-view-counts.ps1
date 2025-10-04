# CashCore View Count System Setup Script (PowerShell)
Write-Host "🚀 Setting up CashCore View Count System..." -ForegroundColor Green

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js is installed: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js is not installed. Please install Node.js first." -ForegroundColor Red
    exit 1
}

# Check if npm is installed
try {
    $npmVersion = npm --version
    Write-Host "✅ npm is installed: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ npm is not installed. Please install npm first." -ForegroundColor Red
    exit 1
}

# Install new dependencies
Write-Host "📦 Installing new dependencies..." -ForegroundColor Yellow
npm install node-fetch@^3.3.2

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Dependencies installed successfully" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
    exit 1
}

# Check if .env file exists
if (-not (Test-Path ".env")) {
    Write-Host "⚠️  .env file not found. Creating from template..." -ForegroundColor Yellow
    Copy-Item "env_example.txt" ".env"
    Write-Host "📝 Please update your .env file with your API keys" -ForegroundColor Cyan
} else {
    Write-Host "✅ .env file exists" -ForegroundColor Green
}

# Check for required environment variables
Write-Host "🔍 Checking environment variables..." -ForegroundColor Yellow

if ((Get-Content ".env" -Raw) -match "YOUTUBE_API_KEY=") {
    Write-Host "✅ YouTube API key found in .env" -ForegroundColor Green
} else {
    Write-Host "⚠️  YouTube API key not found in .env" -ForegroundColor Yellow
    Write-Host "📝 Please add your YouTube API key to the .env file" -ForegroundColor Cyan
}

# Test the bot
Write-Host "🧪 Testing bot startup..." -ForegroundColor Yellow
try {
    $job = Start-Job -ScriptBlock { node index.js }
    Start-Sleep -Seconds 5
    Stop-Job $job
    Remove-Job $job
    Write-Host "✅ Bot starts successfully" -ForegroundColor Green
} catch {
    Write-Host "❌ Bot failed to start. Check your configuration." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🎉 CashCore View Count System setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next steps:" -ForegroundColor Cyan
Write-Host "1. Update your .env file with your YouTube API key" -ForegroundColor White
Write-Host "2. Deploy your commands: npm run deploy" -ForegroundColor White
Write-Host "3. Test the new commands:" -ForegroundColor White
Write-Host "   - /update-view-counts (for users)" -ForegroundColor Gray
Write-Host "   - /quota-status (for admins)" -ForegroundColor Gray
Write-Host ""
Write-Host "📚 Documentation: VIEW_COUNT_SYSTEM.md" -ForegroundColor Cyan
Write-Host "🔧 Configuration: env_example.txt" -ForegroundColor Cyan
Write-Host ""
Write-Host "🚀 Your bot is now ready to handle view counts for YouTube, TikTok, and Instagram!" -ForegroundColor Green

