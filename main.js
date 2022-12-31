import { randomUUID } from 'crypto';
import trustybot from 'trustybot-base';
const { import_json, APIObjectCreator, Modal } = trustybot.utils; 
const { action_row } = APIObjectCreator.component;
import { single_role_identifier } from './utils.js';
import {
  RoleSelectMenuBuilder,
  UserSelectMenuBuilder,
  Collection,
  EmbedBuilder
} from 'discord.js';

/**
 * Typing for VSCode
 * @typedef {import('discord.js').APIEmbed} APIEmbed
 * @typedef {import('discord.js').GuildMember} GuildMember
 * @typedef {import('discord.js').Role} Role
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
 * @prop {'Add' | 'Remove'} action
 * @prop {'add' | 'remove'} action_lc
 * @prop {Collection<string, GuildMember | null>} members
 */

/** @type {Collection<string, MassManageRolesInProgress>} */
const mass_manage_member_roles_in_progress = new Collection();

client.on('interactionCreate', async (interaction) => {
  function handle_error(err) {
    client.handle_error(err);
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

      case 'mass_manage_member_roles': {
        const action = options.getString('action', true);
        const customId = randomUUID();

        mass_manage_member_roles_in_progress.set(customId, {
          action,
          action_lc: action.toLowerCase()
        });

        const user_menu = new UserSelectMenuBuilder({
          customId,
          minValues: 0,
          maxValues: 25
        });

        interaction.replyEphemeral({
          embeds: [{
            title: 'Mass manage member roles',
            description: `Select the members you want to apply role changes to, or none if you want to select everyone.`,
            fields: [
              { name: 'Action', value: action },
              { name: 'Members', value: '*waiting for selection...*', inline: true },
              { name: 'Roles', value: '*waiting for selection...*', inline: true }
            ]
          }],
          components: [action_row(user_menu.data)]
        });
      } break;

      case 'create': switch(options.getSubcommand()) {
        case 'button_roles': {
          const myPerms = guild.members.me.permissions;
          const myRole = guild.members.me.roles.botRole;
        
          // check permissions
          if(!myPerms.has('ManageRoles', true)) {
            interaction.replyEphemeral('i need `Manage Roles` perms to create button roles');
            return;
          }
          if(!member.permissions.has('ManageRoles', true)) {
            interaction.replyEphemeral('you need `Manage Roles` perms to create button roles');
            return;
          }
          
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
        obj.members = users.mapValues((v) => guild.members.resolve(v));
      } else {
        obj.members = guild.members.cache;
      }

      const role_menu = new RoleSelectMenuBuilder({
        customId,
        minValues: 0,
        maxValues: 25
      });

      const embed = new EmbedBuilder(message.embeds[0]);
      embed.setDescription('Select the roles to apply to your selected members.');
      embed.data.fields[1].value = users.map((v) => v.toString()).join('\n');

      interaction.update({
        embeds: [embed.data],
        components: [action_row(role_menu)]
      });
    }
  }

  else if(interaction.isRoleSelectMenu()) {
    const { customId, message } = interaction;
    if(mass_manage_member_roles_in_progress.has(customId)) {
      const obj = mass_manage_member_roles_in_progress.get(customId);
      if(!obj) return;
      const { action_lc, members } = obj;

      const embed = new EmbedBuilder(message.embeds[0]);
      embed.setDescription(`Applying role changes to members...`);

      await interaction.update({
        embeds: [embed.data],
        components: []
      });

      const total = members.size;
      let n = total;
      for(const member of members.values()) {
        if(!member) continue;
        try { await member.roles[action_lc](interaction.roles).catch(_handleError); }
        catch { --n; }
      }
      
      embed.setDescription('Done!');
      embed.setFields();
      embed.addFields('Results', `Successfully applied role changes to ${n} of ${total} members.`);

      interaction.editReply({
        embeds: [embed.data]
      });
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
} catch(err) { handle_error(err); } });


client.login(await import_json('./token.json'));
