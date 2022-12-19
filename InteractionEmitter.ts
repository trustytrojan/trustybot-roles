import { Collection } from 'discord.js';

export default class InteractionEmitter<InteractionType> {
  private readonly events = new Collection<string, ((interaction: InteractionType) => any)[]>();

  on(event: string, listener: (interaction: InteractionType) => any) {
    this.events.ensure(event, () => [listener]).push(listener);
  }

  emit(event: string, interaction: InteractionType): boolean {
    const listeners = this.events.get(event);
    if(!listeners) throw new Error('event does not exist!');
    if(listeners.length === 0)
      return false;
    for(const listener of listeners)
      listener(interaction);
    return true;
  }
}