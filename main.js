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
    this.commandCount = 0;
    this.lastCommandTime = 0;
  }

  getRandomDelay() {
    return Math.random() * (2000 - 500) + 500;
  }

  async deleteMessageSafely(message) {
    try {
      const delay = Math.random() * 150 + 50;
      setTimeout(() => {
        message.delete().catch(() => {});
      }, delay);
    } catch {}
  }

  async checkRateLimit() {
    const now = Date.now();
    if (now - this.lastCommandTime < 1500) {
      await new Promise(resolve => setTimeout(resolve, 1500 - (now - this.lastCommandTime)));
    }
    this.lastCommandTime = Date.now();
  }

  async connectToVoice(channelId = null) {
    try {
      await this.checkRateLimit();
      
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

      await new Promise(resolve => setTimeout(resolve, this.getRandomDelay()));

      const { joinVoiceChannel } = require('@discordjs/voice');
      this.voiceConnection = joinVoiceChannel({
        channelId: channel.id,
        guildId: channel.guild.id,
        adapterCreator: channel.guild.voiceAdapterCreator,
        selfDeaf: AUTO_DEAFEN,
        selfMute: false,
      });

      this.guild = channel.guild;
      console.log(`Connected to ${channel.name}`);

      if (AUTO_DEAFEN) {
        await this.setDeafen(true);
        console.log('Auto-deafened');
      }
    } catch (error) {
      console.log(`Failed to connect to voice: ${error}`);
    }
  }

  async setDeafen(deafen) {
    try {
      await this.checkRateLimit();
      
      if (this.guild) {
        const me = await this.guild.members.fetch(this.user.id);
        if (me) {
          await new Promise(resolve => setTimeout(resolve, this.getRandomDelay()));
          
          await me.voice.setDeaf(deafen);
          this.deafened = deafen;
          const status = deafen ? 'Deafened' : 'Undeafened';
          console.log(status);
        }
      }
    } catch (error) {
      console.log(`Failed to change deafen status: ${error}`);
    }
  }

  async updateSpotifyStatus(track, artist) {
    try {
      await this.checkRateLimit();
      
      await new Promise(resolve => setTimeout(resolve, this.getRandomDelay()));
      
      await this.user.setActivity(`${track} - ${artist}`, {
        type: ActivityType.Listening,
      });
      console.log(`Spotify status set to: ${track} - ${artist}`);
    } catch (error) {
      console.log(`Failed to update status: ${error}`);
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
- anti-ban mode active
\`\`\``);

      await message.reply({ embeds: [helpEmbed], ephemeral: true }).catch(() => {
        message.author.send({ embeds: [helpEmbed] }).catch(() => {});
      });

      console.log('Help menu sent');
    } catch (error) {
      console.log(`Failed to send help: ${error}`);
    }
  }
}

const client = new SelfBot();

client.once('ready', async () => {
  console.log(`Logged in as ${client.user.username}`);
  console.log(`Username: ${client.user.username}#${client.user.discriminator}`);
  console.log(`Anti-ban mode active`);

  await client.connectToVoice();

  await client.updateSpotifyStatus(SPOTIFY_TRACK, SPOTIFY_ARTIST);

  setInterval(async () => {
    const randomDelay = Math.random() * 5000 + 5000;
    await new Promise(resolve => setTimeout(resolve, randomDelay));
    await client.updateSpotifyStatus(SPOTIFY_TRACK, SPOTIFY_ARTIST);
  }, 15000);

  setInterval(async () => {
    try {
      if (!client.voiceConnection || client.voiceConnection.state.status === 'disconnected') {
        console.log('Voice connection lost, reconnecting');
        await client.connectToVoice();
      }
    } catch (error) {
      console.log(`Error maintaining voice connection: ${error}`);
    }
  }, 30000);
});

client.on('messageCreate', async (message) => {
  if (message.author.id !== client.user.id) return;

  const content = message.content.toLowerCase().trim();

  if (content === '.help') {
    await client.sendHelpEmbed(message);
    await client.deleteMessageSafely(message);
  }
  else if (content === '.ping') {
    const latency = client.ws.ping;
    console.log(`Pong! Latency: ${latency}ms`);
    await client.deleteMessageSafely(message);
  }
  else if (content.startsWith('.join ')) {
    const channelId = content.substring(6).trim();
    if (channelId) {
      await client.connectToVoice(channelId);
      console.log(`Joined channel: ${channelId}`);
    }
    await client.deleteMessageSafely(message);
  }
  else if (content === '.deafen') {
    await client.setDeafen(true);
    await client.deleteMessageSafely(message);
  }
  else if (content === '.undeafen') {
    await client.setDeafen(false);
    await client.deleteMessageSafely(message);
  }
  else if (content === '.rejoin') {
    await client.connectToVoice();
    await client.deleteMessageSafely(message);
  }
  else if (content === '.leave') {
    if (client.voiceConnection) {
      await client.checkRateLimit();
      client.voiceConnection.destroy();
      console.log('Left voice channel');
    }
    await client.deleteMessageSafely(message);
  }
  else if (content.startsWith('.status ')) {
    const parts = message.content.substring(8).split(' - ');
    if (parts.length === 2) {
      const [track, artist] = parts;
      await client.updateSpotifyStatus(track, artist);
    }
    await client.deleteMessageSafely(message);
  }
});

client.on('error', error => {
  console.log(`Client error: ${error}`);
  setTimeout(() => {
    client.login(DISCORD_TOKEN).catch(err => console.log(`Login failed: ${err}`));
  }, Math.random() * 10000 + 5000);
});

client.on('shardDisconnect', () => {
  console.log('Shard disconnected, attempting reconnect');
});

client.login(DISCORD_TOKEN);
