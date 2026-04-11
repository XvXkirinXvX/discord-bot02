const { Client, GatewayIntentBits } = require('discord.js');
const fs = require('fs');
const blockedPath = './blocked.json';

// Load blocked users
let blockedUsers = [];
if (fs.existsSync(blockedPath)) {
  try {
    blockedUsers = JSON.parse(fs.readFileSync(blockedPath));
  } catch {
    blockedUsers = [];
  }
}

// Save helper
function saveBlockedUsers() {
  fs.writeFileSync(blockedPath, JSON.stringify(blockedUsers, null, 2));
}
const { PREFIX, GUILD_ID, CHANNEL_ID } = require('./config');
const { 
  joinVoiceChannel, 
  getVoiceConnection, 
  VoiceConnectionStatus 
} = require('@discordjs/voice');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates
  ]
});

// 📂 Load commands
const commands = new Map();
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  commands.set(command.name, command);
}

// 🔊 Voice connection function
function connectVC(client) {
  const guild = client.guilds.cache.get(GUILD_ID);
  if (!guild) return console.log("Guild not found");

  const channel = guild.channels.cache.get(CHANNEL_ID);
  if (!channel) return console.log("Channel not found");

  const connection = joinVoiceChannel({
    channelId: CHANNEL_ID,
    guildId: GUILD_ID,
    adapterCreator: guild.voiceAdapterCreator,
    selfDeaf: false,
    selfMute: false
  });

  console.log("Joined voice channel");

  // 🔁 Auto-reconnect
  connection.on(VoiceConnectionStatus.Disconnected, () => {
    console.log("Disconnected! Reconnecting...");
    setTimeout(() => connectVC(client), 3000);
  });
}

// ✅ Ready event
client.once('clientReady', () => {
  console.log(`Logged in as ${client.user.tag}`);
  connectVC(client);
});

// 💬 Commands
const { startAutoMessage, stopAutoMessage } = require('./utils/autosend');

client.on('messageCreate', message => {
  if (message.author.bot) return;

  // 🚫 Ignore blocked users
  if (blockedUsers.includes(message.author.id)) return;

  const msg = message.content.trim();

  // ✅ Case-insensitive prefix
  if (!msg.toLowerCase().startsWith(PREFIX.toLowerCase())) return;

  // ✂️ Remove prefix safely
  const content = msg.slice(PREFIX.length).trim();

  // 🛑 Prevent empty commands (k! only)
  if (!content) return;

  // 🔍 Parse arguments
  const args = content.split(/ +/);
  const commandName = args.shift()?.toLowerCase();

  // 🛑 Extra safety (shouldn't happen, but safe)
  if (!commandName) return;

  console.log("COMMAND:", commandName);
  console.log("ARGS:", args);

  const command = commands.get(commandName);
  if (!command) return;

  try {
    command.execute(message, args, client, {
      blockedUsers,
      saveBlockedUsers,
      startAutoMessage,
      stopAutoMessage,
      connectVC
    });
  } catch (err) {
    console.error("Command error:", err);
    message.reply("❌ Error executing command");
  }
});

// 👥 Voice activity logging
client.on('voiceStateUpdate', (oldState, newState) => {
  if (!oldState.channelId && newState.channelId) {
    console.log(`${newState.member.user.tag} joined VC`);
  }

  if (oldState.channelId && !newState.channelId) {
    console.log(`${oldState.member.user.tag} left VC`);
  }
});


client.login(process.env.TOKEN);

// Export for rejoin command
module.exports = { connectVC };
