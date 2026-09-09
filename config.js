// Discord Selfbot Configuration
// Load from environment variables (.env file)
require('dotenv').config();

module.exports = {
  // Your Discord user token (from DevTools)
  DISCORD_TOKEN: process.env.DISCORD_TOKEN || "YOUR_TOKEN_HERE",

  // Voice Channel ID to stay in 24/7
  VOICE_CHANNEL_ID: parseInt(process.env.VOICE_CHANNEL_ID) || 0,

  // Spotify playlist/track info (will be displayed as listening status)
  SPOTIFY_TRACK: process.env.SPOTIFY_TRACK || "Your Song Name",
  SPOTIFY_ARTIST: process.env.SPOTIFY_ARTIST || "Artist Name",

  // Auto-deafen settings
  AUTO_DEAFEN: process.env.AUTO_DEAFEN === 'true' || true,
};
