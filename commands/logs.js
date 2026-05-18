const fs = require('fs');
const path = require('path');
const { AttachmentBuilder, PermissionsBitField } = require('discord.js');

module.exports = {
  name: "logs",

  async execute(message) {

    // 🔒 Permission check
    if (
      !message.guild.members.me.permissions.has(
        PermissionsBitField.Flags.AttachFiles
      )
    ) {
      return message.reply(
        "❌ I need Attach Files permission."
      );
    }

    // 🧹 Safe filename
    const channelName = message.channel.name
      .replace(/[^a-z0-9-_]/gi, '_')
      .toLowerCase()
      .slice(0, 100);

    const filePath = path.join(
      __dirname,
      '..',
      'logs',
      `${channelName}.log`
    );

    // 📄 File exists?
    if (!fs.existsSync(filePath)) {
      return message.reply(
        "❌ No logs found for this channel."
      );
    }

    try {

      // 📏 File size check (8MB)
      const stats = fs.statSync(filePath);

      if (stats.size > 8 * 1024 * 1024) {
        return message.reply(
          "❌ Log file is too large to upload."
        );
      }

      const attachment = new AttachmentBuilder(filePath);

      await message.reply({
        content: `📄 Logs for #${message.channel.name}`,
        files: [attachment]
      });

    } catch (err) {
      console.error("Logs command error:", err);

      return message.reply(
        "❌ Failed to upload logs."
      );
    }
  }
};
