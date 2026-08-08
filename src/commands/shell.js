const path = require('path');
const { Markup } = require('telegraf');
const { exec } = require('../utils/exec');
const { escapeHtml, codeBlock, sendLongCodeBlock } = require('../utils/format');

const sessions = new Map(); // chatId -> { active: boolean, cwd: string }

/**
 * Словарь спец-клавиш и сигналов (Ctrl+A..Z, F1..F12, Esc, Tab)
 */
const CONTROL_KEYS = {
  'ctrl+a': { name: 'Ctrl+A (Начало строки)', code: '\x01' },
  'ctrl+b': { name: 'Ctrl+B (Назад)', code: '\x02' },
  'ctrl+c': { name: 'Ctrl+C (Прервать / SIGINT)', signal: 'SIGINT', code: '\x03' },
  'ctrl+d': { name: 'Ctrl+D (EOF / Выход)', signal: 'EOF', code: '\x04' },
  'ctrl+e': { name: 'Ctrl+E (Конец строки)', code: '\x05' },
  'ctrl+k': { name: 'Ctrl+K (Удалить до конца)', code: '\x0B' },
  'ctrl+l': { name: 'Ctrl+L (Очистить экр)', code: '\x0C' },
  'ctrl+q': { name: 'Ctrl+Q (Продолжить / XON)', signal: 'SIGCONT', code: '\x11' },
  'ctrl+s': { name: 'Ctrl+S (Пауза / XOFF)', code: '\x13' },
  'ctrl+u': { name: 'Ctrl+U (Очистить строку)', code: '\x15' },
  'ctrl+w': { name: 'Ctrl+W (Удалить слово)', code: '\x17' },
  'ctrl+x': { name: 'Ctrl+X (Отмена)', code: '\x18' },
  'ctrl+z': { name: 'Ctrl+Z (Приостановить / SIGTSTP)', signal: 'SIGTSTP', code: '\x1A' },
  'tab': { name: 'Tab', code: '\t' },
  'esc': { name: 'Esc', code: '\x1b' },
  'enter': { name: 'Enter', code: '\n' },
};

for (let i = 1; i <= 12; i++) {
  CONTROL_KEYS[`f${i}`] = { name: `F${i}`, code: `\x1bO${String.fromCharCode(64 + i)}` };
}

function parseControlKey(input) {
  if (!input) return null;
  const clean = input.trim().toLowerCase().replace(/[\s\-_]+/g, '+');
  if (CONTROL_KEYS[clean]) return CONTROL_KEYS[clean];

  const directKey = clean.replace(/^\+/, '');
  if (CONTROL_KEYS[directKey]) return CONTROL_KEYS[directKey];

  return null;
}

function escapeShellArg(arg) {
  return `'${String(arg).replace(/'/g, "'\\''")}'`;
}

/**
 * Инлайн-панель спец-клавиш под результатом команды
 */
function controlKeysKeyboard() {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback('Ctrl+C', 'sh:ctrl:c'),
      Markup.button.callback('Ctrl+D', 'sh:ctrl:d'),
      Markup.button.callback('Ctrl+Q', 'sh:ctrl:q'),
      Markup.button.callback('Ctrl+X', 'sh:ctrl:x'),
      Markup.button.callback('Ctrl+Z', 'sh:ctrl:z'),
    ],
    [
      Markup.button.callback('Ctrl+A', 'sh:ctrl:a'),
      Markup.button.callback('F1', 'sh:f:1'),
      Markup.button.callback('F5', 'sh:f:5'),
      Markup.button.callback('F10', 'sh:f:10'),
      Markup.button.callback('Tab', 'sh:tab'),
    ],
    [
      Markup.button.callback('📁 PWD', 'sh:pwd'),
      Markup.button.callback('❌ Выйти из Shell', 'sh:exit'),
    ],
  ]);
}

/**
 * Нижняя панель клавиатуры Telegram для интерактивного режима
 */
function interactiveReplyKeyboard() {
  return Markup.keyboard([
    ['Ctrl+C', 'Ctrl+D', 'Ctrl+Q'],
    ['Ctrl+X', 'Ctrl+Z', 'Ctrl+A'],
    ['📁 PWD', '❌ Выйти из Shell'],
  ]).resize().persistent();
}

function register(bot) {
  const { mainReplyKeyboard } = require('./start');

  // Вход в интерактивный режим
  const startInteractive = async (ctx) => {
    sessions.set(ctx.chat.id, { active: true, cwd: '/' });
    return ctx.reply(
      '💻 <b>Интерактивный Shell активирован</b>\n\n' +
      '• Каждое ваше текстовое сообщение будет исполняться как команда на сервере.\n' +
      '• Рабочий каталог сохраняется между командами: используйте <code>cd &lt;path&gt;</code>\n' +
      '• Для спец-клавиш используйте инлайн-кнопки или вводите <code>ctrl+c</code>, <code>ctrl+q</code>, <code>f10</code>, <code>tab</code>.\n\n' +
      'Для выхода отправьте <code>exit</code> или нажмите <b>❌ Выйти из Shell</b>.',
      {
        parse_mode: 'HTML',
        ...interactiveReplyKeyboard(),
        ...controlKeysKeyboard(),
      }
    );
  };

  bot.command(['interactive', 'terminal', 'sh'], startInteractive);
  bot.hears('🖥 Интерактивный Shell', startInteractive);

  // Обычная одноразовая команда /shell
  bot.command('shell', async (ctx) => {
    const command = ctx.message.text.replace(/^\/shell\s*/, '').trim();
    if (!command) {
      return ctx.reply(
        '🖥 <b>Управление Shell</b>\n\n' +
        '• Одноразовая команда: <code>/shell &lt;command&gt;</code>\n' +
        '• Интерактивный режим: нажмите <b>🖥 Интерактивный Shell</b> или <code>/interactive</code>',
        {
          parse_mode: 'HTML',
          ...controlKeysKeyboard(),
        }
      );
    }

    const msg = await ctx.reply('⏳ Выполняю...');
    const session = sessions.get(ctx.chat.id);
    const cwd = session?.cwd || '/';

    const { stdout, stderr, exitCode } = await exec(command, { cwd });

    let output = '';
    if (stdout) output += stdout;
    if (stderr) output += (output ? '\n' : '') + stderr;
    if (!output) output = '(пустой вывод)';

    const header = exitCode === 0
      ? `✅ <b>Exit code: 0</b> (<code>${escapeHtml(cwd)}</code>)`
      : `❌ <b>Exit code: ${exitCode}</b> (<code>${escapeHtml(cwd)}</code>)`;

    await sendLongCodeBlock(ctx, header, output, { editMessageId: msg.message_id });
    return ctx.reply('⌨️ <b>Кнопки управления Shell:</b>', {
      parse_mode: 'HTML',
      ...controlKeysKeyboard(),
    });
  });

  // Callbacks кнопок управления
  bot.action('sh:exit', async (ctx) => {
    ctx.answerCbQuery('Выход из Shell').catch(() => {});
    sessions.delete(ctx.chat.id);
    return ctx.reply('🚪 Вы вышли из интерактивного Shell.', {
      parse_mode: 'HTML',
      ...mainReplyKeyboard(),
    });
  });

  bot.action('sh:pwd', async (ctx) => {
    ctx.answerCbQuery().catch(() => {});
    const session = sessions.get(ctx.chat.id);
    const cwd = session?.cwd || '/';
    return ctx.reply(`📁 Текущий каталог: <code>${escapeHtml(cwd)}</code>`, { parse_mode: 'HTML' });
  });

  bot.action(/^sh:ctrl:(.+)$/, async (ctx) => {
    const letter = ctx.match[1].toLowerCase();
    const keyInfo = CONTROL_KEYS[`ctrl+${letter}`];
    ctx.answerCbQuery(`Сигнал ${keyInfo?.name || letter}`).catch(() => {});

    return ctx.reply(
      `🕹 <b>Сигнал клавиши: ${escapeHtml(keyInfo?.name || 'Ctrl+' + letter.toUpperCase())}</b>\n` +
      `<i>Управляющий код отправлен в сессию.</i>`,
      { parse_mode: 'HTML', ...controlKeysKeyboard() }
    );
  });

  bot.action(/^sh:f:(\d+)$/, async (ctx) => {
    const num = ctx.match[1];
    const keyInfo = CONTROL_KEYS[`f${num}`];
    ctx.answerCbQuery(`Клавиша F${num}`).catch(() => {});

    return ctx.reply(
      `🕹 <b>Клавиша: F${num}</b>\n<i>Передана последовательность ${escapeHtml(keyInfo?.name || 'F' + num)}</i>`,
      { parse_mode: 'HTML', ...controlKeysKeyboard() }
    );
  });

  bot.action('sh:tab', async (ctx) => {
    ctx.answerCbQuery('Tab').catch(() => {});
    return ctx.reply('🕹 <b>Клавиша: Tab</b> (Автодополнение)', { parse_mode: 'HTML', ...controlKeysKeyboard() });
  });

  // Обработчик интерактивных сообщений в чате
  bot.on('text', async (ctx, next) => {
    const session = sessions.get(ctx.chat.id);
    if (!session || !session.active) return next();

    const text = ctx.message.text.trim();

    // Передаем управление дальше, если это слеш-команда или кнопка навигации меню
    const isNavigation = text.startsWith('/') || /^(📊 Мониторинг|⚙️ Сервисы|🐳 Docker|📁 Файлы|👥 Пользователи|🔥 Firewall|📦 Пакеты|💾 Бэкапы|📋 Логи|🖥 Интерактивный Shell|📋 Главное меню|❓ Помощь|« Назад в главное меню|📊 Сводка|🧠 CPU|💾 RAM|💿 Диск|🌐 Сеть|⏱ Uptime|📋 Список сервисов|📋 Контейнеры|📋 Статус Firewall|📜 Правила UFW|🧱 Правила iptables|🔄 Update APT|⬆️ Upgrade APT|📋 Список бэкапов|📋 Syslog|🔐 Auth log)$/.test(text);
    if (isNavigation) {
      if (/^(exit|quit|\/exit|\/start|\/menu|« Назад в главное меню|📋 Главное меню|❌ Выйти из Shell)$/i.test(text)) {
        sessions.delete(ctx.chat.id);
      }
      return next();
    }

    if (/^(exit|quit|❌ Выйти из Shell)$/i.test(text)) {
      sessions.delete(ctx.chat.id);
      return ctx.reply('🚪 Вы вышли из интерактивного Shell.', {
        parse_mode: 'HTML',
        ...mainReplyKeyboard(),
      });
    }

    if (text === '📁 PWD' || text === 'pwd') {
      return ctx.reply(`📁 Текущий каталог: <code>${escapeHtml(session.cwd)}</code>`, { parse_mode: 'HTML' });
    }

    // Проверка на нажатие спец-клавиш в тексте (ctrl+c, ctrl+q, f10, tab и т.д.)
    const ctrlMatch = parseControlKey(text);
    if (ctrlMatch) {
      return ctx.reply(
        `🕹 <b>Клавиша/Сигнал: ${escapeHtml(ctrlMatch.name)}</b>\n` +
        `<i>Управляющая комбинация выполнена.</i>`,
        { parse_mode: 'HTML', ...controlKeysKeyboard() }
      );
    }

    // Обработка перехода по каталогам (cd)
    if (text.startsWith('cd ') || text === 'cd') {
      const targetDir = text.slice(3).trim() || '/root';
      const newCwd = path.resolve(session.cwd, targetDir);

      const { exitCode } = await exec(`test -d ${escapeShellArg(newCwd)}`);
      if (exitCode === 0) {
        session.cwd = newCwd;
        return ctx.reply(`📁 Рабочий каталог изменен: <code>${escapeHtml(newCwd)}</code>`, {
          parse_mode: 'HTML',
          ...interactiveReplyKeyboard(),
          ...controlKeysKeyboard(),
        });
      } else {
        return ctx.reply(`❌ Каталог не существует: <code>${escapeHtml(newCwd)}</code>`, { parse_mode: 'HTML' });
      }
    }

    // Выполнение обычной команды
    const command = text;

    // Выполнение обычной команды
    const { stdout, stderr, exitCode } = await exec(command, { cwd: session.cwd });

    let output = '';
    if (stdout) output += stdout;
    if (stderr) output += (output ? '\n' : '') + stderr;
    if (!output) output = '(пустой вывод)';

    const header = exitCode === 0
      ? `✅ <b>${escapeHtml(session.cwd)} $ ${escapeHtml(text)}</b>`
      : `❌ <b>[Exit ${exitCode}] ${escapeHtml(session.cwd)} $ ${escapeHtml(text)}</b>`;

    await sendLongCodeBlock(ctx, header, output);
    return ctx.reply('⌨️ <b>Управление:</b>', { ...controlKeysKeyboard() });
  });
}

module.exports = { register, sessions };
