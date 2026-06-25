console.clear();
const { spawn } = require("child_process");
const express = require("express");
const fs = require("fs");
const path = require("path");
const app = express();
const chalk = require('chalk');
const logger = require("./IMRANC.js");

const PORT = process.env.PORT || 5000;
const CONFIG_PATH = path.join(process.cwd(), 'Config.json');
const APPSTATE_PATH = path.join(process.cwd(), 'appstate.json');

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'website')));

let botProcess = null;
let botOnline = false;
let botStartTime = Date.now();

function readConfig() {
  try { return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8')); }
  catch(e) { return {}; }
}
function writeConfig(data) {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(data, null, 2), 'utf8');
}

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'website', 'index.html'));
});

app.get('/api/status', (req, res) => {
  const uptimeSec = Math.floor((Date.now() - botStartTime) / 1000);
  const h = Math.floor(uptimeSec / 3600);
  const m = Math.floor((uptimeSec % 3600) / 60);
  const s = uptimeSec % 60;
  res.json({
    online: botOnline,
    uptime: `${h}h ${m}m ${s}s`,
    pid: botProcess ? botProcess.pid : null,
    botname: readConfig().BOTNAME || 'reverse bot'
  });
});

app.post('/api/appstate', (req, res) => {
  try {
    const { appstate } = req.body;
    if (!appstate) return res.status(400).json({ success: false, message: 'No appstate provided' });
    const parsed = typeof appstate === 'string' ? JSON.parse(appstate) : appstate;
    if (!Array.isArray(parsed)) return res.status(400).json({ success: false, message: 'Invalid appstate format (must be JSON array)' });
    fs.writeFileSync(APPSTATE_PATH, JSON.stringify(parsed, null, 2), 'utf8');
    res.json({ success: true, message: 'Appstate updated! Restart the bot for changes to take effect.' });
  } catch(e) {
    res.status(400).json({ success: false, message: 'Invalid JSON: ' + e.message });
  }
});

app.get('/api/appstate', (req, res) => {
  try {
    const data = fs.readFileSync(APPSTATE_PATH, 'utf8');
    const parsed = JSON.parse(data);
    res.json({ success: true, hasAppstate: Array.isArray(parsed) && parsed.length > 0 });
  } catch(e) {
    res.json({ success: false, hasAppstate: false });
  }
});

app.get('/api/config', (req, res) => {
  try { res.json(readConfig()); }
  catch(e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/config', (req, res) => {
  try {
    const current = readConfig();
    const allowed = ['PREFIX', 'BOTNAME', 'adminOnly', 'approval', 'premium', 'developermode', 'language'];
    const updated = { ...current };
    for (const key of allowed) {
      if (req.body.hasOwnProperty(key)) updated[key] = req.body[key];
    }
    writeConfig(updated);
    res.json({ success: true });
  } catch(e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

app.get('/api/admins', (req, res) => {
  try {
    const config = readConfig();
    res.json({ admins: config.ADMINBOT || [], operators: config.OPERATOR || [], owner: config.OWNER || [] });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/admin/add', (req, res) => {
  try {
    const { uid } = req.body;
    if (!uid || isNaN(uid)) return res.status(400).json({ success: false, message: 'Valid UID required' });
    const config = readConfig();
    if (!config.ADMINBOT) config.ADMINBOT = [];
    if (!config.ADMINBOT.includes(String(uid))) {
      config.ADMINBOT.push(String(uid));
      writeConfig(config);
    }
    res.json({ success: true, admins: config.ADMINBOT });
  } catch(e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

app.post('/api/admin/remove', (req, res) => {
  try {
    const { uid } = req.body;
    if (!uid) return res.status(400).json({ success: false, message: 'UID required' });
    const config = readConfig();
    config.ADMINBOT = (config.ADMINBOT || []).filter(id => id !== String(uid));
    writeConfig(config);
    res.json({ success: true, admins: config.ADMINBOT });
  } catch(e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

app.get('/api/commands', (req, res) => {
  try {
    const config = readConfig();
    const cmdsDir = path.join(process.cwd(), 'scripts', 'commands');
    const files = fs.readdirSync(cmdsDir).filter(f => f.endsWith('.js'));
    const commands = files.map(f => {
      try {
        const mod = require(path.join(cmdsDir, f));
        return {
          name: mod.config ? mod.config.name : f.replace('.js',''),
          category: mod.config ? mod.config.category : 'unknown',
          description: mod.config ? mod.config.description : '',
          enabled: !(config.disabledcmds || []).includes(mod.config ? mod.config.name : f.replace('.js',''))
        };
      } catch(e) { return null; }
    }).filter(Boolean);
    res.json({ commands });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/commands/toggle', (req, res) => {
  try {
    const { command, enabled } = req.body;
    if (!command) return res.status(400).json({ success: false, message: 'Command name required' });
    const config = readConfig();
    if (!config.disabledcmds) config.disabledcmds = [];
    if (enabled) {
      config.disabledcmds = config.disabledcmds.filter(c => c !== command);
    } else {
      if (!config.disabledcmds.includes(command)) config.disabledcmds.push(command);
    }
    writeConfig(config);
    res.json({ success: true, disabledcmds: config.disabledcmds });
  } catch(e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

app.post('/api/restart', (req, res) => {
  try {
    res.json({ success: true, message: 'Restarting bot...' });
    botOnline = false;
    if (botProcess) {
      botProcess.kill('SIGTERM');
      botProcess = null;
    }
    setTimeout(() => startChild(), 2000);
  } catch(e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

function startChild() {
  logger.loader(`Starting bot process...`);
  botProcess = spawn("node", ["--trace-warnings", "--async-stack-traces", "IMRANB.js"], {
    cwd: __dirname,
    stdio: "inherit",
    shell: true
  });
  botOnline = true;
  botStartTime = Date.now();

  botProcess.on("close", (codeExit) => {
    botOnline = false;
    if (codeExit !== 0) {
      logger.warn(`Bot process exited with code ${codeExit}, restarting in 5s...`);
      setTimeout(() => startChild(), 5000);
    }
  });

  botProcess.on("error", (error) => {
    botOnline = false;
    logger("an error occurred: " + JSON.stringify(error), "error");
  });
}

function startBot() {
  console.log(chalk.blue('DEPLOYING REVERSE BOT SYSTEM'));
  logger.loader(`deploying dashboard on port ${chalk.blueBright(PORT)}`);
  app.listen(PORT, '0.0.0.0', () => {
    logger.loader(`Dashboard live at port ${chalk.blueBright(PORT)}`);
  });
  startChild();
}

startBot();
