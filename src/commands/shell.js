const { exec } = require('../utils/exec');
const { codeBlock, sendLongCodeBlock } = require('../utils/format');

function register(bot) {
  bot.command('shell', async (ctx) => {
    let command = ctx.message.text.replace(/^\/shell\s*/, '').trim();
    if (!command) return ctx.reply('❌ Укажите команду: /shell <command>');

    // Автоматическое преобразование интерактивных команд в пакетный режим
    const trimmedCmd = command.toLowerCase();

    if (/^(htop|top)$/.test(trimmedCmd)) {
      command = 'top -b -n 1';
    } else if (/^(nano|vim|vi|emacs|less|more|mc)\b/.test(trimmedCmd)) {
      return ctx.reply(
        '⚠️ Интерактивные консольные утилиты (nano, vim, less, mc) не поддерживаются в Telegram Shell.\n\n' +
        '• Для просмотра файлов используйте <code>/cat &lt;path&gt;</code>\n' +
        '• Для работы с файлами: <code>/download &lt;path&gt;</code> и <code>/upload</code>',
        { parse_mode: 'HTML' }
      );
    }

    const msg = await ctx.reply('⏳ Выполняю...');
    const { stdout, stderr, exitCode } = await exec(command);

    let output = '';
    if (stdout) output += stdout;
    if (stderr) output += (output ? '\n' : '') + stderr;
    if (!output) output = '(пустой вывод)';

    const header = exitCode === 0
      ? `✅ <b>Exit code: ${exitCode}</b>`
      : `❌ <b>Exit code: ${exitCode}</b>`;

    return sendLongCodeBlock(ctx, header, output, { editMessageId: msg.message_id });
  });
}

module.exports = { register };
