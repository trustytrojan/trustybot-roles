import trustybot from './trustybot.js';
import {
  import_json,
  something_went_wrong,
  modal_row,
  modal_sender,
  format_error,
  do_nothing,
  extract_text
} from './utils.js';
import { single_role_identifier } from './roles-utils.js';

import {
  ButtonStyle,
  ComponentType,
  TextInputStyle
} from 'discord.js';
const { Primary } = ButtonStyle;
const { ActionRow, Button } = ComponentType;
const { Paragraph } = TextInputStyle;

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

client.on('interactionCreate', async (interaction) => {
  function _handleError(err) {
    client.handleError(err);
    interaction.reply(format_error(err)).catch(do_nothing);
    interaction.followUp(format_error(err)).catch(do_nothing);
  }

  if(!interaction.inCachedGuild()) return;
  if(!interaction.isRepliable()) return;
  const { guild, member } = interaction;

try {
  if(interaction.isChatInputCommand()) {
    const { commandName, options } = interaction;
    switch(commandName) {
      case 'view_roles': {
        const { guild } = interaction;

        /** @type {import('discord.js').APIEmbed[]} */
        const embeds = [
          {
            author: { name: `Roles in ${guild.name}`, icon_url: guild.iconURL() },
            description: ''
          }
        ];

        let i = 0;

        const roles = (await guild.roles.fetch()).sort((a,b) => b.position-a.position).values();
        for(const role of roles) {
          const new_line = `\`${role.position}:\` ${role.toString()}\n`;

          if(embeds[i].description.length + new_line.length > 4096) {
            embeds[++i] = { description: '' };
          }

          embeds[i].description += new_line;
        }

        interaction.reply({ embeds });
      } break;
      case 'mass-manage-roles': {
        const action = options.getString('action', true);
        let a_past, a_proc, a_prop;
        switch(action) {
          case 'add': ([a_past, a_proc, a_prop] = ['added', 'addition', 'to']); break;
          case 'remove': ([a_past, a_proc, a_prop] = ['removed', 'removal', 'from']); break;
        }

        const myPerms = guild.members.me.permissions;
        const myRole = guild.members.me.roles.botRole;

        // check permissions
        if(!myPerms.has('ManageRoles', true))
          { interaction.replyEphemeral('i need `Manage Roles` perms'); return; }
        if(!member.permissions.has('ManageRoles', true))
          { interaction.replyEphemeral('you need `Manage Roles` perms'); return; }

        // result embed description
        let description;

        for(const { role } of options.data) {
          // role position check
          if(role.comparePositionTo(myRole) > 0)
            { interaction.replyEphemeral(`my role is lower than ${role}! please move me above this role!`); return; }

          // add role to all members
          let n = guild.members.cache.size;
          for(const { roles } of guild.members.cache.values()) {
            // inefficient but not important
            try {
              switch(action) {
                case 'add': await roles.add(role); break;
                case 'remove': await roles.remove(role);
              }
            } catch(err) { --n; }
          }

          description += `\n${role} ${a_past} to ${n} members`;
        }

        interaction.reply({
          ephemeral: true,
          embeds: [{
            title: `Mass ${a_proc} of roles`,
            description
          }]
        });
      } break;
      case 'create': switch(options.getSubcommand()) {
        case 'button_roles': {
          const myPerms = guild.members.me.permissions;
          const myRole = guild.members.me.roles.botRole;
        
          // check permissions
          if(!myPerms.has('ManageRoles', true))
            { interaction.replyEphemeral('i need `Manage Roles` perms to create button roles'); return; }
          if(!member.permissions.has('ManageRoles', true))
            { interaction.replyEphemeral('you need `Manage Roles` perms to create button roles'); return; }
          
          // collect roles and create button objects
          const buttons = [];
          let single_role = false;
          for(const { name, role, value } of options.data) {
            if(name === 'single_role') {
              single_role = value;
            }
        
            else if(name.startsWith('role_')) {
              if(!role) { something_went_wrong(interaction, 'undefined role'); return; }
              if(role.comparePositionTo(myRole) > 0) {
                interaction.replyEphemeral(`my role is lower than ${role}! please move me above this role so i can give it to members!`);
                return;
              }
              buttons.push({ type: Button, label: role.name, custom_id: role.id, style: Primary });
            }
        
            else if(name.startsWith('emoji_')) {
              const i = Number.parseInt(name.substring(6))-1;
              buttons[i].emoji = value;
            }
          }
        
          // whatever this is
          const modal_int = await modal_sender(interaction, 'Add message content', 120_000, [
            modal_row('content', 'message content', Paragraph, true)
          ]);
          if(!modal_int) return; // util function replied for us, so just return
          let [content] = extract_text(modal_int);
        
          // this is how the bot will identify single_role messages
          if(single_role) {
            content = `${content} ${single_role_identifier}`; // https://www.invisiblecharacter.org/
          }
        
          // construct final message with buttons          
          const final_message_components = [];
          for(let i = 0; i < Math.ceil(buttons.length/5); ++i)
            final_message_components.push({ type: ActionRow, components: [] });
          for(const b of buttons)
            final_message_components[ (final_message_components[0].components.length < 5) ? 0 : 1 ].components.push(b);
        
          // send message and save id if single_role was enabled
          try { await modal_int.reply({ content, components: final_message_components }); }
          catch(err) {
            if(err.message.includes('emoji'))
              modal_int.replyEphemeral('invalid emoji(s) supplied!');
            else
              modal_int.reply(format_error(err));
          }
        } break;
      } break;
    }
  }

  else if(interaction.isButton()) {
    const { message, customId } = interaction;

    if(guild.roles.resolve(customId)) {
      if(member.roles.resolve(customId)) {
        await member.roles.remove(customId);
        interaction.replyEphemeral(`removed <@&${customId}>!`);
      } else {
        let replaced;
        if(message.content.includes(single_role_identifier)) {
          for(const { customId: role } of message.components[0].components) {
            if(member.roles.cache.has(role)) {
              await member.roles.remove(role);
              replaced = `replaced <@&${role}> with <@&${customId}>!`;
            }
          }
        }
        await member.roles.add(customId);
        interaction.replyEphemeral(replaced ?? `added <@&${customId}>!`);
      }
    }
  }
} catch(err) { _handleError(err); } });


client.login(await import_json('./token.json'));
