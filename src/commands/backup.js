const path = require('path');
const fs = require('fs');
const { exec } = require('../utils/exec');
const { escapeHtml, codeBlock, truncate, formatBytes } = require('../utils/format');
const config = require('../config');

function register(bot) {
  bot.command('backup_create', async (ctx) => {
    const targetPath = ctx.message.text.split(/\s+/).slice(1).join(' ');
    if (!targetPath) return ctx.reply('❌ Укажите путь: /backup_create <path>');

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const dirName = path.basename(targetPath) || 'backup';
    const backupName = `${dirName}_${timestamp}.tar.gz`;
    const backupPath = path.join(config.backupDir, backupName);

    const msg = await ctx.reply(`⏳ Создаю бэкап <code>${escapeHtml(targetPath)}</code>...`, { parse_mode: 'HTML' });

    // Создаём директорию для бэкапов
    await exec(`mkdir -p ${JSON.stringify(config.backupDir)}`);

    const { stderr, exitCode } = await exec(
      `tar -czf ${JSON.stringify(backupPath)} -C ${JSON.stringify(path.dirname(targetPath))} ${JSON.stringify(path.basename(targetPath))}`,
      { timeout: 300_000 }
    );

    if (exitCode !== 0) {
      return ctx.telegram.editMessageText(ctx.chat.id, msg.message_id, null,
        `❌ Ошибка:\n${codeBlock(stderr)}`, { parse_mode: 'HTML' }
      );
    }

    const { stdout: sizeOut } = await exec(`stat -c%s ${JSON.stringify(backupPath)}`);
    const size = parseInt(sizeOut.trim(), 10) || 0;

    return ctx.telegram.editMessageText(ctx.chat.id, msg.message_id, null,
      `✅ Бэкап создан\n\n<b>Файл:</b> <code>${escapeHtml(backupName)}</code>\n<b>Размер:</b> ${formatBytes(size)}`,
      { parse_mode: 'HTML' }
    );
  });

  const handleBackupList = async (ctx) => {
    const { stdout, exitCode } = await exec(
      `ls -lhS ${JSON.stringify(config.backupDir)} 2>/dev/null | tail -n +2`
    );

    if (exitCode !== 0 || !stdout.trim()) {
      return ctx.reply('💾 Бэкапов нет.');
    }

    return ctx.reply(`<b>💾 Бэкапы</b>\n\n${codeBlock(truncate(stdout))}`, { parse_mode: 'HTML' });
  };

  bot.command('backup_list', handleBackupList);
  bot.hears('📋 Список бэкапов', handleBackupList);

  // Inline-кнопка
  bot.action('bk:list', async (ctx) => {
    ctx.answerCbQuery();
    const { stdout, exitCode } = await exec(
      `ls -lhS ${JSON.stringify(config.backupDir)} 2>/dev/null | tail -n +2`
    );

    if (exitCode !== 0 || !stdout.trim()) {
      return ctx.editMessageText('💾 Бэкапов нет.');
    }

    return ctx.editMessageText(`<b>💾 Бэкапы</b>\n\n${codeBlock(truncate(stdout))}`, { parse_mode: 'HTML' });
  });

  bot.command('backup_restore', async (ctx) => {
    const name = ctx.message.text.split(/\s+/)[1];
    if (!name) return ctx.reply('❌ Укажите имя: /backup_restore <name>');

    const backupPath = path.join(config.backupDir, name);
    const msg = await ctx.reply(`⏳ Восстанавливаю <code>${escapeHtml(name)}</code>...`, { parse_mode: 'HTML' });

    const { stderr, exitCode } = await exec(
      `tar -xzf ${JSON.stringify(backupPath)} -C /`,
      { timeout: 300_000 }
    );

    if (exitCode !== 0) {
      return ctx.telegram.editMessageText(ctx.chat.id, msg.message_id, null,
        `❌ Ошибка восстановления:\n${codeBlock(stderr)}`, { parse_mode: 'HTML' }
      );
    }

    return ctx.telegram.editMessageText(ctx.chat.id, msg.message_id, null,
      `✅ Бэкап <code>${escapeHtml(name)}</code> восстановлен.`, { parse_mode: 'HTML' }
    );
  });

  bot.command('backup_download', async (ctx) => {
    const name = ctx.message.text.split(/\s+/)[1];
    if (!name) return ctx.reply('❌ Укажите имя: /backup_download <name>');

    const backupPath = path.join(config.backupDir, name);

    try {
      fs.accessSync(backupPath, fs.constants.R_OK);
    } catch {
      return ctx.reply(`❌ Бэкап не найден: <code>${escapeHtml(name)}</code>`, { parse_mode: 'HTML' });
    }

    const stats = fs.statSync(backupPath);
    if (stats.size > 50 * 1024 * 1024) {
      return ctx.reply(`❌ Файл слишком большой (${formatBytes(stats.size)}). Telegram лимит: 50 MB`);
    }

    return ctx.replyWithDocument({
      source: backupPath,
      filename: name,
    });
  });
}

module.exports = { register };
