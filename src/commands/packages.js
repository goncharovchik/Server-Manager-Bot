const { exec } = require('../utils/exec');
const { codeBlock, truncate } = require('../utils/format');

function register(bot) {
  const handleUpdate = async (ctx) => {
    const msg = await ctx.reply('⏳ Обновляю список пакетов...');
    const { stdout, stderr, exitCode } = await exec('apt-get update -y', { timeout: 120_000 });

    const output = exitCode === 0
      ? `✅ <b>Список пакетов обновлён</b>\n\n${codeBlock(truncate(stdout))}`
      : `❌ <b>Ошибка обновления</b>\n\n${codeBlock(truncate(stderr || stdout))}`;

    return ctx.telegram.editMessageText(ctx.chat.id, msg.message_id, null, output, { parse_mode: 'HTML' });
  };

  const handleUpgrade = async (ctx) => {
    const msg = await ctx.reply('⏳ Обновляю пакеты (может занять несколько минут)...');
    const { stdout, stderr, exitCode } = await exec('apt-get upgrade -y', { timeout: 600_000 });

    const output = exitCode === 0
      ? `✅ <b>Пакеты обновлены</b>\n\n${codeBlock(truncate(stdout))}`
      : `❌ <b>Ошибка</b>\n\n${codeBlock(truncate(stderr || stdout))}`;

    return ctx.telegram.editMessageText(ctx.chat.id, msg.message_id, null, output, { parse_mode: 'HTML' });
  };

  bot.command('apt_update', handleUpdate);
  bot.hears('🔄 Update APT', handleUpdate);

  bot.action('apt:update', async (ctx) => {
    ctx.answerCbQuery('Обновляю...').catch(() => {});
    await ctx.editMessageText('⏳ Обновляю список пакетов...');
    const { stdout, stderr, exitCode } = await exec('apt-get update -y', { timeout: 120_000 });

    const output = exitCode === 0
      ? `✅ <b>Список пакетов обновлён</b>\n\n${codeBlock(truncate(stdout))}`
      : `❌ <b>Ошибка</b>\n\n${codeBlock(truncate(stderr || stdout))}`;

    return ctx.editMessageText(output, { parse_mode: 'HTML' });
  });

  bot.command('apt_upgrade', handleUpgrade);
  bot.hears('⬆️ Upgrade APT', handleUpgrade);

  bot.action('apt:upgrade', async (ctx) => {
    ctx.answerCbQuery('Обновляю пакеты...').catch(() => {});
    await ctx.editMessageText('⏳ Обновляю пакеты (может занять несколько минут)...');
    const { stdout, stderr, exitCode } = await exec('apt-get upgrade -y', { timeout: 600_000 });

    const output = exitCode === 0
      ? `✅ <b>Пакеты обновлены</b>\n\n${codeBlock(truncate(stdout))}`
      : `❌ <b>Ошибка</b>\n\n${codeBlock(truncate(stderr || stdout))}`;

    return ctx.editMessageText(output, { parse_mode: 'HTML' });
  });

  bot.command('apt_install', async (ctx) => {
    const name = ctx.message.text.split(/\s+/).slice(1).join(' ');
    if (!name) return ctx.reply('❌ Укажите пакет: /apt_install <name>');

    if (!/^[a-z0-9][a-z0-9.+\-]+$/.test(name)) {
      return ctx.reply('❌ Некорректное имя пакета.');
    }

    const msg = await ctx.reply(`⏳ Устанавливаю <code>${name}</code>...`, { parse_mode: 'HTML' });
    const { stdout, stderr, exitCode } = await exec(`apt-get install -y ${name}`, { timeout: 300_000 });

    const output = exitCode === 0
      ? `✅ <b>Пакет ${name} установлен</b>\n\n${codeBlock(truncate(stdout))}`
      : `❌ <b>Ошибка установки ${name}</b>\n\n${codeBlock(truncate(stderr || stdout))}`;

    return ctx.telegram.editMessageText(ctx.chat.id, msg.message_id, null, output, { parse_mode: 'HTML' });
  });
}

module.exports = { register };
