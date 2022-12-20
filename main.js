import trustybot from './trustybot.js';
import SingleRole from './SingleRole.js';
import { reply_ephemeral } from './utils.js';
import button_roles from './commands/button-roles.js';
import token from './token.json' assert { type: 'json' };

const single_roles = await SingleRole.readFromFile();

const client = new trustybot({
  intents: [
    'Guilds',
    'GuildMembers'
  ]
}, () => SingleRole.writeToFile(single_roles));

const { chat_input, button } = client;

chat_input.on('ping', (interaction) => interaction.reply(`\`${client.ws.ping}ms\``));
chat_input.on('button_roles', (interaction) => button_roles(interaction, single_roles));

button.on('*', async (interaction) => {
  const { message, customId, guild, channelId } = interaction;
  let { member } = interaction;

  if(!guild) return;

  if((await guild.roles.fetch())?.has(customId)) {
    if(member.roles.cache.has(customId)) {
      await member.roles.remove(customId);
      reply_ephemeral(interaction, `removed <@&${customId}>!`);
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
      reply_ephemeral(interaction, replaced ?? `added <@&${customId}>!`);
    }
  }
});

client.login(token);
