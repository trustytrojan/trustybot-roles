import { ApplicationCommandOptionType } from 'discord.js';

const { Role, Boolean, String } = ApplicationCommandOptionType;

const sr_option = {
  type: Boolean,
  name: 'single_role',
  description: `restrict members to only one role?`,
  required: true
};

const role_1 = { type: Role, name: 'role_1', description: 'role 1 (required)', required: true };

const roles_10 = [role_1];
for(let i = 2; i <= 10; ++i) {
  roles_10.push({ type: Role, name: `role_${i}`, description: `role ${i}` });
}

const roles_24 = [...roles_10];
for(let i = 11; i <= 24; ++i) {
  roles_24.push({ type: Role, name: `role_${i}`, description: `role ${i}` });
}

export const global_commands = [
  { name: 'ping', description: 'check ping' }
];                                                                                                                        
                    
export const guild_commands = [
  { name: 'button_roles', description: '(manage roles required) create buttons that give roles on click', options: [sr_option, ...roles_10] },
  { name: 'dropdown_roles', description: '(manage roles required) create a dropdown menu for roles', options: [sr_option, ...roles_10] },
  { name: 'mass_manage_roles', description: '(manage roles required) add/remove roles to/from all members', options: [
    { name: 'action', type: String, description: 'do you want to add or remove roles from all members?', choices: [
      { name: 'add', value: 'add' }, { name: 'remove', value: 'remove' }
    ] },
    ...roles_24
  ] },
];