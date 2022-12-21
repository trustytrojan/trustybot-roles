import { ButtonInteraction } from 'discord.js';
import './reply-ephemeral.js';

export default async function any_button_interaction(
  /** @type {ButtonInteraction} */ interaction
) {
  const { message, customId, guild, member } = interaction;

  if(!guild) return;

  if((await guild.roles.fetch())?.has(customId)) {
    if(member.roles.cache.has(customId)) {
      await member.roles.remove(customId);
      interaction.replyEphemeral(`removed <@&${customId}>!`);
    } else {
      let replaced;
      if(message.content.includes('||single_rol||'))
        for(const { customId: role } of message.components[0].components) {
          if(member.roles.cache.has(role)) {
            await member.roles.remove(role);
            replaced = `replaced <@&${role}> with <@&${customId}>!`;
          }
        }
      await member.roles.add(customId);
      interaction.replyEphemeral(replaced ?? `added <@&${customId}>!`);
    }
  }
}