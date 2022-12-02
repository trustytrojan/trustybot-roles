const { Client, ApplicationCommandOptionType, APIApplicationCommand } = require('discord.js');
const { handleError } = require('./utils');
const { Role, Boolean, Integer } = ApplicationCommandOptionType;

const role_options = [
  { type: Boolean, name: 'single_role', description: `restrict members to only one role?`, required: true },
  { type: Role, name: 'role_1', description: 'role 1 (required)', required: true }
];

// support up to 10 button roles per message
for(let i = 2; i <= 10; ++i) {
  role_options.push({ type: Role, name: `role_${i}`, description: `role ${i}` });
}

/** @type {APIApplicationCommand[]} */
const global = [
  { name: 'ping', description: 'check ping' },
  { name: 'eval', description: 'only my owner can use this command!', options: [
    { name: 'depth', type: Integer, description: 'object depth' },
    { name: 'show_hidden', type: Boolean, description: 'show hidden properties like getters, symbols, etc' }
  ] }
];

/** @type {APIApplicationCommand[]} */
const guild = [
  { name: 'button_roles', description: 'create buttons that give roles on click', options: role_options },
  { name: 'dropdown_roles', description: 'create a dropdown menu for roles', options: role_options }
];

/**
 * @param {Client} client 
 */
function setCommands(client) {
  client.application.commands.set(global).catch(handleError);
  for(const { commands } of client.guilds.cache.values())
    commands.set(guild).catch(handleError);
}

module.exports = setCommands;