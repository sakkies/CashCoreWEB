import { REST, Routes } from 'discord.js'; 
import { config } from './config.js';

// Import command builders
import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';

// Define all commands
const commands = [
  // Campaign Commands (removed - using campaign-server mapping instead)

  // User Commands
  new SlashCommandBuilder()
    .setName('profile')
    .setDescription('View your profile and stats'),

  new SlashCommandBuilder()
    .setName('account-list')
    .setDescription('List your linked accounts and payment method'),

  new SlashCommandBuilder()
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

  new SlashCommandBuilder()
    .setName('set-payment')
    .setDescription('Set your payment method and information')
    .addStringOption(option =>
      option.setName('method')
        .setDescription('Payment method')
        .setRequired(true)
        .addChoices(
          { name: 'ETH USDT', value: 'ETH USDT' },
          { name: 'ETH USDC', value: 'ETH USDC' }
        ))
    .addStringOption(option =>
      option.setName('info')
        .setDescription('Payment details (email, account number, wallet address, etc.)')
        .setRequired(true)),

  new SlashCommandBuilder()
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

  new SlashCommandBuilder()
    .setName('remove-videos')
    .setDescription('Remove a specific video by link')
    .addStringOption(option =>
      option.setName('link')
        .setDescription('Link to the video you want to remove')
        .setRequired(true)),

  new SlashCommandBuilder()
    .setName('video-list')
    .setDescription('List your uploaded clips')
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

  new SlashCommandBuilder()
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

  new SlashCommandBuilder()
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

  // Announcement Commands
  new SlashCommandBuilder()
    .setName('announce')
    .setDescription('Post an announcement (Admin only)')
    .addStringOption(option =>
      option.setName('message')
        .setDescription('Announcement message')
        .setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  new SlashCommandBuilder()
    .setName('create-embed')
    .setDescription('Create a custom embed with buttons (Admin only)')
    .addStringOption(option =>
      option.setName('title')
        .setDescription('Embed title (optional)')
        .setRequired(false))
    .addStringOption(option =>
      option.setName('description')
        .setDescription('Embed description (optional)')
        .setRequired(false))
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

  // Campaign Server Management Commands
  new SlashCommandBuilder()
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

  new SlashCommandBuilder()
    .setName('list-campaign-servers')
    .setDescription('List all campaign-server mappings (Admin only)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  new SlashCommandBuilder()
    .setName('remove-campaign-server')
    .setDescription('Remove a campaign-server mapping (Admin only)')
    .addStringOption(option =>
      option.setName('server-id')
        .setDescription('Discord server ID to remove')
        .setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  // Test command
  new SlashCommandBuilder()
    .setName('test-campaign')
    .setDescription('Test command for campaign system')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  // Campaign stats command
  new SlashCommandBuilder()
    .setName('campaign-stats')
    .setDescription('View campaign statistics for this server (Admin only)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
];

// Convert commands to JSON format
const commandsJSON = commands.map(command => command.toJSON());

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
