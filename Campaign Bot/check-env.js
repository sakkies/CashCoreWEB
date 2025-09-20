#!/usr/bin/env node

/**
 * Environment Variables Checker
 * Run this script to verify all required environment variables are set
 */

import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const requiredVars = {
  'DISCORD_TOKEN': 'Discord Bot Token (from Discord Developer Portal)',
  'SUPABASE_URL': 'Supabase Project URL',
  'SUPABASE_ANON_KEY': 'Supabase Anonymous Key',
  'SUPABASE_SERVICE_KEY': 'Supabase Service Role Key (optional but recommended)'
};

const optionalVars = {
  'CLIENT_ID': 'Discord Client ID',
  'GUILD_ID': 'Discord Guild ID',
  'YOUTUBE_API_KEY': 'YouTube API Key'
};

console.log('🔍 Checking environment variables...\n');

let allRequired = true;
let missingRequired = [];

// Check required variables
console.log('📋 Required Variables:');
for (const [key, description] of Object.entries(requiredVars)) {
  const value = process.env[key];
  if (value) {
    console.log(`✅ ${key}: ${value.substring(0, 10)}...`);
  } else {
    console.log(`❌ ${key}: MISSING - ${description}`);
    missingRequired.push(key);
    allRequired = false;
  }
}

console.log('\n📋 Optional Variables:');
for (const [key, description] of Object.entries(optionalVars)) {
  const value = process.env[key];
  if (value) {
    console.log(`✅ ${key}: ${value.substring(0, 10)}...`);
  } else {
    console.log(`⚠️  ${key}: Not set - ${description}`);
  }
}

console.log('\n' + '='.repeat(50));

if (allRequired) {
  console.log('🎉 All required environment variables are set!');
  console.log('✅ Your bot should deploy successfully.');
} else {
  console.log('❌ Missing required environment variables:');
  missingRequired.forEach(key => console.log(`   - ${key}`));
  console.log('\n📝 Please set these variables in your Render environment settings.');
  console.log('🔗 See DEPLOYMENT_GUIDE.md for detailed instructions.');
  process.exit(1);
}

console.log('\n🚀 Ready to deploy!');


