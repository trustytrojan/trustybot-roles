import {
  GuildMember
} from 'discord.js';

import './prototype.js';

/**
 * Typing for VSCode
 * @typedef {import('discord.js').ButtonInteraction} ButtonInteraction
 */

/**
 * @param {ButtonInteraction} interaction 
 * @returns 
 */
export default async function any_button_interaction(interaction) {
  const { message, customId, guild } = interaction;
  if(!guild) return;

  let { member } = interaction;
  if(!(member instanceof GuildMember))
    member = await guild.members.fetch(member.user.id);

  if(guild.roles.resolve(customId)) {
    if(member.roles.resolve(customId)) {
      await member.roles.remove(customId);
      interaction.replyEphemeral(`removed <@&${customId}>!`);
    } else {
      let replaced;
      if(message.content.includes('\u200a')) // https://www.invisiblecharacter.org/
        for(const { customId: role } of message.components[0].components) {
          if(member.roles.resolve(role)) {
            await member.roles.remove(role);
            replaced = `replaced <@&${role}> with <@&${customId}>!`;
          }
        }
      await member.roles.add(customId);
      interaction.replyEphemeral(replaced ?? `added <@&${customId}>!`);
    }
  }
}