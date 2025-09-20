import { Client, GatewayIntentBits, EmbedBuilder, SlashCommandBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } from 'discord.js';
import { createClient } from '@supabase/supabase-js';
import { config } from './config.js';
import { spawn } from 'child_process';

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

// Track processed interactions to prevent duplicates
const processedInteractions = new Set();

// Bot ready event
client.once('ready', () => {
  console.log(`🤖 CashCore Discord Bot is online!`);
  console.log(`📊 Logged in as: ${client.user.tag}`);
  console.log(`🏠 Connected to ${client.guilds.cache.size} server(s)`);
  
  // Set bot status
  client.user.setActivity('Campaign Management', { type: 'WATCHING' });
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
        .setDescription('Supported platforms (comma-separated)')
        .setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  // Delete campaign (Admin only)
  delete: new SlashCommandBuilder()
    .setName('delete-campaign')
    .setDescription('Delete a campaign (Admin only)')
    .addIntegerOption(option =>
      option.setName('id')
        .setDescription('Campaign ID to delete')
        .setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
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
  
  const { data, error } = await supabase
    .from('clips')
    .insert([{
      title,
      details,
      budget,
      supported_platforms: platforms
    }])
    .select();
  
  if (error) {
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
      { name: 'Details', value: details, inline: false },
      { name: 'Campaign ID', value: data[0].id.toString(), inline: true }
    )
    .setTimestamp();
  
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

    // Create embed with clips
    const embed = new EmbedBuilder()
      .setTitle(`🎬 Clip Review Dashboard`)
      .setColor('#0099ff')
      .setDescription(`Found **${clips.length}** ${statusFilter === 'all' ? 'clips' : statusFilter + ' clips'}`)
      .setTimestamp();

    // Add clips to embed (limit to 10 to avoid embed limits)
    const clipsToShow = clips.slice(0, 10);
    
    for (const clip of clipsToShow) {
      const statusEmoji = {
        'pending': '⏳',
        'approved': '✅',
        'rejected': '❌'
      }[clip.status] || '❓';

      const createdDate = new Date(clip.created_at).toLocaleDateString();
      
      embed.addFields({
        name: `${statusEmoji} Clip #${clip.id}`,
        value: `**User:** <@${clip.discord_id}>\n**Campaign:** ${clip.campaign_name}\n**Status:** ${clip.status}\n**Date:** ${createdDate}\n**Link:** [View Video](${clip.video_link})`,
        inline: true
      });
    }

    // Add footer if there are more clips
    if (clips.length > 10) {
      embed.setFooter({ text: `Showing 10 of ${clips.length} clips. Use status filter to narrow results.` });
    }

    // Create buttons for pending clips only
    const pendingClips = clips.filter(clip => clip.status === 'pending');
    let components = [];
    
    if (pendingClips.length > 0) {
      // Create buttons for the first 5 pending clips (Discord limit)
      const clipsForButtons = pendingClips.slice(0, 5);
      const buttonRows = [];
      
      for (const clip of clipsForButtons) {
        const approveButton = new ButtonBuilder()
          .setCustomId(`approve_${clip.id}`)
          .setLabel(`✅ Approve #${clip.id}`)
          .setStyle(ButtonStyle.Success);

        const rejectButton = new ButtonBuilder()
          .setCustomId(`reject_${clip.id}`)
          .setLabel(`❌ Reject #${clip.id}`)
          .setStyle(ButtonStyle.Danger);

        const row = new ActionRowBuilder()
          .addComponents(approveButton, rejectButton);
        
        buttonRows.push(row);
      }
      
      components = buttonRows;
    }

    await interaction.editReply({ 
      embeds: [embed], 
      components: components 
    });

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
      status: 'pending'
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
      console.log(`No specific campaign found for server ${guildId}, showing all campaigns`);
    }
    
    // Build query based on campaign filter
    let query = supabase
      .from('clips')
      .select('status, campaign_name, platform, created_at')
      .order('created_at', { ascending: false });

    if (targetCampaign) {
      query = query.eq('campaign_name', targetCampaign);
    }

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
    if (!campaignFilter) {
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
      embed.setDescription(`Statistics for **${targetCampaign}** campaign`);
    } else {
      embed.setDescription('Overall campaign statistics');
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

app.listen(PORT, () => {
  console.log(`Health check server running on port ${PORT}`);
});

// Login to Discord
client.login(config.discord.token).catch(error => {
  console.error('❌ Failed to login to Discord:', error);
  process.exit(1);
});
