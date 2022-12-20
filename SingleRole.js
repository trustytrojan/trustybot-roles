import { existsSync, readFileSync, writeFileSync } from 'fs';
import { Collection } from 'discord.js';
import { json_from_file } from './utils.js';

const file = './single_roles.json';

export default class SingleRole {
  static async readFromFile() {
    /** @type {Collection<string, SingleRole>} */
    const data = new Collection();

    if(existsSync(file) && readFileSync(file).length > 0)
      for(const { channel, messages } of (await json_from_file(file)))
        data.set(channel, new SingleRole(channel, messages));
    return data;
  }

  /** @param {Collection<string, SingleRole>} data */
  static writeToFile(data) {
    const arr = Array.from(data.values());
    writeFileSync(file, JSON.stringify(arr, null, '  '));
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
