import { Command } from "../types/Command.js";

export default {
  name: "availablescripts",
  description: "Replies with a list of available scripts.",

  async exec(client, message, args, extras) {
    const avblScripts = Object.keys(client.config.Scripts);

    if (avblScripts.length === 0) {
      return message.reply("No scripts are currently available.");
    }

    let replyMessage = "Available scripts:\n";

    avblScripts.forEach((scriptName) => {
      replyMessage += `- ${scriptName}\n`;
    });

    await message.reply(replyMessage);
  },
} as Command;
