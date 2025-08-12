const { sendLog } = require('../utils/logger');

module.exports = {
  name: 'guildMemberUpdate',
  async execute(oldMember, newMember, client) {
    if (newMember.guild.id !== client.config.mainServerId) return;

    const addedRoles = newMember.roles.cache.filter(role => !oldMember.roles.cache.has(role.id));
    const removedRoles = oldMember.roles.cache.filter(role => !newMember.roles.cache.has(role.id));

    const adminServer = client.guilds.cache.get(client.config.adminServerId);
    if (!adminServer) {
      sendLog(client, 'Админский сервер не найден!', 'error');
      return;
    }

    const adminServerMember = await adminServer.members.fetch(newMember.id).catch(() => null);
    if (!adminServerMember) return;

    for (const [roleId] of addedRoles) {
      if (client.config.rolePairs[roleId]) {
        const roleToAdd = adminServer.roles.cache.get(client.config.rolePairs[roleId]);
        if (roleToAdd) {
          await adminServerMember.roles.add(roleToAdd).catch(err => {
            sendLog(client, `Ошибка при добавлении роли: ${err.message}`, 'error');
          });
          sendLog(client, `Добавлена роль ${roleToAdd.name} пользователю ${newMember.user.tag}`, 'info');
        }
      }
    }

    for (const [roleId] of removedRoles) {
      if (client.config.rolePairs[roleId]) {
        const roleToRemove = adminServer.roles.cache.get(client.config.rolePairs[roleId]);
        if (roleToRemove) {
          await adminServerMember.roles.remove(roleToRemove).catch(err => {
            sendLog(client, `Ошибка при удалении роли: ${err.message}`, 'error');
          });
          sendLog(client, `Удалена роль ${roleToRemove.name} у пользователя ${newMember.user.tag}`, 'info');
        }
      }
    }
  }
};