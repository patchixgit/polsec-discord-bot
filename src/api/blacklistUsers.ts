const BASE_API_URL = "https://api.getpolsec.com/api/v1/blacklist";

export async function blacklistByHWID(hwid: string, note = "No Note Provided") {
  try {
    const res = await Bun.fetch(BASE_API_URL + "/hwids", {
      method: "POST",
      headers: {
        Authentication: Bun.env.POLSEC_API_KEY!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ hwid, note }),
    });

    const data = await res.json().catch((e) => {
      return { data: { blacklisted: false }, msg: `Got error: ${e.message}` };
    });

    return { success: data.data.blacklisted, msg: data };
  } catch (e) {
    return { success: false, error: e };
  }
}

export async function removeBlacklistByHWID(hwid: string) {
  try {
    const res = await Bun.fetch(BASE_API_URL + "/hwids", {
      method: "DELETE",
      headers: {
        Authentication: Bun.env.POLSEC_API_KEY!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ hwid }),
    });

    const data = await res.text();

    if (data.includes("not blacklisted")) {
      return { success: false, msg: data };
    }

    const jsonData = JSON.parse(data);

    return { success: jsonData.data.removed, msg: jsonData.data };
  } catch (e) {
    return { success: false, msg: (e as Error).message };
  }
}

export async function blacklistByDiscordID(
  discordId: string,
  note = "No Note Provided",
) {
  try {
    const res = await Bun.fetch(BASE_API_URL + "/users", {
      method: "POST",
      headers: {
        Authentication: Bun.env.POLSEC_API_KEY!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ discord_id: discordId, note }),
    });

    const data = await res.json().catch((e) => {
      return { data: { blacklisted: false }, msg: `Got error: ${e.message}` };
    });

    return { success: data.data.blacklisted, msg: data };
  } catch (err) {
    return { success: false, msg: "Got Error: " + (err as Error).message };
  }
}

export async function removeBlacklistByDiscordID(discordId: string) {
  try {
    const res = await Bun.fetch(BASE_API_URL + "/users", {
      method: "DELETE",
      headers: {
        Authentication: Bun.env.POLSEC_API_KEY!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ discord_id: discordId }),
    });

    const data = await res.text();

    if (data.includes("not blacklisted")) {
      return { success: false, msg: data };
    }

    const jsonData = JSON.parse(data);

    return { success: jsonData.data.removed, msg: jsonData.data };
  } catch (err) {
    return { success: false, msg: "Got Error: " + (err as Error).message };
  }
}
