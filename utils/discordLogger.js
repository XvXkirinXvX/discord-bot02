const {
  LOG_CHANNEL_MESSAGE,
  LOG_CHANNEL_EDIT,
  LOG_CHANNEL_DELETE,
  LOG_CHANNEL_ERROR
} = require('../config');

// ✂️ Prevent Discord 2000 char limit
function trim(text = "", max = 1800) {
  const safe = String(text || "[Empty]");

  return safe.length > max
    ? safe.slice(0, max) + "... [TRUNCATED]"
    : safe;
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

// 📤 Send log safely
async function sendLog(client, channelId, content) {
  try {
    if (!client || !channelId) return;

    const channel = await client.channels.fetch(channelId).catch(() => null);

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

    const channelName = message.channel?.name || "unknown";
    const serverName = message.guild?.name || "DM";

    const content =
      `📝 **MESSAGE**\n` +
      `SERVER: ${serverName}\n` +
      `CHANNEL: #${channelName}\n` +
      `USER: ${message.author.tag} (${message.author.id})\n\n` +
      `${trim(message.content)}${getAttachments(message)}`;

    await sendLog(client, LOG_CHANNEL_MESSAGE, content);

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

    // Ignore unchanged edits
    if ((oldMsg.content || "") === (newMsg.content || "")) return;

    const channelName = newMsg.channel?.name || "unknown";
    const serverName = newMsg.guild?.name || "DM";

    const content =
      `✏️ **EDIT**\n` +
      `SERVER: ${serverName}\n` +
      `CHANNEL: #${channelName}\n` +
      `USER: ${newMsg.author.tag} (${newMsg.author.id})\n\n` +
      `BEFORE:\n${trim(oldMsg.content)}\n\n` +
      `AFTER:\n${trim(newMsg.content)}` +
      `\n\nOLD ATTACHMENTS:${getAttachments(oldMsg) || "\nNone"}\n` +
`\nNEW ATTACHMENTS:${getAttachments(newMsg) || "\nNone"}`;

    await sendLog(client, LOG_CHANNEL_EDIT, content);

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
