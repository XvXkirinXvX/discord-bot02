// 🛡️ Global error protection
process.on('unhandledRejection', async err => {
  console.error("Unhandled Rejection:", err);

  try {
    await logError(client, err, "Unhandled Rejection");
  } catch {}
});

process.on('uncaughtException', async err => {
  console.error("Uncaught Exception:", err);

  try {
    await logError(client, err, "Uncaught Exception");
  } catch {}
});

const {
  Client,
  GatewayIntentBits,
  Partials
} = require('discord.js');
const { OWNER_ID, PREFIX, GUILD_ID, CHANNEL_ID } = require('./config');

const {
  logMessage,
  logEdit,
  logDelete,
  logError
} = require('./utils/discordLogger');

const AUTO_DELETE_DELAY = 60000;
let autoDeleteEnabled = process.env.NODE_ENV !== "production";
let vcGreetingEnabled = true;

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

const { joinVoiceChannel, VoiceConnectionStatus } = require('@discordjs/voice');

// 🤖 Client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates
  ],
  partials: [
    Partials.Message,
    Partials.Channel,
    Partials.Reaction
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
  if (!guild) {
  reconnecting = false;
  return console.log("Guild not found");
}

  const channel = guild.channels.cache.get(CHANNEL_ID);
  if (!channel) {
  reconnecting = false;
  return console.log("Channel not found");
}

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

  // 🧹 Auto-delete reply patch (SAFE + dynamic)
const { Message } = require("discord.js");

if (!Message.prototype._autoDeletePatched) {
  Message.prototype._autoDeletePatched = true;

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
}
  console.log(`🧹 Auto-delete system initialized (${autoDeleteEnabled ? "ON" : "OFF"})`);
});

// 🔌 Autosend utils
const { startAutoMessage, stopAutoMessage } = require('./utils/autosend');

// 📝 Message logging
//client.on('messageCreate', async message => {
 // try {
  //  await logMessage(client, message);
//  } catch (err) {
//    console.error("Message log error:", err);
//  }
//});

// ✏️ Edit logging
client.on('messageUpdate', async (oldMessage, newMessage) => {
  try {
    if (oldMessage.partial) {
      try { await oldMessage.fetch(); } catch {}
    }

    if (newMessage.partial) {
      try { await newMessage.fetch(); } catch {}
    }

    await logEdit(client, oldMessage, newMessage);

  } catch (err) {
    console.error("Edit log error:", err);
  }
});

// 🗑️ Delete logging
client.on('messageDelete', async message => {
  try {
    if (message.partial) {
      try { await message.fetch(); } catch {}
    }

    await logDelete(client, message);

  } catch (err) {
    console.error("Delete log error:", err);
  }
});

// 💬 Command handler
client.on('messageCreate', async message => {
  if (message.author.bot) return;
  if (blockedUsers.includes(message.author.id)) return;

  const now = Date.now();

  // 📣 AFK mention system
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
      if (hours > 0) timeText = `${hours}h ${minutes % 60}m`;
      else if (minutes > 0) timeText = `${minutes}m`;
      else timeText = `${seconds}s`;

      try {
        await message.reply(
          `⏰ ${message.guild?.members.cache.get(user.id)?.displayName || user.username} is AFK: ${afkData.reason} (since ${timeText} ago)`
        );
      } catch {}
    }
  }

  // 💤 Remove AFK
  if (afkUsers.has(message.author.id)) {
    afkUsers.delete(message.author.id);

    const member = message.member;

    try {
      if (member && member.manageable) {
        let currentNick = member.nickname || member.user.username;
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
        await message.reply("💕welcome back owner tercinta💕");
      } else {
        await message.reply("👋 Welcome back, you are no longer AFK.");
      }
    } catch {}
  }

  // 💬 Command system
  const msg = (message.content || "").trim();

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
      setAutoDelete: (value) => autoDeleteEnabled = value,
getVCGreeting: () => vcGreetingEnabled,
setVCGreeting: (value) => vcGreetingEnabled = value
    });
  } catch (err) {
    console.error("Command error:", err);
    try {
      await message.reply("❌ Error executing command");
    } catch {}
  }
});

// 👥 Voice logs
const specialGreetings = {
  "874846881652559952": "Welcome my owner 💖 <@874846881652559952>",
  "639916489629237258": "Welcome mas abu🩶<@639916489629237258>",
  "701695703449075752": "welkam timtam🖤<@701695703449075752>",
  "596959504349003786": "a-alow zar cayang UwU<@596959504349003786>",
  "581844299507826689": "welcome to the voice <@581844299507826689>-sama, semoga betah ya💕",
  "1495677921514356796": "welcome ya buronan server <@1495677921514356796>",
  "1463147288237969489": "welcome ya buronan dunia <@1463147288237969489>",
  "1314831779890462761": "alo blower <@1314831779890462761>",
  "1371531736042700932": "💕halo sayang~💕 <@1371531736042700932>",
  "710277455176400978": "halo musang <@710277455176400978>"
};

const specialGoodbyes = {
  "874846881652559952": "Babay owner👋",
  "639916489629237258": "yaah, mas abu nya pergi🙁",
  "701695703449075752": "why leave doraemon-_",
  "596959504349003786": "k-kok kamu keluar cinta?😣",
  "581844299507826689": "semangat hime untuk melakukan aktivitas mu😁 (atau rest well jika kamu mau istirahat)",
  "1495677921514356796": "ketangkep kah buronan satu ini?",
  "1463147288237969489": "ketangkep kah buronan satu ini?",
  "1314831779890462761": "peniup handal telah pergi",
  "1371531736042700932": "yah my bebeb sayang keluar 😭😭",
  "710277455176400978": "jauh jauh sana musang"
  
};

client.on('voiceStateUpdate', async (oldState, newState) => {
  if (!vcGreetingEnabled) return;

  try {

    // ❌ Ignore bot itself
    if (newState.member?.user.id === client.user.id) return;
    if (oldState.member?.user.id === client.user.id) return;

    // 🎤 Bot current VC
const botVC =
  oldState.guild.members.me?.voice?.channelId;

if (!botVC) return;

    // Ignore VC switching
if (
  oldState.channelId &&
  newState.channelId
) return;

   // ✅ Joined VC
if (
  !oldState.channelId &&
  newState.channelId === botVC
) {

  const logChannel = newState.channel;

  if (!logChannel?.isTextBased()) return;

  const customGreeting =
    specialGreetings[newState.member.id];

  await logChannel.send(
    customGreeting ||
    `🎤 Welcome ${newState.member} to **${newState.channel.name}**`
  );

  console.log(`${newState.member.user.tag} joined VC`);
}

// ✅ Left VC
else if (
  oldState.channelId === botVC &&
  !newState.channelId
) {

  const logChannel =
    oldState.guild.channels.cache.get(oldState.channelId);

  if (!logChannel?.isTextBased()) return;

  const customGoodbye =
    specialGoodbyes[oldState.member.id];

  await logChannel.send(
    customGoodbye ||
    `👋 Goodbye ${oldState.member.displayName}`
  );

  console.log(`${oldState.member.user.tag} left VC`);
}

  } catch (err) {
    console.error("VC greeting error:", err);
  }
});

// 🚀 Start bot
client.login(process.env.TOKEN);

// Export
module.exports = { connectVC };
