# 🚀 Railway Deployment Guide

## Step 1: Create Railway Account
1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub
3. Click **"New Project"**

## Step 2: Deploy from GitHub
1. Select **"Deploy from GitHub repo"**
2. Choose your repository
3. Railway will auto-detect it's a Node.js project

## Step 3: Environment Variables
Add these in Railway dashboard:

```
DISCORD_TOKEN=your_discord_bot_token_here
CLIENT_ID=1400465506711896235
GUILD_ID=1293191068698939454
SUPABASE_URL=https://whcwkuufssjoiktkpeen.supabase.co
SUPABASE_SERVICE_KEY=your_actual_service_key_here
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndoY3drdXVmc3Nqb2lrdGtwZWVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwNzU1NTgsImV4cCI6MjA3MjY1MTU1OH0.EqiEpEzlxPjajMuHF1RhZgXjJX9E9Bp97XPY8cIjtI8
YOUTUBE_API_KEY=AIzaSyCGCarM_ZaZXsWoIU0QLcpljZehLFoV_Es
VERIFICATION_DELAY_SECONDS=1
MAX_CONCURRENT_REQUESTS=5
BATCH_SIZE=10
VERIFICATION_INTERVAL_MINUTES=60
```

## Step 4: Deploy Commands
After deployment, run in Railway console:
```bash
npm run deploy
```

## Step 5: Keep Bot Running
Railway will keep your bot running 24/7 on the free tier!

## Alternative: Replit (Always Free)

### Step 1: Go to Replit
1. Visit [replit.com](https://replit.com)
2. Sign up with GitHub
3. Click **"Create Repl"**

### Step 2: Import Repository
1. Choose **"Import from GitHub"**
2. Paste your repository URL
3. Select **"Node.js"** template

### Step 3: Add Environment Variables
1. Click the **"Secrets"** tab (lock icon)
2. Add all the environment variables listed above

### Step 4: Run Bot
1. Click **"Run"** button
2. Your bot will start automatically
3. **Keep the tab open** for free tier

### Step 5: Deploy Commands
In the Replit console, run:
```bash
npm run deploy
```

## 🎯 **Recommendation: Railway**
- **Easiest setup**
- **Most reliable**
- **Good free tier**
- **Professional service**

## 🔧 **Quick Fix for Current Setup**
If you want to stick with Render, try:
1. **Use a different email** for Render account
2. **Clear browser cache** and cookies
3. **Try incognito mode**
4. **Contact Render support**

Would you like me to help you set up Railway or Replit?
