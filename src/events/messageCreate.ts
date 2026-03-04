import { Events } from "discord.js";
import type { Message } from "discord.js";
import type { BotEvent } from "../types/Event.js";
import type { Command } from "../types/Command.js";

const event: BotEvent = {
  name: Events.MessageCreate,

  async exec(client, message: Message) {
    const beforeProcessing = performance.now();

    if (message.author.bot) return;

    const prefix = Bun.env.PREFIX;

    if (!prefix) {
      console.error("Setup your prefix in the .env file.");
      process.exit(1);
    }

    if (!message.content.startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const commandName = args.shift()?.toLowerCase();

    if (!commandName) return;

    const command = client.commands.get(commandName) as Command | undefined;

    if (!command) return;

    if (command.restrictions?.roleRestrictions) {
      const roleRestrictionMode =
        command.restrictions.roleRestrictions.MainMode;

      switch (roleRestrictionMode) {
        case "blacklist":
          if (
            message.member?.roles.cache.some((role) =>
              command.restrictions?.roleRestrictions?.Roles.has(role.id),
            )
          ) {
            return message.reply("You are not allowed to use this command.");
          }
          break;
        case "whitelist":
          if (
            !message.member?.roles.cache.some((role) =>
              command.restrictions?.roleRestrictions?.Roles.has(role.id),
            )
          ) {
            return message.reply("You are not allowed to use this command.");
          }
          break;
        default:
          console.warn(
            `Unknown role restriction mode for command ${command.name}.`,
          );
          break;
      }
    }

    if (command.restrictions?.userRestrictions) {
      const userRestrictionMode =
        command.restrictions.userRestrictions.MainMode;

      switch (userRestrictionMode) {
        case "blacklist":
          if (
            command.restrictions.userRestrictions.Users.has(
              message.author.id,
            )
          ) {
            return message.reply("You are not allowed to use this command.");
          }
          break;
        case "whitelist":
          if (
            !command.restrictions.userRestrictions.Users.has(
              message.author.id,
            )
          ) {
            return message.reply("You are not allowed to use this command.");
          }
          break;
        default:
          console.warn(
            `Unknown user restriction mode for command ${command.name}.`,
          );
          break;
      }
    }

    try {
      await command.exec(client, message, args, {
        processTime: performance.now() - beforeProcessing,
      });
    } catch (err) {
      console.error(`Error executing command ${command.name}:`, err);
      await message.reply(
        "There was an error executing this command. It's been logged to the console.",
      );
    }
  },
};

export default event;
