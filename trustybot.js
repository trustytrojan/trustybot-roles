import {
  Client,
  User,
  ComponentType,
  ButtonStyle,
  ButtonInteraction,
  TextInputStyle,
} from 'discord.js';

import { guild_commands, global_commands } from './command-data.js';
import { format_error, modal_row, modal_helper, extract_text } from './utils.js';
import EventEmitter from 'events';
import { inspect } from 'util';
import './reply-ephemeral.js';

const { ActionRow, Button } = ComponentType;
const { Danger, Primary } = ButtonStyle;
const { Paragraph } = TextInputStyle;

const do_nothing = () => {};

export default class trustybot extends Client {
  /** @type {EventEmitter} */ chat_input;
  /** @type {EventEmitter} */ button;
  /** @type {() => any} */ on_kill;
  /** @type {User} */ owner;
  /** @type {Message} */ owner_buttons;

  constructor(o, on_kill) {
    super(o);

    Object.defineProperty(this, 'chat_input', { value: new EventEmitter(), writable: false });
    Object.defineProperty(this, 'button', { value: new EventEmitter(), writable: false });

    if(on_kill) this.on_kill = on_kill ?? do_nothing;

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
    process.on('uncaughtException', (err) => { this.handleError(err); });

    this.button.on('kill', this.kill.bind(this));

    this.button.on('guildcmds', async (interaction) => {
      await this.application?.commands.set(guild_commands);
      interaction.replyEphemeral('set guild commands!');
    });

    this.button.on('globalcmds', async (interaction) => {
      await this.application?.commands.set(global_commands);
      interaction.replyEphemeral('set global commands!');
    });
    
    this.button.on('eval', async (/** @type {ButtonInteraction} */ interaction) => {
      const { user } = interaction;
      if(user.id !== this.owner.id) { await interaction.reply('only my owner can use this command!'); return; }
      const modal_int = await modal_helper(interaction, 'eval', 60_000, [
        modal_row('expr', 'expression', Paragraph, true)
      ]);
      if(!modal_int) return;
      let [code] = extract_text(modal_int);
      if(code.includes('await')) code = `(async () => { ${code} })().catch(handleError)`;
      let output;
      try { output = inspect(await eval(code), { depth: 0, showHidden: true }); }
      catch(err) { this.handleError(err); return; }
      let x;
      if(output.length <= 2000)
        x = '```js\n'+output+'```';
      else if(output.length > 2000 && output.length <= 4096)
        x = { embeds: [{ description: '```js\n'+output+'```' }] };
      else if(output.length > 4096)
        x = { files: [{ attachment: Buffer.from(output), name: 'output.js'}] };
      modal_int.replyEphemeral(x);
    });
  }

  async fetchOwner() {
    const { owner } = await this.application.fetch();
    if(!(owner instanceof User)) throw 'kill yourself';
    return (this.owner = owner);
  }

  async handleError(/** @type {Error} */ err) {
    console.error(err);
    const owner = this.owner ?? await this.fetchOwner();
    owner.send(format_error(err)).catch(do_nothing);
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

    this.owner_buttons = await owner.send({
      content: 'owner buttons',
      components: [
        { type: ActionRow, components: [
          { type: Button, label: 'kill bot process', custom_id: 'kill', style: Danger },
          { type: Button, label: 'set guild commands', custom_id: 'guildcmds', style: Primary },
          { type: Button, label: 'set global commands', custom_id: 'globalcmds', style: Primary },
          { type: Button, label: 'eval', custom_id: 'eval', style: Primary }
        ] }
      ]
    });
  }

  async kill() {
    await this.owner_buttons?.delete().catch(do_nothing);
    await this.on_kill()?.catch(do_nothing);
    this.destroy();
    process.exit();
  }
}