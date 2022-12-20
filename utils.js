import { randomUUID } from 'crypto';
import { readFileSync } from 'fs';
import { ComponentType, } from 'discord.js';
const { ActionRow, TextInput } = ComponentType;
export const format_error = (err) => `\`\`\`js\n${err.stack ?? err}\`\`\``;
export const reply_ephemeral = (interaction, content) => interaction.reply({ ephemeral: true, content }).catch(() => { });
export const something_went_wrong = (interaction) => reply_ephemeral(interaction, 'something went wrong, please try again');
export const modal_row = (custom_id, label, style, required) => ({
    toJSON: () => ({ type: ActionRow, components: [{ type: TextInput, custom_id, label, style, required }] }),
});
export async function send_modal_and_wait_for_submit(interaction, title, time, rows) {
    const customId = randomUUID();
    interaction.showModal({ customId, title, components: rows });
    let modal_int;
    try {
        modal_int = await interaction.awaitModalSubmit({ filter: (m) => m.customId === customId, time });
    }
    catch (err) {
        interaction.followUp(`${interaction.member} you took too long to submit the modal`);
        return;
    }
    return modal_int;
}
export const parse_json_from_file = (file) => JSON.parse(readFileSync(file).toString());
