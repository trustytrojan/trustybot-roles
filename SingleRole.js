import { existsSync, writeFileSync, readFileSync } from 'fs';
import { Collection } from 'discord.js';
import { parse_json_from_file } from './utils.js';
const file = './single_roles.json';
export default class SingleRole {
    static async readFromFile() {
        const data = new Collection();
        if (existsSync(file) && readFileSync(file).length > 0)
            for (const { channel, messages } of parse_json_from_file(file))
                data.set(channel, new SingleRole(channel, messages));
        return data;
    }
    static writeToFile(data) {
        writeFileSync(file, JSON.stringify(data, null, '  '));
    }
    channel;
    messages = [];
    constructor(channel, messages) {
        this.channel = channel;
        if (messages)
            this.messages = messages;
    }
}
