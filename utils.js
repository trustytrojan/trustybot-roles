const { BaseInteraction, User, Client } = require('discord.js');

/**
 * formats an error to be sent in discord
 * @param {Error} err
 * @returns {string}
 */
const formatError = (err) => `**this is an error**\`\`\`js\n${err.stack ?? err}\`\`\``;


/**
 * reference necessary for `handleError` to send messages to the bot owner
 * @type {User}
 */
let owner;

/**
 * @param {Client}
 */
const initOwner = async ({ application }) => ({ owner } = await application.fetch());

/** 
 * notifies the bot owner of an error
 * @param {Error} err
 */
async function handleError(err) {
  console.error(err);
  await owner.send(error_str(err));
}

/**
 * self-explanatory
 * @param {BaseInteraction} interaction 
 */
const somethingWentWrong = (interaction) => interaction.replyEphemeral('something went wrong, please try again').catch(handleError);

module.exports = {
  get formatError() { return formatError; },
  get somethingWentWrong() { return somethingWentWrong; },
  get initOwner() { return initOwner; },
  get handleError() { return handleError; }
};