module.exports = {
  name: "autosend",
  execute(message, args, client, { startAutoMessage, stopAutoMessage }) {

    if (!args.length) {
      return message.reply("Usage: !autosend on/off");
    }

    const action = args[0].toLowerCase();

    if (action === "on") {
      const started = startAutoMessage(client, message.channel.id);
      return message.reply(started ? "✅ Started." : "Already running.");
    }

    if (action === "off") {
      const stopped = stopAutoMessage();
      return message.reply(stopped ? "🛑 Stopped." : "Not running.");
    }

    message.reply("Usage: !autosend on/off");
  }
};
