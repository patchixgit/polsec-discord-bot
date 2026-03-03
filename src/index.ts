import * as Discord from "discord.js";
import path from "node:path";
import fs from "node:fs";
import { PolsecBotClient } from "./types/Client.js";

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
	.filter(f => f.endsWith(".js") || f.endsWith(".ts"));

for (const file of commandFiles) {
	const command = await import(path.join(__dirname, "commands", file));

	if (!command || !command.default) {
		console.warn(`Failed to load command file: ${file}`);
		continue;
	}

	client.commands.set(command.default.name, command.default);

	console.log(`Loaded command: ${command.default.name}`);
}

/* Event Handling */

const eventFiles = fs
	.readdirSync(path.join(__dirname, "events"))
	.filter(f => f.endsWith(".js") || f.endsWith(".ts"));

for (const file of eventFiles) {
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
}

await client.login(Bun.env.BOT_TOKEN);
