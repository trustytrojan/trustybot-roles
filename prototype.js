import { BaseInteraction } from 'discord.js';
import { format_error } from './utils.js';

BaseInteraction.prototype.replyEphemeral = function(x) {
  if(typeof x === 'string')
    this.reply({ content: x, ephemeral: true });
  else if(typeof x === 'object') {
    x.ephemeral = true;
    this.reply(x);
  }
};

/**
 * @param {Error} err 
 */
BaseInteraction.prototype.replyError = function(err) {
  this.reply(format_error(err));
};