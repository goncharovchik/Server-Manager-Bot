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
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

/**
 * Форматирует uptime (секунды) в читаемый вид
 */
function formatUptime(seconds) {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);

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
  const filled = Math.round((percent / 100) * length);
  const empty = length - filled;
  return '█'.repeat(filled) + '░'.repeat(empty);
}

module.exports = {
  escapeHtml,
  codeBlock,
  truncate,
  splitMessage,
  formatBytes,
  formatUptime,
  progressBar,
  MAX_MESSAGE_LENGTH,
};
