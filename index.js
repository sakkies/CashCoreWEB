import { Client, GatewayIntentBits, EmbedBuilder, SlashCommandBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, AttachmentBuilder } from 'discord.js';
import { createClient } from '@supabase/supabase-js';
import { config } from './config.js';
import { spawn } from 'child_process';
import fetch from 'node-fetch';
import ViewCountManager from './viewCountManager.js';

// Initialize Discord client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

// Initialize Supabase client (use serviceKey on server if provided)
const supabaseKey = config.supabase.serviceKey && config.supabase.serviceKey.length > 0
  ? config.supabase.serviceKey
  : config.supabase.anonKey;
const supabase = createClient(config.supabase.url, supabaseKey);

// Initialize View Count Manager
const viewCountManager = new ViewCountManager();

// Track processed interactions to prevent duplicates
const processedInteractions = new Set();

// Track Discord ready state for readiness probe
let discordReady = false;

// Bot ready event
client.once('ready', () => {
  console.log(`🤖 CashCore Discord Bot is online!`);
  console.log(`📊 Logged in as: ${client.user.tag}`);
  console.log(`🏠 Connected to ${client.guilds.cache.size} server(s)`);
  
  // Set bot status
  client.user.setActivity('Campaign Management', { type: 'WATCHING' });
  discordReady = true;
});

// Additional connection lifecycle logging
client.on('shardDisconnect', (event, shardId) => {
  console.warn(`Shard ${shardId} disconnected:`, event?.code, event?.reason || 'no reason');
  discordReady = false;
});

client.on('shardError', (error, shardId) => {
  console.error(`Shard ${shardId} error:`, error);
});

client.on('invalidated', () => {
  console.error('Discord session invalidated, attempting to relogin...');
  discordReady = false;
  loginWithRetry();
});

// Command handlers
const commands = new Map();

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
        .setRequired(true))
	,

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

  // Update view counts (User command)
  updateViewCounts: new SlashCommandBuilder()
    .setName('update-view-counts')
    .setDescription('Update view counts for your YouTube, TikTok, and Instagram videos'),

  // Check quota status (Admin only)
  quotaStatus: new SlashCommandBuilder()
    .setName('quota-status')
    .setDescription('Check API quota status and reset if needed (Admin only)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
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

// Command interaction handler
client.on('interactionCreate', async interaction => {
  // Check if this interaction has already been processed
  const interactionId = interaction.id;
  if (processedInteractions.has(interactionId)) {
    console.log('Interaction already processed, skipping:', interactionId);
    return;
  }
  processedInteractions.add(interactionId);
  
  // Clean up old interactions (keep only last 1000)
  if (processedInteractions.size > 1000) {
    const firstId = processedInteractions.values().next().value;
    processedInteractions.delete(firstId);
  }

  // Handle button interactions
  if (interaction.isButton()) {
    const customId = interaction.customId;
    
    // Handle approve/reject buttons
    if (customId.startsWith('approve_')) {
      const clipId = customId.split('_')[1];
      await handleApproveClip(interaction, clipId);
      return;
    } else if (customId.startsWith('reject_')) {
      const clipId = customId.split('_')[1];
      await handleRejectClip(interaction, clipId);
      return;
    }
    
    // Handle quota reset button
    if (customId === 'reset_quota') {
      await handleResetQuota(interaction);
      return;
    }
    
    // Handle other button interactions
    await handleButtonClick(interaction);
    return;
  }
  
  // Handle modal submissions
  if (interaction.isModalSubmit()) {
    const customId = interaction.customId;
    
    if (customId.startsWith('reject_modal_')) {
      const clipId = customId.split('_')[2];
      const rejectionReason = interaction.fields.getTextInputValue('rejection_reason');
      await handleRejectClipSubmit(interaction, clipId, rejectionReason);
      return;
    }
  }
  
  if (!interaction.isChatInputCommand()) return;

  const { commandName } = interaction;

  try {
    switch (commandName) {
      case 'create-campaign':
        await handleCreateCampaign(interaction);
        break;
      case 'delete-campaign':
        await handleDeleteCampaign(interaction);
        break;
      case 'profile':
        await handleProfile(interaction);
        break;
      case 'link-account':
        await handleLinkAccount(interaction);
        break;
      case 'set-payment':
        await handleSetPayment(interaction);
        break;
      case 'remove-account':
        await handleRemoveAccount(interaction);
        break;
      case 'remove-videos':
        await handleRemoveVideos(interaction);
        break;
      case 'video-list':
        console.log('Handling video-list command for user:', interaction.user.tag);
        await handleVideoList(interaction);
        break;
      case 'upload':
        await handleUpload(interaction);
        break;
      case 'review-clips':
        await handleReviewClips(interaction);
        break;
      case 'account-list':
        await handleAccountList(interaction);
        break;
      case 'announce':
        await handleAnnounce(interaction);
        break;
      case 'manual-views':
        await handleManualViews(interaction);
        break;
      case 'leaderboard':
        await handleLeaderboard(interaction);
        break;
      case 'create-embed':
        await handleCreateEmbed(interaction);
        break;
      case 'set-campaign-server':
        await handleSetCampaignServer(interaction);
        break;
      case 'list-campaign-servers':
        await handleListCampaignServers(interaction);
        break;
      case 'remove-campaign-server':
        await handleRemoveCampaignServer(interaction);
        break;
      case 'test-campaign':
        await interaction.reply({ content: '✅ Test command working!', ephemeral: true });
        break;
      case 'campaign-stats':
        await handleCampaignStats(interaction);
        break;
      case 'export-clips':
        await handleExportClips(interaction);
        break;
      case 'update-view-counts':
        await handleUpdateViewCounts(interaction);
        break;
      case 'quota-status':
        await handleQuotaStatus(interaction);
        break;
      default:
        await interaction.reply({ content: '❌ Unknown command!', ephemeral: true });
    }
  } catch (error) {
    console.error('Command error:', error);
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({ 
        content: '❌ An error occurred while processing your command.', 
        ephemeral: true 
      });
    }
  }
});

// Command implementations
async function handleCampaignsList(interaction) {
  const platform = interaction.options.getString('platform');
  
  let query = supabase.from('clips').select('*').order('created_at', { ascending: false });
  
  if (platform) {
    query = query.ilike('supported_platforms', `%${platform}%`);
  }
  
  const { data: campaigns, error } = await query;
  
  if (error) {
    await interaction.reply({ content: '❌ Failed to fetch campaigns.', ephemeral: true });
    return;
  }
  
  if (!campaigns || campaigns.length === 0) {
    await interaction.reply({ content: '📭 No campaigns found.', ephemeral: true });
    return;
  }
  
  const embed = new EmbedBuilder()
    .setTitle('🎯 Available Campaigns')
    .setColor('#a259ff')
    .setTimestamp();
  
  campaigns.slice(0, 10).forEach(campaign => {
    embed.addFields({
      name: `${campaign.title} (ID: ${campaign.id})`,
      value: `💰 Budget: $${campaign.budget}\n📱 Platforms: ${campaign.supported_platforms}\n📝 ${campaign.details?.substring(0, 100)}${campaign.details?.length > 100 ? '...' : ''}`,
      inline: false
    });
  });
  
  if (campaigns.length > 10) {
    embed.setFooter({ text: `Showing 10 of ${campaigns.length} campaigns` });
  }
  
  await interaction.reply({ embeds: [embed], ephemeral: true });
}

async function handleCreateCampaign(interaction) {
  const title = interaction.options.getString('title');
  const details = interaction.options.getString('details');
  const budget = interaction.options.getNumber('budget');
  const platforms = interaction.options.getString('platforms');
  const serverInvite = interaction.options.getString('server_invite');
  const rpm = interaction.options.getNumber('rpm');
  const paymentMethod = interaction.options.getString('payment_method');
  const imageUrl = interaction.options.getString('image_url');
  
  // Get guild information
  const guildId = interaction.guild?.id || '0';
  const guildName = interaction.guild?.name || 'Unknown Server';
  
  const { data, error } = await supabase
    .from('campaign_servers')
    .insert([{
      campaign_name: title,
      discord_guild_id: guildId,
      discord_guild_name: guildName,
      server_invite: serverInvite,
      rpm: rpm,
      platform: platforms,
      payment_method: paymentMethod,
      image_url: imageUrl,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }])
    .select();
  
  if (error) {
    console.error('Error creating campaign:', error);
    await interaction.reply({ content: '❌ Failed to create campaign.', ephemeral: true });
    return;
  }
  
  const embed = new EmbedBuilder()
    .setTitle('✅ Campaign Created')
    .setColor('#a6e22e')
    .addFields(
      { name: 'Title', value: title, inline: true },
      { name: 'Budget', value: `$${budget}`, inline: true },
      { name: 'Platforms', value: platforms, inline: true },
      { name: 'Server Invite', value: serverInvite, inline: true },
      { name: 'RPM', value: rpm.toString(), inline: true },
      { name: 'Payment Method', value: paymentMethod, inline: true },
      { name: 'Details', value: details, inline: false },
      { name: 'Campaign ID', value: data[0].id.toString(), inline: true }
    )
    .setTimestamp();
  
  // Add image to embed if provided
  if (imageUrl) {
    embed.setImage(imageUrl);
    embed.addFields({ name: 'Image', value: `[View Image](${imageUrl})`, inline: true });
  }
  
  await interaction.reply({ embeds: [embed], ephemeral: true });
}

async function handleDeleteCampaign(interaction) {
  const campaignId = interaction.options.getInteger('id');
  
  const { error } = await supabase
    .from('clips')
    .delete()
    .eq('id', campaignId);
  
  if (error) {
    await interaction.reply({ content: '❌ Failed to delete campaign.', ephemeral: true });
    return;
  }
  
  await interaction.reply({ 
    content: `✅ Campaign with ID ${campaignId} has been deleted.`, 
    ephemeral: true 
  });
}

async function handleCampaignDetails(interaction) {
  const campaignId = interaction.options.getInteger('id');
  
  const { data: campaign, error } = await supabase
    .from('clips')
    .select('*')
    .eq('id', campaignId)
    .single();
  
  if (error || !campaign) {
    await interaction.reply({ content: '❌ Campaign not found.', ephemeral: true });
    return;
  }
  
  const embed = new EmbedBuilder()
    .setTitle(`🎯 ${campaign.title}`)
    .setColor('#a259ff')
    .addFields(
      { name: '💰 Budget', value: `$${campaign.budget}`, inline: true },
      { name: '📱 Platforms', value: campaign.supported_platforms, inline: true },
      { name: '📝 Details', value: campaign.details || 'No details provided', inline: false },
      { name: '🆔 Campaign ID', value: campaign.id.toString(), inline: true },
      { name: '📅 Created', value: new Date(campaign.created_at).toLocaleDateString(), inline: true }
    )
    .setTimestamp();
  
  if (campaign.thumbnail) {
    embed.setImage(campaign.thumbnail);
  }
  
  await interaction.reply({ embeds: [embed], ephemeral: true });
}


async function handleProfile(interaction) {
  const userId = interaction.user.id;
  
  const { data: profile, error } = await supabase
    .from('discord_users')
    .select('*')
    .eq('discord_id', userId)
    .single();
  
  if (error || !profile) {
    await interaction.reply({ 
      content: '❌ You are not registered. Use `/register` to create an account.', 
      ephemeral: true 
    });
    return;
  }
  
  const embed = new EmbedBuilder()
    .setTitle(`👤 ${profile.username}'s Profile`)
    .setColor('#a259ff')
    .addFields(
      { name: 'Username', value: profile.username, inline: true },
      { name: 'Email', value: profile.email || 'Not provided', inline: true },
      { name: 'Discord ID', value: profile.discord_id, inline: true },
      { name: 'Member Since', value: new Date(profile.created_at).toLocaleDateString(), inline: true }
    )
    .setThumbnail(interaction.user.displayAvatarURL())
    .setTimestamp();
  
  // Add payment information if available
  if (profile.payment_method && profile.payment_info) {
    embed.addFields(
      { name: 'Payment Method', value: profile.payment_method, inline: true },
      { name: 'Payment Info', value: profile.payment_info, inline: true }
    );
    embed.setDescription('✅ Payment information configured');
  } else {
    embed.setDescription('⚠️ Payment information not set. Use `/set-payment` to add it.');
  }
  
  await interaction.reply({ embeds: [embed], ephemeral: true });
}


async function handleLinkAccount(interaction) {
  const userId = interaction.user.id;
  const platform = interaction.options.getString('platform');
  const username = interaction.options.getString('username');

  const { data: user } = await supabase
    .from('discord_users')
    .select('*')
    .eq('discord_id', userId)
    .single();

  if (!user) {
    await interaction.reply({
      content: '❌ No account found. Use `/set-payment` first, then `/register`.',
      flags: 64
    });
    return;
  }

  if (!user.payment_method || !user.payment_info) {
    await interaction.reply({
      content: '⚠️ Payment info missing. Use `/set-payment` to add it, then try again.',
      flags: 64
    });
    return;
  }

  // Check account limit per platform (max 2 accounts per platform) BEFORE saving
  const { data: existingAccounts, error: countError } = await supabase
    .from('user_accounts')
    .select('id, platform, username')
    .eq('discord_id', userId)
    .eq('platform', platform);

  if (countError) {
    console.error('Error checking account count:', countError);
    await interaction.reply({
      content: '❌ Error checking account limit. Please try again.',
      ephemeral: true
    });
    return;
  }

  if (existingAccounts && existingAccounts.length >= 2) {
    const accountList = existingAccounts.map(acc => `• ${acc.username}`).join('\n');
    await interaction.reply({
      content: `❌ **Account Limit Reached!**\n\nYou already have **2 ${platform} accounts** linked:\n${accountList}\n\n**To add a new account:**\n1. Use \`/remove-account\` to remove one of the above accounts\n2. Then use \`/link-account\` to add your new account\n\n**Security Note:** You can only link 2 accounts per platform.`,
      ephemeral: true
    });
    return;
  }

  // Check if this exact account (platform + username) already exists in database
  const { data: existingAccount, error: accountExistsError } = await supabase
    .from('user_accounts')
    .select('discord_id, platform, username')
    .eq('platform', platform)
    .eq('username', username)
    .single();

  if (accountExistsError && accountExistsError.code !== 'PGRST116') {
    // PGRST116 means no rows found, which is what we want
    console.error('Error checking if account exists:', accountExistsError);
    await interaction.reply({
      content: '❌ Error checking if account exists. Please try again.',
      ephemeral: true
    });
    return;
  }

  if (existingAccount) {
    // Account already exists in database
    const isOwnAccount = existingAccount.discord_id === userId;
    if (isOwnAccount) {
      await interaction.reply({
        content: `❌ **Account Already Linked!**\n\nYou have already linked this account:\n• **${platform}**: ${username}\n\n**To manage this account:**\nUse \`/account-list\` to see all your linked accounts`,
        ephemeral: true
      });
    } else {
      await interaction.reply({
        content: `❌ **Account Already in Use!**\n\nThis account is already linked by another user:\n• **${platform}**: ${username}\n\n**Please use a different account** or contact support if you believe this is an error.`,
        ephemeral: true
      });
    }
    return;
  }

  // Upsert the linked account for this user (only if all checks passed)
  try {
    const { data: upserted, error: upsertError } = await supabase
      .from('user_accounts')
      .upsert({
        discord_id: userId,
        platform: platform,
        username: username
      }, { onConflict: 'discord_id,platform,username' })
      .select();
    if (upsertError) {
      console.error('Upsert user_accounts error:', upsertError);
      // Handle specific DB error for value too long (e.g., username exceeds column limit)
      if (upsertError.code === '22001') {
        await interaction.reply({
          content: '❌ The username you entered is too long. Please use your real username (shorter than 100 characters) and try again.',
          flags: 64
        });
      } else {
      await interaction.reply({ content: '❌ Failed to link account in database.', flags: 64 });
      }
      return;
    }
  } catch (e) {
    console.error('Unexpected error linking account:', e);
    await interaction.reply({ content: '❌ Unexpected error while linking your account.', flags: 64 });
    return;
  }

  // Mark account as verified/linked immediately (no code step)
  const { error: updateError } = await supabase
    .from('user_accounts')
    .update({ 
      verified: true,
      verification_code: null,
      verification_code_found: null,
      last_verification_attempt: null,
      verification_error: null
    })
    .eq('discord_id', userId)
    .eq('platform', platform)
    .eq('username', username);

  if (updateError) {
    console.error('Error finalizing account link:', updateError);
  }

  const embed = new EmbedBuilder()
    .setTitle('🔗 Account Linked')
    .setColor('#a6e22e')
    .setDescription('Your account has been linked and verified. You are ready for campaigns!')
    .addFields(
      { name: 'Platform', value: platform, inline: true },
      { name: 'Username', value: username, inline: true },
      { name: 'Payment Method', value: user.payment_method, inline: true },
      { name: 'Status', value: '✅ Verified', inline: false }
    )
    .setTimestamp();

  await interaction.reply({ embeds: [embed], ephemeral: true });
}

async function handleSetPayment(interaction) {
  try {
    const method = interaction.options.getString('method');
    const info = interaction.options.getString('info');
    const userId = interaction.user.id;
  
  // Check if user exists
  const { data: existingUser, error: userCheckError } = await supabase
    .from('discord_users')
    .select('*')
    .eq('discord_id', userId)
    .single();
  
  if (userCheckError && userCheckError.code !== 'PGRST116') {
    console.error('Error checking user:', userCheckError);
    await interaction.reply({ 
      content: `❌ Error checking user account. Please try again.`, 
      ephemeral: true 
    });
    return;
  }
  
  if (!existingUser) {
    // Create new user with payment information
    const { data, error } = await supabase
      .from('discord_users')
      .insert([{
        discord_id: userId,
        username: interaction.user.username,
        email: null,
        payment_method: method,
        payment_info: info
      }])
      .select();
    
    if (error) {
      console.error('Payment insert error:', error);
      await interaction.reply({ content: `❌ Failed to create account with payment information. Error: ${error.message}`, ephemeral: true });
      return;
    }
    
    const embed = new EmbedBuilder()
      .setTitle('✅ Account Created with Payment Info')
      .setColor('#a6e22e')
      .addFields(
        { name: 'Username', value: interaction.user.username, inline: true },
        { name: 'Payment Method', value: method, inline: true },
        { name: 'Payment Info', value: info, inline: true }
      )
      .setDescription('Welcome to CashCore! Your account has been created and you can now participate in campaigns.')
      .setTimestamp();
    
    await interaction.reply({ embeds: [embed], ephemeral: true });
  } else {
    // Update existing user's payment information
    const { data, error } = await supabase
      .from('discord_users')
      .update({
        payment_method: method,
        payment_info: info
      })
      .eq('discord_id', userId)
      .select();
    
    if (error) {
      console.error('Payment update error:', error);
      await interaction.reply({ content: `❌ Failed to update payment information. Error: ${error.message}`, ephemeral: true });
      return;
    }
    
    const embed = new EmbedBuilder()
      .setTitle('✅ Payment Information Updated')
      .setColor('#a6e22e')
      .addFields(
        { name: 'Payment Method', value: method, inline: true },
        { name: 'Payment Info', value: info, inline: true }
      )
      .setDescription('Your payment information has been updated!')
      .setTimestamp();
    
    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
  } catch (error) {
    console.error('Unexpected error in handleSetPayment:', error);
    await interaction.reply({ 
      content: `❌ An unexpected error occurred: ${error.message}`, 
      ephemeral: true 
    });
  }
}

async function handleAnnounce(interaction) {
  const message = interaction.options.getString('message');
  
  // Add announcement to database
  const { data, error } = await supabase
    .from('announcements')
    .insert([{
      message,
      author: interaction.user.username,
      discord_id: interaction.user.id
    }])
    .select();
  
  if (error) {
    await interaction.reply({ content: '❌ Failed to post announcement.', ephemeral: true });
    return;
  }
  
  const embed = new EmbedBuilder()
    .setTitle('📢 New Announcement')
    .setDescription(message)
    .setColor('#ff6a2b')
    .setAuthor({ name: interaction.user.username, iconURL: interaction.user.displayAvatarURL() })
    .setTimestamp();
  
  await interaction.reply({ embeds: [embed], ephemeral: true });
}

async function handleManualViews(interaction) {
  try {
    await interaction.deferReply({ ephemeral: true });
    
    const clipId = interaction.options.getString('clip_id');
    const viewCount = interaction.options.getInteger('view_count');
    const selectedUser = interaction.options.getUser('user');
    
    // Validate inputs
    if (!clipId || !viewCount || viewCount < 0) {
      await interaction.editReply({
        content: '❌ Invalid input. Please provide a valid clip ID and view count.'
      });
      return;
    }
    
    // Check if clip exists
    const { data: clip, error: fetchError } = await supabase
      .from('clips')
      .select('*')
      .eq('id', clipId)
      .single();
    
    if (fetchError || !clip) {
      await interaction.editReply({
        content: '❌ Clip not found. Please check the clip ID.'
      });
      return;
    }
    
    // Check if platform is Instagram or Twitter/X
    if (clip.platform !== 'Instagram' && clip.platform !== 'Twitter' && clip.platform !== 'X') {
      await interaction.editReply({
        content: '❌ This command is only for Instagram and Twitter/X clips. Use `/update-view-counts` for YouTube and TikTok.'
      });
      return;
    }
    
    // If user is specified, verify they match the clip owner
    if (selectedUser && clip.discord_id !== selectedUser.id) {
      await interaction.editReply({
        content: `❌ The selected user (${selectedUser.username}) does not match the clip owner. Please select the correct user or leave this field empty.`
      });
      return;
    }
    
    // Update the view count
    const { error: updateError } = await supabase
      .from('clips')
      .update({ 
        view_count: viewCount,
        last_view_count_update: new Date().toISOString()
      })
      .eq('id', clipId);
    
    if (updateError) {
      console.error('Error updating view count:', updateError);
      await interaction.editReply({
        content: '❌ Failed to update view count. Please try again.'
      });
      return;
    }
    
    // Get user info for display
    let userDisplay = 'Unknown User';
    if (clip.discord_id) {
      try {
        const user = await client.users.fetch(clip.discord_id);
        userDisplay = user.username;
      } catch (err) {
        userDisplay = `<@${clip.discord_id}>`;
      }
    }
    
    // Create success embed
    const embed = new EmbedBuilder()
      .setTitle('✅ View Count Updated Manually')
      .setColor('#00ff00')
      .setDescription(`Successfully updated view count for clip ${clipId}`)
      .addFields(
        { name: '📱 Platform', value: clip.platform, inline: true },
        { name: '👀 View Count', value: viewCount.toLocaleString(), inline: true },
        { name: '👤 Clip Owner', value: userDisplay, inline: true },
        { name: '🔗 Link', value: `[View Clip](${clip.video_link})`, inline: false },
        { name: '👤 Updated by', value: interaction.user.username, inline: true },
        { name: '⏰ Updated at', value: new Date().toLocaleString(), inline: true }
      )
      .setTimestamp();
    
    await interaction.editReply({ embeds: [embed] });
    console.log(`Manual view count updated by ${interaction.user.tag} (${interaction.user.id}): Clip ${clipId} = ${viewCount} views (${clip.platform})`);
    
  } catch (error) {
    console.error('Error in handleManualViews:', error);
    await interaction.editReply({
      content: '❌ An error occurred while updating the view count. Please try again.'
    });
  }
}

async function handleCreateEmbed(interaction) {
  const title = interaction.options.getString('title') || 'Welcome to CashCore!';
  const description = interaction.options.getString('description');
  const color = interaction.options.getString('color') || '#a259ff';
  const footer = interaction.options.getString('footer');
  const buttonLabel = interaction.options.getString('button-label') || 'Start Clipping';
  const buttonUrl = interaction.options.getString('button-url');
  
  // Default registration message if no description provided
  const defaultDescription = `Please click the button below to begin the registration process.

If you've used our services before, you'll be able to access all of your accounts across every CashCore server once you register.

If this is your first time, you'll be guided through a quick account setup process.`;
  
  const embed = new EmbedBuilder()
    .setTitle(title)
    .setDescription(description || defaultDescription)
    .setColor(color)
    .setTimestamp();
  
  if (footer) {
    embed.setFooter({ text: footer });
  }
  
  const components = [];
  
  // Always add Start Clipping button
  const button = new ButtonBuilder()
    .setLabel(buttonLabel)
    .setStyle(ButtonStyle.Primary);
  
  if (buttonUrl) {
    button.setURL(buttonUrl);
  } else {
    // Make it a custom ID button for handling
    button.setCustomId(`start_clipping_${Date.now()}`);
  }
  
  const row = new ActionRowBuilder().addComponents(button);
  components.push(row);
  
  const replyOptions = { embeds: [embed], components: components };
  
  await interaction.reply(replyOptions);
}

// List linked accounts and payment method/info
async function handleAccountList(interaction) {
  const userId = interaction.user.id;

  try {
    // Search user data from Supabase
    const { data: profile, error: profileError } = await supabase
      .from('discord_users')
      .select('*')
      .eq('discord_id', userId)
      .single();

    const { data: accounts, error: accError } = await supabase
      .from('user_accounts')
      .select('platform, username, created_at')
      .eq('discord_id', userId)
      .order('platform', { ascending: true });

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('Profile search error:', profileError);
    }
    if (accError) {
      console.error('Accounts search error:', accError);
    }

    const embed = new EmbedBuilder()
      .setTitle('User Accounts Found')
      .setColor('#a259ff')
      .setTimestamp();

    // Add description
    embed.setDescription('We found your accounts in our records. You may post clips from any of the following accounts. If you would like to add additional accounts, please use /link-account.');

    // Group accounts by platform
    const accountGroups = {};
    if (accounts && accounts.length > 0) {
      accounts.forEach(a => {
        if (!accountGroups[a.platform]) {
          accountGroups[a.platform] = [];
        }
        accountGroups[a.platform].push(a.username);
      });

      // Add account groups
      Object.entries(accountGroups).forEach(([platform, usernames]) => {
        const accountList = usernames.map(username => {
          if (platform === 'Instagram') {
            return `https://www.instagram.com/${username}/`;
          } else if (platform === 'YouTube') {
            return `https://www.youtube.com/@${username}`;
          } else {
            return username;
          }
        }).join('\n');
        
        embed.addFields({ 
          name: `${platform} Accounts`, 
          value: accountList, 
          inline: false 
        });
      });
    } else {
      embed.addFields({ 
        name: 'Linked Accounts', 
        value: 'No accounts linked yet. Use `/link-account` to add one.', 
        inline: false 
      });
    }

    // Add payment information
    if (profile) {
      const paymentFields = [];
      
      // Check for crypto addresses
      if (profile.payment_method === 'ETH USDT' && profile.payment_info) {
        paymentFields.push({ name: 'USDT Address', value: profile.payment_info, inline: false });
      } else if (profile.payment_method === 'ETH USDC' && profile.payment_info) {
        paymentFields.push({ name: 'USDC Address', value: profile.payment_info, inline: false });
      } else if (profile.payment_method && profile.payment_info) {
        paymentFields.push({ name: `${profile.payment_method}`, value: profile.payment_info, inline: false });
      }

      // Add other payment methods as "Not Set"
      const otherMethods = ['USDC Address', 'ETH Address', 'BTC Address', 'SOL Address', 'SOL USDC Address', 'PayPal Email', 'PayPal Name', 'Cashapp', 'Zelle'];
      otherMethods.forEach(method => {
        if (!paymentFields.some(field => field.name.includes(method.split(' ')[0]))) {
          paymentFields.push({ name: method, value: 'Not Set', inline: false });
        }
      });

      paymentFields.forEach(field => embed.addFields(field));
    } else {
      embed.addFields({ 
        name: 'Payment Information', 
        value: 'Not registered. Use `/set-payment` first.', 
        inline: false 
      });
    }

    await interaction.reply({ embeds: [embed], ephemeral: true });
  } catch (error) {
    console.error('Account list error:', error);
    await interaction.reply({ 
      content: '❌ Failed to load your account data.',
      ephemeral: true 
    });
  }
}


async function handleButtonClick(interaction) {
  const buttonId = interaction.customId;
  
  if (buttonId.startsWith('start_clipping_')) {
    // Handle "Start Clipping" button
    const userId = interaction.user.id;
    const username = interaction.user.username;
    const displayName = interaction.member?.displayName || interaction.user.displayName;
    const email = interaction.user.email; // This might be null if user hasn't shared email
    
    // Create user data object
    const userData = {
      discord_id: userId,
      discord_username: username,
      display_name: displayName,
      email: email || 'Not provided',
      clicked_at: new Date().toISOString()
    };
    
    // Log the user data (you can also save to database)
    console.log('User clicked Start Clipping:', userData);
    
    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('discord_users')
      .select('*')
      .eq('discord_id', userId)
      .single();
    
    if (existingUser) {
      // User exists, check payment info
      if (existingUser.payment_method && existingUser.payment_info) {
        const embed = new EmbedBuilder()
          .setTitle('🎯 Welcome Back!')
          .setDescription(`Hello ${displayName}! 

**Your Information:**
• Discord ID: \`${userId}\`
• Username: \`${username}\`
• Display Name: \`${displayName}\`

✅ **You're all set!** Your payment information is configured and you can participate in campaigns!

➡️ To continue, use \`/link-account\` to link your account.`)
          .setColor('#a6e22e')
          .addFields(
            { name: 'Payment Method', value: existingUser.payment_method, inline: true },
            { name: 'Payment Info', value: existingUser.payment_info, inline: true }
          )
          .setTimestamp();
        
        await interaction.reply({ embeds: [embed], ephemeral: true });
      } else {
        const embed = new EmbedBuilder()
          .setTitle('⚠️ Payment Information Required')
          .setDescription(`Hello ${displayName}! 

**Your Information:**
• Discord ID: \`${userId}\`
• Username: \`${username}\`
• Display Name: \`${displayName}\`

You're registered but need to add your payment information to participate in campaigns.`)
          .setColor('#ff6a2b')
          .setFooter({ text: 'Use /set-payment to add your payment details' })
          .setTimestamp();
        
        await interaction.reply({ embeds: [embed], ephemeral: true });
      }
    } else {
      // Don't create user - require payment method first
      const embed = new EmbedBuilder()
        .setTitle('⚠️ Payment Method Required First')
        .setDescription(`Hello ${displayName}! 

**Your Information:**
• Discord ID: \`${userId}\`
• Username: \`${username}\`
• Display Name: \`${displayName}\`

You must set up your payment method before participating in CashCore campaigns.`)
        .setColor('#ff6a2b')
        .addFields(
          { name: 'Step 1', value: 'Use `/set-payment` to add your payment details', inline: false },
          { name: 'Available Methods', value: 'ETH USDT, ETH USDC', inline: false }
        )
        .setTimestamp();
      
      await interaction.reply({ embeds: [embed], ephemeral: true });
    }
  }
}

// Handle review clips (Admin only)
async function handleReviewClips(interaction) {
  try {
    // Check if user has administrator permissions
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      await interaction.reply({
        content: '❌ **Access Denied!**\n\nThis command is only available to administrators.',
        ephemeral: true
      });
      return;
    }

    // Reply immediately instead of deferring
    await interaction.reply({
      content: '⏳ Loading clips...',
      ephemeral: true
    });

    const statusFilter = interaction.options.getString('status') || 'all';
    
    // Build query based on status filter
    let query = supabase
      .from('clips')
      .select('*')
      .order('created_at', { ascending: false });

    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }

    const { data: clips, error } = await query;

    if (error) {
      console.error('Error fetching clips:', error);
      await interaction.editReply({
        content: '❌ **Error fetching clips!**\n\nThere was an error retrieving the clips from the database.'
      });
      return;
    }

    if (!clips || clips.length === 0) {
      const statusText = statusFilter === 'all' ? 'clips' : `${statusFilter} clips`;
      await interaction.editReply({
        content: `📭 **No ${statusText} found!**\n\nThere are currently no clips with the selected status.`
      });
      return;
    }

    // Send each clip as a separate message for better readability
    const clipsToShow = clips.slice(0, 20); // Show up to 20 clips individually
    
    // First, send a summary message
    const summaryEmbed = new EmbedBuilder()
      .setTitle(`🎬 Clip Review Dashboard`)
      .setColor('#0099ff')
      .setDescription(`Found **${clips.length}** ${statusFilter === 'all' ? 'clips' : statusFilter + ' clips'}\n\nEach clip will be shown individually below:`)
      .setTimestamp();

    await interaction.editReply({ embeds: [summaryEmbed] });

    // Send each clip individually
    for (const clip of clipsToShow) {
      const statusEmoji = {
        'pending': '⏳',
        'approved': '✅',
        'rejected': '❌'
      }[clip.status] || '❓';

      const statusColor = {
        'pending': '#ffa500',
        'approved': '#00ff00',
        'rejected': '#ff0000'
      }[clip.status] || '#0099ff';

      const createdDate = new Date(clip.created_at).toLocaleDateString();
      
      const clipEmbed = new EmbedBuilder()
        .setTitle(`${statusEmoji} Clip #${clip.id}`)
        .setColor(statusColor)
        .addFields(
          { name: '👤 User', value: `<@${clip.discord_id}>`, inline: true },
          { name: '🎯 Campaign', value: clip.campaign_name, inline: true },
          { name: '📱 Platform', value: clip.platform || 'Unknown', inline: true },
          { name: '📊 Status', value: clip.status, inline: true },
          { name: '📅 Date', value: createdDate, inline: true },
          { name: '🔗 Link', value: `[View Video](${clip.video_link})`, inline: true },
          { name: '📋 Clip ID', value: `\`${clip.id}\``, inline: false }
        )
        .setFooter({ text: `💡 Use /manual-views clip_id:${clip.id} view_count:XXXX to update view counts` })
        .setTimestamp();

      // Add buttons for pending clips only
      let components = [];
      if (clip.status === 'pending') {
        const approveButton = new ButtonBuilder()
          .setCustomId(`approve_${clip.id}`)
          .setLabel(`✅ Approve`)
          .setStyle(ButtonStyle.Success);

        const rejectButton = new ButtonBuilder()
          .setCustomId(`reject_${clip.id}`)
          .setLabel(`❌ Reject`)
          .setStyle(ButtonStyle.Danger);

        const row = new ActionRowBuilder()
          .addComponents(approveButton, rejectButton);
        
        components = [row];
      }

      await interaction.followUp({ 
        embeds: [clipEmbed], 
        components: components
      });

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Send completion message if there are more clips
    if (clips.length > 20) {
      const completionEmbed = new EmbedBuilder()
        .setTitle(`📋 Review Complete`)
        .setColor('#00ff00')
        .setDescription(`Showed first 20 of ${clips.length} clips.\nUse status filter to narrow results.`)
        .setTimestamp();

      await interaction.followUp({ embeds: [completionEmbed] });
    }

  } catch (error) {
    console.error('Error in handleReviewClips:', error);
    await interaction.editReply({
      content: '❌ An error occurred while fetching clips. Please try again.'
    });
  }
}

// Handle approve clip
async function handleApproveClip(interaction, clipId) {
  try {
    // Check if user has administrator permissions
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      await interaction.reply({
        content: '❌ **Access Denied!**\n\nThis action is only available to administrators.',
        ephemeral: true
      });
      return;
    }

    await interaction.deferReply({ ephemeral: true });

    // Update clip status to approved
    const { data: updatedClip, error } = await supabase
      .from('clips')
      .update({
        status: 'approved',
        reviewed_by: interaction.user.id,
        reviewed_at: new Date().toISOString()
      })
      .eq('id', clipId)
      .select()
      .single();

    if (error) {
      console.error('Error approving clip:', error);
      await interaction.editReply({
        content: '❌ **Error approving clip!**\n\nThere was an error updating the clip status.'
      });
      return;
    }

    // Create success embed
    const embed = new EmbedBuilder()
      .setTitle('✅ Clip Approved!')
      .setColor('#00ff00')
      .setDescription(`Clip #${clipId} has been approved by <@${interaction.user.id}>`)
      .addFields(
        { name: 'Clip ID', value: `#${clipId}`, inline: true },
        { name: 'Status', value: '✅ Approved', inline: true },
        { name: 'Reviewed By', value: `<@${interaction.user.id}>`, inline: true }
      )
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });

    // Log the approval
    console.log(`Clip #${clipId} approved by ${interaction.user.tag} (${interaction.user.id})`);

  } catch (error) {
    console.error('Error in handleApproveClip:', error);
    await interaction.editReply({
      content: '❌ An error occurred while approving the clip. Please try again.'
    });
  }
}

// Handle reject clip
async function handleRejectClip(interaction, clipId) {
  try {
    // Check if user has administrator permissions
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      await interaction.reply({
        content: '❌ **Access Denied!**\n\nThis action is only available to administrators.',
        ephemeral: true
      });
      return;
    }

    // Create modal for rejection reason
    const modal = new ModalBuilder()
      .setCustomId(`reject_modal_${clipId}`)
      .setTitle('Reject Clip');

    const reasonInput = new TextInputBuilder()
      .setCustomId('rejection_reason')
      .setLabel('Reason for rejection')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('Please provide a reason for rejecting this clip...')
      .setRequired(true)
      .setMaxLength(1000);

    const reasonRow = new ActionRowBuilder().addComponents(reasonInput);
    modal.addComponents(reasonRow);

    await interaction.showModal(modal);

  } catch (error) {
    console.error('Error in handleRejectClip:', error);
    await interaction.reply({
      content: '❌ An error occurred while processing the rejection. Please try again.',
      ephemeral: true
    });
  }
}

// Handle reject clip submission
async function handleRejectClipSubmit(interaction, clipId, rejectionReason) {
  try {
    await interaction.deferReply({ ephemeral: true });

    // Update clip status to rejected
    const { data: updatedClip, error } = await supabase
      .from('clips')
      .update({
        status: 'rejected',
        rejection_reason: rejectionReason,
        reviewed_by: interaction.user.id,
        reviewed_at: new Date().toISOString()
      })
      .eq('id', clipId)
      .select()
      .single();

    if (error) {
      console.error('Error rejecting clip:', error);
      await interaction.editReply({
        content: '❌ **Error rejecting clip!**\n\nThere was an error updating the clip status.'
      });
      return;
    }

    // Create success embed
    const embed = new EmbedBuilder()
      .setTitle('❌ Clip Rejected')
      .setColor('#ff0000')
      .setDescription(`Clip #${clipId} has been rejected by <@${interaction.user.id}>`)
      .addFields(
        { name: 'Clip ID', value: `#${clipId}`, inline: true },
        { name: 'Status', value: '❌ Rejected', inline: true },
        { name: 'Reviewed By', value: `<@${interaction.user.id}>`, inline: true },
        { name: 'Rejection Reason', value: rejectionReason, inline: false }
      )
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });

    // Log the rejection
    console.log(`Clip #${clipId} rejected by ${interaction.user.tag} (${interaction.user.id}): ${rejectionReason}`);

  } catch (error) {
    console.error('Error in handleRejectClipSubmit:', error);
    await interaction.editReply({
      content: '❌ An error occurred while rejecting the clip. Please try again.'
    });
  }
}

async function handleUpload(interaction) {
  await interaction.deferReply({ ephemeral: true });

  const clipLink = interaction.options.getString('link');
  const platform = interaction.options.getString('platform');
  const userId = interaction.user.id;
  const guildId = interaction.guild?.id || '0'; // Use '0' as default for DMs

  // Basic validation for link
  if (!clipLink.startsWith('http://') && !clipLink.startsWith('https://')) {
    await interaction.editReply({
      content: '❌ Please provide a valid link (starting with http:// or https://).'
    });
    return;
  }

  // Validate that the link matches the selected platform
  const platformValidation = {
    'Instagram': ['instagram.com', 'instagr.am'],
    'YouTube': ['youtube.com', 'youtu.be', 'm.youtube.com'],
    'TikTok': ['tiktok.com', 'vm.tiktok.com', 'vt.tiktok.com'],
    'X': ['twitter.com', 'x.com', 't.co']
  };

  const validDomains = platformValidation[platform];
  if (!validDomains) {
    await interaction.editReply({
      content: `❌ Invalid platform selected: ${platform}`
    });
    return;
  }

  const linkMatchesPlatform = validDomains.some(domain => clipLink.includes(domain));
  if (!linkMatchesPlatform) {
    const expectedDomains = validDomains.join(', ');
    await interaction.editReply({
      content: `❌ **Platform Mismatch!**\n\nYou selected **${platform}** but the link is not from the correct platform.\n\n**Expected domains:** ${expectedDomains}\n**Your link:** ${clipLink}\n\nPlease use a link from the correct platform or change your platform selection.`
    });
    return;
  }

  // Check if user is registered and has payment info
  const { data: user } = await supabase
    .from('discord_users')
    .select('*')
    .eq('discord_id', userId)
    .single();

  if (!user) {
    await interaction.editReply({
      content: '❌ You are not registered. Please use `/register` first.'
    });
    return;
  }

  if (!user.payment_method || !user.payment_info) {
    await interaction.editReply({
      content: '❌ Your payment information is not set. Please use `/set-payment` first.'
    });
    return;
  }

  // Require at least one linked account on the selected platform
  try {
    const { data: linkedAccounts, error: linkedErr } = await supabase
      .from('user_accounts')
      .select('id')
      .eq('discord_id', userId)
      .eq('platform', platform)
      .limit(1);

    if (linkedErr) {
      console.error('Error checking linked accounts:', linkedErr);
      await interaction.editReply({
        content: '❌ Could not verify your linked accounts. Please try again later.'
      });
      return;
    }

    if (!linkedAccounts || linkedAccounts.length === 0) {
      await interaction.editReply({
        content: `❌ You must link a ${platform} account before uploading. Use \`/link-account\` to add it.`
      });
      return;
    }
  } catch (e) {
    console.error('Unexpected error verifying linked accounts:', e);
    await interaction.editReply({
      content: '❌ Unexpected error while verifying your linked accounts.'
    });
    return;
  }

  // Get campaign name based on server
  let campaignName = 'General Submission'; // Default fallback
  
  try {
    const { data: campaignServer } = await supabase
      .from('campaign_servers')
      .select('campaign_name')
      .eq('discord_guild_id', guildId)
      .eq('is_active', true)
      .single();
    
    if (campaignServer) {
      campaignName = campaignServer.campaign_name;
    }
  } catch (error) {
    console.log(`No specific campaign found for server ${guildId}, using default: ${campaignName}`);
  }

  // Insert clip into database
  const { data, error } = await supabase
    .from('clips')
    .insert([{
      discord_id: userId,
      video_link: clipLink,
      campaign_name: campaignName,
      platform: platform,
      status: 'pending',
      discord_guild_id: guildId
    }])
    .select();

  if (error) {
    console.error('Error inserting clip:', error);
    await interaction.editReply({
      content: `❌ Failed to upload clip. ${error.message || 'Database error.'}`
    });
    return;
  }

  const clipId = data[0].id;

  const embed = new EmbedBuilder()
    .setTitle('✅ Clip Uploaded!')
    .setColor('#00ff00')
    .setDescription(`Your clip has been uploaded for review! Clip ID: \`${clipId}\`\n\n**Campaign:** ${campaignName}\n**Platform:** ${platform}\n**Link:** [View Clip](${clipLink})`)
    .setThumbnail(interaction.user.displayAvatarURL())
    .setTimestamp();

  await interaction.editReply({ embeds: [embed] });
  console.log(`Clip uploaded by ${interaction.user.tag} (${interaction.user.id}): ${clipLink}`);
}

// Handle remove account
async function handleRemoveAccount(interaction) {
  const userId = interaction.user.id;
  const platform = interaction.options.getString('platform');
  const username = interaction.options.getString('username');

  try {
    // Check if the account exists
    const { data: account, error: fetchError } = await supabase
      .from('user_accounts')
      .select('*')
      .eq('discord_id', userId)
      .eq('platform', platform)
      .eq('username', username)
      .single();

    if (fetchError || !account) {
      await interaction.reply({
        content: '❌ Account not found. Please check the platform and username.',
        ephemeral: true
      });
      return;
    }

    // Delete the account
    const { error: deleteError } = await supabase
      .from('user_accounts')
      .delete()
      .eq('discord_id', userId)
      .eq('platform', platform)
      .eq('username', username);

    if (deleteError) {
      console.error('Error deleting account:', deleteError);
      await interaction.reply({
        content: '❌ Failed to remove account. Please try again.',
        ephemeral: true
      });
      return;
    }

    const embed = new EmbedBuilder()
      .setTitle('🗑️ Account Removed')
      .setColor('#ff6a2b')
      .setDescription('Your account has been successfully removed.')
      .addFields(
        { name: 'Platform', value: platform, inline: true },
        { name: 'Username', value: username, inline: true }
      )
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
    console.log(`Account removed by ${interaction.user.tag} (${interaction.user.id}): ${platform}/${username}`);

  } catch (error) {
    console.error('Error in handleRemoveAccount:', error);
    await interaction.reply({
      content: '❌ An error occurred while removing the account. Please try again.',
      ephemeral: true
    });
  }
}

// Handle remove videos
async function handleRemoveVideos(interaction) {
  const userId = interaction.user.id;
  const videoLink = interaction.options.getString('link');

  try {
    // Basic validation for link
    if (!videoLink.startsWith('http://') && !videoLink.startsWith('https://')) {
      await interaction.reply({
        content: '❌ Please provide a valid link (starting with http:// or https://).',
        ephemeral: true
      });
      return;
    }

    // Find the specific video by link
    const { data: clip, error: fetchError } = await supabase
      .from('clips')
      .select('*')
      .eq('discord_id', userId)
      .eq('video_link', videoLink)
      .single();

    if (fetchError || !clip) {
      await interaction.reply({
        content: '❌ Video not found. Please check the link and make sure it belongs to you.',
        ephemeral: true
      });
      return;
    }

    // Show video details before removal
    const statusEmoji = {
      'pending': '⏳',
      'approved': '✅',
      'rejected': '❌'
    }[clip.status] || '❓';

    const createdDate = new Date(clip.created_at).toLocaleDateString();
    const reviewedDate = clip.reviewed_at ? new Date(clip.reviewed_at).toLocaleDateString() : 'Not reviewed';

    const embed = new EmbedBuilder()
      .setTitle('🗑️ Video to be Removed')
      .setColor('#ff6a2b')
      .setDescription('This video will be removed from the database:')
      .addFields(
        { name: 'Video ID', value: `#${clip.id}`, inline: true },
        { name: 'Status', value: `${statusEmoji} ${clip.status}`, inline: true },
        { name: 'Upload Date', value: createdDate, inline: true },
        { name: 'Video Link', value: `[View Video](${clip.video_link})`, inline: false }
      )
      .setTimestamp();

    if (clip.reviewed_by) {
      embed.addFields({ name: 'Reviewed by', value: `<@${clip.reviewed_by}>`, inline: true });
    }
    
    if (clip.reviewed_at) {
      embed.addFields({ name: 'Reviewed on', value: reviewedDate, inline: true });
    }
    
    if (clip.rejection_reason) {
      embed.addFields({ name: 'Rejection reason', value: clip.rejection_reason, inline: false });
    }

    await interaction.reply({ embeds: [embed], ephemeral: true });

    // Now actually delete the video
    const { error: deleteError } = await supabase
      .from('clips')
      .delete()
      .eq('discord_id', userId)
      .eq('video_link', videoLink);

    if (deleteError) {
      console.error('Error deleting clip:', deleteError);
      await interaction.followUp({
        content: '❌ Failed to remove video from database. Please try again.',
        ephemeral: true
      });
      return;
    }

    // Send confirmation message
    await interaction.followUp({
      content: `✅ Successfully removed video #${clip.id} from the database!`,
      ephemeral: true
    });

    console.log(`Video removed by ${interaction.user.tag} (${interaction.user.id}): Video #${clip.id} - ${videoLink}`);

  } catch (error) {
    console.error('Error in handleRemoveVideos:', error);
    await interaction.reply({
      content: '❌ An error occurred while removing the video. Please try again.',
      ephemeral: true
    });
  }
}

// Handle video list
async function handleVideoList(interaction) {
  try {
    console.log('handleVideoList called for user:', interaction.user.tag, 'status:', interaction.options.getString('status'));
    const userId = interaction.user.id;
    const statusFilter = interaction.options.getString('status') || 'all';
    // Build query based on status filter
    let query = supabase
      .from('clips')
      .select('*')
      .eq('discord_id', userId)
      .order('created_at', { ascending: false });

    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }

    const { data: clips, error } = await query;

    if (error) {
      console.error('Error fetching clips:', error);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          content: '❌ Failed to fetch your videos. Please try again.',
          ephemeral: true
        });
      }
      return;
    }

    if (!clips || clips.length === 0) {
      const statusText = statusFilter === 'all' ? 'videos' : `${statusFilter} videos`;
      await interaction.reply({
        content: `📭 No ${statusText} found.`,
        ephemeral: true
      });
      return;
    }

    // Create embed with video list
    const embed = new EmbedBuilder()
      .setTitle('🎬 Your Video List')
      .setColor('#a259ff')
      .setDescription(`Found **${clips.length}** ${statusFilter === 'all' ? 'videos' : statusFilter + ' videos'}`)
      .setTimestamp();

    // Add videos to embed (limit to 10 to avoid embed limits)
    const videosToShow = clips.slice(0, 10);
    
    for (const clip of videosToShow) {
      const statusEmoji = {
        'pending': '⏳',
        'approved': '✅',
        'rejected': '❌'
      }[clip.status] || '❓';

      const createdDate = new Date(clip.created_at).toLocaleDateString();
      const reviewedDate = clip.reviewed_at ? new Date(clip.reviewed_at).toLocaleDateString() : 'Not reviewed';
      
      let fieldValue = `**Status:** ${statusEmoji} ${clip.status}\n**Platform:** ${clip.platform || 'Unknown'}\n**Date:** ${createdDate}\n**Link:** [View Video](${clip.video_link})`;
      
      if (clip.reviewed_by) {
        fieldValue += `\n**Reviewed by:** <@${clip.reviewed_by}>`;
      }
      
      if (clip.reviewed_at) {
        fieldValue += `\n**Reviewed on:** ${reviewedDate}`;
      }
      
      if (clip.rejection_reason) {
        fieldValue += `\n**Rejection reason:** ${clip.rejection_reason}`;
      }
      
      embed.addFields({
        name: `🎥 Video #${clip.id}`,
        value: fieldValue,
        inline: false
      });
    }

    // Add footer if there are more videos
    if (clips.length > 10) {
      embed.setFooter({ text: `Showing 10 of ${clips.length} videos. Use status filter to narrow results.` });
    }

    await interaction.reply({ embeds: [embed], ephemeral: true });
    console.log(`Video list viewed by ${interaction.user.tag} (${interaction.user.id}): ${clips.length} videos (${statusFilter})`);

  } catch (error) {
    console.error('Error in handleVideoList:', error);
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({
        content: '❌ An error occurred while fetching your videos. Please try again.',
        ephemeral: true
      });
    }
  }
}

// Campaign Server Management Functions
async function handleSetCampaignServer(interaction) {
  try {
    const campaignName = interaction.options.getString('campaign-name');
    const serverId = interaction.options.getString('server-id') || interaction.guild?.id;
    
    if (!serverId) {
      await interaction.reply({ 
        content: '❌ Server ID is required. Please provide a server ID or use this command in a server.', 
        ephemeral: true 
      });
      return;
    }

    // Get server name for display
    const serverName = interaction.guild?.name || 'Unknown Server';

    // Upsert the campaign-server mapping
    const { data, error } = await supabase
      .from('campaign_servers')
      .upsert({
        campaign_name: campaignName,
        discord_guild_id: serverId,
        discord_guild_name: serverName,
        is_active: true
      }, { onConflict: 'discord_guild_id' })
      .select();

    if (error) {
      console.error('Error setting campaign server:', error);
      await interaction.reply({ 
        content: `❌ Failed to set campaign server. Error: ${error.message}\n\n**Note:** Make sure you've run the SQL script to create the \`campaign_servers\` table first.`, 
        ephemeral: true 
      });
      return;
    }

    const embed = new EmbedBuilder()
      .setTitle('✅ Campaign Server Set')
      .setColor('#00ff00')
      .addFields(
        { name: 'Campaign', value: campaignName, inline: true },
        { name: 'Server', value: serverName, inline: true },
        { name: 'Server ID', value: serverId, inline: true }
      )
      .setDescription('This server is now mapped to the campaign. Users uploading clips here will automatically be assigned to this campaign.')
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
    console.log(`Campaign server set: ${campaignName} -> ${serverName} (${serverId})`);

  } catch (error) {
    console.error('Error in handleSetCampaignServer:', error);
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({ 
        content: `❌ An unexpected error occurred: ${error.message}`, 
        ephemeral: true 
      });
    }
  }
}

async function handleListCampaignServers(interaction) {
  try {
    const { data: campaignServers, error } = await supabase
      .from('campaign_servers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error listing campaign servers:', error);
      await interaction.reply({ 
        content: `❌ Failed to list campaign servers. Error: ${error.message}`, 
        ephemeral: true 
      });
      return;
    }

    if (!campaignServers || campaignServers.length === 0) {
      await interaction.reply({ 
        content: '📝 No campaign servers configured yet.', 
        ephemeral: true 
      });
      return;
    }

    const embed = new EmbedBuilder()
      .setTitle('📋 Campaign Server Mappings')
      .setColor('#0099ff')
      .setDescription('Here are all the configured campaign-server mappings:')
      .setTimestamp();

    for (const server of campaignServers) {
      const status = server.is_active ? '🟢 Active' : '🔴 Inactive';
      embed.addFields({
        name: `${server.campaign_name}`,
        value: `**Server:** ${server.discord_guild_name}\n**ID:** \`${server.discord_guild_id}\`\n**Status:** ${status}\n**Created:** ${new Date(server.created_at).toLocaleDateString()}`,
        inline: true
      });
    }

    await interaction.reply({ embeds: [embed], ephemeral: true });

  } catch (error) {
    console.error('Error in handleListCampaignServers:', error);
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({ 
        content: `❌ An unexpected error occurred: ${error.message}`, 
        ephemeral: true 
      });
    }
  }
}

async function handleRemoveCampaignServer(interaction) {
  try {
    const serverId = interaction.options.getString('server-id');

    // Get server info before deletion
    const { data: existingServer } = await supabase
      .from('campaign_servers')
      .select('*')
      .eq('discord_guild_id', serverId)
      .single();

    if (!existingServer) {
      await interaction.reply({ 
        content: '❌ No campaign server mapping found for that server ID.', 
        ephemeral: true 
      });
      return;
    }

    // Delete the mapping
    const { error } = await supabase
      .from('campaign_servers')
      .delete()
      .eq('discord_guild_id', serverId);

    if (error) {
      console.error('Error removing campaign server:', error);
      await interaction.reply({ 
        content: `❌ Failed to remove campaign server. Error: ${error.message}`, 
        ephemeral: true 
      });
      return;
    }

    const embed = new EmbedBuilder()
      .setTitle('✅ Campaign Server Removed')
      .setColor('#ff6b6b')
      .addFields(
        { name: 'Campaign', value: existingServer.campaign_name, inline: true },
        { name: 'Server', value: existingServer.discord_guild_name, inline: true },
        { name: 'Server ID', value: serverId, inline: true }
      )
      .setDescription('This server is no longer mapped to any campaign. Users uploading clips here will use the default campaign.')
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
    console.log(`Campaign server removed: ${existingServer.campaign_name} -> ${existingServer.discord_guild_name} (${serverId})`);

  } catch (error) {
    console.error('Error in handleRemoveCampaignServer:', error);
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({ 
        content: `❌ An unexpected error occurred: ${error.message}`, 
        ephemeral: true 
      });
    }
  }
}

// Handle campaign stats
async function handleCampaignStats(interaction) {
  try {
    const guildId = interaction.guild?.id || '0';
    let targetCampaign = null;
    
    // Try to detect campaign from server
    try {
      const { data: campaignServer } = await supabase
        .from('campaign_servers')
        .select('campaign_name')
        .eq('discord_guild_id', guildId)
        .eq('is_active', true)
        .single();
      
      if (campaignServer) {
        targetCampaign = campaignServer.campaign_name;
      }
    } catch (error) {
      console.log(`No specific campaign found for server ${guildId}, showing clips from this server only`);
    }
    
    // Build query based on server and campaign filter
    let query = supabase
      .from('clips')
      .select('status, campaign_name, platform, created_at, discord_id, discord_guild_id')
      .eq('discord_guild_id', guildId) // Always filter by server first
      .order('created_at', { ascending: false });

    if (targetCampaign) {
      // If we found a specific campaign for this server, also filter by campaign name
      query = query.eq('campaign_name', targetCampaign);
    }
    // If no specific campaign found, show all clips from this server

    const { data: clips, error } = await query;

    if (error) {
      console.error('Error fetching campaign stats:', error);
      await interaction.reply({
        content: '❌ Failed to fetch campaign statistics. Please try again.',
        ephemeral: true
      });
      return;
    }

    // Calculate statistics
    const totalSubmitted = clips.length;
    const pending = clips.filter(clip => clip.status === 'pending').length;
    const approved = clips.filter(clip => clip.status === 'approved').length;
    const rejected = clips.filter(clip => clip.status === 'rejected').length;
    
    // Calculate approval rate
    const reviewed = approved + rejected;
    const approvalRate = reviewed > 0 ? ((approved / reviewed) * 100).toFixed(1) : '0.0';

    // Get platform breakdown
    const platformStats = {};
    clips.forEach(clip => {
      const platform = clip.platform || 'Unknown';
      platformStats[platform] = (platformStats[platform] || 0) + 1;
    });

    // Get campaign breakdown (if no specific campaign filter)
    const campaignStats = {};
    if (!targetCampaign) {
      clips.forEach(clip => {
        const campaign = clip.campaign_name || 'Unknown';
        campaignStats[campaign] = (campaignStats[campaign] || 0) + 1;
      });
    }

    // Create embed
    const embed = new EmbedBuilder()
      .setTitle('📊 Campaign Statistics')
      .setColor('#a259ff')
      .setTimestamp();

    if (targetCampaign) {
      embed.setDescription(`Statistics for **${targetCampaign}** campaign in ${interaction.guild?.name || 'this server'}`);
    } else {
      embed.setDescription(`Statistics for ${interaction.guild?.name || 'this server'} (all campaigns)`);
    }

    // Add main stats
    embed.addFields({
      name: '📈 Overview',
      value: `**Total Submitted:** ${totalSubmitted}\n**Pending:** ${pending}\n**Approved:** ${approved}\n**Rejected:** ${rejected}\n**Approval Rate:** ${approvalRate}%`,
      inline: true
    });

    // Add platform breakdown
    const platformText = Object.entries(platformStats)
      .sort(([,a], [,b]) => b - a)
      .map(([platform, count]) => `**${platform}:** ${count}`)
      .join('\n') || 'No data';

    embed.addFields({
      name: '📱 Platform Breakdown',
      value: platformText,
      inline: true
    });

    // Add campaign breakdown (if no specific campaign filter)
    if (!targetCampaign) {
      const campaignText = Object.entries(campaignStats)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5) // Show top 5 campaigns
        .map(([campaign, count]) => `**${campaign}:** ${count}`)
        .join('\n') || 'No data';

      embed.addFields({
        name: '🎯 Campaign Breakdown',
        value: campaignText,
        inline: true
      });
    }

    // Add footer with last updated info
    if (clips.length > 0) {
      const lastSubmission = new Date(clips[0].created_at).toLocaleDateString();
      embed.setFooter({ text: `Last submission: ${lastSubmission}` });
    }

    await interaction.reply({ embeds: [embed], ephemeral: true });
    console.log(`Campaign stats viewed by ${interaction.user.tag} (${interaction.user.id}): ${totalSubmitted} total clips`);

  } catch (error) {
    console.error('Error in handleCampaignStats:', error);
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({
        content: '❌ An error occurred while fetching campaign statistics. Please try again.',
        ephemeral: true
      });
    }
  }
}

// Handle export clips (User command - own clips only)
async function handleExportClips(interaction) {
  try {
    await interaction.deferReply({ ephemeral: true });

    const userId = interaction.user.id;

    // Export only the user's own clips
    const { data: clips, error } = await supabase
      .from('clips')
      .select('*')
      .eq('discord_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching clips for export:', error);
      await interaction.editReply({
        content: '❌ **Error fetching clips!**\n\nThere was an error retrieving the clips from the database.'
      });
      return;
    }

    if (!clips || clips.length === 0) {
      await interaction.editReply({
        content: '📭 **No clips found!**\n\nYou haven\'t uploaded any clips yet.'
      });
      return;
    }

    // Create CSV content (date, link, and view count)
    const csvHeaders = 'Date,Clip Link,View Count\n';
    const csvRows = clips.map(clip => {
      return [
        new Date(clip.created_at).toLocaleDateString(),
        clip.video_link || '',
        clip.view_count || 'N/A'
      ].join(',');
    });

    const csvContent = csvHeaders + csvRows.join('\n');

    // Create buffer and attachment
    const buffer = Buffer.from(csvContent, 'utf8');
    const attachment = {
      name: `my_clips_export_${new Date().toISOString().split('T')[0]}.csv`,
      attachment: buffer
    };

    const embed = new EmbedBuilder()
      .setTitle('📊 Your Clips Export Complete')
      .setColor('#00ff00')
      .setDescription(`Successfully exported **${clips.length}** of your clips`)
      .addFields(
        { name: 'Export Type', value: 'Your clips only', inline: true },
        { name: 'Export Date', value: new Date().toLocaleDateString(), inline: true },
        { name: 'File Name', value: `my_clips_export_${new Date().toISOString().split('T')[0]}.csv`, inline: true }
      )
      .setTimestamp();

    await interaction.editReply({ 
      embeds: [embed], 
      files: [attachment] 
    });

    console.log(`User clips exported by ${interaction.user.tag} (${interaction.user.id}): ${clips.length} clips`);

  } catch (error) {
    console.error('Error in handleExportClips:', error);
    await interaction.editReply({
      content: '❌ An error occurred while exporting clips. Please try again.'
    });
  }
}

// Handle update view counts (User command)
async function handleUpdateViewCounts(interaction) {
  try {
    await interaction.deferReply({ ephemeral: true });

    const userId = interaction.user.id;

    // Get user's clips from all platforms
    const { data: clips, error } = await supabase
      .from('clips')
      .select('*')
      .eq('discord_id', userId)
      .in('platform', ['YouTube', 'TikTok', 'Instagram'])
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching clips:', error);
      await interaction.editReply({
        content: '❌ **Error fetching clips!**\n\nThere was an error retrieving your clips.'
      });
      return;
    }

    if (!clips || clips.length === 0) {
      await interaction.editReply({
        content: '📭 **No clips found!**\n\nYou haven\'t uploaded any YouTube, TikTok, or Instagram videos yet.'
      });
      return;
    }

    // Show quota status before processing
    const quotaStatus = viewCountManager.getQuotaStatus();
    const quotaEmbed = new EmbedBuilder()
      .setTitle('📊 View Count Update Starting')
      .setColor('#0099ff')
      .setDescription(`Processing **${clips.length}** clips from all platforms`)
      .addFields(
        { name: 'YouTube API Quota', value: `${quotaStatus.youtube.used}/${quotaStatus.youtube.limit} (${quotaStatus.youtube.percentage}%)`, inline: true },
        { name: 'Platforms', value: 'YouTube, TikTok, Instagram', inline: true }
      )
      .setTimestamp();

    await interaction.editReply({ embeds: [quotaEmbed] });

    // Process clips in batches
    const batchSize = 10;
    const batches = [];
    for (let i = 0; i < clips.length; i += batchSize) {
      batches.push(clips.slice(i, i + batchSize));
    }

    let totalResults = {
      youtube: { updated: 0, errors: 0 },
      tiktok: { updated: 0, errors: 0 },
      instagram: { updated: 0, errors: 0 }
    };

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      console.log(`Processing batch ${i + 1}/${batches.length} (${batch.length} clips)`);
      
      const batchResults = await viewCountManager.updateViewCountsBatch(batch);
      
      // Accumulate results
      Object.keys(totalResults).forEach(platform => {
        totalResults[platform].updated += batchResults[platform].updated;
        totalResults[platform].errors += batchResults[platform].errors;
      });

      // Update progress
      if (batches.length > 1) {
        const progressEmbed = new EmbedBuilder()
          .setTitle('📊 View Count Update Progress')
          .setColor('#ffa500')
          .setDescription(`Processing batch ${i + 1}/${batches.length}`)
          .addFields(
            { name: 'YouTube', value: `✅ ${totalResults.youtube.updated} updated, ❌ ${totalResults.youtube.errors} errors`, inline: true },
            { name: 'TikTok', value: `✅ ${totalResults.tiktok.updated} updated, ❌ ${totalResults.tiktok.errors} errors`, inline: true },
            { name: 'Instagram', value: `✅ ${totalResults.instagram.updated} updated, ❌ ${totalResults.instagram.errors} errors`, inline: true }
          )
          .setTimestamp();

        await interaction.editReply({ embeds: [progressEmbed] });
      }

      // Delay between batches
      if (i < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    // Final results
    const finalEmbed = new EmbedBuilder()
      .setTitle('📊 View Counts Updated Successfully!')
      .setColor('#00ff00')
      .setDescription(`Completed processing **${clips.length}** clips from all platforms`)
      .addFields(
        { name: '📺 YouTube', value: `✅ ${totalResults.youtube.updated} updated\n❌ ${totalResults.youtube.errors} errors`, inline: true },
        { name: '🎵 TikTok', value: `✅ ${totalResults.tiktok.updated} updated\n❌ ${totalResults.tiktok.errors} errors`, inline: true },
        { name: '📸 Instagram', value: `✅ ${totalResults.instagram.updated} updated\n❌ ${totalResults.instagram.errors} errors`, inline: true },
        { name: '📈 Total Success', value: `${totalResults.youtube.updated + totalResults.tiktok.updated + totalResults.instagram.updated}/${clips.length} clips`, inline: false }
      )
      .setTimestamp();

    await interaction.editReply({ embeds: [finalEmbed] });
    console.log(`View counts updated by ${interaction.user.tag} (${interaction.user.id}): ${totalResults.youtube.updated + totalResults.tiktok.updated + totalResults.instagram.updated}/${clips.length} successful`);

  } catch (error) {
    console.error('Error in handleUpdateViewCounts:', error);
    await interaction.editReply({
      content: '❌ An error occurred while updating view counts. Please try again.'
    });
  }
}

// Handle quota status (Admin only)
async function handleQuotaStatus(interaction) {
  try {
    // Check if user has administrator permissions
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      await interaction.reply({
        content: '❌ **Access Denied!**\n\nThis command is only available to administrators.',
        ephemeral: true
      });
      return;
    }

    const quotaStatus = viewCountManager.getQuotaStatus();
    
    const embed = new EmbedBuilder()
      .setTitle('📊 API Quota Status')
      .setColor('#0099ff')
      .setDescription('Current API quota usage across all platforms')
      .addFields(
        { 
          name: '📺 YouTube API', 
          value: `**Used:** ${quotaStatus.youtube.used}/${quotaStatus.youtube.limit}\n**Remaining:** ${quotaStatus.youtube.remaining}\n**Usage:** ${quotaStatus.youtube.percentage}%`, 
          inline: true 
        },
        { 
          name: '🎵 TikTok Scraper', 
          value: `**Rate Limit:** ${viewCountManager.tiktokRateLimit} requests/min\n**Status:** Active\n**Method:** Web Scraping`, 
          inline: true 
        },
        { 
          name: '📸 Instagram Scraper', 
          value: `**Rate Limit:** ${viewCountManager.instagramRateLimit} requests/min\n**Status:** Active\n**Method:** Web Scraping`, 
          inline: true 
        }
      )
      .setTimestamp();

    // Add warning if quota is high
    if (quotaStatus.youtube.percentage > 80) {
      embed.setColor('#ff6b6b');
      embed.addFields({
        name: '⚠️ Warning',
        value: 'YouTube API quota is running low! Consider resetting or upgrading your quota.',
        inline: false
      });
    }

    // Add reset button if quota is high
    const components = [];
    if (quotaStatus.youtube.percentage > 50) {
      const resetButton = new ButtonBuilder()
        .setCustomId('reset_quota')
        .setLabel('🔄 Reset YouTube Quota')
        .setStyle(ButtonStyle.Danger);
      
      const row = new ActionRowBuilder().addComponents(resetButton);
      components.push(row);
    }

    await interaction.reply({ 
      embeds: [embed], 
      components: components,
      ephemeral: true 
    });

  } catch (error) {
    console.error('Error in handleQuotaStatus:', error);
    await interaction.reply({
      content: '❌ An error occurred while checking quota status. Please try again.',
      ephemeral: true
    });
  }
}

// Handle reset quota (Admin only)
async function handleResetQuota(interaction) {
  try {
    // Check if user has administrator permissions
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      await interaction.reply({
        content: '❌ **Access Denied!**\n\nThis action is only available to administrators.',
        ephemeral: true
      });
      return;
    }

    await interaction.deferReply({ ephemeral: true });

    // Reset the quota
    viewCountManager.resetQuota();
    
    const embed = new EmbedBuilder()
      .setTitle('🔄 YouTube API Quota Reset')
      .setColor('#00ff00')
      .setDescription('YouTube API quota has been successfully reset!')
      .addFields(
        { name: 'Reset By', value: `<@${interaction.user.id}>`, inline: true },
        { name: 'Reset Time', value: new Date().toLocaleString(), inline: true },
        { name: 'New Quota', value: '0/10,000 (0%)', inline: true }
      )
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
    console.log(`YouTube API quota reset by ${interaction.user.tag} (${interaction.user.id})`);

  } catch (error) {
    console.error('Error in handleResetQuota:', error);
    await interaction.editReply({
      content: '❌ An error occurred while resetting the quota. Please try again.'
    });
  }
}

// Error handling
client.on('error', error => {
  console.error('Discord client error:', error);
});

process.on('unhandledRejection', error => {
  console.error('Unhandled promise rejection:', error);
});

// Health check server for Render deployment
import express from 'express';
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.json({ 
    status: 'Bot is running', 
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Health and readiness endpoints for uptime monitors and load balancers
app.get('/healthz', (req, res) => {
  res.json({
    ok: true,
    uptime: process.uptime(),
    discordReady,
    timestamp: new Date().toISOString()
  });
});

app.get('/readyz', (req, res) => {
  if (discordReady) {
    res.json({ ready: true });
  } else {
    res.status(503).json({ ready: false, reason: 'Discord client not ready' });
  }
});

const server = app.listen(PORT, () => {
  console.log(`Health check server running on port ${PORT}`);
});

// Optional self-keepalive ping to prevent free-tier idling if PUBLIC_URL is set
if (process.env.PUBLIC_URL) {
  const keepAliveUrl = `${process.env.PUBLIC_URL.replace(/\/$/, '')}/healthz`;
  setInterval(async () => {
    try {
      await fetch(keepAliveUrl, { method: 'GET' });
      console.log('Self keepalive ping OK');
    } catch (e) {
      console.warn('Self keepalive ping failed:', e?.message || e);
    }
  }, 5 * 60 * 1000); // every 5 minutes
}

// Graceful shutdown
async function shutdown(signal) {
  try {
    console.log(`Received ${signal}, shutting down gracefully...`);
    server?.close?.();
    try { await client.destroy(); } catch {}
  } finally {
    process.exit(0);
  }
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

// Login with retry/backoff to handle transient failures
async function loginWithRetry(maxRetries = Infinity, baseDelayMs = 10000) {
  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      await client.login(config.discord.token);
      return;
    } catch (error) {
      attempt += 1;
      const delay = Math.min(baseDelayMs * Math.pow(2, Math.min(attempt, 5)), 5 * 60 * 1000);
      console.error(`❌ Failed to login to Discord (attempt ${attempt}). Retrying in ${Math.round(delay/1000)}s...`, error?.message || error);
      await new Promise(r => setTimeout(r, delay));
    }
  }
}

async function handleLeaderboard(interaction) {
  try {
    await interaction.deferReply({ ephemeral: true });
    
    // Get all clips with view counts and user info
    const { data: clips, error } = await supabase
      .from('clips')
      .select('id, view_count, platform, video_link, created_at, discord_id')
      .not('view_count', 'is', null)
      .not('discord_id', 'is', null);
    
    if (error) {
      console.error('Error fetching view count leaderboard:', error);
      await interaction.editReply({ content: '❌ Error fetching leaderboard data!' });
      return;
    }
    
    // Calculate total view counts per user
    const userStats = {};
    clips.forEach(clip => {
      if (!userStats[clip.discord_id]) {
        userStats[clip.discord_id] = {
          totalViews: 0,
          videoCount: 0,
          platforms: new Set()
        };
      }
      userStats[clip.discord_id].totalViews += clip.view_count || 0;
      userStats[clip.discord_id].videoCount += 1;
      userStats[clip.discord_id].platforms.add(clip.platform);
    });
    
    // Sort users by total view count
    const sortedUsers = Object.entries(userStats)
      .sort(([,a], [,b]) => b.totalViews - a.totalViews);
    
    const totalUploaders = sortedUsers.length;
    const topUsers = sortedUsers.slice(0, 10);
    
    const embed = new EmbedBuilder()
      .setTitle('🏆 Top Users by Total View Count')
      .setColor(0x00ff00)
      .setTimestamp();
    
    if (topUsers.length > 0) {
      let description = '';
      for (let i = 0; i < topUsers.length; i++) {
        const [discordId, stats] = topUsers[i];
        const position = i + 1;
        const rank = `${position}/${totalUploaders}`;
        const medal = position === 1 ? '🥇' : position === 2 ? '🥈' : position === 3 ? '🥉' : '';
        const totalViews = stats.totalViews.toLocaleString();
        const platforms = Array.from(stats.platforms).join(', ');
        
        description += `${medal} **${rank}** <@${discordId}>\n`;
        description += `   👀 **${totalViews}** total views\n`;
        description += `   📹 ${stats.videoCount} videos (${platforms})\n\n`;
      }
      embed.setDescription(description);
    } else {
      embed.setDescription('No users with view counts found.');
    }
    
    await interaction.editReply({ embeds: [embed] });
    
  } catch (error) {
    console.error('Error in handleLeaderboard:', error);
    await interaction.editReply({ content: '❌ Error generating leaderboard!' });
  }
}

// Initial login
loginWithRetry();
