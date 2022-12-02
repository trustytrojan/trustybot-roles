const { BaseInteraction } = require('discord.js');

/**
 * shortcut for replying with an ephemeral message
 * @param {string | object} x
 */
BaseInteraction.prototype.replyEphemeral = function(x) {
  if(!this.reply)
    throw new TypeError('type of "this" does not have "reply" property method');
  if(typeof x === 'string')
    return this.reply({ content: x, ephemeral: true });
  if(typeof x === 'object') {
    x.ephemeral = true;
    return this.reply(x);
  }
  throw new TypeError(`Expected argument of type "string" or "object", received "${typeof x}" instead`);
};