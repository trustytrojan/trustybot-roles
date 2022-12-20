import { ChatInputCommandInteraction } from 'discord.js';
import { something_went_wrong } from '../utils.js';
import '../reply-ephemeral.js';

/**
 * @param {ChatInputCommandInteraction} interaction 
 */
export default async function mass_manage_roles(interaction) {
  const { guild, member, options } = interaction;

  const action = options.getString('action', true);
  let a_past, a_proc, a_prop;
  switch(action) {
    case 'add': ([a_past, a_proc, a_prop] = ['added', 'addition', 'to']); break;
    case 'remove': ([a_past, a_proc, a_prop] = ['removed', 'removal', 'from']); break;
    default: something_went_wrong(interaction); return;
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
}