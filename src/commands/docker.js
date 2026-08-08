const Docker = require('dockerode');
const { Markup } = require('telegraf');
const { escapeHtml, codeBlock, truncate, sendLongCodeBlock } = require('../utils/format');
const logger = require('../logger');

let docker;
try {
  docker = new Docker({ socketPath: '/var/run/docker.sock' });
} catch (err) {
  logger.warn(`Docker недоступен: ${err.message}`);
}

function statusEmoji(state) {
  switch (state) {
    case 'running': return '🟢';
    case 'exited': return '🔴';
    case 'paused': return '🟡';
    case 'restarting': return '🔄';
    case 'created': return '⚪';
    default: return '⚫';
  }
}

async function getContainersList() {
  if (!docker) return null;

  const containers = await docker.listContainers({ all: true });
  return containers.map((c) => ({
    id: c.Id.slice(0, 12),
    name: (c.Names[0] || '').replace(/^\//, ''),
    image: c.Image,
    state: c.State,
    status: c.Status,
  }));
}

function containerButtons(containers) {
  const buttons = containers.slice(0, 20).map((c) => [
    Markup.button.callback(
      `${statusEmoji(c.state)} ${c.name}`,
      `docker:info:${c.name}`
    ),
  ]);
  buttons.push([Markup.button.callback('« Назад', 'menu:main')]);
  return Markup.inlineKeyboard(buttons);
}

function containerActionButtons(name) {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback('▶️ Start', `docker:start:${name}`),
      Markup.button.callback('⏹ Stop', `docker:stop:${name}`),
      Markup.button.callback('🔄 Restart', `docker:restart:${name}`),
    ],
    [
      Markup.button.callback('📋 Logs', `docker:logs:${name}`),
      Markup.button.callback('« Контейнеры', 'docker:list'),
    ],
  ]);
}

function register(bot) {
  // Проверка доступности Docker
  function checkDocker(ctx) {
    if (!docker) {
      ctx.reply('❌ Docker не найден. Убедитесь, что Docker установлен и сокет доступен.');
      return false;
    }
    return true;
  }

  const handleContainers = async (ctx) => {
    if (!checkDocker(ctx)) return;

    const containers = await getContainersList();
    if (!containers || containers.length === 0) {
      return ctx.reply('🐳 Контейнеры не найдены.');
    }

    let text = `<b>🐳 Контейнеры (${containers.length})</b>\n\n`;
    for (const c of containers) {
      text += `${statusEmoji(c.state)} <code>${escapeHtml(c.name)}</code> — ${escapeHtml(c.status)}\n`;
      text += `   Image: <code>${escapeHtml(c.image)}</code>\n`;
    }

    return ctx.reply(truncate(text), {
      parse_mode: 'HTML',
      ...containerButtons(containers),
    });
  };

  bot.command('containers', handleContainers);
  bot.hears('📋 Контейнеры', handleContainers);

  // Inline: список контейнеров
  bot.action('docker:list', async (ctx) => {
    if (!checkDocker(ctx)) return;
    ctx.answerCbQuery().catch(() => {});

    const containers = await getContainersList();
    if (!containers || containers.length === 0) {
      return ctx.editMessageText('🐳 Контейнеры не найдены.');
    }

    let text = `<b>🐳 Контейнеры (${containers.length})</b>\n\n`;
    for (const c of containers) {
      text += `${statusEmoji(c.state)} <code>${escapeHtml(c.name)}</code> — ${escapeHtml(c.status)}\n`;
    }

    return ctx.editMessageText(truncate(text), {
      parse_mode: 'HTML',
      ...containerButtons(containers),
    });
  });

  // Inline: инфо о контейнере
  bot.action(/^docker:info:(.+)$/, async (ctx) => {
    if (!checkDocker(ctx)) return;
    ctx.answerCbQuery().catch(() => {});
    const name = ctx.match[1];

    try {
      const container = docker.getContainer(name);
      const info = await container.inspect();

      let text = `<b>🐳 ${escapeHtml(name)}</b>\n\n`;
      text += `<b>Image:</b> <code>${escapeHtml(info.Config.Image)}</code>\n`;
      text += `<b>Статус:</b> ${statusEmoji(info.State.Status)} ${escapeHtml(info.State.Status)}\n`;
      text += `<b>Создан:</b> ${new Date(info.Created).toLocaleString('ru-RU')}\n`;
      text += `<b>ID:</b> <code>${info.Id.slice(0, 12)}</code>\n`;

      if (info.State.StartedAt) {
        text += `<b>Запущен:</b> ${new Date(info.State.StartedAt).toLocaleString('ru-RU')}\n`;
      }

      // Порты
      const ports = info.NetworkSettings?.Ports;
      if (ports && Object.keys(ports).length > 0) {
        text += `\n<b>Порты:</b>\n`;
        for (const [container_port, bindings] of Object.entries(ports)) {
          if (bindings && bindings.length > 0) {
            for (const b of bindings) {
              text += `  ${b.HostPort} → ${container_port}\n`;
            }
          } else {
            text += `  ${container_port} (не проброшен)\n`;
          }
        }
      }

      return ctx.editMessageText(text, {
        parse_mode: 'HTML',
        ...containerActionButtons(name),
      });
    } catch (err) {
      return ctx.editMessageText(`❌ Контейнер <code>${escapeHtml(name)}</code> не найден.`, {
        parse_mode: 'HTML',
      });
    }
  });

  // Inline: start/stop/restart
  bot.action(/^docker:(start|stop|restart):(.+)$/, async (ctx) => {
    if (!checkDocker(ctx)) return;
    ctx.answerCbQuery().catch(() => {});
    const action = ctx.match[1];
    const name = ctx.match[2];

    const actionNames = { start: 'Запускаю', stop: 'Останавливаю', restart: 'Перезапускаю' };
    const actionDone = { start: 'запущен', stop: 'остановлен', restart: 'перезапущен' };

    try {
      const container = docker.getContainer(name);
      await container[action]();
      return ctx.editMessageText(
        `✅ Контейнер <code>${escapeHtml(name)}</code> ${actionDone[action]}.`,
        { parse_mode: 'HTML', ...containerActionButtons(name) }
      );
    } catch (err) {
      return ctx.editMessageText(
        `❌ Ошибка (${action}) <code>${escapeHtml(name)}</code>:\n${codeBlock(err.message)}`,
        { parse_mode: 'HTML' }
      );
    }
  });

  // Inline: логи контейнера
  bot.action(/^docker:logs:(.+)$/, async (ctx) => {
    if (!checkDocker(ctx)) return;
    ctx.answerCbQuery().catch(() => {});
    const name = ctx.match[1];

    try {
      const container = docker.getContainer(name);
      const logs = await container.logs({ stdout: true, stderr: true, tail: 50 });
      const logText = logs.toString('utf8').replace(/[\x00-\x08]/g, '');

      return ctx.editMessageText(
        `<b>📋 Логи: ${escapeHtml(name)}</b>\n\n${codeBlock(truncate(logText))}`,
        { parse_mode: 'HTML', ...containerActionButtons(name) }
      );
    } catch (err) {
      return ctx.editMessageText(
        `❌ Ошибка получения логов <code>${escapeHtml(name)}</code>:\n${codeBlock(err.message)}`,
        { parse_mode: 'HTML' }
      );
    }
  });

  // Текстовые команды
  bot.command('container_start', async (ctx) => {
    if (!checkDocker(ctx)) return;
    const name = ctx.message.text.split(/\s+/)[1];
    if (!name) return ctx.reply('❌ Укажите имя: /container_start <name>');

    try {
      const container = docker.getContainer(name);
      await container.start();
      return ctx.reply(`✅ Контейнер <code>${escapeHtml(name)}</code> запущен.`, { parse_mode: 'HTML' });
    } catch (err) {
      return ctx.reply(`❌ Ошибка: ${codeBlock(err.message)}`, { parse_mode: 'HTML' });
    }
  });

  bot.command('container_stop', async (ctx) => {
    if (!checkDocker(ctx)) return;
    const name = ctx.message.text.split(/\s+/)[1];
    if (!name) return ctx.reply('❌ Укажите имя: /container_stop <name>');

    try {
      const container = docker.getContainer(name);
      await container.stop();
      return ctx.reply(`✅ Контейнер <code>${escapeHtml(name)}</code> остановлен.`, { parse_mode: 'HTML' });
    } catch (err) {
      return ctx.reply(`❌ Ошибка: ${codeBlock(err.message)}`, { parse_mode: 'HTML' });
    }
  });

  bot.command('container_restart', async (ctx) => {
    if (!checkDocker(ctx)) return;
    const name = ctx.message.text.split(/\s+/)[1];
    if (!name) return ctx.reply('❌ Укажите имя: /container_restart <name>');

    try {
      const container = docker.getContainer(name);
      await container.restart();
      return ctx.reply(`✅ Контейнер <code>${escapeHtml(name)}</code> перезапущен.`, { parse_mode: 'HTML' });
    } catch (err) {
      return ctx.reply(`❌ Ошибка: ${codeBlock(err.message)}`, { parse_mode: 'HTML' });
    }
  });

  bot.command('container_logs', async (ctx) => {
    if (!checkDocker(ctx)) return;
    const name = ctx.message.text.split(/\s+/)[1];
    if (!name) return ctx.reply('❌ Укажите имя: /container_logs <name>');

    try {
      const container = docker.getContainer(name);
      const logs = await container.logs({ stdout: true, stderr: true, tail: 100 });
      const logText = logs.toString('utf8').replace(/[\x00-\x08]/g, '');

      return sendLongCodeBlock(ctx, `<b>📋 Логи: ${escapeHtml(name)}</b>`, logText);
    } catch (err) {
      return ctx.reply(`❌ Ошибка: ${codeBlock(err.message)}`, { parse_mode: 'HTML' });
    }
  });
}

module.exports = { register };
