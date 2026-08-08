const { Markup } = require('telegraf');

/**
 * Главное меню — inline-клавиатура
 */
function mainMenuKeyboard() {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback('📊 Мониторинг', 'menu:monitoring'),
      Markup.button.callback('⚙️ Сервисы', 'menu:services'),
    ],
    [
      Markup.button.callback('🐳 Docker', 'menu:docker'),
      Markup.button.callback('📁 Файлы', 'menu:files'),
    ],
    [
      Markup.button.callback('👥 Пользователи', 'menu:users'),
      Markup.button.callback('🔥 Firewall', 'menu:firewall'),
    ],
    [
      Markup.button.callback('📦 Пакеты', 'menu:packages'),
      Markup.button.callback('💾 Бэкапы', 'menu:backup'),
    ],
    [
      Markup.button.callback('📋 Логи', 'menu:logs'),
      Markup.button.callback('🖥 Shell', 'menu:shell'),
    ],
  ]);
}

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

function monitoringSubmenu() {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback('📊 Сводка', 'mon:status'),
      Markup.button.callback('🧠 CPU', 'mon:cpu'),
    ],
    [
      Markup.button.callback('💾 RAM', 'mon:ram'),
      Markup.button.callback('💿 Диск', 'mon:disk'),
    ],
    [
      Markup.button.callback('🌐 Сеть', 'mon:network'),
      Markup.button.callback('⏱ Uptime', 'mon:uptime'),
    ],
    [Markup.button.callback('« Назад', 'menu:main')],
  ]);
}

function servicesSubmenu() {
  return Markup.inlineKeyboard([
    [Markup.button.callback('📋 Список сервисов', 'svc:list')],
    [Markup.button.callback('« Назад', 'menu:main')],
  ]);
}

function dockerSubmenu() {
  return Markup.inlineKeyboard([
    [Markup.button.callback('📋 Контейнеры', 'docker:list')],
    [Markup.button.callback('« Назад', 'menu:main')],
  ]);
}

function firewallSubmenu() {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback('📋 Статус', 'fw:status'),
      Markup.button.callback('📜 Правила', 'fw:rules'),
    ],
    [
      Markup.button.callback('🧱 iptables', 'fw:iptables'),
      Markup.button.callback('« Назад', 'menu:main'),
    ],
  ]);
}

function packagesSubmenu() {
  return Markup.inlineKeyboard([
    [Markup.button.callback('🔄 Update', 'apt:update')],
    [Markup.button.callback('⬆️ Upgrade', 'apt:upgrade')],
    [Markup.button.callback('« Назад', 'menu:main')],
  ]);
}

function backupSubmenu() {
  return Markup.inlineKeyboard([
    [Markup.button.callback('📋 Список бэкапов', 'bk:list')],
    [Markup.button.callback('« Назад', 'menu:main')],
  ]);
}

function logsSubmenu() {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback('📋 Syslog', 'log:syslog'),
      Markup.button.callback('🔐 Auth', 'log:authlog'),
    ],
    [Markup.button.callback('« Назад', 'menu:main')],
  ]);
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
    return ctx.reply('👋 <b>VDS Manager Bot</b>\n\nВыберите раздел:', {
      parse_mode: 'HTML',
      ...mainReplyKeyboard(),
      ...mainMenuKeyboard(),
    });
  });

  // /help
  bot.help((ctx) => {
    return ctx.reply(HELP_TEXT, {
      parse_mode: 'HTML',
      ...mainReplyKeyboard(),
    });
  });

  // /menu — повторный вызов главного меню
  bot.command('menu', (ctx) => {
    return ctx.reply('📋 <b>Главное меню</b>', {
      parse_mode: 'HTML',
      ...mainReplyKeyboard(),
      ...mainMenuKeyboard(),
    });
  });

  // --- Обработчики нажатий нижней persistent-клавиатуры ---
  bot.hears('📊 Мониторинг', (ctx) => {
    return ctx.reply('📊 <b>Мониторинг</b>\n\nВыберите метрику:', {
      parse_mode: 'HTML',
      ...monitoringReplyKeyboard(),
      ...monitoringSubmenu(),
    });
  });

  bot.hears('⚙️ Сервисы', (ctx) => {
    return ctx.reply('⚙️ <b>Сервисы</b>\n\nИспользуйте меню или команды:\n/services\n/service_start, /service_stop, /service_restart, /service_status &lt;name&gt;', {
      parse_mode: 'HTML',
      ...servicesReplyKeyboard(),
      ...servicesSubmenu(),
    });
  });

  bot.hears('🐳 Docker', (ctx) => {
    return ctx.reply('🐳 <b>Docker</b>\n\nИспользуйте меню или команды:\n/containers\n/container_start, /container_stop, /container_restart, /container_logs &lt;name&gt;', {
      parse_mode: 'HTML',
      ...dockerReplyKeyboard(),
      ...dockerSubmenu(),
    });
  });

  bot.hears('📁 Файлы', (ctx) => {
    return ctx.reply('📁 <b>Файлы</b>\n\nИспользуйте команды:\n/ls &lt;path&gt;\n/cat &lt;path&gt;\n/download &lt;path&gt;\n/upload (reply с файлом)', {
      parse_mode: 'HTML',
      ...mainReplyKeyboard(),
      ...Markup.inlineKeyboard([[Markup.button.callback('« Назад', 'menu:main')]]),
    });
  });

  bot.hears('👥 Пользователи', (ctx) => {
    return ctx.reply('👥 <b>Пользователи</b>\n\nИспользуйте команды:\n/users\n/useradd &lt;name&gt;\n/userdel &lt;name&gt;', {
      parse_mode: 'HTML',
      ...mainReplyKeyboard(),
      ...Markup.inlineKeyboard([
        [Markup.button.callback('📋 Список', 'usr:list')],
        [Markup.button.callback('« Назад', 'menu:main')],
      ]),
    });
  });

  bot.hears('🔥 Firewall', (ctx) => {
    return ctx.reply('🔥 <b>Firewall</b>\n\nИспользуйте меню или команды:\n/fw_status, /fw_rules\n/fw_allow &lt;port&gt;, /fw_deny &lt;port&gt;\n/iptables, /iptables_allow, /iptables_deny', {
      parse_mode: 'HTML',
      ...firewallReplyKeyboard(),
      ...firewallSubmenu(),
    });
  });

  bot.hears('📦 Пакеты', (ctx) => {
    return ctx.reply('📦 <b>Пакеты (APT)</b>\n\nИли: /apt_install &lt;name&gt;', {
      parse_mode: 'HTML',
      ...packagesReplyKeyboard(),
      ...packagesSubmenu(),
    });
  });

  bot.hears('💾 Бэкапы', (ctx) => {
    return ctx.reply('💾 <b>Бэкапы</b>\n\nИспользуйте:\n/backup_create &lt;path&gt;\n/backup_restore &lt;name&gt;\n/backup_download &lt;name&gt;', {
      parse_mode: 'HTML',
      ...backupReplyKeyboard(),
      ...backupSubmenu(),
    });
  });

  bot.hears('📋 Логи', (ctx) => {
    return ctx.reply('📋 <b>Логи</b>\n\nИли: /logs &lt;service&gt;', {
      parse_mode: 'HTML',
      ...logsReplyKeyboard(),
      ...logsSubmenu(),
    });
  });

  bot.hears(['« Назад в главное меню', '📋 Главное меню'], (ctx) => {
    return ctx.reply('📋 <b>Главное меню</b>', {
      parse_mode: 'HTML',
      ...mainReplyKeyboard(),
      ...mainMenuKeyboard(),
    });
  });

  // Кнопки подменю Мониторинга
  bot.hears('📊 Сводка', (ctx) => bot.handleUpdate({ ...ctx.update, message: { ...ctx.message, text: '/status' } }));
  bot.hears('🧠 CPU', (ctx) => bot.handleUpdate({ ...ctx.update, message: { ...ctx.message, text: '/cpu' } }));
  bot.hears('💾 RAM', (ctx) => bot.handleUpdate({ ...ctx.update, message: { ...ctx.message, text: '/ram' } }));
  bot.hears('💿 Диск', (ctx) => bot.handleUpdate({ ...ctx.update, message: { ...ctx.message, text: '/disk' } }));
  bot.hears('🌐 Сеть', (ctx) => bot.handleUpdate({ ...ctx.update, message: { ...ctx.message, text: '/network' } }));
  bot.hears('⏱ Uptime', (ctx) => bot.handleUpdate({ ...ctx.update, message: { ...ctx.message, text: '/uptime' } }));

  // Кнопки подменю Сервисов и Docker
  bot.hears('📋 Список сервисов', (ctx) => bot.handleUpdate({ ...ctx.update, message: { ...ctx.message, text: '/services' } }));
  bot.hears('📋 Контейнеры', (ctx) => bot.handleUpdate({ ...ctx.update, message: { ...ctx.message, text: '/containers' } }));

  // Кнопки подменю Firewall
  bot.hears('📋 Статус Firewall', (ctx) => bot.handleUpdate({ ...ctx.update, message: { ...ctx.message, text: '/fw_status' } }));
  bot.hears('📜 Правила UFW', (ctx) => bot.handleUpdate({ ...ctx.update, message: { ...ctx.message, text: '/fw_rules' } }));
  bot.hears('🧱 Правила iptables', (ctx) => bot.handleUpdate({ ...ctx.update, message: { ...ctx.message, text: '/iptables' } }));

  // Кнопки пакетов, бэкапов и логов
  bot.hears('🔄 Update APT', (ctx) => bot.handleUpdate({ ...ctx.update, message: { ...ctx.message, text: '/apt_update' } }));
  bot.hears('⬆️ Upgrade APT', (ctx) => bot.handleUpdate({ ...ctx.update, message: { ...ctx.message, text: '/apt_upgrade' } }));
  bot.hears('📋 Список бэкапов', (ctx) => bot.handleUpdate({ ...ctx.update, message: { ...ctx.message, text: '/backup_list' } }));
  bot.hears('📋 Syslog', (ctx) => bot.handleUpdate({ ...ctx.update, message: { ...ctx.message, text: '/syslog' } }));
  bot.hears('🔐 Auth log', (ctx) => bot.handleUpdate({ ...ctx.update, message: { ...ctx.message, text: '/authlog' } }));

  bot.hears('❓ Помощь', (ctx) => {
    return ctx.reply(HELP_TEXT, {
      parse_mode: 'HTML',
      ...mainReplyKeyboard(),
    });
  });

  // Навигация по подменю через callback
  bot.action('menu:main', (ctx) => {
    ctx.answerCbQuery();
    return ctx.editMessageText('📋 <b>Главное меню</b>', {
      parse_mode: 'HTML',
      ...mainMenuKeyboard(),
    });
  });

  bot.action('menu:monitoring', (ctx) => {
    ctx.answerCbQuery();
    return ctx.editMessageText('📊 <b>Мониторинг</b>\n\nВыберите метрику:', {
      parse_mode: 'HTML',
      ...monitoringSubmenu(),
    });
  });

  bot.action('menu:services', (ctx) => {
    ctx.answerCbQuery();
    return ctx.editMessageText('⚙️ <b>Сервисы</b>\n\nИли используйте:\n/service_start, /service_stop, /service_restart, /service_status &lt;name&gt;', {
      parse_mode: 'HTML',
      ...servicesSubmenu(),
    });
  });

  bot.action('menu:docker', (ctx) => {
    ctx.answerCbQuery();
    return ctx.editMessageText('🐳 <b>Docker</b>\n\nИли используйте:\n/container_start, /container_stop, /container_restart, /container_logs &lt;name&gt;', {
      parse_mode: 'HTML',
      ...dockerSubmenu(),
    });
  });

  bot.action('menu:files', (ctx) => {
    ctx.answerCbQuery();
    return ctx.editMessageText('📁 <b>Файлы</b>\n\nИспользуйте команды:\n/ls &lt;path&gt;\n/cat &lt;path&gt;\n/download &lt;path&gt;\n/upload (reply с файлом)', {
      parse_mode: 'HTML',
      ...Markup.inlineKeyboard([[Markup.button.callback('« Назад', 'menu:main')]]),
    });
  });

  bot.action('menu:users', (ctx) => {
    ctx.answerCbQuery();
    return ctx.editMessageText('👥 <b>Пользователи</b>\n\nИспользуйте команды:\n/users\n/useradd &lt;name&gt;\n/userdel &lt;name&gt;', {
      parse_mode: 'HTML',
      ...Markup.inlineKeyboard([
        [Markup.button.callback('📋 Список', 'usr:list')],
        [Markup.button.callback('« Назад', 'menu:main')],
      ]),
    });
  });

  bot.action('menu:firewall', (ctx) => {
    ctx.answerCbQuery();
    return ctx.editMessageText('🔥 <b>Firewall</b>\n\nИли используйте:\n/fw_allow &lt;port&gt;, /fw_deny &lt;port&gt;\n/iptables, /iptables_allow, /iptables_deny', {
      parse_mode: 'HTML',
      ...firewallSubmenu(),
    });
  });

  bot.action('menu:packages', (ctx) => {
    ctx.answerCbQuery();
    return ctx.editMessageText('📦 <b>Пакеты (APT)</b>\n\nИли: /apt_install &lt;name&gt;', {
      parse_mode: 'HTML',
      ...packagesSubmenu(),
    });
  });

  bot.action('menu:backup', (ctx) => {
    ctx.answerCbQuery();
    return ctx.editMessageText('💾 <b>Бэкапы</b>\n\nИспользуйте:\n/backup_create &lt;path&gt;\n/backup_restore &lt;name&gt;\n/backup_download &lt;name&gt;', {
      parse_mode: 'HTML',
      ...backupSubmenu(),
    });
  });

  bot.action('menu:logs', (ctx) => {
    ctx.answerCbQuery();
    return ctx.editMessageText('📋 <b>Логи</b>\n\nИли: /logs &lt;service&gt;', {
      parse_mode: 'HTML',
      ...logsSubmenu(),
    });
  });

  bot.action('menu:shell', (ctx) => {
    ctx.answerCbQuery();
    return ctx.editMessageText('🖥 <b>Shell</b>\n\nИспользуйте: /shell &lt;command&gt;', {
      parse_mode: 'HTML',
      ...Markup.inlineKeyboard([[Markup.button.callback('« Назад', 'menu:main')]]),
    });
  });
}

module.exports = { register, mainMenuKeyboard, mainReplyKeyboard };
