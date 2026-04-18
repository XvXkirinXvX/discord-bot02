const { OWNER_ID } = require('../config');

module.exports = {
  name: "afk",
  execute(message, args, client, { afkUsers }) {

    let reason;

    // 👑 Owner default reason
    if (!args.length && message.author.id === OWNER_ID) {
      reason = "Busy (Owner AFK)";
    } else {
      reason = args.join(" ") || "AFK";
    }

    afkUsers.set(message.author.id, {
      reason,
      time: Date.now()
    });

    message.reply(`😴 You are now AFK: ${reason}`);
  }
};
