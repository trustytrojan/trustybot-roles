import trustybot from './trustybot';
import SingleRole from './SingleRole';
import { GuildMember } from 'discord.js';
import { reply_ephemeral, something_went_wrong } from './utils';
import button_roles from './button-roles';
import token from './token.json';

const single_roles = await SingleRole.readFromFile();

const client = new trustybot({
  intents: [
    'Guilds',
    'GuildMembers'
  ]
}, () => SingleRole.writeToFile(single_roles));

const { chat_input, button } = client;

chat_input.on('ping', async (interaction) => interaction.reply(`\`${client.ws.ping}ms\``));
chat_input.on('button_roles', (interaction) => button_roles(interaction, single_roles));

button.on('*', async (interaction) => {
  const { message, customId, guild, channelId } = interaction;
  let { member } = interaction;

  if(!guild) return;

  if((await guild.roles.fetch())?.has(customId)) {
    if(!member) { something_went_wrong(interaction); return; }
    if(!(member instanceof GuildMember))
      member = await guild.members.fetch(member.user.id);
    if(member.roles.cache.has(customId)) {
      member.roles.remove(customId);
      reply_ephemeral(interaction, `removed <@&${customId}>!`);
    } else {
      let replaced;
      if(single_roles.get(channelId)?.messages.includes(message.id))
        for(const { customId: x } of message.components[0].components) {
          if(!x) continue;
          if(member.roles.cache.has(x)) {
            member.roles.remove(x);
            replaced = `replaced <@&${x}> with <@&${customId}>!`;
          }
        }
      member.roles.add(customId);
      reply_ephemeral(interaction, replaced ?? `added <@&${customId}>!`);
    }
  }
});

client.login(token);
