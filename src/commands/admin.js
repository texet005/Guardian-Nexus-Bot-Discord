const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const { sendLog } = require('../utils/logger');
const fs = require('fs');
const path = require('path');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('admin')
    .setDescription('Админские команды')
    .addSubcommand(subcommand =>
      subcommand
        .setName('add')
        .setDescription('Добавить администратора')
        .addUserOption(option =>
          option.setName('user')
            .setDescription('Пользователь для добавления')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('remove')
        .setDescription('Удалить администратора')
        .addUserOption(option =>
          option.setName('user')
            .setDescription('Пользователь для удаления')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('list')
        .setDescription('Список администраторов')
    ),
  async execute(interaction, client) {
    if (interaction.user.id !== client.config.creatorId) {
      return interaction.reply({ 
        content: '❌ Только создатель бота может использовать эту команду!',
        flags: MessageFlags.Ephemeral
      });
    }

    const subcommand = interaction.options.getSubcommand();
    const adminsPath = path.join(__dirname, '../../config/admins.json');
    let admins = JSON.parse(fs.readFileSync(adminsPath, 'utf8'));

    switch (subcommand) {
      case 'add': {
        const user = interaction.options.getUser('user');
        if (admins.includes(user.id)) {
          return interaction.reply({ 
            content: '❌ Этот пользователь уже является администратором!',
            flags: MessageFlags.Ephemeral
          });
        }
        admins.push(user.id);
        fs.writeFileSync(adminsPath, JSON.stringify(admins, null, 2));
        sendLog(client, `Пользователь ${user.tag} (${user.id}) добавлен в администраторы`, 'info');
        return interaction.reply({ 
          content: `✅ Пользователь ${user} успешно добавлен в администраторы!`,
          flags: MessageFlags.Ephemeral
        });
      }
      
      case 'remove': {
        const user = interaction.options.getUser('user');
        if (!admins.includes(user.id)) {
          return interaction.reply({ 
            content: '❌ Этот пользователь не является администратором!',
            flags: MessageFlags.Ephemeral
          });
        }
        admins = admins.filter(id => id !== user.id);
        fs.writeFileSync(adminsPath, JSON.stringify(admins, null, 2));
        sendLog(client, `Пользователь ${user.tag} (${user.id}) удален из администраторов`, 'info');
        return interaction.reply({ 
          content: `✅ Пользователь ${user} успешно удален из администраторов!`,
          flags: MessageFlags.Ephemeral
        });
      }
      
      case 'list': {
        if (admins.length === 0) {
          return interaction.reply({ 
            content: 'ℹ️ Нет администраторов, кроме создателя.',
            flags: MessageFlags.Ephemeral
          });
        }
        
        let description = '';
        for (const adminId of admins) {
          const user = await client.users.fetch(adminId).catch(() => null);
          description += `- ${user ? user.tag : 'Неизвестный пользователь'} (${adminId})\n`;
        }
        
        const embed = new EmbedBuilder()
          .setTitle('Список администраторов')
          .setDescription(description)
          .setColor(0x5865F2);
          
        return interaction.reply({ 
          embeds: [embed],
          flags: MessageFlags.Ephemeral
        });
      }
    }
  }
};