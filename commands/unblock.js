const { OWNER_ID } = require('../config');

module.exports = {
  name: "unblock",
  execute(message, args, client, { blockedUsers, saveBlockedUsers }) {
    if (message.author.id !== OWNER_ID) {
      return message.reply("Only the bot owner can use this.");
    }

    const user = message.mentions.users.first();
    if (!user) return message.reply("Mention a user.");

    const index = blockedUsers.indexOf(user.id);
    if (index === -1) {
      return message.reply("User not blocked.");
    }

    blockedUsers.splice(index, 1);
    saveBlockedUsers();

    message.reply(`Unblocked ${user.tag}`);
  }
};