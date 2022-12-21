import { randomUUID } from 'crypto';
import './prototype.js';

import {
  CommandInteraction,
  TextInputStyle,
  ComponentType,
  ModalSubmitInteraction
} from 'discord.js';

const { ActionRow, TextInput } = ComponentType;

/**
 * @typedef {import('discord.js').APIActionRowComponent<import('discord.js').APIModalActionRowComponent>} ModalRow
 */

/**
 * @param {Error} err 
 */
export const format_error = (err) => `\`\`\`js\n${err.stack ?? err}\`\`\``;

/**
 * @param {CommandInteraction} interaction 
 */
export const something_went_wrong = (interaction) =>
  interaction.replyEphemeral('something went wrong, please try again');

/**
 * @param {string} custom_id 
 * @param {string} label 
 * @param {TextInputStyle} style 
 * @param {boolean?} required 
 * @returns {ModalRow}
 */
export const modal_row = (custom_id, label, style, required) =>
  ({ type: ActionRow, components: [{ type: TextInput, custom_id, label, style, required }] });

/**
 * @param {CommandInteraction} interaction 
 * @param {string} title 
 * @param {number} time 
 * @param {ModalRow[]} rows 
 */
export async function modal_helper(interaction, title, time, rows) {
  const customId = randomUUID();
  interaction.showModal({ customId, title, components: rows });
  let modal_int;
  try { modal_int = await interaction.awaitModalSubmit({ filter: (m) => m.customId === customId, time }); }
  catch(err) { interaction.followUp(`${interaction.member} you took too long to submit the modal`); return; }
  return modal_int;
}

/** @param {ModalSubmitInteraction} modal_int */
export const extract_text = (modal_int) => modal_int.fields.fields.map((v) => v.value);

/**
 * @param {string} file 
 */
export const json_from_file = async (file) => (await import(file, { assert: { type: 'json' } })).default;

export const single_role_identifier = '\u2800';