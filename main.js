const { Client, GatewayIntentBits, ActivityType } = require('discord.js');
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// Конфигурация
const config = {
  mainServerId: 'Основной сервер ID',
  adminServerId: 'Второй сервер ID',
  rolePairs: {
    'Роль ID основного': 'Роль ID второго', //пишите сюда роль, чтобы не потеряться
    //Можно добавить максимум 50 ролей
  },
  activity: {
    name: 'Название актисности',
    type: ActivityType.Watching, //типы активности (ActivityType) могут быть: Playing - Играет в... Streaming - Стримит... (требуется URL) Listening - Слушает... Watching - Смотрит... Competing - Соревнуется в...
    url: '_____' // Замените на реальную ссылку (Работает только с подтверждёнными ботами
  }
};

client.on('ready', () => {
  console.log(`Бот ${client.user.tag} готов к работе!`);
  
  // Устанавливаем активность с кнопкой-ссылкой
  client.user.setPresence({
    activities: [{
      name: config.activity.name,
      type: config.activity.type,
      url: config.activity.url
    }],
    status: 'online'
  });
});

client.on('guildMemberUpdate', async (oldMember, newMember) => {
  // Проверяем, что событие произошло на основном сервере
  if (newMember.guild.id !== config.mainServerId) return;

  // Получаем добавленные и удаленные роли
  const addedRoles = newMember.roles.cache.filter(role => !oldMember.roles.cache.has(role.id));
  const removedRoles = oldMember.roles.cache.filter(role => !newMember.roles.cache.has(role.id));

  // Находим админский сервер
  const adminServer = client.guilds.cache.get(config.adminServerId);
  if (!adminServer) {
    console.error('Админский сервер не найден!');
    return;
  }

  // Находим пользователя на админском сервере
  const adminServerMember = await adminServer.members.fetch(newMember.id).catch(() => null);
  if (!adminServerMember) return;

  // Обрабатываем добавленные роли
  for (const [roleId] of addedRoles) {
    if (config.rolePairs[roleId]) {
      const roleToAdd = adminServer.roles.cache.get(config.rolePairs[roleId]);
      if (roleToAdd) {
        await adminServerMember.roles.add(roleToAdd).catch(console.error);
        console.log(`Добавлена роль ${roleToAdd.name} пользователю ${newMember.user.tag}`);
      }
    }
  }

  // Обрабатываем удаленные роли
  for (const [roleId] of removedRoles) {
    if (config.rolePairs[roleId]) {
      const roleToRemove = adminServer.roles.cache.get(config.rolePairs[roleId]);
      if (roleToRemove) {
        await adminServerMember.roles.remove(roleToRemove).catch(console.error);
        console.log(`Удалена роль ${roleToRemove.name} у пользователя ${newMember.user.tag}`);
      }
    }
  }
});

client.login('Токен вашего бота');
