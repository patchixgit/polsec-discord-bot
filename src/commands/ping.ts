import { Command } from "../types/Command.js";

export default {
  name: "ping",
  aliases: ["p"],
  description: "Replies with Pong! and the bot's latency.",

  async exec(client, message, args, extras) {
    const latency = Date.now() - message.createdTimestamp;
    await message.reply(
      `Pong! Latency: ${latency}ms. Process Time: ${extras.processTime.toFixed(2)}ms..`,
    );
  },
} as Command;
