const { exec: cpExec } = require('child_process');
const fs = require('fs');
const logger = require('../logger');

const DEFAULT_TIMEOUT = 30_000; // 30 секунд
const MAX_BUFFER = 1024 * 1024; // 1 MB

/**
 * Определяем, запущен ли бот внутри Docker-контейнера
 */
const IS_DOCKER = (() => {
  try {
    // Проверяем наличие /.dockerenv или cgroup с docker/containerd
    if (fs.existsSync('/.dockerenv')) return true;
    const cgroup = fs.readFileSync('/proc/1/cgroup', 'utf8');
    return /docker|containerd|kubepods/.test(cgroup);
  } catch {
    return false;
  }
})();

if (IS_DOCKER) {
  logger.info('🐳 Docker-режим: команды будут выполняться через nsenter на хосте');
}

/**
 * Безопасная обёртка над child_process.exec
 * В Docker-режиме команды выполняются через nsenter в namespace хоста
 *
 * @param {string} command — команда для выполнения
 * @param {object} [options] — опции
 * @param {number} [options.timeout] — таймаут в мс
 * @param {boolean} [options.hostExec=true] — выполнять на хосте (через nsenter в Docker)
 * @returns {Promise<{stdout: string, stderr: string, exitCode: number}>}
 */
function exec(command, options = {}) {
  const timeout = options.timeout || DEFAULT_TIMEOUT;
  const hostExec = options.hostExec !== false;

  // В Docker: оборачиваем в nsenter для выполнения в namespace хоста
  const finalCommand =
    IS_DOCKER && hostExec
      ? `nsenter -t 1 -m -u -i -n -p -- ${command}`
      : command;

  const env = {
    ...process.env,
    TERM: 'xterm-256color',
    LANG: 'en_US.UTF-8',
    LC_ALL: 'en_US.UTF-8',
    ...(options.env || {}),
  };

  return new Promise((resolve) => {
    cpExec(finalCommand, { timeout, maxBuffer: MAX_BUFFER, env }, (error, stdout, stderr) => {
      const exitCode = error?.code ?? 0;

      if (error && error.killed) {
        resolve({
          stdout: stdout || '',
          stderr: `Команда прервана по таймауту (${timeout / 1000}с)`,
          exitCode: 124,
        });
        return;
      }

      resolve({
        stdout: stdout || '',
        stderr: stderr || '',
        exitCode: typeof exitCode === 'number' ? exitCode : 1,
      });
    });
  });
}

module.exports = { exec, IS_DOCKER };

