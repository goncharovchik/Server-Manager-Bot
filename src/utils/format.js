const MAX_MESSAGE_LENGTH = 4000; // Telegram лимит 4096, оставляем запас

/**
 * Экранирование HTML-спецсимволов для Telegram HTML parse mode
 */
function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Оборачивает текст в <pre> блок с экранированием
 */
function codeBlock(text) {
  return `<pre>${escapeHtml(text)}</pre>`;
}

/**
 * Обрезает текст до лимита Telegram, добавляя маркер обрезки
 */
function truncate(text, maxLen = MAX_MESSAGE_LENGTH) {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen - 20) + '\n... (обрезано)';
}

/**
 * Разбивает длинный текст на массив сообщений
 */
function splitMessage(text, maxLen = MAX_MESSAGE_LENGTH) {
  if (text.length <= maxLen) return [text];

  const chunks = [];
  let remaining = text;

  while (remaining.length > 0) {
    if (remaining.length <= maxLen) {
      chunks.push(remaining);
      break;
    }

    // Ищем последний перенос строки в пределах лимита
    let splitAt = remaining.lastIndexOf('\n', maxLen);
    if (splitAt === -1 || splitAt < maxLen * 0.5) {
      splitAt = maxLen;
    }

    chunks.push(remaining.slice(0, splitAt));
    remaining = remaining.slice(splitAt).trimStart();
  }

  return chunks;
}

/**
 * Форматирует байты в читаемый вид
 */
function formatBytes(bytes) {
  const num = Number(bytes);
  if (isNaN(num) || num <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.min(Math.floor(Math.log(num) / Math.log(1024)), units.length - 1);
  return `${(num / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

/**
 * Форматирует uptime (секунды) в читаемый вид
 */
function formatUptime(seconds) {
  const sec = Number(seconds) || 0;
  const d = Math.floor(sec / 86400);
  const h = Math.floor((sec % 86400) / 3600);
  const m = Math.floor((sec % 3600) / 60);

  const parts = [];
  if (d > 0) parts.push(`${d}д`);
  if (h > 0) parts.push(`${h}ч`);
  parts.push(`${m}м`);

  return parts.join(' ');
}

/**
 * Генерирует прогресс-бар
 */
function progressBar(percent, length = 10) {
  const safePercent = Math.min(Math.max(Number(percent) || 0, 0), 100);
  const filled = Math.min(Math.max(Math.round((safePercent / 100) * length), 0), length);
  const empty = length - filled;
  return '█'.repeat(filled) + '░'.repeat(empty);
}

/**
 * Отправляет многострочный код/текст, автоматически разбивая его на несколько сообщений при превышении лимита
 */
async function sendLongCodeBlock(ctx, title, content, options = {}) {
  const parseMode = options.parse_mode || options.parseMode || 'HTML';
  const editMsgId = options.editMessageId || null;
  const maxChunkLen = options.maxChunkLen || 3500;

  const rawContent = String(content || '').trim();
  if (!rawContent) {
    const text = title ? `${title}\n\n${codeBlock('(пусто)')}` : codeBlock('(пусто)');
    if (editMsgId) {
      return ctx.telegram.editMessageText(ctx.chat.id, editMsgId, null, text, { parse_mode: parseMode });
    }
    return ctx.reply(text, { parse_mode: parseMode });
  }

  const chunks = splitMessage(rawContent, maxChunkLen);

  for (let i = 0; i < chunks.length; i++) {
    const prefix = (i === 0 && title) ? `${title}\n\n` : '';
    const chunkCounter = chunks.length > 1 ? `\n<i>[Часть ${i + 1}/${chunks.length}]</i>` : '';
    const formatted = `${prefix}${codeBlock(chunks[i])}${chunkCounter}`;

    if (i === 0 && editMsgId) {
      await ctx.telegram.editMessageText(ctx.chat.id, editMsgId, null, formatted, { parse_mode: parseMode });
    } else {
      await ctx.reply(formatted, { parse_mode: parseMode });
    }
  }
}

module.exports = {
  escapeHtml,
  codeBlock,
  truncate,
  splitMessage,
  sendLongCodeBlock,
  formatBytes,
  formatUptime,
  progressBar,
  MAX_MESSAGE_LENGTH,
};
