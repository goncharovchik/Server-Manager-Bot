const config = require('../config');
const logger = require('../logger');

/**
 * Middleware авторизации — пропускает только пользователей из whitelist
 */
function authMiddleware(ctx, next) {
  const userId = ctx.from?.id;

  if (!userId || !config.adminIds.includes(userId)) {
    logger.warn(`Неавторизованный доступ (игнорируется): user=${userId} username=${ctx.from?.username || 'N/A'}`);
    return;
  }

  return next();
}

module.exports = authMiddleware;
