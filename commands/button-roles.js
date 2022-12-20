import {
  ChatInputCommandInteraction,
  Collection,
  ComponentType,
  TextInputStyle,
  ButtonStyle,
} from 'discord.js';

import {
  format_error,
  modal_helper,
  modal_row,
} from '../utils.js';

import SingleRole from '../SingleRole.js';

const { ActionRow, Button } = ComponentType;
const { Paragraph } = TextInputStyle;
const { Primary } = ButtonStyle;

/**
 * @param {ChatInputCommandInteraction} interaction 
 * @param {Collection<string, SingleRole>} single_roles 
 */
export default async function button_roles(interaction, single_roles) {
  const { guild, options, channelId, member } = interaction;

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
  for(let { name, role, value } of options.data) {
    if(name === 'single_role')
      { single_role = value; continue; }

    // role position check
    if(role.comparePositionTo(myRole) > 0)
      { interaction.replyEphemeral(`my role is lower than ${role}! please move me above this role so i can give it to members!`); return; }
    
    buttons.push({ type: Button, label: role.name, custom_id: role.id, style: Primary });
  }

  // whatever this is
  const fields = await modal_helper(interaction, 'Add message content', 120_000, [
    modal_row('content', 'message content', Paragraph, true)
  ]);
  if(!fields) return; // util function replied for us, so just return
  const [content] = fields;

  // construct final message with buttons          
  const final_message_components = [];
  for(let i = 0; i < Math.ceil(buttons.length/5); ++i)
    final_message_components.push({ type: ActionRow, components: [] });
  for(const b of buttons)
    final_message_components[ (final_message_components[0].components.length < 5) ? 0 : 1 ].components.push(b);

  // send message and save id if single_role was enabled
  try {
    const { id } = await modal_int.reply({ content, fetchReply: true, components: final_message_components });
    if(single_role) single_roles.ensure(channelId, () => new SingleRole(channelId)).messages.push(id);
  } catch(err) {
    if(!(err instanceof Error)) return;
    if(err.message.includes('emoji'))
      reply_ephemeral(modal_int, 'invalid emoji(s) supplied!');
    else
      modal_int.reply(format_error(err));
  }

}