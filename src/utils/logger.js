const fs = require('fs');
const path = require('path');
const { EmbedBuilder } = require('discord.js');

const logColors = {
  info: 0x3498db,
  success: 0x2ecc71,
  warning: 0xf39c12,
  error: 0xe74c3c
};

async function sendLog(client, message, type = 'info') {
  try {
    const logChannel = client.channels.cache.get(client.config.logChannelId);
    if (!logChannel) {
      console.error('Лог-канал не найден!');
      return;
    }

    const embed = new EmbedBuilder()
      .setColor(logColors[type] || logColors.info)
      .setTitle(`Лог: ${type.toUpperCase()}`)
      .setDescription(message)
      .setTimestamp();

    await logChannel.send({ embeds: [embed] });
    logToFile(`[${type}] ${message}`);
  } catch (error) {
    console.error('Ошибка при отправке лога:', error);
    logToFile(`[ERROR] Ошибка при отправке лога: ${error.message}`);
  }
}

function logToFile(message) {
  const logPath = path.join(__dirname, '../../logs/bot.log');
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;

  fs.appendFile(logPath, logMessage, err => {
    if (err) console.error('Ошибка при записи в лог-файл:', err);
  });
}

module.exports = { sendLog, logToFile };