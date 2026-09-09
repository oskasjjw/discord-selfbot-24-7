const { Client, GatewayIntentBits, ActivityType, ChannelType, EmbedBuilder } = require('discord.js');

// Read token directly from environment variable
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const VOICE_CHANNEL_ID = process.env.VOICE_CHANNEL_ID || "0";
const SPOTIFY_TRACK = process.env.SPOTIFY_TRACK || "Your Song Name";
const SPOTIFY_ARTIST = process.env.SPOTIFY_ARTIST || "Artist Name";
const AUTO_DEAFEN = process.env.AUTO_DEAFEN !== "false";

// Debug logging
console.log("\n=== CONFIG DEBUG ===");
console.log("DISCORD_TOKEN exists:", !!DISCORD_TOKEN);
console.log("DISCORD_TOKEN length:", DISCORD_TOKEN ? DISCORD_TOKEN.length : 0);
console.log("VOICE_CHANNEL_ID:", VOICE_CHANNEL_ID);
console.log("SPOTIFY_TRACK:", SPOTIFY_TRACK);
console.log("SPOTIFY_ARTIST:", SPOTIFY_ARTIST);
console.log("AUTO_DEAFEN:", AUTO_DEAFEN);
console.log("===================\n");

// Validate token exists
if (!DISCORD_TOKEN || DISCORD_TOKEN.trim() === "") {
  console.error("❌ ERROR: DISCORD_TOKEN is not set in Railway variables!");
  console.error("Please add DISCORD_TOKEN to your Railway environment variables.");
  process.exit(1);
}

class SelfBot extends Client {
  constructor() {
    super({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates,
      ],
      presence: {
        status: 'invisible',
      },
    });
    this.voiceConnection = null;
    this.guild = null;
    this.deafened = AUTO_DEAFEN;
  }

  async connectToVoice(channelId = null) {
    try {
      const targetChannelId = channelId || VOICE_CHANNEL_ID;
      const channel = await this.channels.fetch(targetChannelId);
      
      if (!channel) {
        console.log(`Channel ${targetChannelId} not found!`);
        return;
      }

      if (channel.type !== ChannelType.GuildVoice) {
        console.log(`${channel.name} is not a voice channel!`);
        return;
      }

      if (this.voiceConnection) {
        this.voiceConnection.destroy();
      }

      const { joinVoiceChannel } = require('@discordjs/voice');
      this.voiceConnection = joinVoiceChannel({
        channelId: channel.id,
        guildId: channel.guild.id,
        adapterCreator: channel.guild.voiceAdapterCreator,
        selfDeaf: AUTO_DEAFEN,
        selfMute: false,
      });

      this.guild = channel.guild;
      console.log(`✅ Connected to ${channel.name}`);

      if (AUTO_DEAFEN) {
        const me = await this.guild.members.fetch(this.user.id);
        if (me) {
          await me.voice.setDeaf(true);
          console.log('✅ Auto-deafened');
        }
      }
    } catch (error) {
      console.log(`❌ Failed to connect to voice: ${error.message}`);
    }
  }

  async updateSpotifyStatus(track, artist) {
    try {
      await this.user.setActivity(`${track} - ${artist}`, {
        type: ActivityType.Listening,
      });
      console.log(`✅ Spotify status set to: ${track} - ${artist}`);
    } catch (error) {
      console.log(`❌ Failed to update status: ${error.message}`);
    }
  }

  async sendHelpEmbed(message) {
    try {
      const helpEmbed = new EmbedBuilder()
        .setColor(0xFF0000)
        .setDescription(`
\`\`\`diff
- .help show menu
- .ping check latency
- .join <channel_id> join voice
- .status <song> - <artist> set spotify
- .leave leave voice
- .deafen deafen
- .undeafen undeafen
- .rejoin rejoin default
\`\`\``);

      await message.reply({ embeds: [helpEmbed] }).catch(() => {
        message.author.send({ embeds: [helpEmbed] }).catch(() => {});
      });

      console.log('✅ Help menu sent');
    } catch (error) {
      console.log(`❌ Failed to send help: ${error.message}`);
    }
  }
}

const client = new SelfBot();

client.once('ready', async () => {
  console.log(`\n🎉 Logged in as ${client.user.username}#${client.user.discriminator}`);
  console.log(`User ID: ${client.user.id}\n`);

  await client.connectToVoice();
  await client.updateSpotifyStatus(SPOTIFY_TRACK, SPOTIFY_ARTIST);

  // Update Spotify status every 15 seconds
  setInterval(async () => {
    await client.updateSpotifyStatus(SPOTIFY_TRACK, SPOTIFY_ARTIST);
  }, 15000);

  // Check voice connection every 30 seconds
  setInterval(async () => {
    try {
      if (!client.voiceConnection || client.voiceConnection.state.status === 'disconnected') {
        console.log('⚠️  Voice connection lost, reconnecting...');
        await client.connectToVoice();
      }
    } catch (error) {
      console.log(`❌ Error maintaining voice connection: ${error.message}`);
    }
  }, 30000);
});

client.on('messageCreate', async (message) => {
  if (message.author.id !== client.user.id) return;

  const content = message.content.toLowerCase().trim();

  if (content === '.help') {
    await client.sendHelpEmbed(message);
  }
  else if (content === '.ping') {
    console.log(`🏓 Pong! Latency: ${client.ws.ping}ms`);
  }
  else if (content.startsWith('.join ')) {
    const channelId = content.substring(6).trim();
    if (channelId) {
      await client.connectToVoice(channelId);
    }
  }
  else if (content === '.deafen') {
    if (client.guild) {
      const me = await client.guild.members.fetch(client.user.id);
      if (me) {
        await me.voice.setDeaf(true);
        console.log('✅ Deafened');
      }
    }
  }
  else if (content === '.undeafen') {
    if (client.guild) {
      const me = await client.guild.members.fetch(client.user.id);
      if (me) {
        await me.voice.setDeaf(false);
        console.log('✅ Undeafened');
      }
    }
  }
  else if (content === '.rejoin') {
    await client.connectToVoice();
  }
  else if (content === '.leave') {
    if (client.voiceConnection) {
      client.voiceConnection.destroy();
      console.log('✅ Left voice channel');
    }
  }
  else if (content.startsWith('.status ')) {
    const parts = message.content.substring(8).split(' - ');
    if (parts.length === 2) {
      const [track, artist] = parts;
      await client.updateSpotifyStatus(track, artist);
    }
  }
});

client.on('error', error => {
  console.log(`❌ Client error: ${error.message}`);
});

client.on('shardDisconnect', () => {
  console.log('⚠️  Shard disconnected');
});

client.on('shardError', error => {
  console.log(`❌ Shard error: ${error.message}`);
});

console.log("🔗 Attempting to login...\n");
client.login(DISCORD_TOKEN);
