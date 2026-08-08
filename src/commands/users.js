const { exec } = require('../utils/exec');
const { escapeHtml, codeBlock, truncate, sendLongCodeBlock } = require('../utils/format');

function register(bot) {
  bot.command('users', async (ctx) => {
    const { stdout, stderr, exitCode } = await exec('cat /etc/passwd | grep -E ":[0-9]{4,}:" | cut -d: -f1,3,6,7');

    if (exitCode !== 0) {
      return ctx.reply(`❌ Ошибка:\n${codeBlock(stderr)}`, { parse_mode: 'HTML' });
    }

    const lines = stdout.trim().split('\n').filter(Boolean);
    let text = `<b>👥 Пользователи (${lines.length})</b>\n\n`;

    for (const line of lines) {
      const [name, uid, home, shell] = line.split(':');
      text += `👤 <code>${escapeHtml(name)}</code> (UID: ${uid})\n`;
      text += `   Home: <code>${escapeHtml(home)}</code>\n`;
      text += `   Shell: <code>${escapeHtml(shell)}</code>\n\n`;
    }

    return ctx.reply(truncate(text), { parse_mode: 'HTML' });
  });

  bot.command(['logins', 'who', 'sessions'], async (ctx) => {
    const { stdout, stderr } = await exec('who -a || w');
    return sendLongCodeBlock(ctx, '<b>🌐 Активные сессии подключений (who/w)</b>', stdout || stderr || 'Нет активных сессий');
  });

  // Inline-кнопка
  bot.action('usr:list', async (ctx) => {
    ctx.answerCbQuery().catch(() => {});
    const { stdout } = await exec('cat /etc/passwd | grep -E ":[0-9]{4,}:" | cut -d: -f1,3');

    const lines = stdout.trim().split('\n').filter(Boolean);
    let text = `<b>👥 Пользователи (${lines.length})</b>\n\n`;

    for (const line of lines) {
      const [name, uid] = line.split(':');
      text += `👤 <code>${escapeHtml(name)}</code> (UID: ${uid})\n`;
    }

    return ctx.editMessageText(truncate(text), { parse_mode: 'HTML' });
  });

  bot.command('useradd', async (ctx) => {
    const name = ctx.message.text.split(/\s+/)[1];
    if (!name) return ctx.reply('❌ Укажите имя: /useradd <name>');

    if (!/^[a-z_][a-z0-9_-]*$/.test(name)) {
      return ctx.reply('❌ Некорректное имя пользователя. Допустимы: a-z, 0-9, _, -');
    }

    const { stderr, exitCode } = await exec(`useradd -m -s /bin/bash ${name}`);

    if (exitCode !== 0) {
      return ctx.reply(`❌ Ошибка создания:\n${codeBlock(stderr)}`, { parse_mode: 'HTML' });
    }

    return ctx.reply(`✅ Пользователь <code>${escapeHtml(name)}</code> создан.`, { parse_mode: 'HTML' });
  });

  bot.command('userdel', async (ctx) => {
    const name = ctx.message.text.split(/\s+/)[1];
    if (!name) return ctx.reply('❌ Укажите имя: /userdel <name>');

    const { stderr, exitCode } = await exec(`userdel -r ${name}`);

    if (exitCode !== 0) {
      return ctx.reply(`❌ Ошибка удаления:\n${codeBlock(stderr)}`, { parse_mode: 'HTML' });
    }

    return ctx.reply(`✅ Пользователь <code>${escapeHtml(name)}</code> удалён.`, { parse_mode: 'HTML' });
  });
}

module.exports = { register };
