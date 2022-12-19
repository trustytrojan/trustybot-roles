import {
  ChatInputCommandInteraction,
  Collection,
  ComponentType,
  TextInputStyle,
  ButtonStyle,
  Role,
  GuildMember,
  APIButtonComponent,
  APIActionRowComponent
} from 'discord.js';

import {
  format_error,
  modal_row,
  reply_ephemeral,
  send_modal_and_wait_for_submit,
  something_went_wrong
} from './utils';

import SingleRole from './SingleRole';

const { ActionRow, Button } = ComponentType;
const { Paragraph } = TextInputStyle;
const { Primary } = ButtonStyle;

export default async function button_roles(
  interaction: ChatInputCommandInteraction,
  single_roles: Collection<string, SingleRole>
) {

  const { guild, options, channelId } = interaction;
  let { member } = interaction;

  // type checks
  if(!guild) return;
  if(!member) { something_went_wrong(interaction); return; }
  if(!(member instanceof GuildMember))
    member = await guild.members.fetch(member.user.id);
  const me = guild.members.me;
  if(!me) { something_went_wrong(interaction); return; }
  const myPerms = me.permissions;
  const myRole = me.roles.botRole;
  if(!myRole) { reply_ephemeral(interaction, `i don't have a dedicated role in this server!`); return; }

  // check permissions
  if(!myPerms.has('ManageRoles', true))
    { reply_ephemeral(interaction, 'i need `Manage Roles` perms to create button roles'); return; }
  if(!member.permissions.has('ManageRoles', true))
    { reply_ephemeral(interaction, 'you need `Manage Roles` perms to create button roles'); return; }
  
  // collect roles and create button objects
  const buttons: APIButtonComponent[] = [];
  let single_role = false;
  for(let { name, role, value } of options.data) {
    // type checks
    if(!role) { something_went_wrong(interaction); return; }
    if(!(role instanceof Role))
      role = await guild.roles.fetch(role.id);
    if(!role) { reply_ephemeral(interaction, `one of the roles you gave me does not exist!`); return; }

    // role position check
    if(role.comparePositionTo(myRole) > 0)
      { reply_ephemeral(interaction, `my role is lower than ${role}! please move me above this role so i can give it to members!`); return; }
    
    if(name === 'single_role' && typeof value === 'boolean')
      { single_role = value; continue; }
    buttons.push({ type: Button, label: role.name, custom_id: role.id, style: Primary });
  }

  // whatever this is
  const modal_int = await send_modal_and_wait_for_submit(interaction, 'Add message content', 120_000, [
    modal_row('content', 'message content', Paragraph, true)
  ]);
  if(!modal_int) return;
  const content = modal_int.fields.getTextInputValue('content');

  // construct final message with buttons          
  const final_message_components: APIActionRowComponent<APIButtonComponent>[] = [];
  for(let i = 0; i < Math.ceil(buttons.length/5); ++i)
    final_message_components.push({ type: ActionRow, components: [] });
  for(const b of buttons) {
    final_message_components[ (final_message_components[0].components.length < 5) ? 0 : 1 ].components.push(b);
  }

  // send message and save id if single_role was enabled
  try {
    const { id } = await modal_int.reply({ content, fetchReply: true, components: final_message_components });
    if(single_role) single_roles.ensure(channelId, () => new SingleRole(channelId)).messages.push(id);
  } catch(err) {
    if(err.message.includes('emoji'))
      reply_ephemeral(modal_int, 'invalid emoji(s) supplied!');
    else
      modal_int.reply(format_error(err));
  }

}