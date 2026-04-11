const { joinVoiceChannel } = require('@discordjs/voice');

module.exports = {
  name: "join",
  execute(message, args, client) {
    const channel = message.member.voice.channel;
    if (!channel) return message.reply("Join a VC first!");

    joinVoiceChannel({
      channelId: channel.id,
      guildId: channel.guild.id,
      adapterCreator: channel.guild.voiceAdapterCreator,
    });

    message.reply("Joined your VC!");
  }
};