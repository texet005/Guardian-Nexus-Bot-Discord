# 🤖 Discord Role Sync Bot

![GitHub last commit](https://img.shields.io/github/last-commit/texet005/discord_roles_servers)
![GitHub repo size](https://img.shields.io/github/repo-size/texet005/discord_roles_servers)
![Discord.js](https://img.shields.io/badge/discord.js-v14-blue.svg)

Многофункциональный Discord бот для синхронизации ролей между серверами с удобной админ-панелью и расширенным управлением правами.

## ✨ Особенности

- 🔄 **Синхронизация ролей** между основным и админ-сервером
- 🛠 **Интерактивная админ-панель** с кнопками управления
- 📊 **Логирование действий** в Discord-канал и файл
- 👑 **Гибкая система администрирования**
- 📱 **Модальные окна** для удобного ввода данных
- 📈 **Мониторинг статуса** бота (пинг, аптайм, использование памяти)

## 🚀 Установка

1. Клонируйте репозиторий:
```
git clone https://github.com/texet005/discord_roles_servers.git
cd discord_roles_servers
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
  "token": "токен вашего бота",
  "creatorId": "id создателя",
  "mainServerId": "id основного сервера",
  "adminServerId": "id админского сервера",
  "logChannelId": "id канала для логов",
  "adminChannelId": "id канала для админ панели",
  "activity": {
    "name": "название активности",
    "type": "Watching"
  },
  "rolePairs": {}
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

