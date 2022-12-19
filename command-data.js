const { ApplicationCommandOptionType, APIApplicationCommand, Guild } = require('discord.js');
const { handleError, getGlobals } = require('./utils');
const { Role, Boolean } = ApplicationCommandOptionType;

const sr_option = { type: Boolean, name: 'single_role', description: `restrict members to only one role?`, required: true };

const roles_10 = [
  { type: Role, name: 'role_1', description: 'role 1 (required)', required: true }
];

// support up to 10 button roles per message
for(let i = 2; i <= 10; ++i) {
  roles_10.push({ type: Role, name: `role_${i}`, description: `role ${i}` });
}

/** @type {APIApplicationCommand[]} */
const global_cmds = [
  { name: 'ping', description: 'check ping' }
];

/** @type {APIApplicationCommand[]} */
const guild_cmds = [
  { name: 'button_roles', description: '(manage roles required) create buttons that give roles on click', options: [sr_option, ...roles_10] },
  { name: 'dropdown_roles', description: '(manage roles required) create a dropdown menu for roles', options: [sr_option, ...roles_10] },
  { name: 'add_role_to_all', description: '(manage roles required) add roles to all members', options: roles_10 },
  { name: 'remove_role_from_all', description: '(manage roles required) remove roles from members', options: roles_10 }
];

async function setCommands() {
  await setGlobalCommands();
  await setGuildCommands();
}

async function setGlobalCommands() {
  const { client } = getGlobals();
  await client.application.commands.set(global_cmds).catch(handleError);
  console.log('global commands set');
}

async function setGuildCommands() {
  const { client } = getGlobals();
  for(const { id, name, commands } of client.guilds.cache.values())
    try {
      await commands.set(guild_cmds);
      console.log(`set commands for guild ${id} ${name}`);
    } catch(err) {
      console.error(`could not set commands for guild ${id} ${name}`);
      handleError(err);
    }
}

/** @param {Guild} guild */
const setCommandsForGuild = ({ commands }) => commands.set(guild_cmds);

module.exports = {
  get setCommands() { return setCommands; },
  get setGlobalCommands() { return setGlobalCommands; },
  get setGuildCommands() { return setGuildCommands; },
  get setCommandsForGuild() { return setCommandsForGuild; },
};