import {
  ChatInputCommandInteraction,
  Collection,
  ComponentType,
  TextInputStyle,
  ButtonStyle,
} from 'discord.js';

import {
  extract_text,
  format_error,
  modal_helper,
  modal_row,
} from '../utils.js';

import '../prototype.js';

const { ActionRow, Button } = ComponentType;
const { Paragraph } = TextInputStyle;
const { Primary } = ButtonStyle;

/**
 * @param {ChatInputCommandInteraction} interaction 
 */
export default async function create_button_roles(interaction) {
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
  const modal_int = await modal_helper(interaction, 'Add message content', 120_000, [
    modal_row('content', 'message content', Paragraph, true)
  ]);
  if(!modal_int) return; // util function replied for us, so just return
  let [content] = extract_text(modal_int);

  // this is how the bot will identify single_role messages
  if(single_role)
    content = `${content} ||single_role||`;

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
      reply_ephemeral(modal_int, 'invalid emoji(s) supplied!');
    else
      modal_int.reply(format_error(err));
  }

}