const { OWNER_ID } = require('../config');

module.exports = {
  name: "afk",
  async execute(message, args, client, { afkUsers })

    const reason = args.join(" ") || "Busy (Owner AFK)";
    const member = message.member;

    afkUsers.set(message.author.id, {
      reason,
      time: Date.now()
    });

    // 🏷️ Add [AFK] only if not already present
    try {
      if (member.manageable) {
        const currentNick = member.nickname || member.user.username;

        if (!currentNick.startsWith("[AFK]")) {
          await member.setNickname(`[AFK] ${currentNick}`);
        }
      }
    } catch (err) {
      console.log("Nickname set failed:", err.message);
    }

    message.reply(`😴 You are now AFK: ${reason}`);
  }
};
