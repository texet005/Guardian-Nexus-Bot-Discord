const { MessageFlags, EmbedBuilder } = require('discord.js');
const ReportManager = require('../utils/reportManager');

module.exports = {
  name: 'messageCreate',
  async execute(message, client) {
    if (message.author.bot) return;
    if (!message.guild) return;
    
    const reportManager = new ReportManager(client);
    const reports = reportManager.loadReports();
    
    // Проверяем, находится ли сообщение в канале репорта
    const reportEntry = Object.entries(reports).find(([_, report]) => 
      report.channelId === message.channel.id && report.status === 'open'
    );
    
    if (reportEntry) {
      const [reportId, report] = reportEntry;
      
      // Если сообщение от админа - пересылаем пользователю
      const { isAdmin } = require('../utils/checks');
      if (isAdmin(client, message.author.id)) {
        const user = await client.users.fetch(report.userId).catch(() => null);
        if (!user) return;
        
        const embed = new EmbedBuilder()
          .setTitle(`Ответ на ваш репорт #${reportId}`)
          .setDescription(message.content)
          .addFields(
            { name: 'Администратор', value: message.author.tag, inline: true },
            { name: 'Время ответа', value: new Date().toLocaleString(), inline: true }
          )
          .setColor(0x3498db);
          
        const row = ReportManager.createCloseButton();
        
        await user.send({ 
          embeds: [embed],
          components: [row] 
        }).catch(() => {});
        
        await message.react('✅');
      }
    }
  }
};