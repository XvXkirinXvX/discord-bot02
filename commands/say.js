module.exports = {
  name: "say",
  execute(message, args) {
    if (!args.length) return message.reply("Say what?");

    const bannedPatterns = [
  /rinki/,
  /gay/,
  /hao/,
  /kuman/,
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
  /discord.gg/i,
  /http(s)?:\/\//i
    ];

    const content = args.join(" ");

    for (const pattern of bannedPatterns) {
      if (pattern.test(content)) {
        return message.reply("❌ Message contains banned content.");
      }
    }

    message.delete(); // optional
    message.channel.send(content);
  }
};
