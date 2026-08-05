const fs = require('fs');
const path = require('path');
const { exec } = require('../utils/exec');
const { escapeHtml, codeBlock, truncate, formatBytes } = require('../utils/format');

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB для Telegram
const MAX_CAT_SIZE = 1024 * 1024; // 1 MB для просмотра

function register(bot) {
  bot.command('ls', async (ctx) => {
    const targetPath = ctx.message.text.split(/\s+/).slice(1).join(' ') || '/';

    const { stdout, stderr, exitCode } = await exec(`ls -lah --color=never ${JSON.stringify(targetPath)}`);

    if (exitCode !== 0) {
      return ctx.reply(`❌ Ошибка:\n${codeBlock(stderr)}`, { parse_mode: 'HTML' });
    }

    return ctx.reply(
      `<b>📁 ${escapeHtml(targetPath)}</b>\n\n${codeBlock(truncate(stdout))}`,
      { parse_mode: 'HTML' }
    );
  });

  bot.command('cat', async (ctx) => {
    const targetPath = ctx.message.text.split(/\s+/).slice(1).join(' ');
    if (!targetPath) return ctx.reply('❌ Укажите путь: /cat <path>');

    try {
      const stats = fs.statSync(targetPath);
      if (stats.size > MAX_CAT_SIZE) {
        return ctx.reply(`❌ Файл слишком большой (${formatBytes(stats.size)}). Максимум: ${formatBytes(MAX_CAT_SIZE)}`);
      }
    } catch {
      return ctx.reply(`❌ Файл не найден: ${escapeHtml(targetPath)}`, { parse_mode: 'HTML' });
    }

    const { stdout, stderr, exitCode } = await exec(`cat ${JSON.stringify(targetPath)}`);

    if (exitCode !== 0) {
      return ctx.reply(`❌ Ошибка:\n${codeBlock(stderr)}`, { parse_mode: 'HTML' });
    }

    return ctx.reply(
      `<b>📄 ${escapeHtml(path.basename(targetPath))}</b>\n\n${codeBlock(truncate(stdout))}`,
      { parse_mode: 'HTML' }
    );
  });

  bot.command('download', async (ctx) => {
    const targetPath = ctx.message.text.split(/\s+/).slice(1).join(' ');
    if (!targetPath) return ctx.reply('❌ Укажите путь: /download <path>');

    try {
      const stats = fs.statSync(targetPath);
      if (stats.size > MAX_FILE_SIZE) {
        return ctx.reply(`❌ Файл слишком большой (${formatBytes(stats.size)}). Максимум: ${formatBytes(MAX_FILE_SIZE)}`);
      }
    } catch {
      return ctx.reply(`❌ Файл не найден: ${escapeHtml(targetPath)}`, { parse_mode: 'HTML' });
    }

    return ctx.replyWithDocument({
      source: targetPath,
      filename: path.basename(targetPath),
    });
  });

  bot.command('upload', (ctx) => {
    return ctx.reply('📎 Отправьте файл в ответ на это сообщение (reply), и укажите путь назначения в подписи к файлу.');
  });

  // Обработка загрузки файлов
  bot.on('document', async (ctx) => {
    const doc = ctx.message.document;
    if (!doc) return;

    // Путь назначения из подписи к файлу
    const destPath = ctx.message.caption?.trim();
    if (!destPath) {
      return ctx.reply('❌ Укажите путь назначения в подписи к файлу (caption).');
    }

    try {
      const link = await ctx.telegram.getFileLink(doc.file_id);
      const response = await fetch(link.href);
      const buffer = Buffer.from(await response.arrayBuffer());

      // Создаём директорию если нет
      const dir = path.dirname(destPath);
      fs.mkdirSync(dir, { recursive: true });

      fs.writeFileSync(destPath, buffer);

      return ctx.reply(
        `✅ Файл сохранён: <code>${escapeHtml(destPath)}</code>\nРазмер: ${formatBytes(buffer.length)}`,
        { parse_mode: 'HTML' }
      );
    } catch (err) {
      return ctx.reply(`❌ Ошибка загрузки: ${escapeHtml(err.message)}`, { parse_mode: 'HTML' });
    }
  });
}

module.exports = { register };
