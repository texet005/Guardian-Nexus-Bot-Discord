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
    GatewayIntentBits.GuildMessageReactions
  ]
});

client.commands = new Collection();
client.config = config;
client.messageFlags = MessageFlags;

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

const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);
  client.commands.set(command.data.name, command);
}

client.on('interactionCreate', async interaction => {
  try {
    if (interaction.isButton()) {
      const adminPanel = require('./panels/adminPanel');
      await adminPanel.handlePanelInteraction(interaction, client);
    } 
    else if (interaction.isModalSubmit()) {
      const adminPanel = require('./panels/adminPanel');
      await adminPanel.handleModalSubmit(interaction, client);
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

process.on('unhandledRejection', error => {
  console.error('Unhandled promise rejection:', error);
});

client.login(config.token);