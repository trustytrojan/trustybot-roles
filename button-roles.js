const { randomUUID } = require('crypto');
const { ChatInputCommandInteraction, Collection, ComponentType, TextInputStyle, ButtonStyle, Role } = require('discord.js');
const { ActionRow, Button, TextInput } = ComponentType;
const { Paragraph, Short } = TextInputStyle;
const { Primary } = ButtonStyle;
const { formatError } = require('./utils');
const { SingleRole } = require('./SingleRole');

/**
 * @param {ChatInputCommandInteraction} interaction 
 * @param {Collection<string,SingleRole>} single_roles 
 */
module.exports = async function(interaction, single_roles) {
  const { client, member, guild, options, channelId } = interaction;
  const myPerms = guild.members.me.permissions;

  // check permissions
  if(!myPerms.has('ManageRoles'))
    { await interaction.replyEphemeral('i need `Manage Roles` perms to create button roles'); return; }
  if(!member.permissions.has('ManageRoles'))
    { await interaction.replyEphemeral('you need `Manage Roles` perms to create button roles'); return; }

  // collect roles and create button objects
  const buttons = [];
  let single_role = false;
  for(let { name, role, value } of options.data) {
    if(!(role instanceof Role)) role = new Role(client, role, guild);
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
  catch(err) { await interaction.followUp(`${member} you took too long to submit the modal`); return; }
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
    if(single_role) single_roles.ensure(channelId, () => new SingleRole(channelId)).messages.push(id);
  } catch(err) {
    if(err.message.includes('emoji'))
      await modal_int.replyEphemeral('invalid emoji(s) supplied!');
    else
      await modal_int.reply(formatError(err));
  }
}