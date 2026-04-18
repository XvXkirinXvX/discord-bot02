// 🛡️ Global error protection
process.on('unhandledRejection', err => {
  console.error("Unhandled Rejection:", err);
});

process.on('uncaughtException', err => {
  console.error("Uncaught Exception:", err);
});

const { Client, GatewayIntentBits } = require('discord.js');
const { OWNER_ID, PREFIX, GUILD_ID, CHANNEL_ID } = require('./config');
const AUTO_DELETE_DELAY = 30000;
let autoDeleteEnabled = process.env.NODE_ENV !== "production";

const afkUsers = new Map();
const afkCooldown = new Map();

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

  // 🧹 Auto-delete reply patch (dynamic)
  const { Message } = require("discord.js");
  const originalReply = Message.prototype.reply;

  Message.prototype.reply = async function (...args) {
    const msg = await originalReply.apply(this, args);

    if (autoDeleteEnabled && msg.author.id === this.client.user.id) {
      setTimeout(() => {
        msg.delete().catch(() => {});
      }, AUTO_DELETE_DELAY);
    }

    return msg;
  };

  console.log(`🧹 Auto-delete system initialized (${autoDeleteEnabled ? "ON" : "OFF"})`);
});
  // ✅ dynamic check (can change anytime)
  if (autoDeleteEnabled && msg.author.id === this.client.user.id) {
    setTimeout(() => {
      msg.delete().catch(() => {});
    }, AUTO_DELETE_DELAY);
  }

  return msg;

console.log("🧹 Auto-delete system initialized");

    console.log("🧹 Auto-delete replies ENABLED");
  } else {
    console.log("🧹 Auto-delete replies DISABLED");
  }
});

// 🔌 Autosend utils
const { startAutoMessage, stopAutoMessage } = require('./utils/autosend');

// 💬 Command handler
client.on('messageCreate', async message => {
  if (message.author.bot) return;
  if (blockedUsers.includes(message.author.id)) return;

  const now = Date.now();

  // 📣 AFK mention system FIRST (before removing AFK)
  if (message.mentions.users.size > 0) {
    for (const user of message.mentions.users.values()) {
      if (!afkUsers.has(user.id)) continue;

      const last = afkCooldown.get(user.id) || 0;
      if (now - last < 30 * 1000) continue;

      afkCooldown.set(user.id, now);

      const afkData = afkUsers.get(user.id);
      const diff = now - afkData.time;

      const seconds = Math.floor(diff / 1000);
      const minutes = Math.floor(seconds / 60);
      const hours = Math.floor(minutes / 60);

      let timeText;
      if (hours > 0) {
        timeText = `${hours}h ${minutes % 60}m`;
      } else if (minutes > 0) {
        timeText = `${minutes}m`;
      } else {
        timeText = `${seconds}s`;
      }

      try {
        await message.reply(
          `⏰ ${user.tag} is AFK: ${afkData.reason} (since ${timeText} ago)`
        );
      } catch {}
    }
  }

  // 💤 Remove AFK AFTER mention check
  if (afkUsers.has(message.author.id)) {
    afkUsers.delete(message.author.id);

    const member = message.member;

    try {
      if (member.manageable) {
        let currentNick = member.nickname || member.user.username;

        // ✅ REMOVE [AFK] ANYWHERE (not just start)
        const newNick = currentNick.replace(/\[AFK\]\s*/gi, "").trim();

        if (newNick !== currentNick) {
          await member.setNickname(newNick);
        }
      }
    } catch (err) {
      console.log("Nickname restore failed:", err.message);
    }

    try {
      if (message.author.id === OWNER_ID) {
        const msg = await message.reply("💕welcome back sayang😘💕");
      } else {
        const msg = await message.reply("👋 Welcome back, you are no longer AFK.");
      }
    } catch {}
  }

  // 💬 Command system
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
  afkUsers,
  getAutoDelete: () => autoDeleteEnabled,
  setAutoDelete: (value) => autoDeleteEnabled = value
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
