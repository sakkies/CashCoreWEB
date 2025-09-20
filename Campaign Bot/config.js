import dotenv from 'dotenv';

dotenv.config();

export const config = {
  discord: {
    token: process.env.DISCORD_TOKEN,
    clientId: process.env.CLIENT_ID,
    guildId: process.env.GUILD_ID
  },
  supabase: {
    url: process.env.SUPABASE_URL || 'https://whcwkuufssjoiktkpeen.supabase.co',
    anonKey: process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndoY3drdXVmc3Nqb2lrdGtwZWVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwNzU1NTgsImV4cCI6MjA3MjY1MTU1OH0.EqiEpEzlxPjajMuHF1RhZgXjJX9E9Bp97XPY8cIjtI8',
    serviceKey: process.env.SUPABASE_SERVICE_KEY || ''
  }
};
