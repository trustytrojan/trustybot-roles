import { existsSync, writeFileSync, readFileSync } from 'fs';
import { Collection } from 'discord.js';

const file = './single_roles.json';

export default class SingleRole {
  static readFromFile() {
    /** @type {Collection<string, SingleRole>} */
    const data = new Collection();

    if(existsSync(file))
      for(const { channel, messages } of require(file))
        data.set(channel, new SingleRole(channel, messages));
    return data;
  }

  static writeToFile(data) {
    writeFileSync(file, JSON.stringify(data, null, '  '));
  }

  // instance properties
  /** @type {string} */ channel;
  /** @type {string[]} */ messages;

  /**
   * @param {string} channel 
   * @param {string[]} messages 
   */
  constructor(channel, messages = []) {
    this.channel = channel;
    this.messages = messages;
  }
}
