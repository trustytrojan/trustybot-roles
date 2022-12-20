import trustybot from './trustybot.js';
import SingleRole from './SingleRole.js';
import button_roles from './commands/button-roles.js';
import token from './token.json' assert { type: 'json' };
import any_button_interaction from './any-button-interaction.js';

const single_roles = await SingleRole.readFromFile();

const client = new trustybot({
  intents: [
    'Guilds',
    'GuildMembers'
  ]
}, () => SingleRole.writeToFile(single_roles));

const { chat_input, button } = client;

chat_input.on('ping', (i) => i.reply(`\`${client.ws.ping}ms\``));
chat_input.on('button_roles', (i) => button_roles(i, single_roles));

button.on('*', (i) => any_button_interaction(i, single_roles));

client.login(token);
