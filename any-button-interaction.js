import { ButtonInteraction, Collection } from 'discord.js';
import SingleRole from './SingleRole.js';
import './reply-ephemeral.js';

export default async function any_button_interaction(
  /** @type {ButtonInteraction} */ interaction,
  /** @type {Collection<string, SingleRole>} */ single_roles
) {
  const { message, customId, guild, member, channelId } = interaction;

  if(!guild) return;

  if((await guild.roles.fetch())?.has(customId)) {
    if(member.roles.cache.has(customId)) {
      await member.roles.remove(customId);
      interaction.replyEphemeral(`removed <@&${customId}>!`);
    } else {
      let replaced;
      if(single_roles.get(channelId)?.messages.includes(message.id))
        for(const { customId: x } of message.components[0].components) {
          if(member.roles.cache.has(x)) {
            await member.roles.remove(x);
            replaced = `replaced <@&${x}> with <@&${customId}>!`;
          }
        }
      await member.roles.add(customId);
      interaction.replyEphemeral(replaced ?? `added <@&${customId}>!`);
    }
  }
}