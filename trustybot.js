import {
  Client,
  User,
  ComponentType,
  ButtonStyle,
  TextInputStyle,
} from 'discord.js';

/**
 * Typing for VSCode
 * @typedef {import('discord.js').ButtonInteraction} ButtonInteraction
 * @typedef {import('discord.js').ClientOptions} ClientOptions
 * @typedef {import('discord.js').APIApplicationCommand} Command
 */

import { format_error, modal_row, modal_helper, extract_text } from './utils.js';
import EventEmitter from 'events';
import { inspect } from 'util';
import './prototype.js';

const { ActionRow, Button } = ComponentType;
const { Danger, Primary } = ButtonStyle;
const { Paragraph, Short } = TextInputStyle;

const do_nothing = () => {};
const wait = (x) => new Promise((resolve) => setTimeout(resolve, x));

/**
 * @typedef {object} trustybot_options
 * @prop {() => any=} on_kill
 * @prop {Command[]=} guild_commands
 * @prop {Command[]=} global_commands
 */

export default class trustybot extends Client {
  // convenience emitters
  /** @type {EventEmitter} */ chat_input;
  /** @type {EventEmitter} */ button;

  // from discord
  /** @type {User} */ owner;
  /** @type {Message} */ owner_buttons;

  // from options
  /** @type {() => any=} */ on_kill = do_nothing;
  /** @type {Command[]=} */ guild_commands = [];
  /** @type {Command[]=} */ global_commands = [];

  /**
   * @param {ClientOptions} discord_options
   * @param {trustybot_options=} trustybot_options
   */
  constructor(discord_options, trustybot_options) {
    super(discord_options);

    if(trustybot_options) {
      const { on_kill, guild_commands, global_commands } = trustybot_options;
      if(on_kill) this.on_kill = on_kill;
      if(guild_commands) this.guild_commands = guild_commands;
      if(global_commands) this.global_commands = global_commands;
    }

    // make em readonly like typescript
    Object.defineProperty(this, 'chat_input', { value: new EventEmitter(), writable: false });
    Object.defineProperty(this, 'button', { value: new EventEmitter(), writable: false });

    this.on('ready', async () => {
      console.log(`Logged in as ${this.user?.tag}!`);
      await this.fetchOwner();
      await this.clearOwnerDM();
      this.sendOwnerButtons();
    });

    this.on('interactionCreate', (interaction) => {
      if(interaction.isChatInputCommand())
        this.chat_input.emit(interaction.commandName, interaction);
      else if(interaction.isButton())
        this.button.emit(interaction.customId, interaction) || this.button.emit('*', interaction);
    });

    this.on('guildCreate', ({ commands }) => void commands.set(guild_commands));

    this.on('error', this.handleError.bind(this));

    process.on('SIGINT', this.kill.bind(this));
    process.on('SIGTERM', this.kill.bind(this));
    process.on('uncaughtException', (err) => { this.handleError(err); this.kill(); });

    // owner button code

    this.button.on('kill', this.kill.bind(this));

    this.button.on('guildcmds', async (interaction) => {
      await this.application?.commands.set(this.guild_commands);
      interaction.replyEphemeral('set guild commands!');
    });

    this.button.on('globalcmds', async (interaction) => {
      await this.application?.commands.set(this.global_commands);
      interaction.replyEphemeral('set global commands!');
    });
    
    this.button.on('eval', async (/** @type {ButtonInteraction} */ interaction) => {
      const { user } = interaction;

      // obviously...
      if(user.id !== this.owner.id) { await interaction.reply('only my owner can use this command!'); return; }

      const modal_int = await modal_helper(interaction, 'eval', 60_000, [
        modal_row('expr', 'expression', Paragraph, true)
      ]);
      if(!modal_int) return;

      let [code] = extract_text(modal_int);
      if(code.includes('await')) code = `(async () => { ${code} })().catch(handleError)`;

      // eval time
      let output;
      try { output = inspect(await eval(code), { depth: 0, showHidden: true }); }
      catch(err) { modal_int.replyError(err); return; }

      // format time
      let x;
      if(output.length <= 2000)
        x = '```js\n'+output+'```';
      else if(output.length > 2000 && output.length <= 4096)
        x = { embeds: [{ description: '```js\n'+output+'```' }] };
      else if(output.length > 4096)
        x = { files: [{ attachment: Buffer.from(output), name: 'output.js'}] };
      
      // send time
      modal_int.replyEphemeral(x);
    });
  }

  async fetchOwner() {
    if(!this.application) {
      await wait(1_000);
      this.fetchOwner();
      return;
    }
    const { owner } = await this.application.fetch();
    if(!(owner instanceof User)) throw 'kill yourself';
    return (this.owner = owner);
  }

  async handleError(/** @type {Error} */ err) {
    console.error(err);
    this.owner?.send(format_error(err)).catch(do_nothing);
  }

  async clearOwnerDM() {
    const user = await this.user?.fetch();
    if(!user) throw new TypeError('client user object could not be fetched!');
    const owner = this.owner ?? await this.fetchOwner();

    const toDelete = (await (await owner.createDM()).messages.fetch()).filter(m => m.author.id === user.id).values();
    setInterval(async () => {
      try { await toDelete.next().value.delete(); }
      catch(err) { clearInterval(void 0); }
    }, 1_000);
  }

  async sendOwnerButtons() {
    const owner = this.owner ?? await this.fetchOwner();

    const buttons = [
      { type: Button, label: 'kill bot process', custom_id: 'kill', style: Danger },
      { type: Button, label: 'set guild commands', custom_id: 'guildcmds', style: Primary },
      { type: Button, label: 'set global commands', custom_id: 'globalcmds', style: Primary },
      { type: Button, label: 'eval', custom_id: 'eval', style: Primary },
    ];

    this.owner_buttons = await owner.send({
      content: 'owner buttons',
      components: [{ type: ActionRow, components: buttons }]
    });
  }

  async kill() {
    await this.owner_buttons?.delete().catch(do_nothing);
    await this.on_kill()?.catch(do_nothing);
    this.destroy();
    process.exit();
  }
}