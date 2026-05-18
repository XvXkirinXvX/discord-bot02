const fs = require('fs');
const path = require('path');

const logsDir = path.join(__dirname, '..', 'logs');

// 📁 Create logs folder
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

// 🧹 Clean filename
function sanitize(name) {
  return name.replace(/[^a-z0-9-_]/gi, '_').toLowerCase();
}

// 📄 Get channel log file
function getLogFile(channel) {
  const channelName = sanitize(channel.name || 'unknown');
  return path.join(logsDir, `${channelName}.log`);
}

// 🕒 Timestamp
function timestamp() {
  return new Date().toLocaleString();
}

// ✍️ Write log
function writeLog(channel, text) {
  const file = getLogFile(channel);

  fs.appendFile(
    file,
    `[${timestamp()}] ${text}\n`,
    err => {
      if (err) console.error("Log write error:", err);
    }
  );
}

// 📝 Message sent
function logMessage(message) {
  if (message.author.bot) return;

  writeLog(
    message.channel,
    `[MESSAGE] ${message.author.tag}: ${message.content || '[Attachment]'}`
  );
}

// ✏️ Message edited
function logEdit(oldMessage, newMessage) {
  if (oldMessage.author?.bot) return;

  if (oldMessage.content === newMessage.content) return;

  writeLog(
    newMessage.channel,
    `[EDIT]
USER: ${newMessage.author.tag}
BEFORE: ${oldMessage.content || '[Empty]'}
AFTER: ${newMessage.content || '[Empty]'}`
  );
}

// 🗑️ Message deleted
function logDelete(message) {
  if (message.author?.bot) return;

  writeLog(
    message.channel,
    `[DELETE] ${message.author.tag}: ${message.content || '[Attachment/Empty]'}`
  );
}

module.exports = {
  logMessage,
  logEdit,
  logDelete,
  logsDir
};
