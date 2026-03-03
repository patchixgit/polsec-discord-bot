import * as Discord from 'discord.js';

export interface PolsecBotClient extends Discord.Client {
    commands: Discord.Collection<string, any>;
}
