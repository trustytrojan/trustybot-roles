/**
 * Typing for VSCode
 * @typedef {import('discord.js').ChatInputCommandInteraction} ChatInputCommandInteraction
 * @typedef {import('discord.js').APIEmbed} APIEmbed
 */

/**
 * @param {ChatInputCommandInteraction} interaction
 */
export default async function view_roles(interaction) {
  const { guild } = interaction;

  /** @type {APIEmbed[]} */
  const embeds = [{
    author: { name: `Roles in ${guild.name}`, icon_url: guild.iconURL() }
  }];

  let desc = '';
  let i = 0;

  const roles = (await guild.roles.fetch()).sort((a,b) => b.position-a.position).values();
  for(const role of roles) {
    const role_line = `\`${role.position}:\` ${role.toString()}\n`;

    if(desc.length + role_line.length > 4096) {
      embeds[i++].description = desc;
      desc = '';
    }

    desc += role_line;
  }

  embeds[i].description = desc;

  interaction.reply({ embeds });
}