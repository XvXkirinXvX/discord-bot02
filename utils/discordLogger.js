const {
  LOG_CHANNEL_MESSAGE,
  LOG_CHANNEL_EDIT,
  LOG_CHANNEL_DELETE,
  LOG_CHANNEL_ERROR
} = require('../config');

// ✂️ Prevent Discord 2000 char limit
function trim(text, max = 1800) {
  if (!text) return "[Empty]";

  return text.length > max
    ? text.slice(0, max) + "... [TRUNCATED]"
    : text;
}

// 📎 Attachment formatter
function getAttachments(message) {
  if (!message.attachments?.size) return "";

  return "\nATTACHMENTS:\n" +
    message.attachments.map(a => a.url).join("\n");
}

// 📤 Send log safely
async function sendLog(client, channelId, content) {
  try {
    const channel = await client.channels.fetch(channelId);

    if (!channel || !channel.isTextBased()) return;

    await channel.send(trim(content, 1900));

  } catch (err) {
    console.error("Log send error:", err);
  }
}

// 📝 Message log
async function logMessage(client, message) {
  try {
    if (!message?.author || message.author.bot) return;

    const channelName = message.channel?.name || "unknown";
    const serverName = message.guild?.name || "DM";

    await sendLog(
      client,
      LOG_CHANNEL_MESSAGE,
      `📝 **MESSAGE**
SERVER: ${serverName}
CHANNEL: #${channelName}
USER: ${message.author.tag}

${trim(message.content)}
${getAttachments(message)}`
    );

  } catch (err) {
    console.error("Message log error:", err);
  }
}

// ✏️ Edit log
async function logEdit(client, oldMsg, newMsg) {
  try {
    if (!oldMsg?.author || oldMsg.author.bot) return;

    if (oldMsg.content === newMsg.content) return;

    const channelName = newMsg.channel?.name || "unknown";
    const serverName = newMsg.guild?.name || "DM";

    await sendLog(
      client,
      LOG_CHANNEL_EDIT,
      `✏️ **EDIT**
SERVER: ${serverName}
CHANNEL: #${channelName}
USER: ${newMsg.author.tag}

BEFORE:
${trim(oldMsg.content)}

AFTER:
${trim(newMsg.content)}
${getAttachments(newMsg)}`
    );

  } catch (err) {
    console.error("Edit log error:", err);
  }
}

// 🗑️ Delete log
async function logDelete(client, message) {
  try {
    if (!message?.author || message.author.bot) return;

    const channelName = message.channel?.name || "unknown";
    const serverName = message.guild?.name || "DM";

    await sendLog(
      client,
      LOG_CHANNEL_DELETE,
      `🗑️ **DELETE**
SERVER: ${serverName}
CHANNEL: #${channelName}
USER: ${message.author.tag}

${trim(message.content)}
${getAttachments(message)}`
    );

  } catch (err) {
    console.error("Delete log error:", err);
  }
}

// ❌ Error logger
async function logError(client, error, type = "ERROR") {
  try {
    const text =
      `❌ **${type}**\n\`\`\`js\n${trim(error?.stack || String(error), 1800)}\n\`\`\``;

    await sendLog(client, LOG_CHANNEL_ERROR, text);

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
