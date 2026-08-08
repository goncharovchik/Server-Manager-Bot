const { exec } = require('../utils/exec');
const { escapeHtml, codeBlock, truncate } = require('../utils/format');

async function checkUfw() {
  const { exitCode, stdout } = await exec('ufw status');
  return exitCode === 0 && !stdout.includes('command not found');
}

async function getStatusOutput() {
  const hasUfw = await checkUfw();
  if (hasUfw) {
    const { stdout, stderr } = await exec('ufw status');
    return { type: 'UFW', output: stdout || stderr };
  }
  const { stdout, stderr } = await exec('iptables -L -n -v');
  return { type: 'iptables', output: stdout || stderr };
}

async function getRulesOutput() {
  const hasUfw = await checkUfw();
  if (hasUfw) {
    const { stdout, stderr } = await exec('ufw status numbered');
    return { type: 'UFW', output: stdout || stderr };
  }
  const { stdout, stderr } = await exec('iptables -L INPUT --line-numbers -n -v');
  return { type: 'iptables (INPUT)', output: stdout || stderr };
}

function parsePortProto(input) {
  if (!input) return null;
  const match = input.trim().match(/^(\d+)(?:\/(tcp|udp))?$/i);
  if (!match) return null;
  return {
    port: match[1],
    proto: (match[2] || 'tcp').toLowerCase(),
  };
}

function register(bot) {
  const handleFwStatus = async (ctx) => {
    const { type, output } = await getStatusOutput();
    return ctx.reply(`<b>🔥 Firewall Status (${type})</b>\n\n${codeBlock(truncate(output))}`, { parse_mode: 'HTML' });
  };

  const handleFwRules = async (ctx) => {
    const { type, output } = await getRulesOutput();
    return ctx.reply(`<b>🔥 Firewall Rules (${type})</b>\n\n${codeBlock(truncate(output))}`, { parse_mode: 'HTML' });
  };

  // --- Общие команды Firewall (UFW + iptables fallback) ---
  bot.command('fw_status', handleFwStatus);
  bot.hears('📋 Статус Firewall', handleFwStatus);

  bot.action('fw:status', async (ctx) => {
    ctx.answerCbQuery().catch(() => {});
    const { type, output } = await getStatusOutput();
    return ctx.editMessageText(`<b>🔥 Firewall Status (${type})</b>\n\n${codeBlock(truncate(output))}`, { parse_mode: 'HTML' });
  });

  bot.command('fw_rules', handleFwRules);
  bot.hears('📜 Правила UFW', handleFwRules);

  bot.action('fw:rules', async (ctx) => {
    ctx.answerCbQuery().catch(() => {});
    const { type, output } = await getRulesOutput();
    return ctx.editMessageText(`<b>🔥 Firewall Rules (${type})</b>\n\n${codeBlock(truncate(output))}`, { parse_mode: 'HTML' });
  });

  bot.command('fw_allow', async (ctx) => {
    const portArg = ctx.message.text.split(/\s+/)[1];
    const parsed = parsePortProto(portArg);
    if (!parsed) return ctx.reply('❌ Укажите порт: /fw_allow <port> (Пример: 80, 443/tcp, 53/udp)');

    const hasUfw = await checkUfw();
    if (hasUfw) {
      const { stdout, stderr, exitCode } = await exec(`ufw allow ${portArg}`);
      if (exitCode !== 0) {
        return ctx.reply(`❌ Ошибка UFW:\n${codeBlock(stderr)}`, { parse_mode: 'HTML' });
      }
      return ctx.reply(`✅ UFW: Порт <code>${escapeHtml(portArg)}</code> открыт.\n${codeBlock(stdout)}`, { parse_mode: 'HTML' });
    }

    // Fallback на iptables
    const cmd = `iptables -I INPUT -p ${parsed.proto} --dport ${parsed.port} -j ACCEPT`;
    const { stdout, stderr, exitCode } = await exec(cmd);
    if (exitCode !== 0) {
      return ctx.reply(`❌ Ошибка iptables:\n${codeBlock(stderr)}`, { parse_mode: 'HTML' });
    }
    return ctx.reply(`✅ iptables: Правило добавлено (ACCEPT ${parsed.port}/${parsed.proto}).\n${codeBlock(stdout || 'ОК')}`, { parse_mode: 'HTML' });
  });

  bot.command('fw_deny', async (ctx) => {
    const portArg = ctx.message.text.split(/\s+/)[1];
    const parsed = parsePortProto(portArg);
    if (!parsed) return ctx.reply('❌ Укажите порт: /fw_deny <port> (Пример: 80, 443/tcp, 53/udp)');

    const hasUfw = await checkUfw();
    if (hasUfw) {
      const { stdout, stderr, exitCode } = await exec(`ufw deny ${portArg}`);
      if (exitCode !== 0) {
        return ctx.reply(`❌ Ошибка UFW:\n${codeBlock(stderr)}`, { parse_mode: 'HTML' });
      }
      return ctx.reply(`✅ UFW: Порт <code>${escapeHtml(portArg)}</code> закрыт.\n${codeBlock(stdout)}`, { parse_mode: 'HTML' });
    }

    // Fallback на iptables
    const cmd = `iptables -I INPUT -p ${parsed.proto} --dport ${parsed.port} -j DROP`;
    const { stdout, stderr, exitCode } = await exec(cmd);
    if (exitCode !== 0) {
      return ctx.reply(`❌ Ошибка iptables:\n${codeBlock(stderr)}`, { parse_mode: 'HTML' });
    }
    return ctx.reply(`✅ iptables: Правило добавлено (DROP ${parsed.port}/${parsed.proto}).\n${codeBlock(stdout || 'ОК')}`, { parse_mode: 'HTML' });
  });

  const handleIptables = async (ctx) => {
    const { stdout, stderr } = await exec('iptables -L -n -v --line-numbers');
    return ctx.reply(`<b>🧱 iptables Rules</b>\n\n${codeBlock(truncate(stdout || stderr))}`, { parse_mode: 'HTML' });
  };

  // --- Явные команды iptables ---
  bot.command(['iptables', 'iptables_status'], handleIptables);
  bot.hears('🧱 Правила iptables', handleIptables);

  bot.action('fw:iptables', async (ctx) => {
    ctx.answerCbQuery().catch(() => {});
    const { stdout, stderr } = await exec('iptables -L -n -v --line-numbers');
    return ctx.editMessageText(`<b>🧱 iptables Rules</b>\n\n${codeBlock(truncate(stdout || stderr))}`, { parse_mode: 'HTML' });
  });

  bot.command('iptables_allow', async (ctx) => {
    const portArg = ctx.message.text.split(/\s+/)[1];
    const parsed = parsePortProto(portArg);
    if (!parsed) return ctx.reply('❌ Использование: /iptables_allow <port[/tcp|udp]>\nПример: /iptables_allow 8080/tcp');

    const cmd = `iptables -I INPUT -p ${parsed.proto} --dport ${parsed.port} -j ACCEPT`;
    const { stdout, stderr, exitCode } = await exec(cmd);
    if (exitCode !== 0) {
      return ctx.reply(`❌ Ошибка iptables:\n${codeBlock(stderr)}`, { parse_mode: 'HTML' });
    }
    return ctx.reply(`✅ iptables: Разрешен трафик на порт <code>${escapeHtml(parsed.port)}/${parsed.proto}</code>\n${codeBlock(stdout || 'ОК')}`, { parse_mode: 'HTML' });
  });

  bot.command('iptables_deny', async (ctx) => {
    const portArg = ctx.message.text.split(/\s+/)[1];
    const parsed = parsePortProto(portArg);
    if (!parsed) return ctx.reply('❌ Использование: /iptables_deny <port[/tcp|udp]>\nПример: /iptables_deny 8080/tcp');

    const cmd = `iptables -I INPUT -p ${parsed.proto} --dport ${parsed.port} -j DROP`;
    const { stdout, stderr, exitCode } = await exec(cmd);
    if (exitCode !== 0) {
      return ctx.reply(`❌ Ошибка iptables:\n${codeBlock(stderr)}`, { parse_mode: 'HTML' });
    }
    return ctx.reply(`✅ iptables: Заблокирован трафик на порт <code>${escapeHtml(parsed.port)}/${parsed.proto}</code>\n${codeBlock(stdout || 'ОК')}`, { parse_mode: 'HTML' });
  });

  bot.command('iptables_delete', async (ctx) => {
    const num = ctx.message.text.split(/\s+/)[1];
    if (!num || !/^\d+$/.test(num)) {
      return ctx.reply('❌ Укажите номер правила из /iptables: /iptables_delete <num>');
    }

    const cmd = `iptables -D INPUT ${num}`;
    const { stdout, stderr, exitCode } = await exec(cmd);
    if (exitCode !== 0) {
      return ctx.reply(`❌ Ошибка удаления правила #${num}:\n${codeBlock(stderr)}`, { parse_mode: 'HTML' });
    }
    return ctx.reply(`✅ iptables: Правило #${num} удалено из цепочки INPUT.\n${codeBlock(stdout || 'ОК')}`, { parse_mode: 'HTML' });
  });
}

module.exports = { register };
