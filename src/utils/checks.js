const fs = require('fs');
const path = require('path');

function isAdmin(client, userId) {
  try {
    if (userId === client.config.creatorId) return true;
    
    const adminsPath = path.join(__dirname, '../../config/admins.json');
    const admins = JSON.parse(fs.readFileSync(adminsPath, 'utf8'));
    
    return admins.includes(userId);
  } catch (error) {
    console.error('Ошибка при проверке администратора:', error);
    return false;
  }
}

function checkConfig(config) {
  if (!config.token) throw new Error('Токен бота не указан в конфиге!');
  if (!config.mainServerId) throw new Error('ID основного сервера не указан!');
  if (!config.adminServerId) throw new Error('ID админского сервера не указан!');
  if (!config.logChannelId) console.warn('ID лог-канала не указан, логи не будут отправляться в Discord');
  if (!config.adminChannelId) console.warn('ID админ-канала не указан, админ панель не будет загружена');
}

module.exports = { isAdmin, checkConfig };