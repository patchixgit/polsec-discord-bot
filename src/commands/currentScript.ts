import { GetAllScriptInfo } from "../api/scripts.js";
import { Command } from "../types/Command.js";

export default {
  name: "scrinfo",
  aliases: ["scinfo"],
  description: "Replies with information about available scripts.",

  async exec(client, message, args, extras) {
    console.log(`Executing command: ${this.name} with args: ${args.join(", ")}`);
    const scriptinfo = await GetAllScriptInfo();
    console.log(`Received script info: ${JSON.stringify(scriptinfo)}`);

    if (scriptinfo.success){
        const scriptInfoString = JSON.stringify(scriptinfo.scripts, null, 2);
        message.reply(`\`\`\`json\n${scriptInfoString}\n\`\`\``);
    } else {
        message.reply(`Failed to retrieve script information: ${scriptinfo.msg || "Unknown error"}`);
    }
  },
} as Command;