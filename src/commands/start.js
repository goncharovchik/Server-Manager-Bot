const { Markup } = require('telegraf');

/**
 * Главная постоянная нижняя клавиатура Telegram
 */
function mainReplyKeyboard() {
  return Markup.keyboard([
    ['📊 Мониторинг', '⚙️ Сервисы'],
    ['🐳 Docker', '📁 Файлы'],
    ['👥 Пользователи', '🔥 Firewall'],
    ['📦 Пакеты', '💾 Бэкапы'],
    ['📋 Логи', '🖥 Интерактивный Shell'],
    ['📋 Главное меню', '❓ Помощь'],
  ]).resize().persistent();
}

function monitoringReplyKeyboard() {
  return Markup.keyboard([
    ['📊 Сводка', '🧠 CPU'],
    ['💾 RAM', '💿 Диск'],
    ['🌐 Сеть', '⏱ Uptime'],
    ['« Назад в главное меню'],
  ]).resize().persistent();
}

function servicesReplyKeyboard() {
  return Markup.keyboard([
    ['📋 Список сервисов', '« Назад в главное меню'],
  ]).resize().persistent();
}

function dockerReplyKeyboard() {
  return Markup.keyboard([
    ['📋 Контейнеры', '« Назад в главное меню'],
  ]).resize().persistent();
}

function firewallReplyKeyboard() {
  return Markup.keyboard([
    ['📋 Статус Firewall', '📜 Правила UFW'],
    ['🧱 Правила iptables', '« Назад в главное меню'],
  ]).resize().persistent();
}

function packagesReplyKeyboard() {
  return Markup.keyboard([
    ['🔄 Update APT', '⬆️ Upgrade APT'],
    ['« Назад в главное меню'],
  ]).resize().persistent();
}

function backupReplyKeyboard() {
  return Markup.keyboard([
    ['📋 Список бэкапов', '« Назад в главное меню'],
  ]).resize().persistent();
}

function logsReplyKeyboard() {
  return Markup.keyboard([
    ['📋 Syslog', '🔐 Auth log'],
    ['« Назад в главное меню'],
  ]).resize().persistent();
}

const HELP_TEXT = `
<b>🖥 VDS Manager Bot</b>

<b>📊 Мониторинг:</b>
/status — сводка сервера
/cpu, /ram, /disk, /network, /uptime

<b>⚙️ Сервисы (systemd):</b>
/services — список сервисов
/service_start, /service_stop, /service_restart, /service_status &lt;name&gt;

<b>🐳 Docker:</b>
/containers — контейнеры
/container_start, /container_stop, /container_restart, /container_logs &lt;name&gt;

<b>📁 Файлы:</b>
/ls &lt;path&gt;, /cat &lt;path&gt;
/download &lt;path&gt;, /upload (reply с файлом)

<b>👥 Пользователи:</b>
/users, /logins, /useradd &lt;name&gt;, /userdel &lt;name&gt;

<b>🔥 Firewall:</b>
/fw_status, /fw_rules
/fw_allow &lt;port&gt;, /fw_deny &lt;port&gt;
/iptables, /iptables_allow &lt;port&gt;, /iptables_deny &lt;port&gt;, /iptables_delete &lt;num&gt;

<b>📦 Пакеты:</b>
/apt_update, /apt_upgrade, /apt_install &lt;name&gt;

<b>💾 Бэкапы:</b>
/backup_create &lt;path&gt;, /backup_list
/backup_restore &lt;name&gt;, /backup_download &lt;name&gt;

<b>📋 Логи:</b>
/logs &lt;service&gt;, /syslog, /authlog

<b>🖥 Shell:</b>
/shell &lt;command&gt;, /interactive (Интерактивный Shell)
`.trim();

function register(bot) {
  // /start
  bot.start((ctx) => {
    return ctx.reply('👋 <b>VDS Manager Bot</b>\n\nВыберите раздел в нижней клавиатуре:', {
      parse_mode: 'HTML',
      reply_markup: mainReplyKeyboard().reply_markup,
    });
  });

  // /help
  bot.help((ctx) => {
    return ctx.reply(HELP_TEXT, {
      parse_mode: 'HTML',
      reply_markup: mainReplyKeyboard().reply_markup,
    });
  });

  // /menu — повторный вызов главного меню
  bot.command('menu', (ctx) => {
    return ctx.reply('📋 <b>Главное меню</b>', {
      parse_mode: 'HTML',
      reply_markup: mainReplyKeyboard().reply_markup,
    });
  });

  // --- Обработчики нажатий нижней persistent-клавиатуры ---
  bot.hears('📊 Мониторинг', (ctx) => {
    return ctx.reply('📊 <b>Мониторинг</b>\n\nВыберите метрику на клавиатуре:', {
      parse_mode: 'HTML',
      reply_markup: monitoringReplyKeyboard().reply_markup,
    });
  });

  bot.hears('⚙️ Сервисы', (ctx) => {
    return ctx.reply('⚙️ <b>Сервисы</b>\n\nИспользуйте клавиши меню или команды:\n/services\n/service_start, /service_stop, /service_restart, /service_status &lt;name&gt;', {
      parse_mode: 'HTML',
      reply_markup: servicesReplyKeyboard().reply_markup,
    });
  });

  bot.hears('🐳 Docker', (ctx) => {
    return ctx.reply('🐳 <b>Docker</b>\n\nИспользуйте клавиши меню или команды:\n/containers\n/container_start, /container_stop, /container_restart, /container_logs &lt;name&gt;', {
      parse_mode: 'HTML',
      reply_markup: dockerReplyKeyboard().reply_markup,
    });
  });

  bot.hears('📁 Файлы', (ctx) => {
    return ctx.reply('📁 <b>Файлы</b>\n\nИспользуйте команды:\n/ls &lt;path&gt;\n/cat &lt;path&gt;\n/download &lt;path&gt;\n/upload (reply с файлом)', {
      parse_mode: 'HTML',
      reply_markup: mainReplyKeyboard().reply_markup,
    });
  });

  bot.hears('👥 Пользователи', (ctx) => {
    return ctx.reply('👥 <b>Пользователи</b>\n\nИспользуйте команды:\n/users\n/logins\n/useradd &lt;name&gt;\n/userdel &lt;name&gt;', {
      parse_mode: 'HTML',
      reply_markup: mainReplyKeyboard().reply_markup,
    });
  });

  bot.hears('🔥 Firewall', (ctx) => {
    return ctx.reply('🔥 <b>Firewall</b>\n\nИспользуйте меню или команды:\n/fw_status, /fw_rules\n/fw_allow &lt;port&gt;, /fw_deny &lt;port&gt;\n/iptables, /iptables_allow, /iptables_deny', {
      parse_mode: 'HTML',
      reply_markup: firewallReplyKeyboard().reply_markup,
    });
  });

  bot.hears('📦 Пакеты', (ctx) => {
    return ctx.reply('📦 <b>Пакеты (APT)</b>\n\nИспользуйте меню или: /apt_install &lt;name&gt;', {
      parse_mode: 'HTML',
      reply_markup: packagesReplyKeyboard().reply_markup,
    });
  });

  bot.hears('💾 Бэкапы', (ctx) => {
    return ctx.reply('💾 <b>Бэкапы</b>\n\nИспользуйте:\n/backup_create &lt;path&gt;\n/backup_restore &lt;name&gt;\n/backup_download &lt;name&gt;', {
      parse_mode: 'HTML',
      reply_markup: backupReplyKeyboard().reply_markup,
    });
  });

  bot.hears('📋 Логи', (ctx) => {
    return ctx.reply('📋 <b>Логи</b>\n\nИспользуйте меню или: /logs &lt;service&gt;', {
      parse_mode: 'HTML',
      reply_markup: logsReplyKeyboard().reply_markup,
    });
  });

  bot.hears(['« Назад в главное меню', '📋 Главное меню'], (ctx) => {
    return ctx.reply('📋 <b>Главное меню</b>', {
      parse_mode: 'HTML',
      reply_markup: mainReplyKeyboard().reply_markup,
    });
  });

  bot.hears('❓ Помощь', (ctx) => {
    return ctx.reply(HELP_TEXT, {
      parse_mode: 'HTML',
      reply_markup: mainReplyKeyboard().reply_markup,
    });
  });
}

module.exports = {
  register,
  mainReplyKeyboard,
  monitoringReplyKeyboard,
  servicesReplyKeyboard,
  dockerReplyKeyboard,
  firewallReplyKeyboard,
  packagesReplyKeyboard,
  backupReplyKeyboard,
  logsReplyKeyboard,
};
