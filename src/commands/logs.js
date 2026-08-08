const { exec } = require('../utils/exec');
const { escapeHtml, sendLongCodeBlock } = require('../utils/format');

function register(bot) {
  bot.command('logs', async (ctx) => {
    const service = ctx.message.text.split(/\s+/)[1];
    if (!service) return ctx.reply('❌ Укажите сервис: /logs <service>');

    const { stdout, stderr } = await exec(`journalctl -u ${service} -n 100 --no-pager`);
    const output = stdout || stderr;

    return sendLongCodeBlock(ctx, `<b>📋 Логи: ${escapeHtml(service)}</b>`, output);
  });

  bot.command('syslog', async (ctx) => {
    const { stdout, stderr } = await exec('tail -n 100 /var/log/syslog');
    const output = stdout || stderr;

    return sendLongCodeBlock(ctx, `<b>📋 Syslog</b>`, output);
  });

  // Inline-кнопка
  bot.action('log:syslog', async (ctx) => {
    ctx.answerCbQuery();
    const { stdout, stderr } = await exec('tail -n 100 /var/log/syslog');
    return sendLongCodeBlock(ctx, `<b>📋 Syslog</b>`, stdout || stderr);
  });

  bot.command('authlog', async (ctx) => {
    const { stdout, stderr } = await exec('tail -n 100 /var/log/auth.log');
    const output = stdout || stderr;

    return sendLongCodeBlock(ctx, `<b>🔐 Auth Log</b>`, output);
  });

  bot.action('log:authlog', async (ctx) => {
    ctx.answerCbQuery();
    const { stdout, stderr } = await exec('tail -n 100 /var/log/auth.log');
    return sendLongCodeBlock(ctx, `<b>🔐 Auth Log</b>`, stdout || stderr);
  });
}

module.exports = { register };
