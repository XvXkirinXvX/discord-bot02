const fs = require('fs');
const path = require('path');
const { AttachmentBuilder } = require('discord.js');

module.exports = {
  name: "logs",

  async execute(message) {
    const channelName = message.channel.name
      .replace(/[^a-z0-9-_]/gi, '_')
      .toLowerCase();

    const filePath = path.join(
      __dirname,
      '..',
      'logs',
      `${channelName}.log`
    );

    if (!fs.existsSync(filePath)) {
      return message.reply("❌ No logs found for this channel.");
    }

    try {
      const attachment = new AttachmentBuilder(filePath);

      await message.reply({
        content: `📄 Logs for #${message.channel.name}`,
        files: [attachment]
      });

    } catch (err) {
      console.error(err);
      message.reply("❌ Failed to upload logs.");
    }
  }
};
