# 🤖 Guardian Nexus Bot

![GitHub last commit](https://img.shields.io/github/last-commit/texet005/Guardian-Nexus-Bot-Discord)
![GitHub repo size](https://img.shields.io/github/repo-size/texet005/Guardian-Nexus-Bot-Discord)
![Discord.js](https://img.shields.io/badge/discord.js-v14-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

> Универсальный защитник вашего Discord-сообщества с расширенными возможностями управления ролями и системой репортов


## ✨ Ключевые особенности

### 🛡️ Защита и управление
- **Двусторонняя синхронизация ролей** между серверами
- **Интеллектуальная система репортов** с созданием тикетов
- **Контроль доступа** с многоуровневой системой прав

### 🎛️ Удобное управление
- **Интерактивные панели** для пользователей и администраторов
- **Модальные окна** для быстрого ввода данных
- **Автоматическое документирование** всех действий

### 📊 Мониторинг и аналитика
- **Система логов** в реальном времени
- **Статистика активности** серверов
- **Уведомления** о важных событиях

## 🚀 Установка и запуск

1. Клонируйте репозиторий:
```
git clone https://github.com/texet005/Guardian-Nexus-Bot-Discord.git
cd Guardian-Nexus-Bot-Discord
```
2. Установите зависимости:
```
npm install
```
3. Настройте конфигурацию в файле `config/config.json`.
4. Запустите бота:
```
node src/index.js
```

## ⚙️ Конфигурация
Файл `config/config.json` содержит основные настройки:
```
{
  "token": "TOKEN BOT",
  "creatorId": "id создателя",
  "mainServerId": "id основного сервера",
  "adminServerId": "id админского сервера",
  "logChannelId": "id канала для логов",
  "adminChannelId": "id канал для админ панели",
  "activity": {
    "name": "название активности",
    "type": "Watching",
    "url": "https://example.com"
  },
  "rolePairs": {},
  "reportSettings": {
    "categoryId": "id категории где находится канал для панели репортом (для пользователей)",
    "userReportChannel": "id канала для репорт панели",
    "adminReportChannel": "id категории для уведомления о репортах"
  }
}
```

## 📋 Команды
Админские команды (`/admin`)

`add @user` - Добавить администратора

`remove @user` - Удалить администратора

`list` - Показать список администраторов

## 🎛 Админ-панель
Бот автоматически создает интерактивную панель управления в указанном канале.
<img width="567" height="252" alt="Снимок" src="https://github.com/user-attachments/assets/9694b869-f2e0-450c-9541-a89276c58f8b" />

Функции панели:

Добавление/удаление связей ролей

Просмотр списка связей

Добавление администраторов

Просмотр статуса бота

## 📜 Логирование
Все действия бота записываются:

В указанный Discord-канал

В файл `logs/bot.log`

Пример лога:

``[2023-05-20T12:00:00.000Z] [INFO] Добавлена роль Moderator пользователю User#1234``

