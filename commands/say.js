const { containsBanned } = require('../utils/filter');

if (containsBanned(content)) {
  return message.reply("❌ Not allowed.");
}
