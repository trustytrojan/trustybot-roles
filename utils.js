import { randomUUID } from 'crypto';
import { readFileSync } from 'fs';

import {
  CommandInteraction,
  TextInputStyle
} from 'discord.js';

const { APIActionRowComponent, APIModalActionRowComponent } = require('discord.js');

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
 * @returns {APIActionRowComponent<APIModalActionRowComponent>}
 */
export const modal_row = (custom_id, label, style, required) => ({ components: [{ custom_id, label, style, required }] });

/**
 * @param {CommandInteraction} interaction 
 * @param {string} title 
 * @param {number} time 
 * @param {APIActionRowComponent<APIModalActionRowComponent>[]} rows 
 */
export async function modal_helper(interaction, title, time, rows) {
  const customId = randomUUID();
  interaction.showModal({ customId, title, components: rows });
  let modal_int;
  try { modal_int = await interaction.awaitModalSubmit({ filter: (m) => m.customId === customId, time }); }
  catch(err) { interaction.followUp(`${interaction.member} you took too long to submit the modal`); return; }
  console.log(modal_int.fields.fields);
  const values = [];
  for(const row_id of rows.map((v) => v.components[0].custom_id)) {
    values.push(modal_int.fields.getTextInputValue(row_id));
  }
  console.log(values);
  return values;
}

/**
 * @param {string} file 
 */
export const parse_json_from_file = (file) => JSON.parse(readFileSync(file).toString());
