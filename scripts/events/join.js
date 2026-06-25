const axios = require("axios");
const fs = require("fs-extra");

module.exports.config = {
  name: "join",
  eventType: ["log:subscribe"],
  version: "3.0.0",
  credits: "Imran",
  description: "Next-Level Gothic Anime Cute Welcome System 🌸",
  dependencies: {
    "fs-extra": ""
  }
};

// helper to get ordinal suffix (1st, 2nd, 3rd, etc.)
function ordinalSuffix(i) {
  const j = i % 10,
    k = i % 100;
  if (j === 1 && k !== 11) return `${i}st`;
  if (j === 2 && k !== 12) return `${i}nd`;
  if (j === 3 && k !== 13) return `${i}rd`;
  return `${i}th`;
}

module.exports.run = async function({ api, event, Threads }) {
  const { threadID } = event;
  const threadData = (await Threads.getData(threadID)).data || {};
  const checkban = threadData.banOut;
  if (Array.isArray(checkban) && checkban.length > 0) return;
  
  const botID = api.getCurrentUserID();
  const botName = global.config.BOTNAME || "𝓝𝓲𝓴𝓪 𝓑𝓸𝓽";
  const prefix = global.config.PREFIX || "!";
  
  // 🌟 BOT JOIN
  if (event.logMessageData.addedParticipants.some(p => p.userFbId == botID)) {
    const BOT_GIF = "https://raw.githubusercontent.com/MR-IMRAN-60/JSON-STORE/main/imbot.gif";
    try {
      await api.changeNickname(` ${botName} `, threadID, botID);
      
      const botMessage = `
❏━━━━━━━━━━━━━━━━━━━━━━━━━❏
      🖤 𝗕𝗢𝗧 𝗖𝗢𝗡𝗡𝗘𝗖𝗧𝗘𝗗 🖤


✅ 𝗔𝗣𝗣𝗥𝗢𝗩𝗔𝗟 𝗜𝗦 𝗥𝗘𝗤𝗨𝗜𝗥𝗘𝗗 𝗙𝗢𝗥 𝗚𝗥𝗢𝗨𝗣
📚 𝗛𝗘𝗟𝗣: ${prefix}help
📜 𝗖𝗢𝗠𝗠𝗔𝗡𝗗𝗦: ${prefix}command

❏━━━━━━━━━━━━━━━━━━━━━━━━━❏
☆ 𝗘𝘅𝗮𝗺𝗽𝗹𝗲𝘀 ☆
${prefix}info — information
${prefix}ediimg — image edit
${prefix}song — music
${prefix}random — video
❏━━━━━━━━━━━━━━━━━━━━━━━━━❏

🚨 𝗖𝗢𝗡𝗧𝗔𝗖𝗧 𝗗𝗘𝗩𝗘𝗟𝗢𝗣𝗘𝗥 🚨
👤 𝓓𝓮𝓿𝓮𝓵𝓸𝓹𝓮𝓻: 𝓘𝓶𝓻𝓪𝓷 𝓐𝓱𝓶𝓮𝓭
📘 𝐅𝐚𝐜𝐞𝐛𝐨𝐨𝐤: https://www.facebook.com/Imran.Ahmed099
💬 𝖂𝗵𝗮𝘁𝘀𝗔𝗽𝗽: wa.me/+8801689903267
✉️ 𝑬𝒎𝒂𝒊𝒍: massangerbot2@gmail.com
❏━━━━━━━━━━━━━━━━━━━━━━━━━❏
`;
      
      const gifResp = await axios.get(BOT_GIF, { responseType: "stream" });
      await api.sendMessage({ body: botMessage, attachment: gifResp.data }, threadID);
    } catch (e) {
      console.error("❌ Bot welcome failed:", e);
    }
    
  } else {
    // 💠 USER JOIN
    try {
      const threadInfo = await api.getThreadInfo(threadID);
      const threadName = threadInfo.threadName || "this group";
      const participantIDs = Array.isArray(threadInfo.participantIDs) ? threadInfo.participantIDs : [];
      const addedUsers = Array.isArray(event.logMessageData.addedParticipants) ?
        event.logMessageData.addedParticipants :
        [];
      
      if (addedUsers.length === 0) return; // nothing to do
      
      const mentions = [];
      const names = [];
      
      for (const user of addedUsers) {
        if (!user.userFbId || !user.fullName) continue;
        mentions.push({ tag: user.fullName, id: user.userFbId });
        names.push(user.fullName);
      }
      
      const memCount = participantIDs.length + addedUsers.length; // approximate new count
      const nameList = names.join(", ");
      
      // allow custom template, else use default styled with ❏
      let msgTemplate = threadData.customJoin || `
❏━━━━━━━━━━━━━━━━━━━━━❏
    🌸 𝗪𝗘𝗟𝗖𝗢𝗠𝗘 🌸

Hey 𝗗𝗲𝗮𝗿 {name} ✨  
You are the ${ordinalSuffix(memCount)} member of 『 ${threadName} 』

───────────────
▶ 𝗪𝗵𝗮𝘁'𝘀 𝗻𝗲𝘅𝘁?
• Type ⌈ ${prefix}help ⌋ to explore commands  
• Stay active = 🎁 bonus stickers (🤫)
───────────────

🪄 𝗤𝘂𝗶𝗰𝗸 𝗜𝗻𝗳𝗼:
• 𝗣𝗿𝗲𝗳𝗶𝘅: ⌈ ${prefix} ⌋  
• 𝗗𝗲𝘃: Imran Ahmed  
• 𝗠𝗼𝗼𝗱: Community vibes only ✨

💡 𝗧𝗶𝗽:  
Active members = 💌 bonus stickers!  
❏━━━━━━━━━━━━━━━━━━━━━❏
`;
      
      // replace placeholders
      let msg = msgTemplate
        .replace(/\{name}/g, nameList || "there")
        .replace(/\{threadName}/g, threadName)
        .replace(/\{soThanhVien}/g, memCount);
      
      // build external welcome image API URL safely
      // NOTE: encode components; adjust API expectations if needed
      const userParam = encodeURIComponent(nameList);
      const uidParam = addedUsers.map(u => u.userFbId).join(",");
      
      // fetch the gif/image
      let attachment = null;
      try {
        const apiu = "https://raw.githubusercontent.com/MR-IMRAN-60/ImranBypass/refs/heads/main/imran.json";
  const config = await axios.get(apiu);
  const res = config.data.wlc;
  const welcomeApiUrl = `${res}/api/welcome?uid=${uidParam}&user_name=${userParam}&count=${memCount}&theme=dark`;
        const gifResp = await axios.get(welcomeApiUrl, { responseType: "stream", timeout: 8000 });
        attachment = gifResp.data;
      } catch (fetchErr) {
        console.warn("⚠️ Failed to fetch welcome image, proceeding without it.", fetchErr.message);
      }
      
      const sendObj = {
        body: msg,
        mentions
      };
      if (attachment) sendObj.attachment = attachment;
      
      await api.sendMessage(sendObj, threadID);
    } catch (e) {
      console.error("❌ User welcome failed:", e);
    }
  }
};
