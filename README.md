# 🖥️ VDS Manager Bot

Telegram-бот на **Node.js (Telegraf)** для полного управления VDS сервером прямо из мессенджера.

Работает локально на сервере (или в Docker-контейнере) и исполняет системные команды через `child_process`. Не требует поднятия SSH-соединения.

---

## 🚀 Возможности

| Модуль | Описание | Команды |
|---|---|---|
| 📊 **Мониторинг** | Нагрузка CPU, использование RAM, дисков, сетевой трафик, uptime | `/status`, `/cpu`, `/ram`, `/disk`, `/network`, `/uptime` |
| ⚙️ **Сервисы** | Управление `systemd` сервисами (список, старт, стоп, перезапуск, статус) | `/services`, `/service_start`, `/service_stop`, `/service_restart`, `/service_status` |
| 🐳 **Docker** | Управление контейнерами (список, старт, стоп, рестарт, просмотр логов) | `/containers`, `/container_start`, `/container_stop`, `/container_restart`, `/container_logs` |
| 📁 **Файлы** | Просмотр директорий, файлов, скачивание и загрузка файлов через Telegram | `/ls`, `/cat`, `/download`, `/upload` *(reply с файлом)* |
| 👥 **Пользователи** | Просмотр системных пользователей, создание и удаление | `/users`, `/useradd`, `/userdel` |
| 🔥 **Firewall** | Просмотр статуса и правил `ufw`, открытие и закрытие портов | `/fw_status`, `/fw_rules`, `/fw_allow`, `/fw_deny` |
| 🖥️ **Shell** | Выполнение произвольных bash-команд с ограничениями по времени | `/shell <command>` |
| 📦 **Пакеты** | Обновление списка пакетов `apt update`, `apt upgrade` и установка пакетов | `/apt_update`, `/apt_upgrade`, `/apt_install` |
| 💾 **Бэкапы** | Создание `tar.gz` архивов, просмотр, восстановление и скачивание | `/backup_create`, `/backup_list`, `/backup_restore`, `/backup_download` |
| 📋 **Логи** | Просмотр логов сервисов (`journalctl`), `syslog` и `auth.log` | `/logs`, `/syslog`, `/authlog` |

---

## 🛡️ Безопасность

1. **Авторизация (Whitelist)** — доступ разрешён исключительно Telegram ID из переменной `ADMIN_IDS`. Неавторизованные запросы блокируются и логируются.
2. **Rate Limiting** — защита от спама (ограничение по умолчанию — 30 команд в минуту на пользователя).
3. **Логирование действий** — ротируемые логи (Winston).
4. **Маскировка чувствительных данных** — пароли, токены, ключи и секреты автоматически заменяются на `***` в логах.

---

## 📦 Быстрый запуск

### Вариант 1: Запуск через Docker Compose (Рекомендуемый)

Бот поддерживает автоматическое определение Docker-окружения и выполнение команд на хосте через `nsenter`.

1. Клонируйте репозиторий:
   ```bash
   git clone https://github.com/your-username/vds_manager_bot.git
   cd vds_manager_bot
   ```

2. Создайте файл `.env` на основе `.env.example`:
   ```bash
   cp .env.example .env
   ```
   Укажите ваш `BOT_TOKEN` и `ADMIN_IDS`.

3. Запустите через Docker Compose:
   ```bash
   docker compose up -d
   ```

---

### Вариант 2: Локальный запуск на сервере (Node.js)

**Требования:** Node.js 18+

1. Установите зависимости:
   ```bash
   npm install
   ```

2. Настройте `.env`:
   ```env
   BOT_TOKEN=123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ
   ADMIN_IDS=123456789,987654321
   RATE_LIMIT=30
   LOG_LEVEL=info
   BACKUP_DIR=/var/backups/vds_bot
   ```

3. Запустите бота:
   ```bash
   npm start
   ```

   > 💡 **Примечание:** Для корректного выполнения большинства системных команд (`systemctl`, `ufw`, `apt`) запуск должен производиться от имени `root` или пользователя с `NOPASSWD` в `/etc/sudoers`.

---

## ⚙️ Переменные окружения (.env)

| Переменная | Описание | Обязательна? | По умолчанию |
|---|---|---|---|
| `BOT_TOKEN` | Токен Telegram-бота от [@BotFather](https://t.me/BotFather) | **Да** | — |
| `ADMIN_IDS` | Список Telegram User ID через запятую | **Да** | — |
| `RATE_LIMIT` | Максимальное количество команд в минуту | Нет | `30` |
| `LOG_LEVEL` | Уровень логирования (`debug`, `info`, `warn`, `error`) | Нет | `info` |
| `BACKUP_DIR` | Директория хранения бэкапов | Нет | `/var/backups/vds_bot` |

---

## 📄 Лицензия

MIT License
