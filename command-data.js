const Discord = require('discord.js');

const { Subcommand, String, Role, Boolean } = Discord.ApplicationCommandOptionType;

const button_roles_options = [
  { type: Boolean, name: 'single_role', description: `restrict members to only one role?`, required: true },
  { type: Role, name: 'role_1', description: 'role 1 (required)', required: true }
];

// support up to 10 button roles per message
for(let i = 2; i <= 10; ++i) {
  button_roles_options.push({ type: Role, name: `role_${i}`, description: `role ${i}` });
}

module.exports = {
  global: [
    { name: 'ping', description: 'check ping' },
  ],

  guild: [
    { name: 'create', description: 'create a role interface', options: [
      { name: 'button_roles', type: Subcommand, description: 'create button roles', options: button_roles_options },
      // { name: 'dropdown_roles', type: Subcommand, options: [
  
      // ] }
    ] }
  ]
};
