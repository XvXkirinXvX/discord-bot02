const {
  LOG_CHANNEL_MESSAGE,
  LOG_CHANNEL_EDIT,
  LOG_CHANNEL_DELETE
} = require('../config');

async function sendLog(client, channelId, content) {
  try {
    const channel = await client.channels.fetch(channelId);

    if (!channel) return;

    await channel.send(content);

  } catch (err) {
    console.error("Log send error:", err);
  }
}

async function logMessage(client, message) {
  if (message.author.bot) return;

  await sendLog(
    client,
    LOG_CHANNEL_MESSAGE,
    `📝 **MESSAGE**
SERVER: ${message.guild?.name}
CHANNEL: #${message.channel.name}
USER: ${message.author.tag}

${message.content || "[Attachment]"}`
  );
}

async function logEdit(client, oldMsg, newMsg) {
  if (oldMsg.author?.bot) return;

  if (oldMsg.content === newMsg.content) return;

  await sendLog(
    client,
    LOG_CHANNEL_EDIT,
    `✏️ **EDIT**
SERVER: ${newMsg.guild?.name}
CHANNEL: #${newMsg.channel.name}
USER: ${newMsg.author.tag}

BEFORE:
${oldMsg.content || "[Empty]"}

AFTER:
${newMsg.content || "[Empty]"}`
  );
}

async function logDelete(client, message) {
  if (message.author?.bot) return;

  await sendLog(
    client,
    LOG_CHANNEL_DELETE,
    `🗑️ **DELETE**
SERVER: ${message.guild?.name}
CHANNEL: #${message.channel.name}
USER: ${message.author.tag}

${message.content || "[Attachment/Empty]"}`
  );
}

module.exports = {
  logMessage,
  logEdit,
  logDelete
};
