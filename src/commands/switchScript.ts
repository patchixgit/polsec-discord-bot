import { GetAllScriptInfo } from "../api/scripts.js";
import { Command } from "../types/Command.js";

import path from 'path';
import fs from 'fs'

const configPath = path.resolve(process.cwd(), 'config.jsonc');
let configuration: any;
try {
  configuration = Bun.JSON5.parse(
    fs.readFileSync(configPath, 'utf-8'),
  );
} catch (err) {
  console.error(`Failed to read configuration file at ${configPath}:`, err);
  configuration = {};
}


const ScriptSwitching = configuration.ScriptSwitching || {};

const allowScriptSwitching = Boolean(ScriptSwitching.Enabled);

const commandObj: Partial<Command> = {
  name: "switchscript",
  aliases: ["sscr"],
  description: "Switches the active script.",
  syntax: "switchscript <scriptName>",

  restrictions: {
    userRestrictions: {},
    roleRestrictions: {}
  },

  async exec(client, message, args, extras) {
    if (!allowScriptSwitching) {
      await message.reply("Sorry, script switching is currently disabled.");
      return;
    }

    const requested = args[0];
    if (!requested) {
      await message.reply(
        `Please specify a script to switch to. Syntax: ${this.syntax}`,
      );
      return;
    }

    const scriptsCfg = configuration.Scripts || {};
    if (!(requested in scriptsCfg)) {
      await message.reply(
        "Invalid script name. Please check the available scripts and try again. Note: this comparison is case sensitive.",
      );
      return;
    }

    const previousKey = process.env.POLSEC_API_KEY || "";
    process.env.POLSEC_API_KEY = scriptsCfg[requested];

    let scriptName = requested;

    try {
      const scriptInfo = await GetAllScriptInfo();

      if (!scriptInfo.success) {
        process.env.POLSEC_API_KEY = previousKey;
        await message.reply(
          `Failed to switch scripts. API key validation failed. Reverting to previous script. Error: ${scriptInfo.msg}`,
        );
        return;
      }

      if (!scriptInfo.scripts || scriptInfo.scripts.length === 0) {
        process.env.POLSEC_API_KEY = previousKey;
        await message.reply(
          "Failed to switch scripts. API key validation failed. Reverting to previous script. Error: no script data returned.",
        );
        return;
      }

      scriptName = scriptInfo.scripts[0]! .scriptName || requested;
    } catch (err) {
      process.env.POLSEC_API_KEY = previousKey;
      await message.reply(
        `An unexpected error occurred while validating the new API key. Reverting to previous script. Details: ${err}`,
      );
      return;
    }

    await message.reply(`Switched active script to: ${scriptName} (${requested})`);
  },
} as Command;

if (ScriptSwitching?.AllowedUsers?.allowUsers) {
  const mode = String(ScriptSwitching.AllowedUsers.Mode || "").toLowerCase();
  if (mode === "whitelist" || mode === "blacklist") {
    commandObj.restrictions!.userRestrictions!.MainMode = mode;
  }

  commandObj.restrictions!.userRestrictions!.Users = new Set(
    ScriptSwitching.AllowedUsers.Users || [],
  );
}

if (ScriptSwitching?.AllowedRoles?.allowRoles) {
  const mode = String(ScriptSwitching.AllowedRoles.Mode || "").toLowerCase();
  if (mode === "whitelist" || mode === "blacklist") {
    commandObj.restrictions!.roleRestrictions!.MainMode = mode;
  }

  commandObj.restrictions!.roleRestrictions!.Roles = new Set(
    ScriptSwitching.AllowedRoles.Roles || [],
  );
}

export default commandObj;
