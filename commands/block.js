const { OWNER_ID } = require('../config');

module.exports = {
  name: "block",
  execute(message, args, client, { blockedUsers, saveBlockedUsers }) {

    // 🔒 Owner-only
    if (message.author.id !== OWNER_ID) {
      return message.reply("Only the bot owner can use this.");
    }

    // 👤 Get user
    const user = message.mentions.users.first();
    if (!user) {
      return message.reply("Please mention a user to block.");
    }

    // 🚫 Already blocked
    if (blockedUsers.includes(user.id)) {
      return message.reply("User already blocked.");
    }

    // ✅ Add + save
    blockedUsers.push(user.id);
    saveBlockedUsers();

    return message.reply(`Blocked ${user.tag}`);
  }
};