import { REST, Routes } from 'discord.js';
import { config } from './config.js';

// Create REST instance
const rest = new REST({ version: '10' }).setToken(config.discord.token);

// Clear all commands
(async () => {
  try {
    console.log('🗑️ Clearing all application (/) commands...');

    // Clear global commands
    await rest.put(
      Routes.applicationCommands(config.discord.clientId),
      { body: [] },
    );
    console.log('✅ Successfully cleared all global application (/) commands.');

    // Clear guild commands (if guild ID is provided)
    if (config.discord.guildId) {
      await rest.put(
        Routes.applicationGuildCommands(config.discord.clientId, config.discord.guildId),
        { body: [] },
      );
      console.log('✅ Successfully cleared all guild application (/) commands.');
    }

    console.log('🎉 All commands have been removed!');
  } catch (error) {
    console.error('❌ Error clearing commands:', error);
  }
})();

