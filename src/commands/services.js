const { Markup } = require('telegraf');
const { exec } = require('../utils/exec');
const { escapeHtml, codeBlock, truncate } = require('../utils/format');

async function getServicesList() {
  const { stdout } = await exec(
    'systemctl list-units --type=service --state=running,failed,exited --no-pager --no-legend --plain'
  );

  const lines = stdout.trim().split('\n').filter(Boolean);
  const services = lines.map((line) => {
    const parts = line.trim().split(/\s+/);
    const name = parts[0]?.replace('.service', '') || '';
    const load = parts[1] || '';
    const active = parts[2] || '';
    const sub = parts[3] || '';
    return { name, load, active, sub };
  });

  return services;
}

function statusEmoji(active, sub) {
  if (active === 'active' && sub === 'running') return '🟢';
  if (active === 'active' && sub === 'exited') return '⚪';
  if (active === 'failed') return '🔴';
  return '🟡';
}

function register(bot) {
  bot.command('services', async (ctx) => {
    const msg = await ctx.reply('⏳ Получаю список сервисов...');
    const services = await getServicesList();

    if (services.length === 0) {
      return ctx.telegram.editMessageText(ctx.chat.id, msg.message_id, null, '⚙️ Сервисы не найдены.');
    }

    let text = `<b>⚙️ Сервисы (${services.length})</b>\n\n`;
    for (const svc of services.slice(0, 40)) {
      text += `${statusEmoji(svc.active, svc.sub)} <code>${escapeHtml(svc.name)}</code> [${svc.sub}]\n`;
    }
    if (services.length > 40) {
      text += `\n... и ещё ${services.length - 40}`;
    }

    return ctx.telegram.editMessageText(ctx.chat.id, msg.message_id, null, truncate(text), { parse_mode: 'HTML' });
  });

  // Inline-кнопка из подменю
  bot.action('svc:list', async (ctx) => {
    ctx.answerCbQuery();
    const services = await getServicesList();

    if (services.length === 0) {
      return ctx.editMessageText('⚙️ Сервисы не найдены.');
    }

    let text = `<b>⚙️ Сервисы (${services.length})</b>\n\n`;
    for (const svc of services.slice(0, 40)) {
      text += `${statusEmoji(svc.active, svc.sub)} <code>${escapeHtml(svc.name)}</code> [${svc.sub}]\n`;
    }
    if (services.length > 40) {
      text += `\n... и ещё ${services.length - 40}`;
    }

    return ctx.editMessageText(truncate(text), { parse_mode: 'HTML' });
  });

  bot.command('service_start', async (ctx) => {
    const name = ctx.message.text.split(/\s+/)[1];
    if (!name) return ctx.reply('❌ Укажите имя сервиса: /service_start <name>');

    const msg = await ctx.reply(`⏳ Запускаю ${escapeHtml(name)}...`, { parse_mode: 'HTML' });
    const { stderr, exitCode } = await exec(`systemctl start ${name}`);

    if (exitCode !== 0) {
      return ctx.telegram.editMessageText(ctx.chat.id, msg.message_id, null,
        `❌ Ошибка запуска <code>${escapeHtml(name)}</code>:\n${codeBlock(stderr)}`,
        { parse_mode: 'HTML' }
      );
    }

    return ctx.telegram.editMessageText(ctx.chat.id, msg.message_id, null,
      `✅ Сервис <code>${escapeHtml(name)}</code> запущен.`,
      { parse_mode: 'HTML' }
    );
  });

  bot.command('service_stop', async (ctx) => {
    const name = ctx.message.text.split(/\s+/)[1];
    if (!name) return ctx.reply('❌ Укажите имя сервиса: /service_stop <name>');

    const msg = await ctx.reply(`⏳ Останавливаю ${escapeHtml(name)}...`, { parse_mode: 'HTML' });
    const { stderr, exitCode } = await exec(`systemctl stop ${name}`);

    if (exitCode !== 0) {
      return ctx.telegram.editMessageText(ctx.chat.id, msg.message_id, null,
        `❌ Ошибка остановки <code>${escapeHtml(name)}</code>:\n${codeBlock(stderr)}`,
        { parse_mode: 'HTML' }
      );
    }

    return ctx.telegram.editMessageText(ctx.chat.id, msg.message_id, null,
      `✅ Сервис <code>${escapeHtml(name)}</code> остановлен.`,
      { parse_mode: 'HTML' }
    );
  });

  bot.command('service_restart', async (ctx) => {
    const name = ctx.message.text.split(/\s+/)[1];
    if (!name) return ctx.reply('❌ Укажите имя сервиса: /service_restart <name>');

    const msg = await ctx.reply(`⏳ Перезапускаю ${escapeHtml(name)}...`, { parse_mode: 'HTML' });
    const { stderr, exitCode } = await exec(`systemctl restart ${name}`);

    if (exitCode !== 0) {
      return ctx.telegram.editMessageText(ctx.chat.id, msg.message_id, null,
        `❌ Ошибка перезапуска <code>${escapeHtml(name)}</code>:\n${codeBlock(stderr)}`,
        { parse_mode: 'HTML' }
      );
    }

    return ctx.telegram.editMessageText(ctx.chat.id, msg.message_id, null,
      `✅ Сервис <code>${escapeHtml(name)}</code> перезапущен.`,
      { parse_mode: 'HTML' }
    );
  });

  bot.command('service_status', async (ctx) => {
    const name = ctx.message.text.split(/\s+/)[1];
    if (!name) return ctx.reply('❌ Укажите имя сервиса: /service_status <name>');

    const { stdout, stderr } = await exec(`systemctl status ${name} --no-pager`);
    const output = stdout || stderr;
    return ctx.reply(`<b>⚙️ ${escapeHtml(name)}</b>\n\n${codeBlock(truncate(output))}`, {
      parse_mode: 'HTML',
    });
  });
}

module.exports = { register };
