const { ActivityType } = require('discord.js');
const { sendLog } = require('../utils/logger');
const { loadAdminPanel } = require('../panels/adminPanel');
const { loadUserReportPanel } = require('../panels/reportPanel');

module.exports = {
  name: 'ready',
  once: true,
  execute(client) {
    console.log(`Бот ${client.user.tag} готов к работе!`);
    
    // Установка активности
    client.user.setPresence({
      activities: [{
        name: client.config.activity.name,
        type: ActivityType[client.config.activity.type],
        url: client.config.activity.url
      }],
      status: 'online'
    });

    // Загрузка панелей
    loadAdminPanel(client);
    loadUserReportPanel(client);

    // Проверка подключения и отправка логов
    const logChannel = client.channels.cache.get(client.config.logChannelId);
    if (logChannel) {
      sendLog(client, 'Бот успешно запущен и готов к работе!', 'success');
    } else {
      console.error('Лог-канал не найден!');
    }
  }
};