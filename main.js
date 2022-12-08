const { Client } = require('discord.js');
const { setCommands, setCommandsForGuild } = require('./command-data');
const { handleError, initGlobals, clearOwnerDM, sendOwnerButtons } = require('./utils');
const { readSingleRoles, writeSingleRoles } = require('./SingleRole');

// run the code in prototypes.js to set desired methods in class prototypes
require('./prototypes');

const single_roles = readSingleRoles();

const client = new Client({
  intents: [
    'Guilds',
    'GuildMembers'
  ],
});

// for compatibility with external code
global.client = client;

client.on('ready', async () => {
  await initGlobals(client);
  clearOwnerDM();
  sendOwnerButtons();
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('interactionCreate', async (interaction) => {

  if(interaction.isChatInputCommand()) {
    try { switch(interaction.commandName) {
      case 'ping': await interaction.reply(`\`${client.ws.ping}ms\``); break;
      case 'eval': await require('./eval-command')(interaction); break;
      case 'button_roles': await require('./button-roles')(interaction, single_roles); break;
      case 'dropdown_roles': await interaction.replyEphemeral('work in progress!'); break;
    } } catch(err) { handleError(err); }
  }
  
  else if(interaction.isButton()) require('./button-interaction')(interaction, single_roles);

});

client.on('guildCreate', setCommandsForGuild);

process.on('uncaughtException', (err) => handleError(err).then(kill));
process.on('SIGTERM', kill);
process.on('SIGINT', kill);

// disconnect from discord, save data, end process
function kill() {
  client.destroy();
  writeSingleRoles(single_roles);
  process.exit();
}

// for eval
global.kill = kill;

// token.json should only contain a string (not an object)
client.login(require('./token.json'));
