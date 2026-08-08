const path = require('path');
const fs = require('fs');
const { exec } = require('../utils/exec');
const { escapeHtml, codeBlock, sendLongCodeBlock, formatBytes } = require('../utils/format');

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB для Telegram
const MAX_CAT_SIZE = 1024 * 1024; // 1 MB для просмотра

/**
 * Экранирует аргумент для безопасной передачи в bash
 */
function escapeShellArg(arg) {
  return `'${String(arg).replace(/'/g, "'\\''")}'`;
}

function register(bot) {
  bot.command('ls', async (ctx) => {
    const targetPath = ctx.message.text.split(/\s+/).slice(1).join(' ') || '/';

    const { stdout, stderr, exitCode } = await exec(`ls -lah --color=never ${escapeShellArg(targetPath)}`);

    if (exitCode !== 0) {
      return ctx.reply(`❌ Ошибка:\n${codeBlock(stderr)}`, { parse_mode: 'HTML' });
    }

    return sendLongCodeBlock(ctx, `<b>📁 ${escapeHtml(targetPath)}</b>`, stdout);
  });

  bot.command('cat', async (ctx) => {
    const targetPath = ctx.message.text.split(/\s+/).slice(1).join(' ');
    if (!targetPath) return ctx.reply('❌ Укажите путь: /cat <path>');

    // Проверяем размер файла на хосте
    const { stdout: sizeOut, exitCode: statCode } = await exec(`stat -c%s ${escapeShellArg(targetPath)}`);
    if (statCode !== 0) {
      return ctx.reply(`❌ Файл не найден или недоступен: ${escapeHtml(targetPath)}`, { parse_mode: 'HTML' });
    }

    const fileSize = parseInt(sizeOut.trim(), 10) || 0;
    if (fileSize > MAX_CAT_SIZE) {
      return ctx.reply(`❌ Файл слишком большой (${formatBytes(fileSize)}). Максимум: ${formatBytes(MAX_CAT_SIZE)}`);
    }

    const { stdout, stderr, exitCode } = await exec(`cat ${escapeShellArg(targetPath)}`);

    if (exitCode !== 0) {
      return ctx.reply(`❌ Ошибка чтения:\n${codeBlock(stderr)}`, { parse_mode: 'HTML' });
    }

    return sendLongCodeBlock(ctx, `<b>📄 ${escapeHtml(path.basename(targetPath))}</b>`, stdout);
  });

  bot.command('download', async (ctx) => {
    const targetPath = ctx.message.text.split(/\s+/).slice(1).join(' ');
    if (!targetPath) return ctx.reply('❌ Укажите путь: /download <path>');

    // Проверяем размер файла на хосте
    const { stdout: sizeOut, exitCode: statCode } = await exec(`stat -c%s ${escapeShellArg(targetPath)}`);
    if (statCode !== 0) {
      return ctx.reply(`❌ Файл не найден или недоступен: ${escapeHtml(targetPath)}`, { parse_mode: 'HTML' });
    }

    const fileSize = parseInt(sizeOut.trim(), 10) || 0;
    if (fileSize > MAX_FILE_SIZE) {
      return ctx.reply(`❌ Файл слишком большой (${formatBytes(fileSize)}). Максимум: ${formatBytes(MAX_FILE_SIZE)}`);
    }

    // Читаем бинарный файл с хоста через base64
    const { stdout: b64Out, exitCode: b64Code, stderr } = await exec(`base64 -w 0 ${escapeShellArg(targetPath)}`, {
      timeout: 60_000,
    });

    if (b64Code !== 0) {
      return ctx.reply(`❌ Ошибка чтения файла:\n${codeBlock(stderr)}`, { parse_mode: 'HTML' });
    }

    const fileBuffer = Buffer.from(b64Out.trim(), 'base64');

    return ctx.replyWithDocument({
      source: fileBuffer,
      filename: path.basename(targetPath),
    });
  });

  bot.command('upload', (ctx) => {
    return ctx.reply('📎 Отправьте файл в ответ на это сообщение (reply), и укажите путь назначения в подписи к файлу (caption).');
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

      const dir = path.dirname(destPath);
      const b64Data = buffer.toString('base64');

      // Создаем директорию и записываем файл на хосте через exec и base64
      const tmpB64File = `/tmp/upload_${Date.now()}_${Math.random().toString(36).slice(2)}.b64`;
      fs.writeFileSync(tmpB64File, b64Data);

      const cmd = `mkdir -p ${escapeShellArg(dir)} && base64 -d ${escapeShellArg(tmpB64File)} > ${escapeShellArg(destPath)} && rm -f ${escapeShellArg(tmpB64File)}`;
      const { stderr, exitCode } = await exec(cmd);

      if (fs.existsSync(tmpB64File)) {
        try { fs.unlinkSync(tmpB64File); } catch {}
      }

      if (exitCode !== 0) {
        return ctx.reply(`❌ Ошибка сохранения файла на хост:\n${codeBlock(stderr)}`, { parse_mode: 'HTML' });
      }

      return ctx.reply(
        `✅ Файл сохранён на хосте: <code>${escapeHtml(destPath)}</code>\nРазмер: ${formatBytes(buffer.length)}`,
        { parse_mode: 'HTML' }
      );
    } catch (err) {
      return ctx.reply(`❌ Ошибка загрузки: ${escapeHtml(err.message)}`, { parse_mode: 'HTML' });
    }
  });
}

module.exports = { register, escapeShellArg };
