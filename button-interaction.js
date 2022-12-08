const { ButtonInteraction, Collection, GuildMember } = require('discord.js');
const {  } = require('./utils');
const { setGlobalCommands, setGuildCommands } = require('./command-data');
const { SingleRole } = require('./SingleRole');

/**
 * @param {ButtonInteraction} interaction 
 * @param {Collection<string,SingleRole>} single_roles 
 */
module.exports = async function(interaction, single_roles) {
  const { message, customId, guild, channelId } = interaction;
  let { member } = interaction;

  switch(customId) {
    case 'kill': 
    case 'globalcmds': await setGlobalCommands(); return;
    case 'guildcmds': await setGuildCommands(); return;
  }

  if((await guild?.roles?.fetch()).has(customId)) {
    if(!(member instanceof GuildMember)) member = new GuildMember(client, member, guild);
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