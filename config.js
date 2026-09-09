// Discord Selfbot Configuration
// Load environment variables from Railway
require('dotenv').config();

module.exports = {
  DISCORD_TOKEN: (process.env.DISCORD_TOKEN || "").trim(),
  VOICE_CHANNEL_ID: process.env.VOICE_CHANNEL_ID || "0",
  SPOTIFY_TRACK: process.env.SPOTIFY_TRACK || "Your Song Name",
  SPOTIFY_ARTIST: process.env.SPOTIFY_ARTIST || "Artist Name",
  AUTO_DEAFEN: process.env.AUTO_DEAFEN !== "false",
};
