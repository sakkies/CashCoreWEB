// Discord bot command to trigger account verification
// Add this to your existing index.js file

// Add this command to your campaignCommands object:
const verifyCommand = new SlashCommandBuilder()
  .setName('verify-accounts')
  .setDescription('Verify linked accounts for verification codes (Admin only)')
  .addStringOption(option =>
    option.setName('discord_id')
      .setDescription('Discord user ID to verify (optional - verifies your own if not provided)')
      .setRequired(false))
  .addBooleanOption(option =>
    option.setName('force')
      .setDescription('Force re-verification even if recently verified')
      .setRequired(false))
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

// Add this to your allCommands array:
// allCommands.push(verifyCommand);

// Add this case to your command switch statement:
// case 'verify-accounts':
//   await handleVerifyAccounts(interaction);
//   break;

async function handleVerifyAccounts(interaction) {
  const targetDiscordId = interaction.options.getString('discord_id') || interaction.user.id;
  const forceReverify = interaction.options.getBoolean('force') || false;
  
  // Check if user is admin or verifying their own account
  const isAdmin = interaction.member.permissions.has(PermissionFlagsBits.Administrator);
  const isOwnAccount = targetDiscordId === interaction.user.id;
  
  if (!isAdmin && !isOwnAccount) {
    await interaction.reply({ 
      content: '❌ You can only verify your own accounts or need admin permissions.', 
      flags: 64 
    });
    return;
  }
  
  // Defer reply since verification takes time
  await interaction.deferReply({ ephemeral: true });
  
  try {
    // Get user's linked accounts
    const { data: accounts, error } = await supabase
      .from('user_accounts')
      .select('*')
      .eq('discord_id', targetDiscordId);
    
    if (error) {
      await interaction.editReply({ 
        content: '❌ Failed to fetch linked accounts.' 
      });
      return;
    }
    
    if (!accounts || accounts.length === 0) {
      await interaction.editReply({ 
        content: '❌ No linked accounts found. Use `/link-account` to add accounts first.' 
      });
      return;
    }
    
    // Check if accounts were recently verified (unless force is true)
    if (!forceReverify) {
      const recentlyVerified = accounts.filter(account => {
        if (!account.last_verification_attempt) return false;
        const lastAttempt = new Date(account.last_verification_attempt);
        const now = new Date();
        const hoursSinceAttempt = (now - lastAttempt) / (1000 * 60 * 60);
        return hoursSinceAttempt < 24; // Within 24 hours
      });
      
      if (recentlyVerified.length === accounts.length) {
        await interaction.editReply({ 
          content: '⚠️ All accounts were verified within the last 24 hours. Use `force: true` to re-verify.' 
        });
        return;
      }
    }
    
    // Start verification process
    await interaction.editReply({ 
      content: `🔍 Starting verification for ${accounts.length} account(s)... This may take a few moments.` 
    });
    
    // Call Python verification script
    const { spawn } = require('child_process');
    
    const pythonProcess = spawn('python', ['bio_verifier.py', '--discord-id', targetDiscordId], {
      cwd: process.cwd()
    });
    
    let output = '';
    let errorOutput = '';
    
    pythonProcess.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    pythonProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });
    
    pythonProcess.on('close', async (code) => {
      if (code === 0) {
        // Verification completed successfully
        try {
          // Get updated verification results
          const { data: updatedAccounts } = await supabase
            .from('user_accounts')
            .select('*')
            .eq('discord_id', targetDiscordId);
          
          const embed = new EmbedBuilder()
            .setTitle('🔍 Verification Results')
            .setColor('#a259ff')
            .setTimestamp();
          
          let verifiedCount = 0;
          let totalCount = updatedAccounts.length;
          
          updatedAccounts.forEach(account => {
            const status = account.verified ? '✅ VERIFIED' : '❌ NOT VERIFIED';
            const codeInfo = account.verification_code_found ? ` (Code: ${account.verification_code_found})` : '';
            const errorInfo = account.verification_error ? `\nError: ${account.verification_error}` : '';
            
            embed.addFields({
              name: `${account.platform}/${account.username}`,
              value: `${status}${codeInfo}${errorInfo}`,
              inline: false
            });
            
            if (account.verified) verifiedCount++;
          });
          
          embed.setDescription(`Verified ${verifiedCount}/${totalCount} accounts`);
          
          // Add verification instructions if some accounts failed
          if (verifiedCount < totalCount) {
            embed.addFields({
              name: '📝 Next Steps',
              value: 'For unverified accounts:\n1. Add your verification code to your bio\n2. Wait a few minutes for changes to appear\n3. Run this command again',
              inline: false
            });
          }
          
          await interaction.editReply({ 
            content: '✅ Verification completed!',
            embeds: [embed]
          });
          
        } catch (dbError) {
          await interaction.editReply({ 
            content: `✅ Verification completed but failed to fetch results: ${dbError.message}` 
          });
        }
      } else {
        // Python script failed
        await interaction.editReply({ 
          content: `❌ Verification failed: ${errorOutput || 'Unknown error'}` 
        });
      }
    });
    
    // Set a timeout for the verification process
    setTimeout(async () => {
      if (!pythonProcess.killed) {
        pythonProcess.kill();
        await interaction.editReply({ 
          content: '⏰ Verification timed out. Please try again.' 
        });
      }
    }, 60000); // 60 second timeout
    
  } catch (error) {
    console.error('Verification command error:', error);
    await interaction.editReply({ 
      content: '❌ An error occurred during verification.' 
    });
  }
}

// Export for use in main bot file
module.exports = {
  verifyCommand,
  handleVerifyAccounts
};


