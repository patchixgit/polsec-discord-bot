import { Command } from "../types/Command.js";
import { EmbedBuilder, Colors } from "discord.js";

export default {
  name: "help",
  description: "Displays help information for available commands.",

  async exec(client, message, args, extras) {
    const prefix = Bun.env.PREFIX || "!";
    const commands = Array.from(new Set(client.commands.values())) as Command[];

    if (args.length === 0) {
      // build an embed listing each command with its description
      const embed = new EmbedBuilder()
        .setTitle("Available Commands")
        .setColor(Colors.Blurple)
        .setDescription(
          "Use `" + prefix + "help <command>` to get more information on a specific command.",
        )
        .addFields(
          commands.map((cmd) => ({
            name: prefix + cmd.name,
            value: cmd.description || "No description provided.",
            inline: false,
          })),
        )
        .setFooter({ text: `Requested by ${message.author.tag}` });

      await message.reply({ embeds: [embed] });
      return;
    }

    // detailed help
    const lookup = args[0]!.toLowerCase();
    const command = client.commands.get(lookup) as Command | undefined;

    if (!command) {
      const embed = new EmbedBuilder()
        .setTitle("Command Not Found")
        .setColor(Colors.Red)
        .setDescription(`I couldn't find a command named \`${lookup}\`.`);
      await message.reply({ embeds: [embed] });
      return;
    }

    const embed = new EmbedBuilder()
      .setTitle(`${prefix}${command.name}`)
      .setColor(Colors.Green)
      .addFields(
        { name: "Description", value: command.description || "-" },
        {
          name: "Syntax",
          value: command.syntax ? `\`${prefix}${command.syntax}\`` : "None",
        },
      )
      .setFooter({ text: `Aliases: ${command.aliases?.join(", ") || "none"}` });

    await message.reply({ embeds: [embed] });
  },
} as Command;
