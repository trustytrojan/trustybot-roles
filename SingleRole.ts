import { existsSync, writeFileSync, readFileSync } from 'fs';
import { Collection } from 'discord.js';
import { parse_json_from_file } from './utils';

const file = './single_roles.json';

export default class SingleRole {
  static async readFromFile(): Promise<Collection<string, SingleRole>> {
    const data = new Collection<string, SingleRole>();
    if(existsSync(file) && readFileSync(file).length > 0)
      for(const { channel, messages } of parse_json_from_file(file))
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