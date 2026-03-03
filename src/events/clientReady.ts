import { Events } from "discord.js";
import { BotEvent } from "../types/Event.js";

export default{
    name: Events.ClientReady,
    once: true,

    async exec (client) {
        console.log(`Logged in as ${client.user?.tag}!`);
    }
} as BotEvent;