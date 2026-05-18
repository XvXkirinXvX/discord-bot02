const fs = require('fs');
const path = require('path');

const {
  LOG_CHANNEL_MESSAGE,
  LOG_CHANNEL_EDIT,
  LOG_CHANNEL_DELETE,
  LOG_CHANNEL_ERROR,
  LOG_ALLOWED_CHANNELS
} = require('../config');

// ✂️ Prevent Discord 2000 char limit
function trim(text = "", max = 1800) {
  const safe = String(text || "[Empty]");

  return safe.length > max
    ? safe.slice(0, max) + "... [TRUNCATED]"
    : safe;
}

// ✅ Allowed channel filter
function isAllowedChannel(message) {
  try {
    if (!message?.channelId) return false;

    return LOG_ALLOWED_CHANNELS.includes(message.channelId);

  } catch {
    return false;
  }
}

// 📎 Attachment formatter
function getAttachments(message) {
  try {
    if (!message?.attachments?.size) return "";

    const urls = [...message.attachments.values()]
      .map(a => a.url)
      .filter(Boolean);

    if (!urls.length) return "";

    return `\nATTACHMENTS:\n${urls.join("\n")}`;

  } catch {
    return "";
  }
}

// 💾 Save logs to file
function saveLogToFile(channelName, content) {
  try {
    const safeName = String(channelName || "unknown")
      .replace(/[^a-z0-9-_]/gi, '_')
      .toLowerCase()
      .slice(0, 100);

    const logsDir = path.join(__dirname, '..', 'logs');

    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }

    const filePath = path.join(
      logsDir,
      `${safeName}.log`
    );

    const timestamp = new Date().toISOString();

    fs.appendFileSync(
      filePath,
      `[${timestamp}]\n${content}\n\n`
    );

  } catch (err) {
    console.error("File log error:", err);
  }
}

// 📤 Send log safely
async function sendLog(client, channelId, content) {
  try {
    if (!client || !channelId) return;

    const channel = await client.channels
      .fetch(channelId)
      .catch(() => null);

    if (!channel || !channel.isTextBased()) return;

    await channel.send({
      content: trim(content, 1900),
      allowedMentions: { parse: [] }
    });

  } catch (err) {
    console.error("Log send error:", err);
  }
}

// 📝 Message log
async function logMessage(client, message) {
  try {
    if (
      !message ||
      !message.author ||
      message.author.bot ||
      message.webhookId
    ) return;

    if (!isAllowedChannel(message)) return;

    const channelName = message.channel?.name || "unknown";
    const serverName = message.guild?.name || "DM";

    const content =
      `📝 **MESSAGE**\n` +
      `SERVER: ${serverName}\n` +
      `CHANNEL: #${channelName}\n` +
      `USER: ${message.author.tag} (${message.author.id})\n\n` +
      `${trim(message.content)}${getAttachments(message)}`;

    await sendLog(client, LOG_CHANNEL_MESSAGE, content);

    saveLogToFile(channelName, content);

  } catch (err) {
    console.error("Message log error:", err);
  }
}

// ✏️ Edit log
async function logEdit(client, oldMsg, newMsg) {
  try {
    if (
      !oldMsg ||
      !newMsg ||
      !newMsg.author ||
      newMsg.author.bot ||
      newMsg.webhookId
    ) return;

    if (!isAllowedChannel(newMsg)) return;

    const oldContent = (oldMsg.content || "").trim();
    const newContent = (newMsg.content || "").trim();

    // Ignore unchanged edits
    if (oldContent === newContent) return;

    const channelName = newMsg.channel?.name || "unknown";
    const serverName = newMsg.guild?.name || "DM";

    const content =
      `✏️ **EDIT**\n` +
      `SERVER: ${serverName}\n` +
      `CHANNEL: #${channelName}\n` +
      `USER: ${newMsg.author.tag} (${newMsg.author.id})\n\n` +
      `BEFORE:\n${trim(oldContent)}\n\n` +
      `AFTER:\n${trim(newContent)}\n\n` +
      `OLD ATTACHMENTS:${getAttachments(oldMsg) || "\nNone"}\n\n` +
      `NEW ATTACHMENTS:${getAttachments(newMsg) || "\nNone"}`;

    await sendLog(client, LOG_CHANNEL_EDIT, content);

    saveLogToFile(channelName, content);

  } catch (err) {
    console.error("Edit log error:", err);
  }
}

// 🗑️ Delete log
async function logDelete(client, message) {
  try {
    if (
      !message ||
      !message.author ||
      message.author.bot ||
      message.webhookId
    ) return;

    if (!isAllowedChannel(message)) return;

    const channelName = message.channel?.name || "unknown";
    const serverName = message.guild?.name || "DM";

    const content =
      `🗑️ **DELETE**\n` +
      `SERVER: ${serverName}\n` +
      `CHANNEL: #${channelName}\n` +
      `USER: ${message.author.tag} (${message.author.id})\n\n` +
      `${trim(message.content)}` +
      `${getAttachments(message)}`;

    await sendLog(client, LOG_CHANNEL_DELETE, content);

    saveLogToFile(channelName, content);

  } catch (err) {
    console.error("Delete log error:", err);
  }
}

// ❌ Error logger
async function logError(client, error, type = "ERROR") {
  try {
    const errorText =
      error?.stack ||
      error?.message ||
      String(error);

    const content =
      `❌ **${type}**\n` +
      "```js\n" +
      trim(errorText, 1800) +
      "\n```";

    await sendLog(client, LOG_CHANNEL_ERROR, content);

  } catch (err) {
    console.error("Failed to send error log:", err);
  }
}

module.exports = {
  logMessage,
  logEdit,
  logDelete,
  logError
};
