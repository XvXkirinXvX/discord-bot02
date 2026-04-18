module.exports = {
  name: "afk",
  execute(message, args, client, { afkUsers }) {
    const reason = args.join(" ") || "AFK";

    afkUsers.set(message.author.id, {
      reason,
      time: Date.now()
    });

    message.reply(`😴 You are now AFK: ${reason}`);
  }
};
