const { existsSync, writeFileSync } = require('fs');
const { Collection } = require('discord.js');

const sr_file = './single_roles.json';

/**
 * Stores the IDs of single-role messages in a channel.
 * @param {string} channel 
 * @param {string[] | undefined} messages 
 */
class SingleRole {
  /** @type {string[]} */ messages;

  /**
   * @param {string} channel 
   * @param {string[] | undefined} messages 
   */
  constructor(channel, messages) {
    this.channel = channel;
    if(messages)
      this.messages = messages;
    else
      this.messages = [];
  }
}

/**
 * @returns {Collection<string,SingleRole>}
 */
function readSingleRoles() {
  const single_roles = new Collection();
  if(existsSync(sr_file))
    for(const { channel, messages } of require(sr_file))
      single_roles.set(channel, new SingleRole(channel, messages));
  return single_roles;
}

/**
 * @param {Collection<string,SingleRole>} single_roles 
 */
const writeSingleRoles = (single_roles) => writeFileSync(sr_file, JSON.stringify(single_roles, null, '  '));

module.exports = {
  SingleRole,
  get readSingleRoles() { return readSingleRoles; },
  get writeSingleRoles() { return writeSingleRoles; }
};