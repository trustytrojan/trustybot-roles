const { randomUUID } = require('crypto');
const { inspect } = require('util');
const Discord = require('discord.js');
const { writeFileSync, existsSync } = require('fs');

const { Button, TextInput, ActionRow } = Discord.ComponentType;
const { Primary, Secondary, Success, Danger } = Discord.ButtonStyle;
const { Short, Paragraph } = Discord.TextInputStyle;
const { Subcommand, String, Role } = Discord.ApplicationCommandOptionType;

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
  //setCommands();
  ({ owner } = await client.application.fetch());
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('interactionCreate', async (interaction) => {
  function somethingWentWrong() {
    interaction.replyEphemeral(`something went wrong, please try again`).catch(console.error);
  }
  const { user, member, guild, guildId, channel, channelId } = interaction;
  const myPerms = guild.members.me.permissions;

  if(interaction.inGuild()) {
    if(!guild) { somethingWentWrong(); return; }
  }

  if(interaction.isChatInputCommand()) {
    const { commandName, options } = interaction;
    switch(commandName) {
      case 'ping': await interaction.reply(`\`${client.ws.ping}ms\``); break;
      case 'create': switch(options.getSubcommand()) {
        case 'button_roles': {
          // check permissions
          if(!myPerms.has('ManageRoles')) {
            await interaction.replyEphemeral('i need `Manage Roles` perms to create button roles');
            break;
          }
          if(!member.permissions.has('ManageRoles')) {
            await interaction.replyEphemeral('you need `Manage Roles` perms to create button roles');
            break;
          }
          
          // collect roles and create button objects
          const buttons = [];
          let single_role = false;
          for(const { name, role, value } of options.data[0].options) {
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
      if(!(member instanceof Discord.GuildMember)) { await somethingWentWrong(); return; }
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

process.on('uncaughtException', (err) => { console.error(err); kill(); });
process.on('SIGTERM', () => { console.error('SIGTERM'); kill(); });
process.on('SIGINT', () => { console.error('SIGINT'); kill(); });

Discord.BaseInteraction.prototype.replyEphemeral = async function(x) {
  if(typeof x === 'string')
    await this.reply({ content: x, ephemeral: true });
  else if(typeof x === 'object') {
    x.ephemeral = true;
    await this.reply(x);
  }
}

/**
 * @param {Error} err
 * @returns {string}
 */
function error_str(err) {
  return `**this is an error**\`\`\`js\n${err}\`\`\``;
}

function setCommands() {
  const { global, guild } = require('./command-data');
  client.application.commands.set(global).catch(console.error);
  for(const { commands } of client.guilds.cache.values())
    commands.set(guild).catch(console.error);
}

function writeData() {
  writeFileSync(sr_file, JSON.stringify(single_roles, null, '  '));
}

function kill() { client.destroy(); writeData(); process.exit(); }

client.login(require('./token.json').token);
