const config = require('../config');
const logger = require('../logger');

/**
 * Middleware авторизации — пропускает только пользователей из whitelist
 */
function authMiddleware(ctx, next) {
  const userId = ctx.from?.id;

  if (!userId || !config.adminIds.includes(userId)) {
    logger.warn(`Неавторизованный доступ: user=${userId} username=${ctx.from?.username || 'N/A'}`);
    return ctx.reply('⛔ Доступ запрещён.');
  }

  return next();
}

module.exports = authMiddleware;
