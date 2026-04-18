// 🛡️ Global error protection
process.on('unhandledRejection', err => {
  console.error("Unhandled Rejection:", err);
});

process.on('uncaughtException', err => {
  console.error("Uncaught Exception:", err);
});

const { Client, GatewayIntentBits } = require('discord.js');
const afkUsers = new Map();
const fs = require('fs');
const blockedPath = './blocked.json';

// 🔐 Token safety
if (!process.env.TOKEN) {
  console.error("❌ TOKEN is missing!");
  process.exit(1);
}

// 📁 Load blocked users
let blockedUsers = [];
if (fs.existsSync(blockedPath)) {
  try {
    blockedUsers = JSON.parse(fs.readFileSync(blockedPath));
  } catch {
    blockedUsers = [];
  }
}

// 💾 Save helper
function saveBlockedUsers() {
  fs.writeFileSync(blockedPath, JSON.stringify(blockedUsers, null, 2));
}

const { PREFIX, GUILD_ID, CHANNEL_ID } = require('./config');

const { 
  joinVoiceChannel, 
  VoiceConnectionStatus 
} = require('@discordjs/voice');

// 🤖 Client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates
  ]
});

// 📂 Load commands safely
const commands = new Map();
const commandFiles = fs.readdirSync('./commands').filter(f => f.endsWith('.js'));

for (const file of commandFiles) {
  try {
    const command = require(`./commands/${file}`);
    if (!command.name || typeof command.execute !== 'function') {
      console.log(`⚠️ Invalid command file: ${file}`);
      continue;
    }
    commands.set(command.name, command);
  } catch (err) {
    console.error(`❌ Failed to load ${file}:`, err);
  }
}

// 🔊 Voice connection
let reconnecting = false;

function connectVC(client) {
  if (reconnecting) return;
  reconnecting = true;

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

  connection.on(VoiceConnectionStatus.Disconnected, () => {
    console.log("Disconnected! Reconnecting...");
    reconnecting = false;
    setTimeout(() => connectVC(client), 3000);
  });
}

// ✅ Ready
client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
  connectVC(client);
});

// 🔌 Autosend utils
const { startAutoMessage, stopAutoMessage } = require('./utils/autosend');

// 💬 Command handler
client.on('messageCreate', async message => {
  if (message.author.bot) return;

  if (blockedUsers.includes(message.author.id)) return;

  const msg = message.content.trim();

  if (!msg.toLowerCase().startsWith(PREFIX.toLowerCase())) return;

  const content = msg.slice(PREFIX.length).trim();
  if (!content) return;

  const args = content.split(/ +/);
  const commandName = args.shift()?.toLowerCase();
  if (!commandName) return;

  console.log("COMMAND:", commandName);
  console.log("ARGS:", args);

  const command = commands.get(commandName);
  if (!command) return;

  try {
    await command.execute(message, args, client, {
      blockedUsers,
      saveBlockedUsers,
      startAutoMessage,
      stopAutoMessage,
      connectVC,
      afkUsers
    });
  } catch (err) {
    console.error("Command error:", err);
    try {
      await message.reply("❌ Error executing command");
    } catch {}
  }
});

// 👥 Voice logs
client.on('voiceStateUpdate', (oldState, newState) => {
  if (!oldState.channelId && newState.channelId) {
    console.log(`${newState.member.user.tag} joined VC`);
  }

  if (oldState.channelId && !newState.channelId) {
    console.log(`${oldState.member.user.tag} left VC`);
  }
});

// 🚀 Start bot
client.login(process.env.TOKEN);

// Export
module.exports = { connectVC };
