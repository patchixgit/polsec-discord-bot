import { PolsecBotClient } from "./Client.js";

export interface BotEvent {
    name: string;
    once?: boolean;
    exec: (client: PolsecBotClient, ...args: any[]) => void;
}