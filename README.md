# CashCore Discord Bot

A comprehensive Discord bot for managing CashCore campaigns, user registrations, and announcements.

## Features

### 🎯 Campaign Management
- **List Campaigns** (`/campaigns`) - View all available campaigns with optional platform filtering
- **Create Campaign** (`/create-campaign`) - Admin command to create new campaigns
- **Delete Campaign** (`/delete-campaign`) - Admin command to remove campaigns
- **Campaign Details** (`/campaign-details`) - Get detailed information about specific campaigns

### 👤 User Management
- **Register** (`/register`) - Register for CashCore campaigns with username and platforms
- **Profile** (`/profile`) - View your profile and account information
- **Status** (`/status`) - Check your submission status and statistics

### 📢 Announcements
- **Announce** (`/announce`) - Admin command to post announcements to the server

## Setup

### Prerequisites
- Node.js (v16 or higher)
- Discord Bot Token
- Supabase Database Access

### Installation

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Configuration**
   Create a `.env` file with the following variables:
   ```env
   DISCORD_TOKEN=your_discord_bot_token
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   CLIENT_ID=your_discord_client_id
   GUILD_ID=your_discord_guild_id
   ```

3. **Deploy Commands**
   ```bash
   node deploy-commands.js
   ```

4. **Start the Bot**
   ```bash
   npm start
   ```

### Development Mode
For development with auto-restart:
```bash
npm run dev
```

## Database Schema

The bot integrates with the following Supabase tables:

### `clips` (Campaigns)
- `id` - Campaign ID
- `title` - Campaign title
- `details` - Campaign description
- `budget` - Campaign budget
- `supported_platforms` - Comma-separated list of platforms
- `thumbnail` - Campaign thumbnail URL
- `created_at` - Creation timestamp

### `profile` (Users)
- `id` - User ID
- `username` - User's chosen username
- `platforms` - User's platforms
- `discord_id` - Discord user ID
- `discord_username` - Discord username
- `is_admin` - Admin status
- `created_at` - Registration timestamp

### `verifications` (Submissions)
- `id` - Submission ID
- `user_id` - Reference to profile.id
- `campaign_id` - Reference to clips.id
- `status` - Submission status (pending/approved/rejected)
- `created_at` - Submission timestamp

### `announcements` (News)
- `id` - Announcement ID
- `message` - Announcement content
- `author` - Author username
- `discord_id` - Author Discord ID
- `created_at` - Post timestamp

## Commands Reference

### User Commands
| Command | Description | Usage |
|---------|-------------|-------|
| `/register` | Register for campaigns | `/register username:YourName platforms:TikTok,Instagram` |
| `/profile` | View your profile | `/profile` |
| `/status` | Check submission status | `/status` |
| `/campaigns` | List available campaigns | `/campaigns platform:TikTok` |
| `/campaign-details` | Get campaign info | `/campaign-details id:123` |

### Admin Commands
| Command | Description | Usage |
|---------|-------------|-------|
| `/create-campaign` | Create new campaign | `/create-campaign title:NewCampaign details:Description budget:1000 platforms:TikTok,Instagram` |
| `/delete-campaign` | Delete campaign | `/delete-campaign id:123` |
| `/announce` | Post announcement | `/announce message:Important update!` |

## Permissions

- **User Commands**: Available to all server members
- **Admin Commands**: Require Administrator permission

## Error Handling

The bot includes comprehensive error handling for:
- Database connection issues
- Invalid command parameters
- Permission errors
- Network timeouts

## Integration with Web App

This Discord bot seamlessly integrates with the CashCore web application:
- Shares the same Supabase database
- Real-time campaign synchronization
- Unified user management
- Consistent announcement system

## Support

For issues or questions, contact the CashCore development team.
