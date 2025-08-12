const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, MessageFlags } = require('discord.js');
const { sendLog } = require('../utils/logger');
const fs = require('fs');
const path = require('path');

// Загрузка админ панели
function loadAdminPanel(client) {
  const adminChannel = client.channels.cache.get(client.config.adminChannelId);
  if (!adminChannel) {
    console.warn('Админ-канал не найден, панель не будет загружена');
    return;
  }

  // Очистка канала от старых сообщений
  adminChannel.messages.fetch().then(messages => {
    const botMessages = messages.filter(m => m.author.id === client.user.id);
    adminChannel.bulkDelete(botMessages).catch(() => {});
  }).then(() => {
    // Создание встраиваемого сообщения для панели
    const embed = new EmbedBuilder()
      .setTitle('Админ Панель Управления Ботом')
      .setDescription('Используйте кнопки ниже для управления ботом')
      .setColor(0x5865F2)
      .addFields(
        { name: 'Статус', value: '🟢 Онлайн', inline: true },
        { name: 'Серверов', value: client.guilds.cache.size.toString(), inline: true },
        { name: 'Пользователей', value: client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0).toString(), inline: true }
      );

    // Первый ряд кнопок
    const row1 = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('add_role_pair')
        .setLabel('Добавить связь ролей')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('remove_role_pair')
        .setLabel('Удалить связь ролей')
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId('list_role_pairs')
        .setLabel('Список связей')
        .setStyle(ButtonStyle.Secondary)
    );

    // Второй ряд кнопок
    const row2 = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('add_admin')
        .setLabel('Добавить админа')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId('bot_status')
        .setLabel('Статус бота')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('report_settings')
        .setLabel('Настройки репортов')
        .setStyle(ButtonStyle.Primary)
    );

    // Отправка панели
    adminChannel.send({ embeds: [embed], components: [row1, row2] })
      .then(() => sendLog(client, 'Админ панель успешно загружена', 'success'))
      .catch(err => sendLog(client, `Ошибка при загрузке админ панели: ${err.message}`, 'error'));
  });
}

// Обработчик взаимодействий с кнопками
async function handlePanelInteraction(interaction, client) {
  if (!interaction.isButton()) return;
  
  // Проверка прав администратора
  const { isAdmin } = require('../utils/checks');
  if (!isAdmin(client, interaction.user.id)) {
    return interaction.reply({ 
      content: '❌ У вас нет прав для использования этой панели!',
      flags: MessageFlags.Ephemeral
    });
  }

  try {
    // Для модальных окон не делаем deferReply
    if (interaction.customId === 'add_admin' || 
        interaction.customId === 'add_role_pair' || 
        interaction.customId === 'remove_role_pair') {
      switch (interaction.customId) {
        case 'add_admin':
          return await showAddAdminModal(interaction, client);
        case 'add_role_pair':
          return await showAddRolePairModal(interaction, client);
        case 'remove_role_pair':
          return await showRemoveRolePairModal(interaction, client);
      }
    }

    // Для других действий делаем deferReply
    await interaction.deferReply({ ephemeral: true });

    switch (interaction.customId) {
      case 'list_role_pairs':
        await showRolePairsList(interaction, client);
        break;
      case 'bot_status':
        await showBotStatus(interaction, client);
        break;
      case 'report_settings':
        await showReportSettings(interaction, client);
        break;
      default:
        await interaction.editReply({ content: 'Неизвестная команда' });
    }
  } catch (error) {
    console.error('Ошибка обработки взаимодействия:', error);
    if (interaction.replied || interaction.deferred) {
      await interaction.editReply({ 
        content: '❌ Произошла ошибка при обработке команды',
        flags: MessageFlags.Ephemeral
      });
    } else {
      await interaction.reply({ 
        content: '❌ Произошла ошибка при обработке команды',
        flags: MessageFlags.Ephemeral
      });
    }
  }
}

// Показать модальное окно для добавления связи ролей
async function showAddRolePairModal(interaction, client) {
  const modal = new ModalBuilder()
    .setCustomId('add_role_modal')
    .setTitle('Добавить связь ролей');

  const mainRoleInput = new TextInputBuilder()
    .setCustomId('main_role_id')
    .setLabel('ID роли на основном сервере')
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  const adminRoleInput = new TextInputBuilder()
    .setCustomId('admin_role_id')
    .setLabel('ID роли на админ сервере')
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  const firstActionRow = new ActionRowBuilder().addComponents(mainRoleInput);
  const secondActionRow = new ActionRowBuilder().addComponents(adminRoleInput);

  modal.addComponents(firstActionRow, secondActionRow);

  await interaction.showModal(modal).catch(error => {
    console.error('Ошибка показа модального окна:', error);
    interaction.reply({
      content: '❌ Не удалось открыть форму добавления связи ролей',
      flags: MessageFlags.Ephemeral
    });
  });
}

// Показать модальное окно для удаления связи ролей
async function showRemoveRolePairModal(interaction, client) {
  const modal = new ModalBuilder()
    .setCustomId('remove_role_modal')
    .setTitle('Удалить связь ролей');

  const roleInput = new TextInputBuilder()
    .setCustomId('role_id')
    .setLabel('ID роли на основном сервере')
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  const actionRow = new ActionRowBuilder().addComponents(roleInput);

  modal.addComponents(actionRow);

  await interaction.showModal(modal).catch(error => {
    console.error('Ошибка показа модального окна:', error);
    interaction.reply({
      content: '❌ Не удалось открыть форму удаления связи ролей',
      flags: MessageFlags.Ephemeral
    });
  });
}

// Обработчик модальных окон
async function handleModalSubmit(interaction, client) {
  if (!interaction.isModalSubmit()) return;

  try {
    if (interaction.customId === 'add_role_modal') {
      const mainRoleId = interaction.fields.getTextInputValue('main_role_id');
      const adminRoleId = interaction.fields.getTextInputValue('admin_role_id');

      const mainGuild = client.guilds.cache.get(client.config.mainServerId);
      const adminGuild = client.guilds.cache.get(client.config.adminServerId);
      
      const mainRole = mainGuild?.roles.cache.get(mainRoleId);
      const adminRole = adminGuild?.roles.cache.get(adminRoleId);
      
      if (!mainRole || !adminRole) {
        return await interaction.reply({ 
          content: '❌ Одна из указанных ролей не найдена на сервере',
          flags: MessageFlags.Ephemeral
        });
      }

      client.config.rolePairs[mainRoleId] = adminRoleId;
      fs.writeFileSync(
        path.join(__dirname, '../../config/config.json'),
        JSON.stringify(client.config, null, 2)
      );

      await interaction.reply({ 
        content: `✅ Связь ролей успешно добавлена: ${mainRole.name} (${mainRoleId}) → ${adminRole.name} (${adminRoleId})`,
        flags: MessageFlags.Ephemeral
      });
      sendLog(client, `Добавлена связь ролей: ${mainRole.name} (${mainRoleId}) → ${adminRole.name} (${adminRoleId})`, 'info');
    } 
    else if (interaction.customId === 'remove_role_modal') {
      const roleId = interaction.fields.getTextInputValue('role_id');

      if (!client.config.rolePairs[roleId]) {
        return await interaction.reply({ 
          content: '❌ Связь для этой роли не найдена',
          flags: MessageFlags.Ephemeral
        });
      }

      const mainGuild = client.guilds.cache.get(client.config.mainServerId);
      const adminGuild = client.guilds.cache.get(client.config.adminServerId);
      const mainRole = mainGuild?.roles.cache.get(roleId);
      const adminRoleId = client.config.rolePairs[roleId];
      const adminRole = adminGuild?.roles.cache.get(adminRoleId);

      delete client.config.rolePairs[roleId];
      fs.writeFileSync(
        path.join(__dirname, '../../config/config.json'),
        JSON.stringify(client.config, null, 2)
      );

      await interaction.reply({ 
        content: `✅ Связь ролей удалена: ${mainRole?.name || roleId} → ${adminRole?.name || adminRoleId}`,
        flags: MessageFlags.Ephemeral
      });
      sendLog(client, `Удалена связь ролей: ${mainRole?.name || roleId} → ${adminRole?.name || adminRoleId}`, 'info');
    }
    else if (interaction.customId === 'add_admin_modal') {
      const userId = interaction.fields.getTextInputValue('user_id');
      const user = await client.users.fetch(userId).catch(() => null);
      
      if (!user) {
        return interaction.reply({
          content: '❌ Пользователь с таким ID не найден!',
          flags: MessageFlags.Ephemeral
        });
      }

      const adminsPath = path.join(__dirname, '../../config/admins.json');
      const admins = JSON.parse(fs.readFileSync(adminsPath, 'utf8'));

      if (admins.includes(userId)) {
        return interaction.reply({
          content: '❌ Этот пользователь уже является администратором!',
          flags: MessageFlags.Ephemeral
        });
      }

      admins.push(userId);
      fs.writeFileSync(adminsPath, JSON.stringify(admins, null, 2));

      await interaction.reply({
        content: `✅ Пользователь ${user.tag} (${userId}) добавлен в администраторы!`,
        flags: MessageFlags.Ephemeral
      });
      sendLog(client, `Пользователь ${user.tag} (${userId}) добавлен в администраторы`, 'info');
    }
  } catch (error) {
    console.error('Ошибка обработки модального окна:', error);
    await interaction.reply({
      content: '❌ Произошла ошибка при обработке запроса',
      flags: MessageFlags.Ephemeral
    });
  }
}

// Показать список связей ролей
async function showRolePairsList(interaction, client) {
  const rolePairs = client.config.rolePairs;
  if (Object.keys(rolePairs).length === 0) {
    return interaction.editReply({ content: 'Нет установленных связей ролей.' });
  }

  const mainGuild = client.guilds.cache.get(client.config.mainServerId);
  const adminGuild = client.guilds.cache.get(client.config.adminServerId);
  
  let description = '';
  for (const [mainRoleId, adminRoleId] of Object.entries(rolePairs)) {
    const mainRole = mainGuild?.roles.cache.get(mainRoleId);
    const adminRole = adminGuild?.roles.cache.get(adminRoleId);
    
    description += `🔹 ${mainRole?.name || 'Неизвестная роль'} (${mainRoleId}) → ${adminRole?.name || 'Неизвестная роль'} (${adminRoleId})\n`;
  }

  const embed = new EmbedBuilder()
    .setTitle('Список связей ролей')
    .setDescription(description)
    .setColor(0x5865F2);

  await interaction.editReply({ embeds: [embed] });
}

// Показать модальное окно для добавления администратора
async function showAddAdminModal(interaction, client) {
  // Проверка, что это создатель
  if (interaction.user.id !== client.config.creatorId) {
    if (interaction.replied || interaction.deferred) {
      return interaction.editReply({ 
        content: 'Только создатель бота может добавлять администраторов!',
        flags: MessageFlags.Ephemeral
      });
    } else {
      return interaction.reply({ 
        content: 'Только создатель бота может добавлять администраторов!',
        flags: MessageFlags.Ephemeral
      });
    }
  }

  const modal = new ModalBuilder()
    .setCustomId('add_admin_modal')
    .setTitle('Добавить администратора');

  const userIdInput = new TextInputBuilder()
    .setCustomId('user_id')
    .setLabel('ID пользователя для добавления')
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  const actionRow = new ActionRowBuilder().addComponents(userIdInput);

  modal.addComponents(actionRow);

  await interaction.showModal(modal).catch(error => {
    console.error('Ошибка показа модального окна:', error);
    if (interaction.replied || interaction.deferred) {
      interaction.editReply({
        content: '❌ Не удалось открыть форму добавления администратора',
        flags: MessageFlags.Ephemeral
      });
    } else {
      interaction.reply({
        content: '❌ Не удалось открыть форму добавления администратора',
        flags: MessageFlags.Ephemeral
      });
    }
  });
}

// Показать статус бота
async function showBotStatus(interaction, client) {
  const embed = new EmbedBuilder()
    .setTitle('Статус бота')
    .setColor(0x5865F2)
    .addFields(
      { name: 'Пинг', value: `${client.ws.ping}ms`, inline: true },
      { name: 'Аптайм', value: formatUptime(process.uptime()), inline: true },
      { name: 'Использование памяти', value: `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`, inline: true },
      { name: 'Серверов', value: client.guilds.cache.size.toString(), inline: true },
      { name: 'Пользователей', value: client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0).toString(), inline: true }
    );

  await interaction.editReply({ embeds: [embed] });
}

// Показать настройки репортов
async function showReportSettings(interaction, client) {
  const embed = new EmbedBuilder()
    .setTitle('Настройки системы репортов')
    .addFields(
      { name: 'Категория для репортов', value: client.config.reportSettings.categoryId || 'Не задана', inline: true },
      { name: 'Канал для репортов (пользователи)', value: client.config.reportSettings.userReportChannel || 'Не задан', inline: true },
      { name: 'Канал уведомлений (админы)', value: client.config.reportSettings.adminReportChannel || 'Не задан', inline: true }
    )
    .setColor(0x5865F2);

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('set_report_category')
      .setLabel('Изменить категорию')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId('set_user_report_channel')
      .setLabel('Изменить канал для пользователей')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('set_admin_report_channel')
      .setLabel('Изменить канал для админов')
      .setStyle(ButtonStyle.Secondary)
  );

  await interaction.editReply({ embeds: [embed], components: [row] });
}

// Форматирование времени аптайма
function formatUptime(seconds) {
  const days = Math.floor(seconds / (3600 * 24));
  seconds %= 3600 * 24;
  const hours = Math.floor(seconds / 3600);
  seconds %= 3600;
  const minutes = Math.floor(seconds / 60);
  seconds %= 60;
  
  return `${days}d ${hours}h ${minutes}m ${Math.floor(seconds)}s`;
}

module.exports = { 
  loadAdminPanel, 
  handlePanelInteraction,
  handleModalSubmit
};