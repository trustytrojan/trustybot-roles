import { ButtonInteraction } from 'discord.js';
import trustybot from './trustybot.js';
import SingleRole from './SingleRole.js';
import button_roles from './commands/button-roles.js';
import token from './token.json' assert { type: 'json' };

// run the prototype assignment for CommandInteraction.replyEphemeral()
import './reply-ephemeral.js';

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

button.on('*', async (/** @type {ButtonInteraction} */ interaction) => {
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
});

client.login(token);
