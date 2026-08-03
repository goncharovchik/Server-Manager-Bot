const logger = require('../logger');

/**
 * Правила маскировки: [regex, replacer]
 * Каждый regex имеет группу(ы) для prefix, а значение после — \S+ для маскировки.
 * Порядок важен: более специфичные паттерны идут первыми.
 */
const SANITIZE_RULES = [
  // echo "user:pass" | chpasswd
  {
    pattern: /(echo\s+["']?\S+:)\S+(["']?\s*\|\s*chpasswd)/gi,
    replace: '$1***$2',
  },
  // passwd <user> <password>
  {
    pattern: /(passwd\s+\S+\s+)\S+/gi,
    replace: '$1***',
  },
  // --password=value, --pass=value, --token value, --secret=value и т.д.
  {
    pattern: /(--(?:pass(?:word|wd)?|token|secret|key|auth|credentials?)\s*[=\s])\S+/gi,
    replace: '$1***',
  },
  // PASSWORD=value, DB_PASSWORD=value, TOKEN=value, API_KEY=value
  {
    pattern: /((?:pass(?:word|wd)?|token|secret|api[_-]?key|auth|credentials?)\s*=)\S+/gi,
    replace: '$1***',
  },
  // mysql -p<password> (но НЕ --password, поэтому negative lookbehind)
  {
    pattern: /(?<!-)(-p)\S+/g,
    replace: '$1***',
  },
];

/**
 * Маскирует чувствительные данные в тексте команды
 */
function sanitize(text) {
  let result = text;
  for (const rule of SANITIZE_RULES) {
    rule.pattern.lastIndex = 0;
    result = result.replace(rule.pattern, rule.replace);
  }
  return result;
}

/**
 * Middleware логирования — записывает каждое действие пользователя
 * с маскировкой паролей и чувствительных данных
 */
function actionLoggerMiddleware(ctx, next) {
  const userId = ctx.from?.id || 'unknown';
  const username = ctx.from?.username || 'N/A';
  const text = ctx.message?.text || ctx.callbackQuery?.data || 'N/A';

  logger.info(`action: user=${userId} (@${username}) -> ${sanitize(text)}`);

  return next();
}

actionLoggerMiddleware.sanitize = sanitize;
module.exports = actionLoggerMiddleware;

