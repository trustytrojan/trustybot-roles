const { ApplicationCommandOptionType, APIApplicationCommand, Guild } = require('discord.js');
const { handleError, getGlobals } = require('./utils');
const { Role, Boolean, Integer, String } = ApplicationCommandOptionType;

const role_options = [
  { type: Boolean, name: 'single_role', description: `restrict members to only one role?`, required: true },
  { type: Role, name: 'role_1', description: 'role 1 (required)', required: true }
];

// support up to 10 button roles per message
for(let i = 2; i <= 10; ++i) {
  role_options.push({ type: Role, name: `role_${i}`, description: `role ${i}` });
}

/** @type {APIApplicationCommand[]} */
const global_cmds = [
  { name: 'ping', description: 'check ping' }
];

/** @type {APIApplicationCommand[]} */
const guild_cmds = [
  { name: 'button_roles', description: 'create buttons that give roles on click', options: role_options },
  { name: 'dropdown_roles', description: 'create a dropdown menu for roles', options: role_options }
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