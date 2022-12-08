const { existsSync, writeFileSync, readFileSync } = require('fs');
const { Collection } = require('discord.js');

const sr_file = './single_roles.json';

/**
 * Stores the IDs of single-role messages in a channel.
 * @param {string} channel 
 * @param {string[] | undefined} messages 
 */
class SingleRole {
  /** @type {string[]} */ messages = [];

  /**
   * @param {string} channel 
   * @param {string[] | undefined} messages 
   */
  constructor(channel, messages) {
    this.channel = channel;
    if(messages) this.messages = messages;
  }
}

/**
 * @returns {Collection<string,SingleRole>}
 */
function readSingleRoles() {
  const single_roles = new Collection();
  if(existsSync(sr_file) && readFileSync(sr_file).length > 0)
    for(const { channel, messages } of require(sr_file))
      single_roles.set(channel, new SingleRole(channel, messages));
  return (global.sr = single_roles);
}

/**
 * @param {Collection<string,SingleRole>} single_roles 
 */
const writeSingleRoles = (single_roles) => writeFileSync(sr_file, JSON.stringify(single_roles, null, '  '));

module.exports = {
  get SingleRole() { return SingleRole; },
  get readSingleRoles() { return readSingleRoles; },
  get writeSingleRoles() { return writeSingleRoles; }
};