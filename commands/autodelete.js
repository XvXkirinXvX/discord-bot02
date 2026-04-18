const { OWNER_ID } = require('../config');

module.exports = {
  name: "autodelete",
  execute(message, args, client, { getAutoDelete, setAutoDelete }) {

    // 🔒 Optional: restrict to owner
    if (message.author.id !== OWNER_ID) {
      return message.reply("❌ Only the owner can use this command.");
    }

    if (!args.length) {
      return message.reply(`Auto-delete is currently: **${getAutoDelete() ? "ON" : "OFF"}**`);
    }

    const action = args[0].toLowerCase();

    if (action === "on") {
      setAutoDelete(true);
      return message.reply("🧹 Auto-delete ENABLED");
    }

    if (action === "off") {
      setAutoDelete(false);
      return message.reply("🛑 Auto-delete DISABLED");
    }

    return message.reply("Usage: !autodelete on/off");
  }
};
