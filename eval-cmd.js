const { ChatInputCommandInteraction, User } = require('discord.js');
const { error_str } = require('./utils');

/**
 * @param {ChatInputCommandInteraction} interaction 
 * @param {User} owner 
 */
module.exports = async function(interaction, owner) {
  const { user, options } = interaction;
  if(user.id !== owner.id) { await interaction.reply('only my owner can use this command!'); return; }
  let code = options.getString('code');
  if(code.includes('await')) { code = `(async () => { ${code} })().catch(handleError)`; }
  let output;
  const inspect_options = {
    depth: options.getInteger('depth'),
    showHidden: options.getBoolean('showHidden')
  };
  try { output = require('util').inspect(await eval(code), inspect_options); }
  catch(err) { await interaction.reply(error_str(err)); return; }
  let x;
  if(output.length <= 2000)
    x = '```js\n'+output+'```';
  else if(output.length > 2000 && output.length <= 4096)
    x = { embeds: [{ description: '```js\n'+output+'```' }] };
  else if(output.length > 4096)
    x = { files: [{ attachment: Buffer.from(output), name: 'output.js'}] };
  await interaction.reply(x);
};