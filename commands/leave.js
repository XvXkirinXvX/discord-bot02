const { getVoiceConnection } = require('@discordjs/voice');

module.exports = {
  name: "leave",
  execute(message, args, client) {
    const connection = getVoiceConnection(message.guild.id);
    if (!connection) return message.reply("Not in VC!");

    connection.destroy();
    message.reply("Left VC!");
  }
};