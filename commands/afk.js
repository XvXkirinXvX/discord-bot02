module.exports = {
  name: "afk",
  async execute(message, args, client, { afkUsers }) {

    const reason = args.join(" ") || "AFK";

    const member = message.member;

    afkUsers.set(message.author.id, {
      reason,
      time: Date.now()
    });

    // 🏷️ Add [AFK] if not already anywhere in nickname
    try {
      if (member.manageable) {
        const currentNick = member.nickname || member.user.username;

        // check [AFK] anywhere (case-insensitive)
        if (!/\[afk\]/i.test(currentNick)) {
          let newNick = `[AFK] ${currentNick}`;

          // 🔒 prevent nickname too long (max 32 chars)
          if (newNick.length > 32) {
            newNick = newNick.slice(0, 32);
          }

          await member.setNickname(newNick);
        }
      }
    } catch (err) {
      console.log("Nickname set failed:", err.message);
    }

    try {
      await message.reply(`😴 You are now AFK: ${reason}`);
    } catch {}
  }
};
