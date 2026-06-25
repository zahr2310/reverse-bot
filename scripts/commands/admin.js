module.exports.config = {
  name: "admin",
  version: "2.1.0",
  permission: 0,
  credits: "ryuko",
  description: "control admin lists",
  prefix: false,
  premium: false,
  category: "admin",
  usages: "admin [add/remove/list] [uid]",
  cooldowns: 5,
};

module.exports.languages = {
  "en": {
    "listAdmin": 'admin list: \n\n%1',
    "notHavePermssion": 'you have no permission to use "%1"',
    "addedNewAdmin": 'added %1 Admin :\n\n%2',
    "removedAdmin": 'remove %1 Admin:\n\n%2'
  }
};

module.exports.run = async function ({ api, event, args, Users, permssion, getText }) {
  const content = args.slice(1, args.length);
  const { threadID, messageID, mentions } = event;
  const { configPath } = global.client;
  const { ADMINBOT } = global.config;
  const { writeFileSync } = global.nodemodule["fs-extra"];
  const mention = Object.keys(mentions);

  delete require.cache[require.resolve(configPath)];
  var config = require(configPath);

  switch (args[0]) {
    case "list":
    case "all":
    case "-a": {
      const listAdmin = ADMINBOT || config.ADMINBOT || [];
      var msg = [];
      for (const idAdmin of listAdmin) {
        if (parseInt(idAdmin)) {
          let name;
          try { name = await Users.getNameUser(idAdmin); } catch(e) { name = idAdmin; }
          msg.push(`\nname : ${name}\nid : ${idAdmin}`);
        }
      }
      return api.sendMessage(`🔁 Reverse Bot Admins:\n${msg.join('\n') || 'None'}`, threadID, messageID);
    }

    case "add": {
      // Allow bot admins (permssion >= 2) or operators (permssion >= 3) to add admins
      if (permssion < 2) return api.sendMessage(getText("notHavePermssion", "add"), threadID, messageID);

      if (mention.length !== 0 && isNaN(content[0])) {
        var listAdd = [];
        for (const id of mention) {
          if (!ADMINBOT.includes(id)) ADMINBOT.push(id);
          if (!config.ADMINBOT.includes(id)) config.ADMINBOT.push(id);
          listAdd.push(`${id} - ${event.mentions[id]}`);
        }
        writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
        return api.sendMessage(getText("addedNewAdmin", mention.length, listAdd.join("\n").replace(/\@/g, "")), threadID, messageID);
      }
      else if (content.length !== 0 && !isNaN(content[0])) {
        const uid = String(content[0]);
        if (!ADMINBOT.includes(uid)) ADMINBOT.push(uid);
        if (!config.ADMINBOT.includes(uid)) config.ADMINBOT.push(uid);
        let name;
        try { name = await Users.getNameUser(uid); } catch(e) { name = uid; }
        writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
        return api.sendMessage(getText("addedNewAdmin", 1, `name : ${name}\nuid : ${uid}`), threadID, messageID);
      }
      else return global.utils.throwError(this.config.name, threadID, messageID);
    }

    case "remove":
    case "rm":
    case "delete": {
      // Allow bot admins (permssion >= 2) to remove admins (but not operators/owner)
      if (permssion < 2) return api.sendMessage(getText("notHavePermssion", "delete"), threadID, messageID);

      if (mention.length !== 0 && isNaN(content[0])) {
        const mention = Object.keys(mentions);
        var listDel = [];
        for (const id of mention) {
          const idx = config.ADMINBOT.findIndex(item => item == id);
          if (idx !== -1) {
            ADMINBOT.splice(idx, 1);
            config.ADMINBOT.splice(idx, 1);
          }
          listDel.push(`${id} - ${event.mentions[id]}`);
        }
        writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
        return api.sendMessage(getText("removedAdmin", mention.length, listDel.join("\n").replace(/\@/g, "")), threadID, messageID);
      }
      else if (content.length !== 0 && !isNaN(content[0])) {
        const uid = String(content[0]);
        const index = config.ADMINBOT.findIndex(item => item.toString() == uid);
        if (index !== -1) {
          ADMINBOT.splice(index, 1);
          config.ADMINBOT.splice(index, 1);
        }
        let name;
        try { name = await Users.getNameUser(uid); } catch(e) { name = uid; }
        writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
        return api.sendMessage(getText("removedAdmin", 1, `name : ${name}\nuid : ${uid}`), threadID, messageID);
      }
      else return global.utils.throwError(this.config.name, threadID, messageID);
    }

    default: {
      const listAdmin = ADMINBOT || [];
      return api.sendMessage(`🔁 Reverse Bot - Admin System\n\nUsage:\nadmin list - show all admins\nadmin add [uid/@mention] - add admin\nadmin remove [uid/@mention] - remove admin\n\nTotal admins: ${listAdmin.length}`, threadID, messageID);
    }
  }
};
