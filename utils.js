const { BaseInteraction } = require('discord.js');

/**
 * formats an error to be sent in discord
 * @param {Error} err
 * @returns {string}
 */
const formatError = (err) => `**this is an error**\`\`\`js\n${err.stack ?? err}\`\`\``;

/** 
 * notifies the bot owner of an error
 * @param {Error} err
 */
async function handleError(err) {
  console.error(err);
  await global.owner?.send(formatError(err));
}

/**
 * self-explanatory
 * @param {BaseInteraction} interaction 
 */
const somethingWentWrong = (interaction) => interaction.replyEphemeral('something went wrong, please try again').catch(handleError);

module.exports = {
  get formatError() { return formatError; },
  get somethingWentWrong() { return somethingWentWrong; },
  get handleError() { return handleError; }
};