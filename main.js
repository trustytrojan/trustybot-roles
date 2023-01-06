import { randomUUID } from 'crypto';
import trustybot from 'trustybot-base';
const { import_json, APIObjectCreator, Modal, format_error, do_nothing } = trustybot.utils; 
const { action_row, button } = APIObjectCreator.component;
import { single_role_identifier } from './utils.js';
import {
  RoleSelectMenuBuilder,
  UserSelectMenuBuilder,
  Collection,
  EmbedBuilder,
  ComponentType
} from 'discord.js';

/**
 * Typing for VSCode
 * @typedef {import('discord.js').APIEmbed} APIEmbed
 * @typedef {import('discord.js').GuildMember} GuildMember
 * @typedef {import('discord.js').Role} Role
 * @typedef {import('discord.js').APIButtonComponent} APIButtonComponent
 * @typedef {import('discord.js').APIRoleSelectComponent} APIRoleSelectComponent
 */

const client = new trustybot(
  {
    intents: [
      'Guilds',
      'GuildMembers'
    ]
  },
  {
    guild: (await import('./command-data.js')).guild_commands
  }
);

/**
 * @typedef {object} MassManageRolesInProgress
 * @prop {'add' | 'remove'} action
 * @prop {IterableIterator<GuildMember | null>} members
 */

/**
 * @typedef {object} ButtonRolesInProgress
 * @prop {boolean} single_role
 * @prop {APIButtonComponent[]} buttons
 */

/** @type {Collection<string, MassManageRolesInProgress>} */
const mass_manage_member_roles_in_progress = new Collection();

/** @type {Collection<string, ButtonRolesInProgress>} */
const button_roles_in_progress = new Collection();

client.on('interactionCreate', async (interaction) => {
  function handle_error(err) {
    client.handle_error(err);
    interaction.reply(format_error(err)).catch(do_nothing);
    interaction.followUp(format_error(err)).catch(do_nothing);
  }

  if(!interaction.inCachedGuild()) return;
  if(!interaction.isRepliable()) return;
  const { guild, member, channel, appPermissions, memberPermissions } = interaction;

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

      case 'mass_manage_member_roles': {
        if(!appPermissions.has('ManageRoles', true)) {
          interaction.replyEphemeral('i need the `Manage Roles` permission to manage member roles!');
          return;
        }
        if(!memberPermissions.has('ManageRoles', true)) {
          interaction.replyEphemeral('you need `Manage Roles` perms to manage member roles!');
          return;
        }

        const action = options.getString('action', true);
        const customId = randomUUID();

        mass_manage_member_roles_in_progress.set(customId, {
          action: action.toLowerCase()
        });

        const user_menu = new UserSelectMenuBuilder({
          customId,
          minValues: 0,
          maxValues: 25
        });

        interaction.reply({
          embeds: [{
            title: 'Mass manage member roles',
            description: `Select the members you want to apply role changes to, or none if you want to select everyone.`,
            fields: [
              { name: 'Action', value: action },
              { name: 'Members', value: '*waiting...*', inline: true },
              { name: 'Roles', value: '*waiting...*', inline: true }
            ]
          }],
          components: [action_row(user_menu.data)],
          ephemeral: true
        });
      } break;

      case 'create': switch(options.getSubcommand()) {
        case 'button_roles': {
          const single_role = options.getBoolean('single_role', true);
        
          // check permissions
          if(!appPermissions.has('ManageRoles', true)) {
            interaction.replyEphemeral('i need `Manage Roles` perms to create button roles');
            return;
          }
          if(!memberPermissions.has('ManageRoles', true)) {
            interaction.replyEphemeral('you need `Manage Roles` perms to create button roles');
            return;
          }

          // remember this interaction
          const customId = randomUUID();
          button_roles_in_progress.set(customId, {
            buttons: [],
            single_role
          });

          const role_menu = new RoleSelectMenuBuilder({
            customId,
            max_values: 10
          });

          // ask for roles
          interaction.replyEphemeral({
            embeds: [{
              title: 'Creating button roles',
              description: 'Choose the roles to be included in this set of button roles.',
              fields: [
                { name: 'Roles', value: '*waiting...*', inline: true },
                { name: 'One role?', value: single_role ? 'Yes' : 'No', inline: true }
              ]
            }],
            components: [action_row(role_menu)]
          });
        } break;

        {
          // collect roles and create button objects
          const buttons = [];
          let single_role = false;
          for(const { name, role, value } of options.data[0].options) {
            if(name === 'single_role') {
              single_role = value;
            }
        
            else if(name.startsWith('role_')) {
              // dynamic errors...?
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
          const [modal_int, text] = await Modal.send_and_receive(interaction, 'Add message content', 120_000, [
            Modal.row.paragraph('content', 'message content', { r: true })
          ]);
          if(!modal_int) {
            interaction.followUp('you took too long to submit the modal');
            return;
          }
          let [content] = text;
        
          // this is how the bot will identify single_role messages
          if(single_role) {
            content = `${content}${single_role_identifier}`; // https://www.invisiblecharacter.org/
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

  else if(interaction.isUserSelectMenu()) {
    const { customId, users, message } = interaction;
    if(mass_manage_member_roles_in_progress.has(customId)) {
      const obj = mass_manage_member_roles_in_progress.get(customId);
      if(!obj) return;
      
      if(users.size > 0) {
        obj.members = users.map((v) => guild.members.resolve(v)).values();
      } else {
        obj.members = guild.members.cache.values();
      }

      const role_menu = new RoleSelectMenuBuilder({
        customId,
        minValues: 0,
        maxValues: 25
      });

      const embed = new EmbedBuilder(message.embeds[0]);
      embed.data.fields[1].value = users.map((v) => v.toString()).join('\n');
      embed.setDescription('Select the roles to apply to your selected members.');

      interaction.update({
        embeds: [embed.data],
        components: [action_row(role_menu)]
      });
    }
  }

  else if(interaction.isRoleSelectMenu()) {
    const { customId, message, roles } = interaction;
    let obj;

    if(obj = mass_manage_member_roles_in_progress.get(customId)) {
      const { action, members } = obj;

      const embed = new EmbedBuilder(message.embeds[0]);
      embed.setDescription(`Applying role changes to members...`);

      await interaction.update({
        embeds: [embed.data],
        components: []
      });

      for(const member of members) {
        if(!member) continue;
        try { await member.roles[action](roles).catch(_handleError); }
        catch { --n; }
      }
      
      embed.setDescription('Done!');
      embed.addField('Results', `Successfully applied the desired role changes to the selected members.`);

      interaction.editReply({
        embeds: [embed.data]
      });
    }

    else if(obj = button_roles_in_progress.get(customId)) {
      await interaction.deferUpdate();

      const myRole = guild.members.me.roles.botRole;
      const embed = new EmbedBuilder(message.embeds[0]);

      for(const role of roles.values()) {
        if(role.comparePositionTo(myRole) > 0) {
          embed.setFields();
          embed.setDescription(`**Error:** My role is lower than ${role}! Please move my role above this role so I can give it to members!`);

          button_roles_in_progress.delete(customId);

          interaction.editReply({
            embeds: [embed.data],
            components: []
          });

          return;
        }
        obj.buttons.push(button.primary(role.id, role.name));
      }

      embed.data.fields[0].value = roles.map((v) => v.toString()).join('\n');
      embed.setDescription('You need to provide a message for these roles. Press the button below to submit a message.');

      interaction.editReply({
        embeds: [embed.data],
        components: [action_row(
          button.primary(customId, 'Enter message')
        )]
      });
    }
  }

  else if(interaction.isButton()) {
    const { message, customId } = interaction;
    let obj;

    if(obj = button_roles_in_progress.get(customId)) {
      const embed = new EmbedBuilder(message.embeds[0]);

      // the modal replies to the interaction
      const [modal_int, text] = await Modal.send_and_receive(interaction, 'Message for button roles', 120_000, [
        Modal.row.paragraph('content', 'message content', { r: true })
      ]);
      if(!modal_int) {
        embed.setFields();
        embed.setDescription(`You took too long to submit the form!`);

        interaction.editReply({
          embeds: [embed.data]
        });

        return;
      }
      if(!modal_int.isFromMessage()) return;

      embed.setDescription(`Form received! Sending message...`);
      await modal_int.update({
        embeds: [embed.data]
      });

      let [content] = text;
      if(obj.single_role) {
        content = `${content}${single_role_identifier}`;
      }

      await channel.send({
        content,
        components: [action_row(obj.buttons)]
      });

      embed.setFields();
      embed.setDescription(`Done! I've sent a message in this channel with the button roles.`);

      interaction.editReply({
        embeds: [embed.data],
        components: []
      });

      button_roles_in_progress.delete(customId);
    }

    else if(guild.roles.cache.has(customId)) {
      if(member.roles.cache.has(customId)) {
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

  else if(interaction.isMessageContextMenuCommand()) {
    if(!memberPermissions.has('ManageRoles', true)) {
      interaction.replyEphemeral('you need `Manage Roles` perms to create button roles');
      return;
    }

    const { targetMessage } = interaction;

    if(targetMessage.components.length === 0) {
      interaction.replyEphemeral(`this message does not have any components!`);
      return;
    }

    const buttons = [];
    for(const action_row of targetMessage.components) {
      for(const button of action_row.components) {
        if(button.type !== ComponentType.Button) {
          interaction.replyEphemeral(`this message has non-button components!`);
          return;
        }
        buttons.push(button);
      }
    }

    let roles_str = '';
    let i = 1;
    for(const { customId, emoji } of buttons) {
      roles_str += `\`${i++}:\`${emoji ? ` ${emoji}` : ''} <@&${customId}>\n`;
    }

    const embed = new EmbedBuilder({
      title: 'Editing Button/Dropdown Roles',
      description: 'Below are all the roles that this message has. You can edit these roles and their emojis.',
      fields: [
        { name: 'Roles (+ emojis)', value: roles_str }
      ]
    });

    interaction.replyEphemeral({
      embeds: [embed.data],
      components: null
    });
  }

} catch(err) { handle_error(err); } });


client.login(await import_json('./token.json'));
