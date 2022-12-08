const { ChatInputCommandInteraction } = require('discord.js');
const { getGlobals } = require('./utils');

/**
 * this needs to be in global scope of main.js so the bot owner can access important variables
 * @param {ChatInputCommandInteraction} interaction 
 */
module.exports = async function(interaction) {
  const { user, options, guild, channel, member } = interaction;
  const { client, owner } = getGlobals();

  // for obvious reasons
  if(user.id !== owner.id) { await interaction.replyEphemeral('only my owner can use this command!'); return; }

  // get code from interaction, support async/await
  let code = options.getString('code');
  if(code.includes('await')) { code = `(async () => { ${code} })().catch(handleError)`; }

  // evaluate expression
  let output;
  try { output = require('util').inspect(await eval(code), options.getBoolean('showHidden'), options.getInteger('depth')); }
  catch(err) { await interaction.replyEphemeral(formatError(err)); return; }

  // format output for discord
  let x;
  if(output.length <= 2000)
    x = '```js\n'+output+'```';
  else if(output.length > 2000 && output.length <= 4096)
    x = { embeds: [{ description: '```js\n'+output+'```' }] };
  else if(output.length > 4096)
    x = { files: [{ attachment: Buffer.from(output), name: 'output.js'}] };
  
  await interaction.replyEphemeral(x);
};