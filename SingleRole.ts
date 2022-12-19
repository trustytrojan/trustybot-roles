import { existsSync, writeFileSync, readFileSync } from 'fs';
import { Collection } from 'discord.js';

const file = './single_roles.json';

export default class SingleRole {
  /**
   * Reads SingleRole objects from the default file.
   * 
   * If file doesn't exist, returned collection will be empty.
   * @returns The collection of SingleRole objects parsed from the JSON file.
   */
  static readFromFile(): Collection<string, SingleRole> {
    const data = new Collection<string, SingleRole>();
    if(existsSync(file) && readFileSync(file).length > 0)
      for(const { channel, messages } of require(file))
        data.set(channel, new SingleRole(channel, messages));
    return data;
  }

  static writeToFile(data: Collection<string, SingleRole>) {
    writeFileSync(file, JSON.stringify(data, null, '  '));
  }

  readonly channel: string;
  readonly messages: string[] = [];

  constructor(channel: string, messages?: string[]) {
    this.channel = channel;
    if(messages) this.messages = messages;
  }
}