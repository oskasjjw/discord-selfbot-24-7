// Quick Discord Token Test
const { Client, GatewayIntentBits } = require('discord.js');

const token = process.argv[2];

if (!token) {
  console.error("❌ Usage: node test.js YOUR_TOKEN_HERE");
  console.error("Example: node test.js MzMyNDE0NjU0NDI2NzE1NjQ4.DUFnkQ.Yt4fDeO1DEZFDeO1DEZFDeO1");
  process.exit(1);
}

console.log("\n🔍 Testing Discord Token...\n");
console.log("Token length:", token.length);
console.log("Token preview:", token.substring(0, 10) + "...");

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

client.once('ready', () => {
  console.log("\n✅ SUCCESS! Token is valid!");
  console.log(`Logged in as: ${client.user.username}#${client.user.discriminator}`);
  console.log(`User ID: ${client.user.id}`);
  process.exit(0);
});

client.on('error', (error) => {
  console.log("\n❌ ERROR:", error.message);
  if (error.message.includes('TokenInvalid')) {
    console.log("\n⚠️  TOKEN IS INVALID - Possible causes:");
    console.log("  1. Token has spaces or extra characters");
    console.log("  2. Token was revoked or regenerated");
    console.log("  3. Token is from wrong account");
    console.log("  4. Token format is incorrect");
  }
  process.exit(1);
});

console.log("Attempting login...");
client.login(token).catch(err => {
  console.log("\n❌ Login failed:", err.message);
  process.exit(1);
});

// Timeout after 10 seconds
setTimeout(() => {
  console.log("\n❌ Timeout - No response from Discord");
  process.exit(1);
}, 10000);
