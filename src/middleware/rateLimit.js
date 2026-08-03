const config = require('../config');
const logger = require('../logger');

/** @type {Map<number, number[]>} userId -> timestamps */
const windows = new Map();

/**
 * Sliding window rate limiter middleware
 */
function rateLimitMiddleware(ctx, next) {
  const userId = ctx.from?.id;
  if (!userId) return next();

  const now = Date.now();
  const windowMs = 60_000; // 1 минута

  let timestamps = windows.get(userId) || [];
  // Убираем записи старше окна
  timestamps = timestamps.filter((t) => now - t < windowMs);

  if (timestamps.length >= config.rateLimit) {
    logger.warn(`Rate limit: user=${userId} (${timestamps.length}/${config.rateLimit})`);
    return ctx.reply(`⏳ Слишком много запросов. Лимит: ${config.rateLimit} команд в минуту.`);
  }

  timestamps.push(now);
  windows.set(userId, timestamps);
  return next();
}

module.exports = rateLimitMiddleware;
