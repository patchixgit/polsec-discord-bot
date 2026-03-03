import * as Discord from "discord.js";
import path from "node:path";
import fs from "node:fs";
import { PolsecBotClient } from "./types/Client.js";
import { Command } from "./types/Command.js";

const client = new Discord.Client({
  intents: [
    Discord.GatewayIntentBits.Guilds,
    Discord.GatewayIntentBits.GuildMessages,
    Discord.GatewayIntentBits.MessageContent,
  ],
}) as PolsecBotClient;

/* Command Handling */

client.commands = new Discord.Collection();

const commandFiles = fs
  .readdirSync(path.join(__dirname, "commands"))
  .filter((f) => f.endsWith(".js") || f.endsWith(".ts"));

for (const file of commandFiles) {
  const { default: command }: { default: Command } = await import(
    path.join(__dirname, "commands", file)
  );

  if (!command) {
    console.warn(`Failed to load command file: ${file}`);
    continue;
  }

  client.commands.set(command.name, command);

  console.log(`Loaded command: ${command.name}`);

  if (command.aliases) {
    command.aliases.forEach((alias) => {
      client.commands.set(alias, command);
    });

    console.log(
      `Registered aliases for command ${command.name}: ${command.aliases.join(", ")}`,
    );
  }
}

/* Event Handling */

const eventFiles = fs
  .readdirSync(path.join(__dirname, "events"))
  .filter((f) => f.endsWith(".js") || f.endsWith(".ts"));

for (const file of eventFiles) {
  try {
    const event = await import(path.join(__dirname, "events", file));

    if (!event || !event.default) {
      console.warn(`Failed to load event file: ${file}`);
      continue;
    }

    if (event.default.once) {
      client.once(event.default.name, (...args) =>
        event.default.exec(client, ...args),
      );
    } else {
      client.on(event.default.name, (...args) =>
        event.default.exec(client, ...args),
      );
    }

    console.log(`Loaded event: ${event.default.name}`);
  } catch (error) {
    console.warn(`Failed to load event file: ${file}`);
    console.error(error);
  }
}

await client.login(Bun.env.BOT_TOKEN);
