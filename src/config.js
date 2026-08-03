require('dotenv').config();

const config = {
  botToken: process.env.BOT_TOKEN,
  adminIds: (process.env.ADMIN_IDS || '')
    .split(',')
    .map((id) => parseInt(id.trim(), 10))
    .filter((id) => !isNaN(id)),
  rateLimit: parseInt(process.env.RATE_LIMIT, 10) || 30,
  logLevel: process.env.LOG_LEVEL || 'info',
  backupDir: process.env.BACKUP_DIR || '/var/backups/vds_bot',
};

// Валидация обязательных переменных
if (!config.botToken) {
  console.error('❌ BOT_TOKEN не задан в .env файле');
  process.exit(1);
}

if (config.adminIds.length === 0) {
  console.error('❌ ADMIN_IDS не задан в .env файле');
  process.exit(1);
}

module.exports = config;
