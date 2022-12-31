import trustybot from 'trustybot-base';
const { chat_input, option } = trustybot.utils.APIObjectCreator.command;

export const guild_commands = [
  chat_input('view_roles', 'view all roles in this server'),
  chat_input('create', 'create something', [
    option.subcommand('button_roles', 'create buttons that give roles on tap/click'),
    option.subcommand('dropdown_roles', 'create a dropdown menu that gives roles on a selection'),
  ]),
  chat_input('mass_manage_member_roles', 'add/remove roles to/from all members', [
    option.string('action', 'do you want to add or remove roles from all members?', { r: true, c: [
      option.choice.string('Add'),
      option.choice.string('Remove')
    ] })
  ])
];