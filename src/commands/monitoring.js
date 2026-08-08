const si = require('systeminformation');
const { escapeHtml, formatBytes, formatUptime, progressBar } = require('../utils/format');

function isRealDisk(fs) {
  if (!fs || fs.size === 0) return false;
  const mount = fs.mount || '';
  const type = (fs.type || fs.fs || '').toLowerCase();

  const ignoredTypes = ['tmpfs', 'devtmpfs', 'devfs', 'squashfs', 'iso9660', 'shm', 'cgroup'];
  if (ignoredTypes.includes(type) && mount !== '/') return false;
  if (mount.startsWith('/proc') || mount.startsWith('/sys') || mount.startsWith('/run/user')) return false;

  return true;
}

async function getStatusText() {
  const [cpu, mem, disk, osInfo, time] = await Promise.all([
    si.currentLoad(),
    si.mem(),
    si.fsSize(),
    si.osInfo(),
    si.time(),
  ]);

  const cpuLoad = cpu.currentLoad.toFixed(1);
  const activeMem = mem.active || (mem.total - (mem.available || mem.free));
  const memTotal = mem.total;
  const memPercent = ((activeMem / memTotal) * 100).toFixed(1);
  const uptime = time.uptime;

  let text = `<b>📊 Сводка сервера</b>\n\n`;
  text += `<b>OS:</b> ${escapeHtml(osInfo.distro)} ${escapeHtml(osInfo.release)}\n`;
  text += `<b>Hostname:</b> ${escapeHtml(osInfo.hostname)}\n`;
  text += `<b>Uptime:</b> ${formatUptime(uptime)}\n\n`;

  text += `<b>🧠 CPU:</b> ${cpuLoad}%\n`;
  text += `${progressBar(parseFloat(cpuLoad))} ${cpuLoad}%\n\n`;

  text += `<b>💾 RAM (процессы):</b> ${formatBytes(activeMem)} / ${formatBytes(memTotal)}\n`;
  text += `${progressBar(parseFloat(memPercent))} ${memPercent}%\n\n`;

  text += `<b>💿 Диски:</b>\n`;
  const realDisks = disk.filter(isRealDisk);
  for (const fs of realDisks) {
    const usedPercent = fs.use.toFixed(1);
    text += `  <code>${escapeHtml(fs.mount)}</code> ${formatBytes(fs.used)} / ${formatBytes(fs.size)} (${usedPercent}%)\n`;
    text += `  ${progressBar(parseFloat(usedPercent))}\n`;
  }

  return text;
}

async function getCpuText() {
  const [cpu, cpuInfo, cpuTemp] = await Promise.all([
    si.currentLoad(),
    si.cpu(),
    si.cpuTemperature(),
  ]);

  let text = `<b>🧠 CPU</b>\n\n`;
  text += `<b>Модель:</b> ${escapeHtml(cpuInfo.manufacturer)} ${escapeHtml(cpuInfo.brand)}\n`;
  text += `<b>Ядра:</b> ${cpuInfo.physicalCores} физ. / ${cpuInfo.cores} лог.\n`;
  text += `<b>Частота:</b> ${cpuInfo.speed} GHz\n\n`;

  text += `<b>Загрузка:</b> ${cpu.currentLoad.toFixed(1)}%\n`;
  text += `${progressBar(cpu.currentLoad)}\n\n`;

  if (cpu.cpus && cpu.cpus.length > 0) {
    text += `<b>По ядрам:</b>\n`;
    cpu.cpus.forEach((core, i) => {
      text += `  Core ${i}: ${progressBar(core.load, 8)} ${core.load.toFixed(1)}%\n`;
    });
  }

  if (cpuTemp.main && cpuTemp.main > 0) {
    text += `\n<b>🌡 Температура:</b> ${cpuTemp.main}°C`;
  }

  return text;
}

async function getRamText() {
  const mem = await si.mem();

  const activeMem = mem.active || (mem.total - (mem.available || mem.free));
  const usedPercent = ((activeMem / mem.total) * 100).toFixed(1);
  const buffCache = (mem.buffers || 0) + (mem.cached || 0);
  const swapPercent = mem.swaptotal > 0 ? ((mem.swapused / mem.swaptotal) * 100).toFixed(1) : '0';

  let text = `<b>💾 RAM</b>\n\n`;
  text += `<b>Всего:</b> ${formatBytes(mem.total)}\n`;
  text += `<b>Занято (процессы):</b> ${formatBytes(activeMem)} (${usedPercent}%)\n`;
  text += `${progressBar(parseFloat(usedPercent))}\n`;
  if (buffCache > 0) {
    text += `<b>Буферы / Кэш:</b> ${formatBytes(buffCache)}\n`;
  }
  text += `<b>Доступно:</b> ${formatBytes(mem.available || mem.free)}\n`;
  text += `<b>Свободно:</b> ${formatBytes(mem.free)}\n\n`;

  text += `<b>Swap:</b> ${formatBytes(mem.swapused)} / ${formatBytes(mem.swaptotal)}`;
  if (mem.swaptotal > 0) {
    text += ` (${swapPercent}%)`;
  }

  return text;
}

async function getDiskText() {
  const disks = await si.fsSize();
  const realDisks = disks.filter(isRealDisk);

  let text = `<b>💿 Диски</b>\n\n`;
  for (const fs of realDisks) {
    const usedPercent = fs.use.toFixed(1);
    text += `<b>${escapeHtml(fs.fs)}</b>\n`;
    text += `  Mount: <code>${escapeHtml(fs.mount)}</code>\n`;
    text += `  Тип: ${escapeHtml(fs.type)}\n`;
    text += `  ${formatBytes(fs.used)} / ${formatBytes(fs.size)} (${usedPercent}%)\n`;
    text += `  ${progressBar(parseFloat(usedPercent))}\n\n`;
  }

  return text;
}

async function getNetworkText() {
  const [ifaces, stats] = await Promise.all([
    si.networkInterfaces(),
    si.networkStats(),
  ]);

  let text = `<b>🌐 Сеть</b>\n\n`;
  for (const iface of (Array.isArray(ifaces) ? ifaces : [ifaces])) {
    if (iface.internal) continue;
    text += `<b>${escapeHtml(iface.iface)}</b>\n`;
    if (iface.ip4) text += `  IPv4: <code>${escapeHtml(iface.ip4)}</code>\n`;
    if (iface.ip6) text += `  IPv6: <code>${escapeHtml(iface.ip6)}</code>\n`;
    text += `  MAC: <code>${escapeHtml(iface.mac)}</code>\n`;
    text += `  Состояние: ${iface.operstate}\n\n`;
  }

  for (const stat of stats) {
    if (stat.iface === 'lo') continue;
    text += `<b>${escapeHtml(stat.iface)} трафик:</b>\n`;
    text += `  ↓ RX: ${formatBytes(stat.rx_bytes)}\n`;
    text += `  ↑ TX: ${formatBytes(stat.tx_bytes)}\n\n`;
  }

  return text;
}

async function getUptimeText() {
  const time = await si.time();
  const osInfo = await si.osInfo();

  let text = `<b>⏱ Uptime</b>\n\n`;
  text += `<b>Сервер:</b> ${escapeHtml(osInfo.hostname)}\n`;
  text += `<b>Время работы:</b> ${formatUptime(time.uptime)}\n`;
  text += `<b>Текущее время:</b> ${new Date().toLocaleString('ru-RU')}\n`;
  text += `<b>Timezone:</b> ${escapeHtml(time.timezone)}`;

  return text;
}

function register(bot) {
  const handleStatus = async (ctx) => {
    const msg = await ctx.reply('⏳ Собираю данные...');
    const text = await getStatusText();
    return ctx.telegram.editMessageText(ctx.chat.id, msg.message_id, null, text, { parse_mode: 'HTML' });
  };

  const handleCpu = async (ctx) => {
    const msg = await ctx.reply('⏳ Собираю данные...');
    const text = await getCpuText();
    return ctx.telegram.editMessageText(ctx.chat.id, msg.message_id, null, text, { parse_mode: 'HTML' });
  };

  const handleRam = async (ctx) => {
    const msg = await ctx.reply('⏳ Собираю данные...');
    const text = await getRamText();
    return ctx.telegram.editMessageText(ctx.chat.id, msg.message_id, null, text, { parse_mode: 'HTML' });
  };

  const handleDisk = async (ctx) => {
    const msg = await ctx.reply('⏳ Собираю данные...');
    const text = await getDiskText();
    return ctx.telegram.editMessageText(ctx.chat.id, msg.message_id, null, text, { parse_mode: 'HTML' });
  };

  const handleNetwork = async (ctx) => {
    const msg = await ctx.reply('⏳ Собираю данные...');
    const text = await getNetworkText();
    return ctx.telegram.editMessageText(ctx.chat.id, msg.message_id, null, text, { parse_mode: 'HTML' });
  };

  const handleUptime = async (ctx) => {
    const text = await getUptimeText();
    return ctx.reply(text, { parse_mode: 'HTML' });
  };

  // Текстовые команды и кнопки клавиатуры
  bot.command('status', handleStatus);
  bot.hears('📊 Сводка', handleStatus);

  bot.command('cpu', handleCpu);
  bot.hears('🧠 CPU', handleCpu);

  bot.command('ram', handleRam);
  bot.hears('💾 RAM', handleRam);

  bot.command('disk', handleDisk);
  bot.hears('💿 Диск', handleDisk);

  bot.command('network', handleNetwork);
  bot.hears('🌐 Сеть', handleNetwork);

  bot.command('uptime', handleUptime);
  bot.hears('⏱ Uptime', handleUptime);

  // Inline-кнопки
  bot.action('mon:status', async (ctx) => {
    ctx.answerCbQuery().catch(() => {});
    const text = await getStatusText();
    return ctx.editMessageText(text, { parse_mode: 'HTML' });
  });

  bot.action('mon:cpu', async (ctx) => {
    ctx.answerCbQuery().catch(() => {});
    const text = await getCpuText();
    return ctx.editMessageText(text, { parse_mode: 'HTML' });
  });

  bot.action('mon:ram', async (ctx) => {
    ctx.answerCbQuery().catch(() => {});
    const text = await getRamText();
    return ctx.editMessageText(text, { parse_mode: 'HTML' });
  });

  bot.action('mon:disk', async (ctx) => {
    ctx.answerCbQuery().catch(() => {});
    const text = await getDiskText();
    return ctx.editMessageText(text, { parse_mode: 'HTML' });
  });

  bot.action('mon:network', async (ctx) => {
    ctx.answerCbQuery().catch(() => {});
    const text = await getNetworkText();
    return ctx.editMessageText(text, { parse_mode: 'HTML' });
  });

  bot.action('mon:uptime', async (ctx) => {
    ctx.answerCbQuery().catch(() => {});
    const text = await getUptimeText();
    return ctx.editMessageText(text, { parse_mode: 'HTML' });
  });
}

module.exports = { register };
