import * as Discord from "discord.js";
import path from "node:path";
import fs from "node:fs";
import { PolsecBotClient } from "./types/Client.js";
import persist from "node-persist";
import { Command } from "./types/Command.js";
import { PersistItems } from "./types/PersistItems.js";

const client = new Discord.Client({
  intents: [
    Discord.GatewayIntentBits.Guilds,
    Discord.GatewayIntentBits.GuildMessages,
    Discord.GatewayIntentBits.MessageContent,
  ],
}) as PolsecBotClient;

/* Caching */

await persist.init({
  dir: path.join(process.cwd(), "cache"),
  ttl: false,
  forgiveParseErrors: true,
  writeQueueIntervalMs: 1000,
});
console.log("Cache initialized successfully.");

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

/* Sticky Configuration */

{
  const configPath = path.resolve(process.cwd(), "config.jsonc");
  let configuration: any;
  try {
    configuration = Bun.JSON5.parse(fs.readFileSync(configPath, "utf-8"));
  } catch (err) {
    console.error(`Failed to read configuration file at ${configPath}:`, err);
    configuration = {};
  }

  if (configuration.StickySelectScript.Enabled) {
    const stickyScript = await persist.getItem(
      PersistItems.CurrentStickyScript,
    );

    if (!stickyScript) {
      process.env.POLSEC_API_KEY = Object.values(
        configuration.Scripts,
      )[0] as string;

      console.log(
        "No sticky script found in cache. Defaulting to first script from configuration.",
      );
    } else {
      process.env.POLSEC_API_KEY = stickyScript; // API key should be stored in cache.
      console.log(
        "Sticky script found in cache. Using cached API key for Polsec API.",
      );
    }
  } else {
    process.env.POLSEC_API_KEY = Object.values(
      configuration.Scripts,
    )[0] as string;
    console.log(
      "Sticky script feature is disabled. Defaulting to first script from configuration without caching.",
    );
  }
}

/* Login */

await client.login(Bun.env.BOT_TOKEN);
