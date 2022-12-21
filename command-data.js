import { ApplicationCommandOptionType } from 'discord.js';
const { Role, Boolean, String } = ApplicationCommandOptionType;

/**
 * Typing for VSCode
 * @typedef {import('discord.js').APIApplicationCommand} Command
 * @typedef {import('discord.js').APIApplicationCommandRoleOption} RoleOption
 * @typedef {import('discord.js').APIApplicationCommandBooleanOption} BooleanOption
 * @typedef {import('discord.js').APIApplicationCommandOptionChoice} Choice
 */

/** @type {BooleanOption} */
const sr_option = {
  type: Boolean,
  name: 'single_role',
  description: `restrict members to only one role?`,
  required: true
};

/** @type {RoleOption} */
const role_1 = { type: Role, name: 'role_1', description: 'role 1 (required)', required: true };

/**
 * @param {RoleOption[]} arr 
 * @param {number} start 
 * @param {number} end 
 */
function push_role_options(arr, start, end) {
  for(let i = start; i <= end; ++i)
    arr.push({ type: Role, name: `role_${i}`, description: `role ${i}` });
}

const roles_10 = [role_1];
push_role_options(roles_10, 2, 10);

const roles_24 = [...roles_10];
push_role_options(roles_24, 11, 24);

/**
 * @param {string} x 
 * @param {string | number} y 
 * @returns {Choice}
 */
const choice = (x, y) => ({ name: x, value: y ?? x });

/** @type {Command[]} */
export const global_commands = [
  { name: 'ping', description: 'check ping' }
];

/** @type {Command[]} */
export const guild_commands = [
  { name: 'view_roles', description: 'view all roles in this server' },
  { name: 'create_button_roles', description: '(manage roles required) create buttons that give roles on tap/click', options: [sr_option, ...roles_10] },
  { name: 'create_dropdown_roles', description: '(manage roles required) create a dropdown menu for roles', options: [sr_option, ...roles_10] },
  { name: 'mass_manage_roles', description: '(manage roles required) add/remove roles to/from all members', options: [
    {
      name: 'action',
      type: String,
      description: 'do you want to add or remove roles from all members?',
      choices: [choice('add'), choice('remove')],
      required: true
    },
    ...roles_24
  ] },
];