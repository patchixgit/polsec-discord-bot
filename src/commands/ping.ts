import { Command } from "../types/Command.js";

export default {
  name: "ping",
  aliases: ["p"],
  description: "Replies with Pong! and the bot's latency.",

  async exec(client, message) {
    const latency = Date.now() - message.createdTimestamp;
    await message.reply(`Pong! Latency: ${latency}ms`);
  },
} as Command;
