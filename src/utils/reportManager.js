const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

class ReportManager {
  constructor(client) {
    this.client = client;
    this.reportsPath = path.join(__dirname, '../../config/reports.json');
    this.reports = this.loadReports();
  }

  loadReports() {
    try {
      return JSON.parse(fs.readFileSync(this.reportsPath, 'utf8'));
    } catch (error) {
      return {};
    }
  }

  saveReports() {
    fs.writeFileSync(this.reportsPath, JSON.stringify(this.reports, null, 2));
  }

  async createReport(user, reason) {
    const reportId = Date.now().toString();
    const adminGuild = this.client.guilds.cache.get(this.client.config.adminServerId);
    const category = adminGuild.channels.cache.get(this.client.config.reportSettings.categoryId);

    // Создаем канал для репорта
    const reportChannel = await adminGuild.channels.create({
      name: `report-${reportId}`,
      parent: category,
      topic: `Репорт от ${user.tag} (${user.id})`,
      permissionOverwrites: [
        {
          id: adminGuild.roles.everyone,
          deny: ['ViewChannel']
        }
      ]
    });

    // Добавляем доступ админам
    const admins = JSON.parse(fs.readFileSync(path.join(__dirname, '../../config/admins.json'), 'utf8'));
    for (const adminId of admins) {
      await reportChannel.permissionOverwrites.create(adminId, {
        ViewChannel: true,
        SendMessages: true
      });
    }

    // Сохраняем информацию о репорте
    this.reports[reportId] = {
      userId: user.id,
      channelId: reportChannel.id,
      status: 'open',
      reason: reason
    };
    this.saveReports();

    // Отправляем информацию о репорте в канал
    const embed = new EmbedBuilder()
      .setTitle(`Репорт #${reportId}`)
      .setDescription(reason)
      .addFields(
        { name: 'Пользователь', value: `${user.tag} (${user.id})`, inline: true },
        { name: 'Статус', value: 'Открыт', inline: true }
      )
      .setColor(0xffa500)
      .setTimestamp();

    await reportChannel.send({ embeds: [embed] });

    return { reportId, reportChannel };
  }

  async closeReport(reportId, admin) {
    if (!this.reports[reportId]) return false;

    const report = this.reports[reportId];
    report.status = 'closed';
    report.closedBy = admin.id;
    report.closedAt = new Date().toISOString();
    this.saveReports();

    const adminGuild = this.client.guilds.cache.get(this.client.config.adminServerId);
    const reportChannel = adminGuild.channels.cache.get(report.channelId);

    if (reportChannel) {
      const embed = new EmbedBuilder()
        .setTitle(`Репорт #${reportId} закрыт`)
        .setDescription(`Администратор: ${admin.tag}\nВремя: ${new Date().toLocaleString()}`)
        .setColor(0x00ff00)
        .setTimestamp();

      await reportChannel.send({ embeds: [embed] });
      await reportChannel.setName(`closed-${reportId}`);
    }

    return true;
  }

  static createReportComponents() {
    return new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('create_report')
        .setLabel('Создать репорт')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('report_help')
        .setLabel('Как оформить репорт?')
        .setStyle(ButtonStyle.Secondary)
    );
  }

  static createCloseButton() {
    return new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('close_report')
        .setLabel('Закрыть репорт')
        .setStyle(ButtonStyle.Danger)
    );
  }
}

module.exports = ReportManager;