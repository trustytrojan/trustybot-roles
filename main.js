import trustybot from './trustybot.js';
import token from './token.json' assert { type: 'json' };

import view_roles from './commands/view-roles.js';
import button_roles from './commands/button-roles.js';
import any_button_interaction from './any-button-interaction.js';
import mass_manage_roles from './commands/mass-manage-roles.js';

const client = new trustybot({
  intents: [
    'Guilds',
    'GuildMembers'
  ]
});

const { chat_input, button } = client;

chat_input.on('ping', (i) => i.reply(`\`${client.ws.ping}ms\``));
chat_input.on('view_roles', (i) => view_roles(i));
chat_input.on('button_roles', (i) => button_roles(i, single_roles));
chat_input.on('mass_manage_roles', (i) => mass_manage_roles(i));

button.on('*', (i) => any_button_interaction(i, single_roles));

client.login(token);
