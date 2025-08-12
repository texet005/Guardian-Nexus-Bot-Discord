const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, MessageFlags } = require('discord.js');
const ReportManager = require('../utils/reportManager');
const { sendLog } = require('../utils/logger');

module.exports = {
  loadUserReportPanel(client) {
    const channel = client.channels.cache.get(client.config.reportSettings.userReportChannel);
    if (!channel) {
      console.warn('Канал для репортов пользователей не найден!');
      return;
    }

    const embed = new EmbedBuilder()
      .setTitle('Система репортов')
      .setDescription('Нажмите кнопку ниже, чтобы создать репорт')
      .setColor(0x3498db);

    channel.messages.fetch().then(messages => {
      const botMessages = messages.filter(m => m.author.id === client.user.id);
      channel.bulkDelete(botMessages).catch(() => {});
    }).then(() => {
      channel.send({
        embeds: [embed],
        components: [ReportManager.createReportComponents()]
      });
    }).catch(err => {
      console.error('Ошибка загрузки панели репортов:', err);
    });
  },

  async handleUserInteraction(interaction, client) {
    if (!interaction.isButton()) return;

    try {
      switch (interaction.customId) {
        case 'create_report':
          await this.showReportModal(interaction);
          break;
        case 'report_help':
          await interaction.reply({
            content: 'Правила оформления репортов:\n1. Четко опишите проблему\n2. Укажите участников, если это конфликт\n3. Прикрепите доказательства (скриншоты, ссылки)',
            flags: MessageFlags.Ephemeral
          });
          break;
      }
    } catch (error) {
      console.error('Ошибка обработки взаимодействия:', error);
      await interaction.reply({
        content: '❌ Произошла ошибка при обработке запроса',
        flags: MessageFlags.Ephemeral
      });
    }
  },

  async showReportModal(interaction) {
    const modal = new ModalBuilder()
      .setCustomId('report_modal')
      .setTitle('Создание репорта');

    const reasonInput = new TextInputBuilder()
      .setCustomId('report_reason')
      .setLabel('Опишите проблему подробно')
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true);

    const actionRow = new ActionRowBuilder().addComponents(reasonInput);
    modal.addComponents(actionRow);

    await interaction.showModal(modal);
  },

  async handleReportModal(interaction, client) {
    if (!interaction.isModalSubmit()) return;

    const reason = interaction.fields.getTextInputValue('report_reason');
    const reportManager = new ReportManager(client);

    try {
      const { reportId, reportChannel } = await reportManager.createReport(interaction.user, reason);

      await interaction.reply({
        content: `Ваш репорт #${reportId} успешно создан! Администраторы рассмотрят его в ближайшее время.`,
        flags: MessageFlags.Ephemeral
      });

      // Уведомление в админ-канал
      const adminChannel = client.channels.cache.get(client.config.reportSettings.adminReportChannel);
      if (adminChannel) {
        const embed = new EmbedBuilder()
          .setTitle('Новый репорт создан')
          .setDescription(`[Перейти к репорту](${reportChannel.url})`)
          .addFields(
            { name: 'ID', value: reportId, inline: true },
            { name: 'Пользователь', value: `${interaction.user.tag}`, inline: true }
          )
          .setColor(0xffa500);

        await adminChannel.send({ embeds: [embed] });
      }
    } catch (error) {
      console.error('Ошибка создания репорта:', error);
      await interaction.reply({
        content: 'Произошла ошибка при создании репорта. Пожалуйста, попробуйте позже.',
        flags: MessageFlags.Ephemeral
      });
    }
  }
};