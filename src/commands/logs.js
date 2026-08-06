const { exec } = require('../utils/exec');
const { escapeHtml, codeBlock, truncate } = require('../utils/format');

function register(bot) {
  bot.command('logs', async (ctx) => {
    const service = ctx.message.text.split(/\s+/)[1];
    if (!service) return ctx.reply('❌ Укажите сервис: /logs <service>');

    const { stdout, stderr } = await exec(`journalctl -u ${service} -n 50 --no-pager`);
    const output = stdout || stderr;

    return ctx.reply(
      `<b>📋 Логи: ${escapeHtml(service)}</b>\n\n${codeBlock(truncate(output))}`,
      { parse_mode: 'HTML' }
    );
  });

  bot.command('syslog', async (ctx) => {
    const { stdout, stderr } = await exec('tail -n 50 /var/log/syslog');
    const output = stdout || stderr;

    return ctx.reply(
      `<b>📋 Syslog (последние 50 строк)</b>\n\n${codeBlock(truncate(output))}`,
      { parse_mode: 'HTML' }
    );
  });

  // Inline-кнопка
  bot.action('log:syslog', async (ctx) => {
    ctx.answerCbQuery();
    const { stdout, stderr } = await exec('tail -n 30 /var/log/syslog');
    return ctx.editMessageText(
      `<b>📋 Syslog</b>\n\n${codeBlock(truncate(stdout || stderr))}`,
      { parse_mode: 'HTML' }
    );
  });

  bot.command('authlog', async (ctx) => {
    const { stdout, stderr } = await exec('tail -n 50 /var/log/auth.log');
    const output = stdout || stderr;

    return ctx.reply(
      `<b>🔐 Auth Log (последние 50 строк)</b>\n\n${codeBlock(truncate(output))}`,
      { parse_mode: 'HTML' }
    );
  });

  bot.action('log:authlog', async (ctx) => {
    ctx.answerCbQuery();
    const { stdout, stderr } = await exec('tail -n 30 /var/log/auth.log');
    return ctx.editMessageText(
      `<b>🔐 Auth Log</b>\n\n${codeBlock(truncate(stdout || stderr))}`,
      { parse_mode: 'HTML' }
    );
  });
}

module.exports = { register };
