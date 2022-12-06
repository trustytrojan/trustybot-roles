const { Message, Client, User, ComponentType, ButtonStyle } = require('discord.js');
const { ActionRow, Button } = ComponentType;
const { Danger, Primary } = ButtonStyle;

function getGlobals() {
  const { client, owner } = global;
  if(!(client instanceof Client)) throw 'global client object is not an instance of Discord.Client!';
  if(!(owner instanceof User)) throw 'global owner object is not an instance of Discord.User!';
  return { client, owner };
}

/** @param {Client} client */
async function initGlobals(client) {
  global.client = client;
  global.owner = (await client.application.fetch()).owner;
}

/**
 * formats an error to be sent in discord
 * @param {Error} err
 * @returns {string}
 */
const formatError = (err) => `**this is an error**\`\`\`js\n${err.stack ?? err}\`\`\``;

/**
 * notifies the bot owner of an error
 * @param {Error} err
 * @returns {Promise<Message>}
 */
async function handleError(err) {
  const { owner } = getGlobals();
  console.error(err);
  await owner.send(formatError(err)).catch(() => {});
}

async function clearOwnerDM() {
  const { client, owner } = getGlobals();

  const toDelete = (await (await owner.createDM()).messages.fetch()).filter(m => m.author.id === client.user.id).values();
  setInterval(async () => {
    try { await toDelete.next().value.delete(); }
    catch(err) { clearInterval(); }
  }, 1_000);
}

async function sendOwnerButtons() {
  const { owner } = getGlobals();

  /** @type {Message} */
  const message = {
    content: 'owner buttons',
    components: [
      { type: ActionRow, components: [
        { type: Button, label: 'kill bot process', customId: 'kill', style: Danger },
        { type: Button, label: 'set guild commands', customId: 'guildcmds', style: Primary },
        { type: Button, label: 'set global commands', customId: 'globalcmds', style: Primary },
      ] }
    ]
  }

  owner.buttons = await owner.send(message);
}

module.exports = {
  get getGlobals() { return getGlobals; },
  get initGlobals() { return initGlobals; },
  get formatError() { return formatError; },
  get handleError() { return handleError; },
  get clearOwnerDM() { return clearOwnerDM; },
  get sendOwnerButtons() { return sendOwnerButtons; },
};