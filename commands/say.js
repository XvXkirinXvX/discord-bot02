module.exports = {
  name: "say",
  async execute(message, args) { // ✅ async added
    if (!args.length) {
      return message.reply("Say what?");
    }

    const bannedPatterns = [
      /rinki/i,
      /gay/i,
      /hao/i,
      /kuman/i,
      /homo/i,
      /lesbian/i,
      /lesbi/i,
      /yuri/i,
      /bodoh/i,
      /goblok/i,
      /fuck/i,
      /asw/i,
      /asu/i,
      /inkir/i,
      /kirin/i,
      /loli/i,
      /lonte/i, // ✅ fixed
      /fck/i,
      /discord\.gg/i,
      /http(s)?:\/\//i
    ];

    const content = args.join(" ");

    // 🚫 Filter check
    for (const pattern of bannedPatterns) {
      if (pattern.test(content)) {
        return message.reply("❌ Message contains banned content.");
      }
    }

    // 🗑 Delete safely
    try {
      if (message.guild.members.me.permissions.has("ManageMessages")) {
        await message.delete();
      }
    } catch (err) {
      console.log("Delete failed:", err.message);
    }

    // 📤 Send safely
    try {
      await message.channel.send(content);
    } catch (err) {
      console.log("Send failed:", err.message);
      message.reply("❌ I couldn't send the message.");
    }
  }
};
