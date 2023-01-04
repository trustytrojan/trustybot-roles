import {
  ApplicationCommandOptionType,
  PermissionFlagsBits,
  ApplicationCommandType
} from 'discord.js';

const { Subcommand, String, Boolean } = ApplicationCommandOptionType;
const { ManageGuild, ManageRoles } = PermissionFlagsBits;

/** @type {import('discord.js').APIApplicationCommand[]} */
export const guild_commands = [
  {
    type: ApplicationCommandType.ChatInput,
    name: 'view_roles',
    description: 'view all roles in this server'
  },
  {
    type: ApplicationCommandType.ChatInput,
    name: 'create',
    description: 'create something',
    default_member_permissions: (ManageRoles).toString(),
    options: [
      {
        type: Subcommand,
        name: 'button_roles',
        description: 'create buttons that give roles on tap/click',
        options: [
          {
            type: Boolean,
            name: 'single_role',
            description: 'would you like to restrict members to only one role?',
            required: true
          }
        ]
      }
    ],
  },
  {
    type: ApplicationCommandType.ChatInput,
    name: 'mass_manage_member_roles',
    description: 'add/remove roles to/from members',
    default_member_permissions: (ManageRoles).toString(),
    options: [
      {
        type: String,
        name: 'action',
        description: 'add or remove roles from members?',
        required: true
      }
    ]
  }
];

/** @type {import('discord.js').APIApplicationCommand[]} */
export const global_commands = [
  {
    type: ApplicationCommandType.Message,
    name: 'Edit Button/Dropdown Roles',
  }
];
