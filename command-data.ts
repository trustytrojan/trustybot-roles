import {
  ApplicationCommandOptionType,
  ApplicationCommandOption,
} from 'discord.js';

const { Role, Boolean } = ApplicationCommandOptionType;

const sr_option: ApplicationCommandOption = {
  type: Boolean,
  name: 'single_role',
  description: `restrict members to only one role?`,
  required: true
};

const roles_10: ApplicationCommandOption[] = [
  {
    type: Role,
    name: 'role_1',
    description: 'role 1 (required)',
    required: true
  }
];

// support up to 10 button roles per message
for(let i = 2; i <= 10; ++i) {
  roles_10.push({ type: Role, name: `role_${i}`, description: `role ${i}` });
}

export const global_commands = [
  { name: 'ping', description: 'check ping' }
];

export const guild_commands = [
  { name: 'button_roles', description: '(manage roles required) create buttons that give roles on click', options: [sr_option, ...roles_10] },
  { name: 'dropdown_roles', description: '(manage roles required) create a dropdown menu for roles', options: [sr_option, ...roles_10] },
  { name: 'add_role_to_all', description: '(manage roles required) add roles to all members', options: roles_10 },
  { name: 'remove_role_from_all', description: '(manage roles required) remove roles from members', options: roles_10 }
];