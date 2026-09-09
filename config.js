// Discord Selfbot Configuration
// All values are read from environment variables

// Debug: Log what's being read
console.log("=== CONFIG DEBUG ===");
console.log("DISCORD_TOKEN exists:", !!process.env.DISCORD_TOKEN);
console.log("DISCORD_TOKEN length:", process.env.DISCORD_TOKEN ? process.env.DISCORD_TOKEN.length : 0);
console.log("VOICE_CHANNEL_ID:", process.env.VOICE_CHANNEL_ID);
console.log("SPOTIFY_TRACK:", process.env.SPOTIFY_TRACK);
console.log("SPOTIFY_ARTIST:", process.env.SPOTIFY_ARTIST);
console.log("AUTO_DEAFEN:", process.env.AUTO_DEAFEN);
console.log("===================\n");

// Validate token exists
if (!process.env.DISCORD_TOKEN || process.env.DISCORD_TOKEN.trim() === "") {
  console.error("❌ ERROR: DISCORD_TOKEN is not set in Railway variables!");
  console.error("Please add DISCORD_TOKEN to your Railway environment variables.");
  process.exit(1);
}

module.exports = {
  // Your Discord user token (from Railway variables)
  DISCORD_TOKEN: process.env.DISCORD_TOKEN.trim(),

  // Voice Channel ID to stay in 24/7
  VOICE_CHANNEL_ID: process.env.VOICE_CHANNEL_ID || "0",

  // Spotify playlist/track info (will be displayed as listening status)
  SPOTIFY_TRACK: process.env.SPOTIFY_TRACK || "Your Song Name",
  SPOTIFY_ARTIST: process.env.SPOTIFY_ARTIST || "Artist Name",

  // Auto-deafen settings
  AUTO_DEAFEN: process.env.AUTO_DEAFEN !== "false", // Set to false if you want mic on by default
};
