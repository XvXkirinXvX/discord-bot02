```js
module.exports = {
  name: "afk",

  async execute(message, args, client, { afkUsers }) {
    const reason = args.join(" ") || "AFK";
    const member = message.member;

    // Save AFK status
    afkUsers.set(message.author.id, {
      reason,
      time: Date.now()
    });

    // Try to add [AFK] to nickname
    try {
      // Check whether the bot can manage this member
      if (!member.manageable) {
        console.log(
          `[AFK] Cannot change nickname for ${message.author.tag}. ` +
          `Bot role may be below the user's highest role.`
        );
      } else {
        const currentNick = member.nickname || member.user.username;

        // Don't add [AFK] if it's already there
        if (!/\[afk\]/i.test(currentNick)) {
          let newNick = `[AFK] ${currentNick}`;

          // Discord nickname limit = 32 characters
          if (newNick.length > 32) {
            newNick = newNick.slice(0, 32);
          }

          await member.setNickname(newNick);

          console.log(
            `[AFK] Changed ${message.author.tag}'s nickname to "${newNick}"`
          );
        } else {
          console.log(
            `[AFK] ${message.author.tag} already has [AFK] in their nickname.`
          );
        }
      }
    } catch (err) {
      console.error(
        `[AFK] Failed to change nickname for ${message.author.tag}:`,
        err
      );
    }

    // Confirm AFK
    try {
      await message.reply(`😴 You are now AFK: ${reason}`);
    } catch (err) {
      console.error("[AFK] Failed to send reply:", err);
    }
  }
};
```
