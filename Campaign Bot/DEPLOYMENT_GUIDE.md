# CashCore Campaign Bot - Deployment Guide

## 🚀 Render.com Deployment

### Prerequisites
1. **Discord Bot Token**: Get from [Discord Developer Portal](https://discord.com/developers/applications)
2. **Supabase Project**: Set up at [Supabase](https://supabase.com)
3. **Render Account**: Sign up at [Render.com](https://render.com)

### Step 1: Environment Variables Setup

#### Required Environment Variables:
```bash
DISCORD_TOKEN=your_discord_bot_token_here
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_key
```

#### Optional Environment Variables:
```bash
CLIENT_ID=your_discord_client_id
GUILD_ID=your_discord_guild_id
YOUTUBE_API_KEY=your_youtube_api_key
```

### Step 2: Render.com Configuration

1. **Create New Web Service**:
   - Connect your GitHub repository
   - Choose "Web Service" as the service type
   - Set the following:
     - **Build Command**: `npm install`
     - **Start Command**: `npm start`
     - **Environment**: `Node`

2. **Set Environment Variables**:
   - Go to your service dashboard
   - Navigate to "Environment" tab
   - Add all required environment variables from Step 1

### Step 3: Database Setup

1. **Run SQL Scripts** in your Supabase SQL Editor:
   ```sql
   -- Run these scripts in order:
   -- 1. create_profile_table.sql
   -- 2. create_campaign_servers_table.sql
   -- 3. add_payment_columns.sql
   -- 4. add_verification_columns.sql
   -- 5. add_rejection_reason_column.sql
   -- 6. add_platform_column_to_clips.sql
   ```

### Step 4: Discord Bot Setup

1. **Bot Permissions** (in Discord Developer Portal):
   - `applications.commands` - Use slash commands
   - `bot` - Basic bot functionality
   - `guilds` - Access guild information
   - `guild_messages` - Read messages
   - `message_content` - Read message content
   - `guild_members` - Read guild members

2. **Invite Bot to Server**:
   - Use the generated invite link with proper permissions
   - Bot needs Administrator permissions for some commands

### Step 5: Deploy Commands

After deployment, register slash commands:

```bash
# Deploy commands to Discord
npm run deploy
```

Or manually run:
```bash
node deploy-commands.js
```

### Step 6: Test Deployment

1. **Check Bot Status**:
   - Visit your Render service URL
   - Should show: `{"status":"Bot is running","uptime":...}`

2. **Test Commands**:
   - Use `/profile` to test basic functionality
   - Use `/set-payment` to test user registration
   - Use `/upload` to test video submission

## 🔧 Troubleshooting

### Common Issues:

1. **"DISCORD_TOKEN not found"**:
   - Check environment variables in Render dashboard
   - Ensure token is correctly copied (no extra spaces)

2. **"Supabase configuration not found"**:
   - Verify SUPABASE_URL and SUPABASE_ANON_KEY are set
   - Check Supabase project is active

3. **Bot not responding to commands**:
   - Ensure commands are deployed: `npm run deploy`
   - Check bot has proper permissions in Discord server

4. **Database errors**:
   - Verify all SQL scripts have been run
   - Check Supabase service key has proper permissions

### Logs and Monitoring:

- **Render Logs**: Check service logs in Render dashboard
- **Discord Logs**: Bot will log important events to console
- **Database Logs**: Check Supabase logs for database issues

## 📋 Post-Deployment Checklist

- [ ] Bot is online and responding
- [ ] Slash commands are registered
- [ ] Database tables are created
- [ ] Test user registration works
- [ ] Test video upload works
- [ ] Test admin review system works
- [ ] Environment variables are secure

## 🔒 Security Notes

- Never commit `.env` files to version control
- Use Render's environment variables for sensitive data
- Regularly rotate Discord bot tokens
- Monitor Supabase usage and costs
- Use Supabase Row Level Security (RLS) policies

## 📞 Support

If you encounter issues:
1. Check Render service logs
2. Verify all environment variables are set
3. Ensure database schema is up to date
4. Test commands locally first

---

**Happy Deploying! 🚀**


