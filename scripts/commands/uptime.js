const moment = require("moment-timezone");
const axios = require("axios");
const pidusage = require("pidusage");
const { performance } = require("perf_hooks");

moment.tz.setDefault("Asia/Dhaka");

module.exports.config = {
  name: "uptime",
  version: "2.0.0",
  permission: 0,
  credits: "IMRAN",
  description: "Shows bot uptime and status with GIF",
  prefix: true,
  category: "info",
  usages: "",
  cooldowns: 5
};

// GIF/image URLs for uptime
const UPTIME_GIFS = [
  "https://media.giphy.com/media/26FxsQwgJyU4me9ig/giphy.gif",
  "https://media.giphy.com/media/3ohzdIuqJoo8QdKlnW/giphy.gif",
  "https://media.giphy.com/media/l0HlBO7eyXzSZkJri/giphy.gif"
];

function getRandomGif() {
  return UPTIME_GIFS[Math.floor(Math.random() * UPTIME_GIFS.length)];
}

module.exports.run = async ({ api, event }) => {
  try {
    const timeStart = performance.now();

    const currentTime = moment().format("h:mm:ss A");
    const currentDate = moment().format("DD/MM/YYYY");

    const uptimeInSeconds = process.uptime();
    const hours = Math.floor(uptimeInSeconds / 3600);
    const minutes = Math.floor((uptimeInSeconds % 3600) / 60);
    const seconds = Math.floor(uptimeInSeconds % 60);
    const formattedUptime = `${hours}h ${minutes}m ${seconds}s`;

    const timeEnd = performance.now();
    const ping = Math.round(timeEnd - timeStart);

    let memUsage = '';
    try {
      const usage = await pidusage(process.pid);
      memUsage = `${(usage.memory / 1024 / 1024).toFixed(1)} MB`;
    } catch(e) { memUsage = 'N/A'; }

    const bodyText = `🔁 𝗥𝗘𝗩𝗘𝗥𝗦𝗘 𝗕𝗢𝗧 𝗦𝗧𝗔𝗧𝗨𝗦 🔁
━━━━━━━━━━━━━━━━━━
🕒 ᴜᴘᴛɪᴍᴇ  : ${formattedUptime}
📶 ᴘɪɴɢ    : ${ping}ms
⏰ ᴛɪᴍᴇ    : ${currentTime}
📅 ᴅᴀᴛᴇ    : ${currentDate}
💾 ᴍᴇᴍᴏʀʏ  : ${memUsage}
👑 ʙᴏᴛ     : ${global.config.BOTNAME || 'reverse bot'}
━━━━━━━━━━━━━━━━━━`;

    const messagePayload = { body: bodyText };

    // Try custom image API first
    try {
      const response = await axios.get("https://uptime-imran.onrender.com/up", {
        responseType: "stream",
        params: { uptime: formattedUptime, ping: `${ping}ms`, time: currentTime, date: currentDate, owner: "IMRAN" },
        timeout: 8000,
      });
      if (response && response.data) {
        messagePayload.attachment = response.data;
      }
    } catch (err) {
      // Try GIF fallback
      try {
        const gifUrl = getRandomGif();
        const gifRes = await axios.get(gifUrl, { responseType: 'stream', timeout: 8000 });
        if (gifRes && gifRes.data) {
          messagePayload.attachment = gifRes.data;
        }
      } catch(e2) {
        // text only fallback
      }
    }

    return api.sendMessage(messagePayload, event.threadID, event.messageID);
  } catch (error) {
    console.error("uptime command error:", error);
    return api.sendMessage("❌ Failed to get bot status.", event.threadID, event.messageID);
  }
};
