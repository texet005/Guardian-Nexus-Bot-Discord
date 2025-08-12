const { ActivityType } = require('discord.js');
const { sendLog } = require('../utils/logger');
const { loadAdminPanel } = require('../panels/adminPanel');

module.exports = {
  name: 'ready',
  once: true,
  execute(client) {
    console.log(`Бот ${client.user.tag} готов к работе!`);
    
    client.user.setPresence({
      activities: [{
        name: client.config.activity.name,
        type: ActivityType[client.config.activity.type],
        url: client.config.activity.url
      }],
      status: 'online'
    });

    loadAdminPanel(client);

    const logChannel = client.channels.cache.get(client.config.logChannelId);
    if (logChannel) {
      sendLog(client, 'Бот успешно запущен и готов к работе!', 'success');
    } else {
      console.error('Лог-канал не найден!');
    }
  }
};