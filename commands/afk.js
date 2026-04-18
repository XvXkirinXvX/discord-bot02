const { OWNER_ID } = require('../config');

module.exports = {
  name: "afk",
  async execute(message, args, client, { afkUsers }) 

    let reason = args.join(" ") || "Busy (Owner AFK)";

    const member = message.member;

    // 🧠 Save original nickname
    const originalNick = member.nickname || member.user.username;

    afkUsers.set(message.author.id, {
      reason,
      time: Date.now(),
      originalNick
    });

    // 🏷️ Set AFK nickname safely
    try {
      if (member.manageable) {
        await member.setNickname(`[AFK] ${originalNick}`);
      }
    } catch (err) {
      console.log("Nickname set failed:", err.message);
    }

    message.reply(`😴 You are now AFK: ${reason}`);
  }
};
