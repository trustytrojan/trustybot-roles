const { Client, ChatInputCommandInteraction } = require('discord.js');
const setCommands = () => require('./command-data')(client);
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
      case 'eval': _eval(interaction); break;
      case 'button_roles': require('./button-roles')(interaction, single_roles); break;
      case 'dropdown_roles': await interaction.replyEphemeral('work in progress!'); break;
    } } catch(err) { handleError(err); }
  }
  
  else if(interaction.isButton()) require('./button-interaction')(interaction, single_roles);

});

client.on('guildCreate', ({ commands }) => commands.set(guild));

process.on('uncaughtException', (err) => handleError(err).then(kill));
process.on('SIGTERM', kill);
process.on('SIGINT', kill);

/**
 * this needs to be in global scope of main.js so the bot owner can access important variables
 * @param {ChatInputCommandInteraction} interaction 
 */
async function _eval(interaction) {
  const { user, options } = interaction;
  if(!global.owner) { await interaction.replyEphemeral('global owner object is undefined!'); return; }
  if(user.id !== global.owner.id) { await interaction.replyEphemeral('only my owner can use this command!'); return; }
  let code = options.getString('code');
  if(code.includes('await')) { code = `(async () => { ${code} })().catch(handleError)`; }
  let output;
  const inspect_options = {
    depth: options.getInteger('depth'),
    showHidden: options.getBoolean('showHidden')
  };
  try { output = require('util').inspect(await eval(code), inspect_options); }
  catch(err) { await interaction.replyEphemeral(formatError(err)); return; }
  let x;
  if(output.length <= 2000)
    x = '```js\n'+output+'```';
  else if(output.length > 2000 && output.length <= 4096)
    x = { embeds: [{ description: '```js\n'+output+'```' }] };
  else if(output.length > 4096)
    x = { files: [{ attachment: Buffer.from(output), name: 'output.js'}] };
  await interaction.replyEphemeral(x);
}

// disconnect from discord, save data, end process
function kill() {
  client.destroy();
  writeSingleRoles(single_roles);
  process.exit();
}

// token.json should only contain a string (not an object)
client.login(require('./token.json'));
