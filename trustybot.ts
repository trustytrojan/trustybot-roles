import { Client, ClientOptions, User, ComponentType, ButtonStyle, Message, APIMessage, MessagePayload, Collection } from 'discord.js';
import { EventEmitter } from 'events';
import { formatError } from './utils';

const { ActionRow, Button } = ComponentType;
const { Danger, Primary } = ButtonStyle;

const do_nothing = () => {};

export default class trustybot extends Client {
  readonly chat_input_interaction = new EventEmitter();
  readonly button_interaction = new EventEmitter();
  owner: User;
  private owner_buttons: Message;
  private readonly on_kill: () => any;

  constructor(o: ClientOptions, on_kill?: () => any) {
    super(o);

    if(on_kill) this.on_kill = on_kill;

    this.on('interactionCreate', (interaction) => {
      if(interaction.isChatInputCommand())
        this.chat_input_interaction.emit(interaction.commandName, interaction);
      else if(interaction.isButton())
        this.button_interaction.emit(interaction.customId, interaction);
    });

    this.on('ready', async () => {
      console.log(`Logged in as ${this.user?.id}!`);
      await this.fetchOwner();
      await this.sendOwnerButtons();
      this.clearOwnerDM();
    });

    this.on('error', this.handleError);

    process.on('SIGINT', this.kill);
    process.on('SIGTERM', this.kill);
    process.on('uncaughtException', (err) => { this.handleError(err); this.kill(); });
  }

  async fetchOwner(): Promise<User> {
    if(this.application?.owner instanceof User)
      return this.application.owner;
    const application = await this.application?.fetch();
    if(!(application?.owner instanceof User)) throw new TypeError('owner could not be fetched!');
    return (this.owner = application.owner);
  }

  async handleError(err: Error) {
    const owner = this.owner ?? await this.fetchOwner();
    if(!this.owner) return;
    console.error(err);
    this.owner.send(formatError(err)).catch(do_nothing);
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
        ] }
      ]
    });
  }

  async kill() {
    await this.owner_buttons?.delete();
    await this.on_kill();
    this.destroy();
    process.exit();
  }
}