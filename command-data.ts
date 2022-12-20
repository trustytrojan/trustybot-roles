import {
  ApplicationCommandOptionType,
  ApplicationCommandOption,
  ChatInputApplicationCommandData,
} from 'discord.js';

const { Role, Boolean, String } = ApplicationCommandOptionType;

const sr_option: ApplicationCommandOption = {
  type: Boolean,
  name: 'single_role',
  description: `restrict members to only one role?`,
  required: true
};

function add_roles_to_options(role_arr: ApplicationCommandOption[], start: number, end: number) {
  for(let i = start; i <= end; ++i) {
    role_arr.push({ type: Role, name: `role_${i}`, description: `role ${i}` });
  }
}

const roles_10: ApplicationCommandOption[] = [
  { type: Role, name: 'role_1', description: 'role 1 (required)', required: true }
];
add_roles_to_options(roles_10, 2, 10);

const roles_25 = [...roles_10];
add_roles_to_options(roles_25, 11, 25);

export const global_commands: ChatInputApplicationCommandData[] = [
  { name: 'ping', description: 'check ping' }
];

export const guild_commands: ChatInputApplicationCommandData[] = [
  { name: 'button_roles', description: '(manage roles required) create buttons that give roles on click', options: [sr_option, ...roles_10] },
  { name: 'dropdown_roles', description: '(manage roles required) create a dropdown menu for roles', options: [sr_option, ...roles_10] },
  { name: 'mass_manage_roles', description: '(manage roles required) add/remove roles to/from all members', options: [
    { name: 'action', type: String, description: 'do you want to add or remove roles from all members?', choices: [
      { name: 'add', value: 'add' }, { name: 'remove', value: 'remove' }
    ] }
  ] },
];