// Discord Selfbot Configuration
// All values are read from environment variables

module.exports = {
  // Your Discord user token (from Railway variables)
  DISCORD_TOKEN: process.env.DISCORD_TOKEN || "",

  // Voice Channel ID to stay in 24/7
  VOICE_CHANNEL_ID: process.env.VOICE_CHANNEL_ID || "0",

  // Spotify playlist/track info (will be displayed as listening status)
  SPOTIFY_TRACK: process.env.SPOTIFY_TRACK || "Your Song Name",
  SPOTIFY_ARTIST: process.env.SPOTIFY_ARTIST || "Artist Name",

  // Auto-deafen settings
  AUTO_DEAFEN: process.env.AUTO_DEAFEN !== "false", // Set to false if you want mic on by default
};
