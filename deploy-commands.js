import { REST, Routes, SlashCommandBuilder, PermissionFlagsBits } from 'discord.js'; 
import { config } from './config.js';

// Campaign Commands
const campaignCommands = {
  // Create new campaign (Admin only)
  create: new SlashCommandBuilder()
    .setName('create-campaign')
    .setDescription('Create a new campaign (Admin only)')
    .addStringOption(option =>
      option.setName('title')
        .setDescription('Campaign title')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('details')
        .setDescription('Campaign details')
        .setRequired(true))
    .addNumberOption(option =>
      option.setName('budget')
        .setDescription('Campaign budget')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('platforms')
        .setDescription('Supported platforms')
        .setRequired(true)
        .addChoices(
          { name: 'TikTok', value: 'TikTok' },
          { name: 'YouTube', value: 'YouTube' },
          { name: 'Instagram', value: 'Instagram' },
          { name: 'X (Twitter)', value: 'X' },
          { name: 'TikTok, YouTube', value: 'TikTok, YouTube' },
          { name: 'TikTok, Instagram', value: 'TikTok, Instagram' },
          { name: 'TikTok, X', value: 'TikTok, X' },
          { name: 'YouTube, Instagram', value: 'YouTube, Instagram' },
          { name: 'YouTube, X', value: 'YouTube, X' },
          { name: 'Instagram, X', value: 'Instagram, X' },
          { name: 'TikTok, YouTube, Instagram', value: 'TikTok, YouTube, Instagram' },
          { name: 'TikTok, YouTube, X', value: 'TikTok, YouTube, X' },
          { name: 'TikTok, Instagram, X', value: 'TikTok, Instagram, X' },
          { name: 'YouTube, Instagram, X', value: 'YouTube, Instagram, X' },
          { name: 'All Platforms', value: 'TikTok, YouTube, Instagram, X' }
        ))
    .addStringOption(option =>
      option.setName('server_invite')
        .setDescription('Discord server invite link')
        .setRequired(true))
    .addNumberOption(option =>
      option.setName('rpm')
        .setDescription('Revenue per minute/rate')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('payment_method')
        .setDescription('Payment method')
        .setRequired(true)
        .addChoices(
          { name: 'Crypto', value: 'Crypto' },
          { name: 'PayPal', value: 'PayPal' },
          { name: 'Both (Crypto & PayPal)', value: 'Both' }
        ))
    .addStringOption(option =>
      option.setName('image_url')
        .setDescription('Campaign image/banner URL (optional)')
        .setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  // Delete campaign (Admin only)
  delete: new SlashCommandBuilder()
    .setName('delete-campaign')
    .setDescription('Delete a campaign (Admin only)')
    .addIntegerOption(option =>
      option.setName('id')
        .setDescription('Campaign ID to delete')
        .setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
};

// User Commands
const userCommands = {
  // User profile
  profile: new SlashCommandBuilder()
    .setName('profile')
    .setDescription('View your profile and stats'),

  // Link account
  linkAccount: new SlashCommandBuilder()
    .setName('link-account')
    .setDescription('Link your account on a platform after payment info is set')
    .addStringOption(option =>
      option.setName('platform')
        .setDescription('The platform your account is on')
        .setRequired(true)
        .addChoices(
          { name: 'TikTok', value: 'TikTok' },
          { name: 'Instagram', value: 'Instagram' },
          { name: 'YouTube', value: 'YouTube' },
          { name: 'X', value: 'X' }
        ))
    .addStringOption(option =>
      option.setName('username')
        .setDescription('Your username on that platform')
        .setRequired(true)),

  // Set payment info
  setPayment: new SlashCommandBuilder()
    .setName('set-payment')
    .setDescription('Set your payment method and information')
    .addStringOption(option =>
      option.setName('method')
        .setDescription('Payment method (PayPal, Bank Transfer, Crypto, etc.)')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('info')
        .setDescription('Payment details (email, account number, wallet address, etc.)')
        .setRequired(true)),

  // Remove account
  removeAccount: new SlashCommandBuilder()
    .setName('remove-account')
    .setDescription('Remove a linked account')
    .addStringOption(option =>
      option.setName('platform')
        .setDescription('Platform to remove account from')
        .setRequired(true)
        .addChoices(
          { name: 'TikTok', value: 'TikTok' },
          { name: 'Instagram', value: 'Instagram' },
          { name: 'YouTube', value: 'YouTube' },
          { name: 'X', value: 'X' }
        ))
    .addStringOption(option =>
      option.setName('username')
        .setDescription('Username to remove')
        .setRequired(true)),

  // Remove videos
  removeVideos: new SlashCommandBuilder()
    .setName('remove-videos')
    .setDescription('Remove a specific video by link')
    .addStringOption(option =>
      option.setName('link')
        .setDescription('Link to the video you want to remove')
        .setRequired(true)),

  // Video list
  videoList: new SlashCommandBuilder()
    .setName('video-list')
    .setDescription('List your uploaded videos')
    .addStringOption(option =>
      option.setName('status')
        .setDescription('Filter by status')
        .setRequired(false)
        .addChoices(
          { name: 'All', value: 'all' },
          { name: 'Pending', value: 'pending' },
          { name: 'Approved', value: 'approved' },
          { name: 'Rejected', value: 'rejected' }
        )),

  // Review clips (Admin only)
  review_clips: new SlashCommandBuilder()
    .setName('review-clips')
    .setDescription('Review pending clips (Admin only)')
    .addStringOption(option =>
      option.setName('status')
        .setDescription('Filter by status')
        .setRequired(false)
        .addChoices(
          { name: 'All', value: 'all' },
          { name: 'Pending', value: 'pending' },
          { name: 'Approved', value: 'approved' },
          { name: 'Rejected', value: 'rejected' }
        ))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  // Export clips (User command - own clips only)
  exportClips: new SlashCommandBuilder()
    .setName('export-clips')
    .setDescription('Export your own clips data to CSV'),

  // Update view counts (User command) - Manual override
  updateViewCounts: new SlashCommandBuilder()
    .setName('update-view-counts')
    .setDescription('Manually update view counts for your videos (automatic updates run every 3 hours)'),

  // Check quota status (Admin only)
  quotaStatus: new SlashCommandBuilder()
    .setName('quota-status')
    .setDescription('Check API quota status and reset if needed (Admin only)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  // Control automatic updates (Admin only)
  autoUpdateStatus: new SlashCommandBuilder()
    .setName('auto-update-status')
    .setDescription('Check automatic view count update status (Admin only)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  // Force update (Admin only)
  forceUpdate: new SlashCommandBuilder()
    .setName('force-update')
    .setDescription('Force immediate view count update for all clips (Admin only)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
};

// Announcement Commands
const announcementCommands = {
  // Post announcement (Admin only)
  announce: new SlashCommandBuilder()
    .setName('announce')
    .setDescription('Post an announcement (Admin only)')
    .addStringOption(option =>
      option.setName('message')
        .setDescription('Announcement message')
        .setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  // Create custom embed (Admin only)
  createEmbed: new SlashCommandBuilder()
    .setName('create-embed')
    .setDescription('Create a custom embed with buttons (Admin only)')
    .addStringOption(option =>
      option.setName('title')
        .setDescription('Embed title')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('description')
        .setDescription('Embed description')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('color')
        .setDescription('Embed color (hex code like #a259ff)')
        .setRequired(false))
    .addStringOption(option =>
      option.setName('footer')
        .setDescription('Embed footer text')
        .setRequired(false))
    .addStringOption(option =>
      option.setName('button-label')
        .setDescription('Button label text')
        .setRequired(false))
    .addStringOption(option =>
      option.setName('button-url')
        .setDescription('Button URL (optional)')
        .setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  // Test views (Admin only)
  testViews: new SlashCommandBuilder()
    .setName('test-views')
    .setDescription('Test view count system with a specific video link (Admin only)')
    .addStringOption(option =>
      option.setName('link')
        .setDescription('Video link to test (YouTube, TikTok, or Instagram)')
        .setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  // Simple test command
  simpleTest: new SlashCommandBuilder()
    .setName('simple-test')
    .setDescription('Simple test command')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  // Leaderboard command
  leaderboard: new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('Show top performers leaderboard'),

  // Manual view count update (Admin only)
  manualViews: new SlashCommandBuilder()
    .setName('manual-views')
    .setDescription('Manually update view count for Instagram/Twitter clips (Admin only)')
    .addStringOption(option =>
      option.setName('clip_id')
        .setDescription('Clip ID to update')
        .setRequired(true))
    .addIntegerOption(option =>
      option.setName('view_count')
        .setDescription('View count to set')
        .setRequired(true))
    .addUserOption(option =>
      option.setName('user')
        .setDescription('User who uploaded the clip (optional)')
        .setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
};

// Upload clip
const uploadCommand = {
  upload: new SlashCommandBuilder()
    .setName('upload')
    .setDescription('Upload a clip for campaign submission')
    .addStringOption(option =>
      option.setName('platform')
        .setDescription('Platform where the video was uploaded')
        .setRequired(true)
        .addChoices(
          { name: 'Instagram', value: 'Instagram' },
          { name: 'YouTube', value: 'YouTube' },
          { name: 'TikTok', value: 'TikTok' },
          { name: 'X (Twitter)', value: 'X' }
        ))
    .addStringOption(option =>
      option.setName('link')
        .setDescription('Link to your video clip')
        .setRequired(true)),
};

// Campaign Server Management Commands
const campaignServerCommands = {
  setCampaignServer: new SlashCommandBuilder()
    .setName('set-campaign-server')
    .setDescription('Map a Discord server to a campaign (Admin only)')
    .addStringOption(option =>
      option.setName('campaign-name')
        .setDescription('Name of the campaign')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('server-id')
        .setDescription('Discord server ID (optional, uses current server if not provided)')
        .setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  listCampaignServers: new SlashCommandBuilder()
    .setName('list-campaign-servers')
    .setDescription('List all campaign-server mappings (Admin only)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  removeCampaignServer: new SlashCommandBuilder()
    .setName('remove-campaign-server')
    .setDescription('Remove a campaign-server mapping (Admin only)')
    .addStringOption(option =>
      option.setName('server-id')
        .setDescription('Discord server ID to remove')
        .setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  campaignStats: new SlashCommandBuilder()
    .setName('campaign-stats')
    .setDescription('View campaign statistics for this server (Admin only)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  testCampaign: new SlashCommandBuilder()
    .setName('test-campaign')
    .setDescription('Test campaign command')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
};

// Register all commands
const allCommands = [
  ...Object.values(campaignCommands),
  ...Object.values(userCommands),
  ...Object.values(announcementCommands),
  ...Object.values(uploadCommand),
  ...Object.values(campaignServerCommands)
];

// Convert commands to JSON format
const commandsJSON = allCommands.map(command => command.toJSON());

// Create REST instance
const rest = new REST({ version: '10' }).setToken(config.discord.token);

// Deploy commands
(async () => {
  try {
    console.log(`🚀 Started refreshing ${commandsJSON.length} application (/) commands.`);

    // Deploy globally (takes up to 1 hour to propagate)
    const data = await rest.put(
      Routes.applicationCommands(config.discord.clientId),
      { body: commandsJSON },
    );
    console.log(`✅ Successfully reloaded ${data.length} global application (/) commands.`);
  } catch (error) {
    console.error('❌ Error deploying commands:', error);
  }
})();
