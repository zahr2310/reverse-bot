const axios = require("axios");

module.exports.config = {
  name: "help",
  version: "2.0.0",
  permission: 0,
  credits: "IMRAN",
  description: "Bot command guide with image",
  prefix: true,
  premium: false,
  category: "guide",
  usages: "[page] or [command]",
  cooldowns: 5,
  envConfig: {
    autoUnsend: true,
    delayUnsend: 60
  }
};

module.exports.languages = {
  en: {
    moduleInfo:
      `⚡️ 𝗖𝗢𝗠𝗠𝗔𝗡𝗗 𝗜𝗡𝗙𝗢 ⚡️
━━━━━━━━━━━━━━━━━━
🗡️ 𝗡𝗮𝗺𝗲 » %1
📝 𝗗𝗲𝘀𝗰 » %2
🧩 𝗨𝘀𝗮𝗴𝗲 » ${global.config.PREFIX}%3
📦 𝗖𝗮𝘁𝗲𝗴𝗼𝗿𝘆 » %4
⏱️ 𝗖𝗼𝗼𝗹𝗱𝗼𝘄𝗻 » %5s
🔒 𝗣𝗲𝗿𝗺𝗶𝘀𝘀𝗶𝗼𝗻 » %6
✨ 𝗖𝗿𝗲𝗱𝗶𝘁𝘀 » %7`,
    helpList: `🗡️ ${global.config.BOTNAME} 𝗖𝗢𝗠𝗠𝗔𝗡𝗗 𝗦𝗬𝗦𝗧𝗘𝗠 🗡️\n\n𝗧𝗼𝘁𝗮𝗹 𝗰𝗼𝗺𝗺𝗮𝗻𝗱𝘀 » %1\n𝗖𝗮𝘁𝗲𝗴𝗼𝗿𝗶𝗲𝘀 » %2\n\n𝗧𝘆𝗽𝗲 ${global.config.PREFIX}𝗵𝗲𝗹𝗽 𝗽𝗮𝗴𝗲𝗡𝘂𝗺 𝘁𝗼 𝘃𝗶𝗲𝘄 𝗰𝗼𝗺𝗺𝗮𝗻𝗱𝘀`,
    user: "👤 User",
    adminGroup: "👑 Group Admin",
    adminBot: "🤖 Bot Admin",
  },
};

// GIF URLs for help command
const HELP_GIFS = [
  "https://media.giphy.com/media/3o7TKSjRrfIPjeiVyM/giphy.gif",
  "https://media.giphy.com/media/l0HlFZfztqZGN5tm4/giphy.gif",
  "https://media.giphy.com/media/xT1XGwU5GZKpGABQwg/giphy.gif"
];

function getRandomGif() {
  return HELP_GIFS[Math.floor(Math.random() * HELP_GIFS.length)];
}

module.exports.handleEvent = function ({ api, event, getText }) {
  const { commands } = global.client;
  const { threadID, messageID, body } = event;

  if (!body || body.toLowerCase().indexOf("help") !== 0) return;
  const input = body.toLowerCase().split(" ");
  if (input.length < 2) return;

  const commandName = input[1];
  if (!commands.has(commandName)) return;

  const command = commands.get(commandName);
  return api.sendMessage(
    getText(
      "moduleInfo",
      command.config.name,
      command.config.description,
      `${command.config.name} ${command.config.usages || ""}`.trim(),
      command.config.category,
      command.config.cooldowns,
      command.config.permission === 0
        ? getText("user")
        : command.config.permission === 1
        ? getText("adminGroup")
        : getText("adminBot"),
      command.config.credits
    ),
    threadID,
    messageID
  );
};

module.exports.run = async function ({ api, event, args, getText }) {
  const { commands } = global.client;
  const { threadID, messageID } = event;
  const { autoUnsend, delayUnsend } = this.config.envConfig;

  // ── Single command info ──
  if (args[0] && isNaN(args[0])) {
    const command = commands.get(args[0].toLowerCase());
    if (command) {
      const info = getText(
        "moduleInfo",
        command.config.name,
        command.config.description,
        `${command.config.name} ${command.config.usages || ""}`.trim(),
        command.config.category,
        command.config.cooldowns,
        command.config.permission === 0
          ? getText("user")
          : command.config.permission === 1
          ? getText("adminGroup")
          : getText("adminBot"),
        command.config.credits
      );
      const sentMsg = await api.sendMessage(info, threadID);
      if (autoUnsend) setTimeout(() => api.unsendMessage(sentMsg.messageID), delayUnsend * 1000);
      return;
    }
  }

  // ── Command list with GIF ──
  const commandList = Array.from(commands.values());
  const categories = [...new Set(commandList.map(cmd => cmd.config.category.toLowerCase()))];
  const itemsPerPage = 6;
  const totalPages = Math.ceil(categories.length / itemsPerPage);
  let currentPage = parseInt(args[0]) || 1;
  if (currentPage < 1) currentPage = 1;
  if (currentPage > totalPages) currentPage = totalPages;

  const startIdx = (currentPage - 1) * itemsPerPage;
  const endIdx = Math.min(startIdx + itemsPerPage, categories.length);
  const visibleCategories = categories.slice(startIdx, endIdx);

  let msg = `\n🔁 𝗥𝗘𝗩𝗘𝗥𝗦𝗘 𝗕𝗢𝗧 𝗖𝗢𝗠𝗠𝗔𝗡𝗗𝗦 🔁\n`;
  msg += `✧･ﾟ: *✧･ﾟ:* ༻ ༺ *:･ﾟ✧*:･ﾟ✧\n\n`;

  for (const category of visibleCategories) {
    const categoryName = category.charAt(0).toUpperCase() + category.slice(1);
    const cmds = commandList
      .filter(cmd => cmd.config.category.toLowerCase() === category)
      .map(cmd => cmd.config.name);
    msg += `⦿ ━━━━『 ${categoryName} 』━━━━ ⦿\n`;
    msg += `│  ${cmds.join(', ')}\n`;
    msg += `✧･ﾟ: *✧･ﾟ:* *:･ﾟ✧*:･ﾟ✧\n\n`;
  }

  msg += `📄 𝗣𝗮𝗴𝗲 ${currentPage}/${totalPages}\n`;
  msg += `🔰 𝗧𝗶𝗽: 𝗧𝘆𝗽𝗲 ${global.config.PREFIX}𝗵𝗲𝗹𝗽 𝗰𝗼𝗺𝗺𝗮𝗻𝗱𝗡𝗮𝗺𝗲\n`;
  msg += getText("helpList", commands.size, categories.length);

  const messagePayload = { body: msg };

  // Try to attach a GIF
  try {
    const gifUrl = getRandomGif();
    const response = await axios.get(gifUrl, { responseType: 'stream', timeout: 8000 });
    if (response && response.data) {
      messagePayload.attachment = response.data;
    }
  } catch (err) {
    // GIF fetch failed, send text only
  }

  const sentMsg = await api.sendMessage(messagePayload, threadID);
  if (autoUnsend) {
    setTimeout(() => api.unsendMessage(sentMsg.messageID), delayUnsend * 1000);
  }
};
