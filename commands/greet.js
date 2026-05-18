module.exports = {
  name: "greet",

  async execute(message, args, client, {
    getVCGreeting,
    setVCGreeting
  }) {

    const option = args[0]?.toLowerCase();

    if (!option || !["on", "off"].includes(option)) {
      return message.reply(
        `Usage: vcgreet <on/off>\nCurrent: ${getVCGreeting() ? "ON" : "OFF"}`
      );
    }

    const enabled = option === "on";

    setVCGreeting(enabled);

    await message.reply(
      `🎤 VC greetings ${enabled ? "ENABLED" : "DISABLED"}`
    );
  }
};
