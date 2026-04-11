let autoMessageInterval = null;

function startAutoMessage(client, channelId) {
  if (autoMessageInterval) return false;

  console.log("Autosend STARTED");

  autoMessageInterval = setInterval(async () => {
    console.log("Interval running...");

    try {
      const channel = await client.channels.fetch(channelId);
      
      if (!channel) {
        console.log("Channel not found");
        return;
      }

      console.log("Sending message...");
      await channel.send("yes");

    } catch (err) {
      console.error("Auto message error:", err);
    }
  }, 60 * 60 * 1000); // 10 seconds test

  return true;
}

function stopAutoMessage() {
  if (!autoMessageInterval) return false;

  clearInterval(autoMessageInterval);
  autoMessageInterval = null;

  console.log("Autosend STOPPED");

  return true;
}

module.exports = {
  startAutoMessage,
  stopAutoMessage
};
