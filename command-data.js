import { ApplicationCommandOptionType } from 'discord.js';
const { Role, Boolean, String, Subcommand } = ApplicationCommandOptionType;

const sr_option = {
  type: Boolean,
  name: 'single_role',
  description: `restrict members to only one role?`,
  required: true
};

const role_1 = { type: Role, name: 'role_1', description: 'role 1 (required)', required: true };

const roles_emojis_10 = [
  role_1,
  { type: String, name: 'emoji_1', description: 'emoji for role 1' }
];
for(let i = 2; i <= 10; ++i) {
  roles_emojis_10.push(
    { type: Role, name: `role_${i}`, description: `role ${i}` },
    { type: String, name: `emoji_${i}`, description: `emoji for role ${i}` }
  );
}

const roles_24 = [role_1];
for(let i = 2; i <= 24; ++i) {
  roles_24.push({ type: Role, name: `role_${i}`, description: `role ${i}` });
}

const choice = (x, y) => ({ name: x, value: y ?? x });

/** @type {Command[]} */
export const guild_commands = [
  { name: 'view_roles', description: 'view all roles in this server' },
  { name: 'create', description: 'create something', options: [
    {
      name: 'button_roles',
      type: Subcommand,
      description: '(manage roles required) create buttons that give roles on tap/click',
      options: [sr_option, ...roles_emojis_10]
    },
    // dropdown_roles...?
  ] },
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