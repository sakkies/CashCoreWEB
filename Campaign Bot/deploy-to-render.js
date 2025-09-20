#!/usr/bin/env node

// Script to deploy commands after Render deployment
import { REST, Routes } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

const commands = [
  // User Commands
  {
    name: 'link-account',
    description: 'Link your social media account to your Discord profile',
    options: [
      {
        name: 'platform',
        description: 'Social media platform',
        type: 3,
        required: true,
        choices: [
          { name: 'Instagram', value: 'Instagram' },
          { name: 'YouTube', value: 'YouTube' },
          { name: 'TikTok', value: 'TikTok' },
          { name: 'Twitter', value: 'Twitter' }
        ]
      },
      {
        name: 'username',
        description: 'Your username on the platform',
        type: 3,
        required: true
      }
    ]
  },
  {
    name: 'set-payment',
    description: 'Set your payment method for rewards',
    options: [
      {
        name: 'method',
        description: 'Payment method',
        type: 3,
        required: true,
        choices: [
          { name: 'ETH USDT', value: 'ETH USDT' },
          { name: 'ETH USDC', value: 'ETH USDC' },
          { name: 'BTC', value: 'BTC' },
          { name: 'PayPal', value: 'PayPal' }
        ]
      },
      {
        name: 'address',
        description: 'Your payment address',
        type: 3,
        required: true
      }
    ]
  },
  {
    name: 'remove-account',
    description: 'Remove a linked social media account',
    options: [
      {
        name: 'platform',
        description: 'Platform to remove account from',
        type: 3,
        required: true,
        choices: [
          { name: 'Instagram', value: 'Instagram' },
          { name: 'YouTube', value: 'YouTube' },
          { name: 'TikTok', value: 'TikTok' },
          { name: 'Twitter', value: 'Twitter' }
        ]
      }
    ]
  },
  {
    name: 'remove-videos',
    description: 'Remove a specific video from your submissions',
    options: [
      {
        name: 'link',
        description: 'Video link to remove',
        type: 3,
        required: true
      }
    ]
  },
  {
    name: 'video-list',
    description: 'View all your submitted videos and their status'
  },
  {
    name: 'upload',
    description: 'Upload a video clip for campaign review',
    options: [
      {
        name: 'platform',
        description: 'Platform where the video is hosted',
        type: 3,
        required: true,
        choices: [
          { name: 'Instagram', value: 'Instagram' },
          { name: 'YouTube', value: 'YouTube' },
          { name: 'TikTok', value: 'TikTok' },
          { name: 'Twitter', value: 'Twitter' }
        ]
      },
      {
        name: 'link',
        description: 'Link to your video',
        type: 3,
        required: true
      }
    ]
  },
  // Admin Commands
  {
    name: 'review-clips',
    description: 'Review submitted video clips (Admin only)',
    options: [
      {
        name: 'status',
        description: 'Filter by status',
        type: 3,
        required: false,
        choices: [
          { name: 'Pending', value: 'pending' },
          { name: 'Accepted', value: 'accepted' },
          { name: 'Rejected', value: 'rejected' }
        ]
      },
      {
        name: 'limit',
        description: 'Number of clips to show (default: 10)',
        type: 4,
        required: false
      }
    ]
  },
  {
    name: 'set-campaign-server',
    description: 'Set campaign for this Discord server (Admin only)',
    options: [
      {
        name: 'campaign',
        description: 'Campaign name',
        type: 3,
        required: true
      }
    ]
  },
  {
    name: 'list-campaign-servers',
    description: 'List all campaign-server mappings (Admin only)'
  },
  {
    name: 'remove-campaign-server',
    description: 'Remove campaign mapping for this server (Admin only)'
  },
  {
    name: 'campaign-stats',
    description: 'View campaign statistics (Admin only)'
  }
];

const rest = new REST().setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log('Started refreshing application (/) commands.');

    // Register commands globally
    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands }
    );

    console.log('Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error(error);
  }
})();
