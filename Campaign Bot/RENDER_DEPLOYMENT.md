# 🚀 Render Deployment Guide

## Step 1: Prepare Your Repository
1. **Commit all changes** to your Git repository
2. **Push to GitHub** (or your preferred Git provider)

## Step 2: Create Render Service
1. Go to [render.com](https://render.com)
2. Sign up/Login with your GitHub account
3. Click **"New +"** → **"Web Service"**
4. Connect your repository

## Step 3: Configure Service Settings

### Basic Settings:
- **Name**: `cashcore-discord-bot`
- **Environment**: `Node`
- **Region**: Choose closest to your users
- **Branch**: `main`
- **Root Directory**: Leave empty (or `Campaign Bot` if your code is in a subfolder)
- **Build Command**: `npm install`
- **Start Command**: `npm start`

### Environment Variables:
Add these in the Render dashboard under "Environment":

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
After deployment, you need to register the Discord slash commands:

### Option A: Manual Deploy (Recommended)
1. Go to your Render service dashboard
2. Click on **"Shell"** tab
3. Run: `npm run deploy`

### Option B: Auto Deploy
Add this to your build command: `npm install && npm run deploy`

## Step 5: Verify Deployment
1. Check the **"Logs"** tab for any errors
2. Visit your service URL to see the health check
3. Test commands in Discord

## Health Check
Your bot now has a health check endpoint at: `https://your-service-name.onrender.com/`

## Troubleshooting
- **Bot not responding**: Check logs for errors
- **Commands not showing**: Run `npm run deploy` in Render shell
- **Database errors**: Verify Supabase credentials
- **Discord errors**: Check bot token and permissions

## Cost
- **Free tier**: 750 hours/month (enough for 24/7 operation)
- **Paid plans**: Start at $7/month for always-on service

## Security Notes
- Never commit `.env` files to Git
- Use Render's environment variables for secrets
- Keep your Discord bot token secure
