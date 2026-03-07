import { Attachment, AttachmentBuilder, Snowflake } from "discord.js";

const BASE_API_URL = "https://api.getpolsec.com/api/v1/scripts";

export interface AdSystemProvider {
  Enabled: boolean;
  Steps: number;
  keyDuration: number;
  apiKey?: string;
}

export type PolsecScript = {
  scriptName: string;
  publicKey: string;
  hwidResetCooldown: number;
  AdSystem: {
    LootLabs: AdSystemProvider;
    Linkvertise: AdSystemProvider & {
      linkvertiseUserId?: string;
    };
    WorkInk: AdSystemProvider;
    Lockr: AdSystemProvider;
    LVL_AntiBypass: boolean;
  };
  authEncryptionKey: number;
  owner: Snowflake;
  isTrial: boolean;
  killSwitch: boolean;
  discordWebhookUrl?: string;
};

export type PolsecEditableCfgAdSystem = {
  Enabled: boolean;
  KeyDuration: number;
};

export type PolsecEditableCfg = {
  LVL_AntiBypass: boolean;
  scriptKillswitch: boolean;
  hwidResetCooldown: number;

  AdSystems: {
    LootLabs: PolsecEditableCfgAdSystem;
    Lockr: PolsecEditableCfgAdSystem;
    Linkvertise: PolsecEditableCfgAdSystem;
    WorkInk: PolsecEditableCfgAdSystem;
  };

  trialMode: boolean;
  discordWebhookUrl: string;
};

function ProcessScriptsData(data: Array<any>): Set<PolsecScript> {
  const scriptsSet = new Set<PolsecScript>();

  data.forEach((scriptObj) => {
    const script: PolsecScript = {
      scriptName: scriptObj.scriptname,
      publicKey: scriptObj.publickey,
      hwidResetCooldown: scriptObj.hwid_reset_cooldown,

      AdSystem: {
        LVL_AntiBypass: scriptObj.antibypass_enabled,

        LootLabs: {
          Enabled: scriptObj.lootlabs,
          Steps: scriptObj.lootlabs_steps,
          keyDuration: scriptObj.lootlabs_key_duration,
          apiKey: scriptObj.lootlabs_api_key || undefined,
        },

        Linkvertise: {
          Enabled: scriptObj.linkvertise,
          Steps: scriptObj.linkvertise_steps,
          keyDuration: scriptObj.linkvertise_key_duration,
          apiKey: scriptObj.linkvertise_api_key || undefined,
          linkvertiseUserId: scriptObj.linkvertise_user_id || undefined,
        },

        WorkInk: {
          Enabled: scriptObj.workink,
          Steps: scriptObj.workink_steps,
          keyDuration: scriptObj.workink_key_duration,
          apiKey: scriptObj.workink_api_key || undefined,
        },

        Lockr: {
          Enabled: scriptObj.lockr,
          Steps: scriptObj.lockr_steps,
          keyDuration: scriptObj.lockr_key_duration,
          apiKey: scriptObj.lockr_api_key || undefined,
        },
      },

      authEncryptionKey: scriptObj.authenckey,
      owner: scriptObj.owner,
      isTrial: scriptObj.trial,
      killSwitch: scriptObj.killswitch,

      discordWebhookUrl: scriptObj.webhook || undefined,
    };

    scriptsSet.add(script);
  });

  return scriptsSet;
}

export async function GetAllScriptInfo() {
  try {
    const res = await Bun.fetch(BASE_API_URL, {
      headers: {
        method: "GET",
        Authentication: Bun.env.POLSEC_API_KEY!,
      },
    });

    if (!res.ok) {
      return {
        success: false,
        msg: `Expected Status 200, but got ${res.status} (${res.statusText})`,
      };
    }

    const plaintextData = await res.text();

    try {
      JSON.parse(plaintextData);
    } catch (e) {
      return {
        success: false,
        msg: "Parse Error (Unknown Issue). " + plaintextData,
      };
    }

    const jsonData = JSON.parse(plaintextData);

    return ProcessScriptsData(jsonData.data);
  } catch (e) {
    return {
      success: false,
      msg: "An error occurred while fetching script info.",
    };
  }
}

export async function EditScriptSource(newSource: Attachment) {
  if (!newSource.name.toLowerCase().endsWith(".lua")) {
    return {
      success: false,
      msg: "Invalid file type. Only .lua files are accepted.",
    };
  }

  if (newSource.size > 3e6) {
    return {
      success: false,
      msg: "File exceeds size limit of 3MB.",
    };
  }

  let res;
  try {
    res = await Bun.fetch(newSource.proxyURL, {
      method: "GET",
    });
  } catch (e) {
    return {
      success: false,
      msg: "Failed to fetch the attachment provided.",
    };
  }

  if (!res.ok) {
    return {
      success: false,
      msg: `Failed to read the attachment provided. Status: ${res.status} (${res.statusText})`,
    };
  }

  res = await res.text();

  let applyRes;
  try {
    applyRes = await Bun.fetch(`${BASE_API_URL}/apply2`, {
      method: "POST",
      headers: {
        Authentication: Bun.env.POLSEC_API_KEY!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        enhanced_security: false,
        script: atob(res),
      }),
    });
  } catch (e) {
    return {
      success: false,
      msg: "An error occurred while applying the new script source.",
    };
  }

  if (!applyRes.ok) {
    const errorText = await applyRes.text();
    return {
      success: false,
      msg: `Failed to apply the new script source. Status: ${applyRes.status} (${applyRes.statusText}). Response: ${errorText}`,
    };
  }

  const resAsText = await applyRes.text();

  try {
    JSON.stringify(resAsText);
  } catch (e) {
    return {
      success: false,
      msg: "Parse Error (Unknown Issue). " + resAsText,
    };
  }

  const parsedData = JSON.parse(resAsText);

  return {
    success: true,
    loader: parsedData.data.loader,
    hostedUrl: parsedData.data.hosted_url,
    userCount: parsedData.data.user_count,
    userLimit: parsedData.data.user_limit,
  };
}

export async function GetScriptObfuscationLimits() {
  try {
    const res = await Bun.fetch(
      `https://api.getpolsec.com/api/v1/obfuscation/usage`,
      {
        method: "GET",

        headers: {
          Authentication: Bun.env.POLSEC_API_KEY!,
        },
      },
    );

    if (!res.ok) {
      return {
        success: false,
        msg: `Expected Status 200, but got ${res.status} (${res.statusText})`,
      };
    }

    const jsonData = await res.json();

    if (!jsonData || !jsonData.data) {
      return {
        success: false,
        msg: "Invalid response format from API.",
      };
    }

    return {
      success: true,
      userCount: jsonData.data.user_count,
      userLimit: jsonData.data.user_limit,
      globalCount: jsonData.data.global_count,
      globalLimit: jsonData.data.global_limit,
      month: jsonData.data.month,
      year: jsonData.data.year,
      resetsAt: new Date(jsonData.data.resets_at),
    };
  } catch (e) {
    return {
      success: false,
      msg: "An error occurred while fetching obfuscation usage info.",
    };
  }
}

export async function EditScriptConfig(newCfg: PolsecEditableCfg) {
  const payloadObj = {
    antibypass_enabled: newCfg.LVL_AntiBypass,
    hwid_reset_cooldown: newCfg.hwidResetCooldown,
    killswitch: newCfg.scriptKillswitch,

    linkvertise_enabled: newCfg.AdSystems.Linkvertise.Enabled,
    linkvertise_key_duration: newCfg.AdSystems.Linkvertise.KeyDuration,

    lockr_enabled: newCfg.AdSystems.Lockr.Enabled,
    lockr_key_duration: newCfg.AdSystems.Lockr.KeyDuration,

    lootlabs_enabled: newCfg.AdSystems.LootLabs.Enabled,
    lootlabs_key_duration: newCfg.AdSystems.LootLabs.KeyDuration,

    workink_enabled: newCfg.AdSystems.WorkInk.Enabled,
    workink_key_duration: newCfg.AdSystems.WorkInk.KeyDuration,

    trial: newCfg.trialMode,
    webhook: newCfg.discordWebhookUrl,
  };

  try {
    const res = await Bun.fetch(`${BASE_API_URL}/config`, {
      method: "PUT",
      headers: {
        Authentication: Bun.env.POLSEC_API_KEY!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payloadObj),
    });

    if (!res.ok) {
      const errorText = await res.text();
      return {
        success: false,
        msg: `Failed to update script config. Status: ${res.status} (${res.statusText}). Response: ${errorText}`,
      };
    }

    const jsonifidData = await res.json();

    return {
      success: jsonifidData.success,
      msg: jsonifidData.message,
    };
  } catch (e) {
    return {
      success: false,
      msg: "Unknown Error. " + (e as Error).message,
    };
  }
}