import { randomUUID } from 'crypto';
import {
  APIActionRowComponent,
  APIModalActionRowComponent,
  ButtonInteraction,
  ChatInputCommandInteraction,
  ModalSubmitInteraction,
  TextInputStyle,
  ComponentType,
  JSONEncodable,
  CommandInteraction,
  MessageComponentInteraction
} from 'discord.js';

const { ActionRow, TextInput } = ComponentType;

export const format_error = (err: Error) => `**this is an error**\`\`\`js\n${err.stack ?? err}\`\`\``;

type RepliableInteraction = CommandInteraction | MessageComponentInteraction | ModalSubmitInteraction;

export const reply_ephemeral = (
  interaction: RepliableInteraction,
  content: string
) => interaction.reply({ ephemeral: true, content }).catch(() => {});

export const something_went_wrong = (
  interaction: RepliableInteraction
) => reply_ephemeral(interaction, 'something went wrong, please try again');

type ModalRow = JSONEncodable<APIActionRowComponent<APIModalActionRowComponent>>;

export const modal_row = (
  custom_id: string,
  label: string,
  style: TextInputStyle,
  required?: boolean
): ModalRow => ({
  toJSON: () => ({ type: ActionRow, components: [{ type: TextInput, custom_id, label, style, required }] }),
});

export async function send_modal_and_wait_for_submit(
  interaction: CommandInteraction,
  title: string,
  time: number,
  rows: ModalRow[]
) {
  const customId = randomUUID();
  interaction.showModal({ customId, title, components: rows });
  let modal_int: ModalSubmitInteraction;
  try { modal_int = await interaction.awaitModalSubmit({ filter: (m) => m.customId === customId, time }); }
  catch(err) { interaction.followUp(`${interaction.member} you took too long to submit the modal`); return; }
  return modal_int;
}