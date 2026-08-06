const { exec } = require('../utils/exec');
const { codeBlock, truncate, splitMessage } = require('../utils/format');

function register(bot) {
  bot.command('shell', async (ctx) => {
    const command = ctx.message.text.replace(/^\/shell\s*/, '');
    if (!command) return ctx.reply('❌ Укажите команду: /shell <command>');

    const msg = await ctx.reply('⏳ Выполняю...');
    const { stdout, stderr, exitCode } = await exec(command);

    let output = '';
    if (stdout) output += stdout;
    if (stderr) output += (output ? '\n' : '') + stderr;
    if (!output) output = '(пустой вывод)';

    const header = exitCode === 0
      ? `✅ <b>Exit code: ${exitCode}</b>`
      : `❌ <b>Exit code: ${exitCode}</b>`;

    const fullText = `${header}\n\n${codeBlock(truncate(output))}`;

    return ctx.telegram.editMessageText(ctx.chat.id, msg.message_id, null, fullText, {
      parse_mode: 'HTML',
    });
  });
}

module.exports = { register };
