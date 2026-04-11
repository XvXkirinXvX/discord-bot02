// 🔧 Normalize text (anti bypass)
function normalize(text) {
  return text
    .toLowerCase()
    .replace(/[@4]/g, "a")
    .replace(/3/g, "e")
    .replace(/1/g, "i")
    .replace(/0/g, "o")
    .replace(/[^a-z0-9]/g, "");
}

// 🚫 Regex patterns
const bannedPatterns = [
  /rinki/,
  /hao/,
  /kuman/,
  /gay/,
  /homo/,
  /lesbian/,
  /lesbi/,
  /yuri/,
  /bodoh/,
  /goblok/,
  /fuck/,
  /asw/,
  /asu/,
  /inkir/,
  /kirin/,
  /loli/,
  /lonte/,
  /lont*/,
  /fck/,
  /discord\.gg/i,
  /https?:\/\//i
];

module.exports = {
  name: "say",
  async execute(message, args) {
    if (!args.length) {
      return message.reply("Say what?");
    }

    const originalText = args.join(" ");
    const normalizedText = normalize(originalText);

    // 🚫 Check banned content
    for (const pattern of bannedPatterns) {
      if (
        pattern.test(originalText) ||
        pattern.test(normalizedText)
      ) {
       return message.reply("🚫 Blocked...");
      }
    }

    // 🧹 Delete the command message
    try {
      await message.delete();
    } catch (err) {
      console.log("Couldn't delete message (missing permission?)");
    }

    // ✅ Send clean message
    message.channel.send(originalText);
  }
};
