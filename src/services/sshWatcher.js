const { exec } = require('../utils/exec');
const { escapeHtml } = require('../utils/format');
const config = require('../config');
const logger = require('../logger');

let isRunning = false;
let checkInterval = null;
let lastCheckTime = new Date();
const processedEvents = new Set();

/**
 * Проверяет новые входы на сервер (SSH и локальные сессии)
 */
async function checkNewLogins(bot) {
  try {
    const sinceStr = lastCheckTime.toISOString().replace('T', ' ').slice(0, 19);
    lastCheckTime = new Date();

    // Пробуем получить свежие записи из journalctl
    let cmd = `journalctl _COMM=sshd -o short-iso --since "${sinceStr}" --no-pager 2>/dev/null`;
    let { stdout, exitCode } = await exec(cmd);

    // Если journalctl не дал результат, проверяем auth.log / secure
    if (exitCode !== 0 || !stdout.trim()) {
      cmd = 'tail -n 30 /var/log/auth.log 2>/dev/null || tail -n 30 /var/log/secure 2>/dev/null';
      const res = await exec(cmd);
      stdout = res.stdout;
    }

    if (!stdout || !stdout.trim()) return;

    const lines = stdout.split('\n');

    for (const line of lines) {
      if (!line.trim()) continue;

      // Паттерн 1: Accepted (publickey|password|keyboard-interactive) for <user> from <ip> port <port>
      const matchSsh = line.match(/Accepted\s+(publickey|password|keyboard-interactive)\s+for\s+(\S+)\s+from\s+(\S+)\s+port\s+(\d+)/i);

      if (matchSsh) {
        const [, authMethod, username, ip, port] = matchSsh;
        const eventKey = `ssh:${username}:${ip}:${port}:${line.slice(0, 30)}`;

        if (processedEvents.has(eventKey)) continue;
        processedEvents.add(eventKey);

        if (processedEvents.size > 500) {
          const firstItem = processedEvents.values().next().value;
          processedEvents.delete(firstItem);
        }

        const timeNow = new Date().toLocaleString('ru-RU');
        const text = `🔐 <b>Новое подключение по SSH!</b>\n\n` +
          `👤 <b>Пользователь:</b> <code>${escapeHtml(username)}</code>\n` +
          `🌐 <b>IP-адрес:</b> <code>${escapeHtml(ip)}</code> (порт ${port})\n` +
          `🔑 <b>Метод:</b> ${escapeHtml(authMethod)}\n` +
          `⏱ <b>Время:</b> ${timeNow}`;

        logger.info(`🔔 SSH вход: user=${username}, ip=${ip}, method=${authMethod}`);
        await notifyAdmins(bot, text);
        continue;
      }

      // Паттерн 2: pam_unix(sshd:session): session opened for user <user> by (uid=0)
      const matchPam = line.match(/pam_unix\((?:sshd|login):session\):\s*session opened for user\s+(\S+)/i);
      if (matchPam) {
        const username = matchPam[1];
        const eventKey = `pam:${username}:${line.slice(0, 40)}`;

        if (processedEvents.has(eventKey)) continue;
        processedEvents.add(eventKey);

        if (processedEvents.size > 500) {
          const firstItem = processedEvents.values().next().value;
          processedEvents.delete(firstItem);
        }

        const timeNow = new Date().toLocaleString('ru-RU');
        const text = `🔑 <b>Открыта сессия пользователя!</b>\n\n` +
          `👤 <b>Пользователь:</b> <code>${escapeHtml(username)}</code>\n` +
          `⏱ <b>Время:</b> ${timeNow}`;

        logger.info(`🔔 Сессия открыта: user=${username}`);
        await notifyAdmins(bot, text);
      }
    }
  } catch (err) {
    logger.error(`Ошибка проверки SSH подключений: ${err.message}`);
  }
}

/**
 * Отправляет уведомления администраторам
 */
async function notifyAdmins(bot, text) {
  for (const adminId of config.adminIds) {
    try {
      await bot.telegram.sendMessage(adminId, text, { parse_mode: 'HTML' });
    } catch (err) {
      logger.error(`Не удалось отправить уведомление админу ${adminId}: ${err.message}`);
    }
  }
}

/**
 * Запуск фонового сервиса отслеживания (интервал по умолчанию 10 секунд)
 */
function start(bot, intervalMs = 10_000) {
  if (isRunning) return;
  isRunning = true;
  lastCheckTime = new Date();

  setTimeout(() => checkNewLogins(bot), 3000);

  checkInterval = setInterval(() => {
    checkNewLogins(bot);
  }, intervalMs);

  logger.info('🛡 Служба уведомлений о входе по SSH (SSH Watcher) запущен.');
}

/**
 * Остановка фонового сервиса
 */
function stop() {
  if (checkInterval) {
    clearInterval(checkInterval);
    checkInterval = null;
  }
  isRunning = false;
  logger.info('🛑 Служба SSH Watcher остановлена.');
}

module.exports = { start, stop, checkNewLogins };
