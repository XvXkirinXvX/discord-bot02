module.exports = {
  name: "rejoin",
  execute(message, args, client, { connectVC }) {
    message.reply("Rejoining VC...");

    setTimeout(() => {
      connectVC(client);
    }, 1000);
  }
};
