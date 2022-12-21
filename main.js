import trustybot from './trustybot.js';
import token from './token.json' assert { type: 'json' };

import view_roles from './commands/view-roles.js';
import create_button_roles from './commands/create-button-roles.js';
import any_button_interaction from './any-button-interaction.js';
import mass_manage_roles from './commands/mass-manage-roles.js';

const client = new trustybot(
  {
    intents: [
      'Guilds',
      'GuildMembers'
    ]
  },
  {
    guild_commands: (await import('./command-data.js')).guild_commands
  }
);

const { chat_input, button } = client;

chat_input.on('view_roles', (i) => view_roles(i));
chat_input.on('create_button_roles', (i) => create_button_roles(i));
chat_input.on('mass_manage_roles', (i) => mass_manage_roles(i));

button.on('*', (i) => any_button_interaction(i));

client.login(token);
