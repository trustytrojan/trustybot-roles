import { ChatInputCommandInteraction, GuildMember, Role } from 'discord.js';
import { reply_ephemeral, something_went_wrong } from '../utils.js';

/**
 * @param {ChatInputCommandInteraction} interaction 
 */
export default async function mass_roles(interaction) {

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
    { reply_ephemeral(interaction, 'i need `Manage Roles` perms to create button roles'); return; }
  if(!member.permissions.has('ManageRoles', true))
    { reply_ephemeral(interaction, 'you need `Manage Roles` perms to create button roles'); return; }

  // result embed description
  let description;

  for(let { role } of options.data) {
    // type checks
    if(!role) { something_went_wrong(interaction); return; }
    if(!(role instanceof Role)) {
      role = await guild.roles.fetch(role.id);
      if(!role) { reply_ephemeral(interaction, `one of the roles you gave me does not exist!`); return; }
    }

    // role position check
    if(role.comparePositionTo(myRole) > 0)
      { reply_ephemeral(interaction, `my role is lower than ${role}! please move me above this role so i can give it to members!`); return; }

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