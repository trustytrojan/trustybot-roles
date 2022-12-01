const { randomUUID } = require('crypto');
const Discord = require('discord.js');
const { writeFileSync, existsSync } = require('fs');

const { Button, TextInput, ActionRow } = Discord.ComponentType;
const { Primary, Secondary, Success, Danger } = Discord.ButtonStyle;
const { Short, Paragraph } = Discord.TextInputStyle;
const { Subcommand, String, Role } = Discord.ApplicationCommandOptionType;

const { global, guild } = require('./command-data');

const single_roles = new Discord.Collection();

const sr_file = './single_roles.json';
if(existsSync(sr_file))
  for(const o of require(sr_file))
    single_roles.set(o.channel, o);

const client = new Discord.Client({
  intents: [
    'Guilds',
    'GuildMembers'
  ],
});

let owner;

client.on('ready', async (client) => {
  ({ owner } = await client.application.fetch());
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('interactionCreate', async (interaction) => {
  function somethingWentWrong() {
    interaction.replyEphemeral(`something went wrong, please try again`).catch(console.error);
  }
  const { user, member, guild, channelId } = interaction;
  const myPerms = guild.members.me.permissions;

  if(interaction.inGuild()) {
    if(!guild) { somethingWentWrong(); return; }
  }

  if(interaction.isChatInputCommand()) {
    const { commandName, options } = interaction;
    switch(commandName) {
      case 'ping': await interaction.reply(`\`${client.ws.ping}ms\``); break;
      case 'eval': {
        if(user.id !== owner.id) { await interaction.reply('only my owner can use this command!'); break; }
        let code = options.getString('code');
        if(code.includes('await')) { code = `(async () => { ${code} })().catch(handleError)`; }
        let output;
        const inspect_options = {
          depth: options.getInteger('depth'),
          showHidden: options.getBoolean('showHidden')
        };
        try { output = require('util').inspect(await eval(code), inspect_options); }
        catch(err) { await interaction.reply(error_str(err)); break; }
        let x;
        if(output.length <= 2000)
          x = '```js\n'+output+'```';
        else if(output.length > 2000 && output.length <= 4096)
          x = { embeds: [{ description: '```js\n'+output+'```' }] };
        else if(output.length > 4096)
          x = { files: [{ attachment: Buffer.from(output), name: 'output.js'}] };
        await interaction.reply(x);
      } break;
      case 'create': switch(options.getSubcommand()) {
        case 'button_roles': {
          // check permissions
          if(!myPerms.has('ManageRoles'))
            { await interaction.replyEphemeral('i need `Manage Roles` perms to create button roles'); break; }
          if(!member.permissions.has('ManageRoles'))
            { await interaction.replyEphemeral('you need `Manage Roles` perms to create button roles'); break; }
          
          // collect roles and create button objects
          const buttons = [];
          let single_role = false;
          for(const { name, role, value } of options.data[0].options) {
            if(!(role instanceof Discord.Role)) { somethingWentWrong(); return; }
            if(role.comparePositionTo(guild.members.me.roles.botRole) > 0)
              { await interaction.replyEphemeral(`my role is lower than ${role}! please move me above this role so i can give it to members!`); return; }
            if(name === 'single_role') { single_role = value; continue; }
            buttons.push({ type: Button, label: role.name, customId: role.id, style: Primary });
          }

          // create modal to ask for message content and optional button emojis
          const modal_components = [{ type: ActionRow, components: [{ type: TextInput, customId: 'content', label: 'message content', style: Paragraph }] }];
          for(let i = 0; i < buttons.length; ++i) {
            modal_components.push({ type: ActionRow, components: [{ type: TextInput, customId: `btn${i}`, label: `emoji for @${buttons[i].label}`, style: Short, required: false }] });
          }
          const customId = randomUUID();
          await interaction.showModal({ customId, title: 'Add message & emojis', components: modal_components });
          let modal_int;
          try { modal_int = await interaction.awaitModalSubmit({ filter: (m) => m.customId === customId, time: 120_000 }); }
          catch(err) { await interaction.followUp(`${user} you took too long to submit the modal`); return; }
          const content = modal_int.fields.getTextInputValue('content');
          for(let i = 0; i < buttons.length; ++i) {
            let b;
            try { b = modal_int.fields.getTextInputValue(`btn${i}`); }
            catch(err) { continue; }
            if(b?.length === 0) continue;
            if(b === 'none') continue;
            buttons[i].emoji = b;
          }

          // construct final message with buttons          
          const final_message_components = [];
          for(let i = 0; i < Math.ceil(buttons.length/5); ++i)
            final_message_components.push({ type: ActionRow, components: [] });
          for(const b of buttons) {
            final_message_components[ (final_message_components[0].components.length < 5) ? 0 : 1 ].components.push(b);
          }

          // send message and save id if single_role was enabled
          try {
            const { id } = await modal_int.reply({ content, fetchReply: true, components: final_message_components });
            if(single_role) single_roles.ensure(channelId, () => ({ channelId, messages: [id] }));
          } catch(err) {
            if(err.message.includes('emoji'))
              await modal_int.replyEphemeral('invalid emoji(s) supplied!');
            else
              await modal_int.reply(error_str(err));
          }
        } break;
        case 'dropdown_roles': {
          
        }
      }
    }
  }
  
  else if(interaction.isButton()) {
    const { customId } = interaction;
    if((await guild?.roles.fetch()).has(customId)) {
      if(!(member instanceof Discord.GuildMember)) { somethingWentWrong(); return; }
      if(member.roles.cache.has(customId)) {
        await member.roles.remove(customId);
        await interaction.replyEphemeral(`removed <@&${customId}>!`);
      } else {
        let replaced;
        if(single_roles.get(channelId)?.messages.includes(message.id))
          for(const { customId: x } of message.components[0].components) 
            if(member.roles.cache.has(x)) {
              await member.roles.remove(x);
              replaced = `replaced <@&${x}> with <@&${customId}>!`;
            }
        await member.roles.add(customId);
        await interaction.replyEphemeral(replaced ?? `added <@&${customId}>!`);
      }
    }
  }

});

client.on('guildCreate', ({ commands }) => commands.set(guild));

process.on('uncaughtException', (err) => { console.error(err); kill(); });
process.on('SIGTERM', kill);
process.on('SIGINT', kill);

/**
 * shortcut for replying with an ephemeral message
 * @param {string | object} x
 */
Discord.BaseInteraction.prototype.replyEphemeral = function(x) {
  if(!this.reply)
    throw new TypeError('type of "this" does not have "reply" property method');
  if(typeof x === 'string')
    return this.reply({ content: x, ephemeral: true });
  if(typeof x === 'object') {
    x.ephemeral = true;
    return this.reply(x);
  }
  throw new TypeError(`Expected argument of type "string" or "object", received "${typeof x}" instead`);
}

/**
 * formats an error to be sent in discord
 * @param {Error} err
 * @returns {string}
 */
const error_str = (err) => `**this is an error**\`\`\`js\n${err.stack ?? err}\`\`\``;

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
