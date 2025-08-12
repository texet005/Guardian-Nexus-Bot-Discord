const { Client, Collection, GatewayIntentBits, MessageFlags } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('../config/config.json');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.DirectMessages
  ]
});

client.commands = new Collection();
client.config = config;
client.messageFlags = MessageFlags;

// Загрузка событий
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
  const filePath = path.join(eventsPath, file);
  const event = require(filePath);
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args, client));
  } else {
    client.on(event.name, (...args) => event.execute(...args, client));
  }
}

// Загрузка команд
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);
  client.commands.set(command.data.name, command);
}

// Обработчик взаимодействий
client.on('interactionCreate', async interaction => {
  try {
    if (interaction.isButton()) {
      // Обработка кнопок админ-панели
      if (interaction.channelId === client.config.adminChannelId) {
        const adminPanel = require('./panels/adminPanel');
        await adminPanel.handlePanelInteraction(interaction, client);
      }
      // Обработка кнопок репортов
      else if (interaction.channelId === client.config.reportSettings.userReportChannel) {
        const reportPanel = require('./panels/reportPanel');
        await reportPanel.handleUserInteraction(interaction, client);
      }
      // Обработка кнопки закрытия репорта в ЛС
      else if (interaction.customId === 'close_report') {
        const ReportManager = require('./utils/reportManager');
        const reportManager = new ReportManager(client);
        const message = interaction.message;
        const reportId = message.embeds[0].title.match(/#(\d+)/)[1];
        
        if (await reportManager.closeReport(reportId, interaction.user)) {
          await interaction.update({
            content: 'Репорт закрыт. Спасибо за обратную связь!',
            components: [],
            embeds: []
          });
        } else {
          await interaction.reply({
            content: 'Не удалось закрыть репорт. Возможно, он уже закрыт.',
            flags: MessageFlags.Ephemeral
          });
        }
      }
    } 
    else if (interaction.isModalSubmit()) {
      // Обработка модального окна репорта
      if (interaction.customId === 'report_modal') {
        const reportPanel = require('./panels/reportPanel');
        await reportPanel.handleReportModal(interaction, client);
      }
      // Обработка других модальных окон
      else {
        const adminPanel = require('./panels/adminPanel');
        await adminPanel.handleModalSubmit(interaction, client);
      }
    } 
    else if (interaction.isCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) return;
      await command.execute(interaction, client);
    }
  } catch (error) {
    console.error('Ошибка обработки взаимодействия:', error);
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ 
        content: '❌ Произошла ошибка при обработке запроса',
        flags: MessageFlags.Ephemeral
      });
    } else {
      await interaction.reply({ 
        content: '❌ Произошла ошибка при обработке запроса',
        flags: MessageFlags.Ephemeral
      });
    }
  }
});

// Обработка ошибок
process.on('unhandledRejection', error => {
  console.error('Unhandled promise rejection:', error);
});

client.login(config.token);