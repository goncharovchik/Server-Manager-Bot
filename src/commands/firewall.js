const { exec } = require('../utils/exec');
const { escapeHtml, codeBlock, truncate } = require('../utils/format');

function register(bot) {
  bot.command('fw_status', async (ctx) => {
    const { stdout, stderr } = await exec('ufw status');
    const output = stdout || stderr;
    return ctx.reply(`<b>🔥 Firewall Status</b>\n\n${codeBlock(truncate(output))}`, { parse_mode: 'HTML' });
  });

  // Inline-кнопка
  bot.action('fw:status', async (ctx) => {
    ctx.answerCbQuery();
    const { stdout, stderr } = await exec('ufw status');
    return ctx.editMessageText(`<b>🔥 Firewall Status</b>\n\n${codeBlock(truncate(stdout || stderr))}`, { parse_mode: 'HTML' });
  });

  bot.command('fw_rules', async (ctx) => {
    const { stdout, stderr } = await exec('ufw status numbered');
    const output = stdout || stderr;
    return ctx.reply(`<b>🔥 Firewall Rules</b>\n\n${codeBlock(truncate(output))}`, { parse_mode: 'HTML' });
  });

  bot.action('fw:rules', async (ctx) => {
    ctx.answerCbQuery();
    const { stdout, stderr } = await exec('ufw status numbered');
    return ctx.editMessageText(`<b>🔥 Firewall Rules</b>\n\n${codeBlock(truncate(stdout || stderr))}`, { parse_mode: 'HTML' });
  });

  bot.command('fw_allow', async (ctx) => {
    const port = ctx.message.text.split(/\s+/)[1];
    if (!port) return ctx.reply('❌ Укажите порт: /fw_allow <port>');

    if (!/^\d+(\/(?:tcp|udp))?$/.test(port)) {
      return ctx.reply('❌ Некорректный формат. Примеры: 80, 443/tcp, 53/udp');
    }

    const { stdout, stderr, exitCode } = await exec(`ufw allow ${port}`);

    if (exitCode !== 0) {
      return ctx.reply(`❌ Ошибка:\n${codeBlock(stderr)}`, { parse_mode: 'HTML' });
    }

    return ctx.reply(`✅ Порт <code>${escapeHtml(port)}</code> открыт.\n${codeBlock(stdout)}`, { parse_mode: 'HTML' });
  });

  bot.command('fw_deny', async (ctx) => {
    const port = ctx.message.text.split(/\s+/)[1];
    if (!port) return ctx.reply('❌ Укажите порт: /fw_deny <port>');

    if (!/^\d+(\/(?:tcp|udp))?$/.test(port)) {
      return ctx.reply('❌ Некорректный формат. Примеры: 80, 443/tcp, 53/udp');
    }

    const { stdout, stderr, exitCode } = await exec(`ufw deny ${port}`);

    if (exitCode !== 0) {
      return ctx.reply(`❌ Ошибка:\n${codeBlock(stderr)}`, { parse_mode: 'HTML' });
    }

    return ctx.reply(`✅ Порт <code>${escapeHtml(port)}</code> закрыт.\n${codeBlock(stdout)}`, { parse_mode: 'HTML' });
  });
}

module.exports = { register };
