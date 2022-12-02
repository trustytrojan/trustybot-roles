const { randomUUID } = require('crypto');
const Discord = require('discord.js');
const { writeFileSync, existsSync } = require('fs');

const { global, guild } = require('./command-data');
const { formatError, readSingleRoles, writeSingleRoles, SingleRole, initOwner } = require('./utils');

// run the code in prototypes.js to set desired methods in class prototypes
require('./prototypes');

const single_roles = readSingleRoles();

const client = new Discord.Client({
  intents: [
    'Guilds',
    'GuildMembers'
  ],
});

/** @type {Discord.User} */
let owner;

client.on('ready', async (client) => {
  initOwner(client);
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('interactionCreate', async (interaction) => {
  const { user, member, guild, channelId } = interaction;
  const myPerms = guild.members.me.permissions;

  if(interaction.inGuild()) {
    if(!guild) { somethingWentWrong(); return; }
  }

  if(interaction.isChatInputCommand()) {
    const { commandName, options } = interaction;
    try { switch(commandName) {
      case 'ping': await interaction.reply(`\`${client.ws.ping}ms\``); break;
      case 'eval': require('./commands/eval')(interaction, owner); break;
      case 'create': switch(options.getSubcommand()) {
        case 'button_roles': require('./commands/button-roles')(interaction, single_roles); break;
        case 'dropdown_roles': /* require('./dropdown-roles)(interaction, single_roles); */ break;
      } break;
    } } catch(err) { handleError(err); }
  }
  
  else if(interaction.isButton()) require('./button-interaction')(interaction, single_roles);

});

client.on('guildCreate', ({ commands }) => commands.set(guild));

process.on('uncaughtException', async (err) => { await handleError(err); kill(); });
process.on('SIGTERM', kill);
process.on('SIGINT', kill);

// for use with /eval
function setCommands() {
  client.application.commands.set(global).catch(console.error);
  for(const { commands } of client.guilds.cache.values())
    commands.set(guild).catch(console.error);
}

// save single role channels
const writeData = () => writeFileSync(sr_file, JSON.stringify(single_roles, null, '  '));

// disconnect from discord, save data, end process
function kill() { client.destroy(); writeData(); process.exit(); }

// token.json should only contain a string (not an object)
client.login(require('./token.json'));
