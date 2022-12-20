import { CommandInteraction } from 'discord.js';

CommandInteraction.prototype.replyEphemeral = function(x) {
  if(typeof x === 'string')
    this.reply({ content: x, ephemeral: true });
  else if(typeof x === 'object') {
    x.ephemeral = true;
    this.reply(x);
  }
};
