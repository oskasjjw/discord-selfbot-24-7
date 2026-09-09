const { Client, GatewayIntentBits, ActivityType, ChannelType, EmbedBuilder } = require('discord.js');

// Read token directly - NO config.js
const DISCORD_TOKEN = (process.env.DISCORD_TOKEN || "").trim();
const VOICE_CHANNEL_ID = process.env.VOICE_CHANNEL_ID || "0";
const SPOTIFY_TRACK = process.env.SPOTIFY_TRACK || "Your Song Name";
const SPOTIFY_ARTIST = process.env.SPOTIFY_ARTIST || "Artist Name";
const AUTO_DEAFEN = process.env.AUTO_DEAFEN !== "false";

// Debug logging
console.log("\n=== ENVIRONMENT DEBUG ===");
console.log("DISCORD_TOKEN present:", !!DISCORD_TOKEN);
console.log("DISCORD_TOKEN length:", DISCORD_TOKEN.length);
console.log("VOICE_CHANNEL_ID:", VOICE_CHANNEL_ID);
console.log("All env vars:", Object.keys(process.env).filter(k => k.includes('DISCORD') || k.includes('VOICE') || k.includes('SPOTIFY')));
console.log("========================\n");

// Validate token exists
if (!DISCORD_TOKEN || DISCORD_TOKEN.length === 0) {
  console.error("\n❌ CRITICAL: DISCORD_TOKEN is missing!");
  console.error("Railway Variables Status:");
  console.error("DISCORD_TOKEN:", process.env.DISCORD_TOKEN ? "SET" : "NOT SET");
  console.error("\nMake sure to:");
  console.error("1. Go to Railway Dashboard");
  console.error("2. Click your service");
  console.error("3. Go to VARIABLES tab");
  console.error("4. Add: DISCORD_TOKEN = your_token_here");
  console.error("5. Click DEPLOY\n");
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
      console.log(`✅ Spotify status: ${track} - ${artist}`);
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
  console.log(`\n🎉 LOGGED IN: ${client.user.username}#${client.user.discriminator}`);
  console.log(`ID: ${client.user.id}\n`);

  await client.connectToVoice();
  await client.updateSpotifyStatus(SPOTIFY_TRACK, SPOTIFY_ARTIST);

  setInterval(async () => {
    await client.updateSpotifyStatus(SPOTIFY_TRACK, SPOTIFY_ARTIST);
  }, 15000);

  setInterval(async () => {
    try {
      if (!client.voiceConnection || client.voiceConnection.state.status === 'disconnected') {
        console.log('⚠️  Reconnecting voice...');
        await client.connectToVoice();
      }
    } catch (error) {
      console.log(`❌ Voice error: ${error.message}`);
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
    console.log(`🏓 Latency: ${client.ws.ping}ms`);
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

console.log("🔗 Attempting login with token...\n");
client.login(DISCORD_TOKEN).catch(err => {
  console.error("❌ LOGIN FAILED:", err.message);
  process.exit(1);
});
