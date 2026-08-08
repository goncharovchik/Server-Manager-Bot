const { Telegraf } = require('telegraf');
const config = require('./config');
const logger = require('./logger');

// Middleware
const authMiddleware = require('./middleware/auth');
const rateLimitMiddleware = require('./middleware/rateLimit');
const actionLoggerMiddleware = require('./middleware/actionLogger');

// Модули команд
const startModule = require('./commands/start');
const monitoringModule = require('./commands/monitoring');
const servicesModule = require('./commands/services');
const dockerModule = require('./commands/docker');
const filesModule = require('./commands/files');
const usersModule = require('./commands/users');
const firewallModule = require('./commands/firewall');
const shellModule = require('./commands/shell');
const packagesModule = require('./commands/packages');
const backupModule = require('./commands/backup');
const logsModule = require('./commands/logs');

// Инициализация бота
const bot = new Telegraf(config.botToken);

// Подключение middleware (порядок важен)
bot.use(authMiddleware);
bot.use(rateLimitMiddleware);
bot.use(actionLoggerMiddleware);

// Регистрация модулей команд
startModule.register(bot);
monitoringModule.register(bot);
servicesModule.register(bot);
dockerModule.register(bot);
filesModule.register(bot);
usersModule.register(bot);
firewallModule.register(bot);
shellModule.register(bot);
packagesModule.register(bot);
backupModule.register(bot);
logsModule.register(bot);

// Обработка ошибок
bot.catch((err, ctx) => {
  logger.error(`Ошибка для ${ctx.updateType}: ${err.message}`);
  ctx.reply('❌ Произошла ошибка. Попробуйте снова.').catch(() => {});
});

// Запуск бота
bot.launch()
  .then(() => {
    logger.info(`✅ Бот запущен. Admins: [${config.adminIds.join(', ')}]`);
  })
  .catch((err) => {
    logger.error(`❌ Не удалось запустить бота: ${err.message}`);
    process.exit(1);
  });

// Graceful shutdown
process.once('SIGINT', () => {
  logger.info('Получен SIGINT, останавливаю бота...');
  bot.stop('SIGINT');
});
process.once('SIGTERM', () => {
  logger.info('Получен SIGTERM, останавливаю бота...');
  bot.stop('SIGTERM');
});
