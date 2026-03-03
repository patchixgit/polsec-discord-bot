import * as Discord from "discord.js";
import { PolsecBotClient } from "./Client.js";


// user and role restrictions are handled in the messageCreate event, as its required for context.

type RoleRestrictions = {
	MainMode: "whitelist" | "blacklist";
	Roles: Array<Discord.Snowflake>;
};

type UserRestrictions = {
	MainMode: "whitelist" | "blacklist";
	Users: Array<Discord.Snowflake>;
};

export interface Command {
	name: string;
	aliases: Array<string>;
	description: string;
	syntax?: string;

	restrictions?: {
		roleRestrictions?: RoleRestrictions;
		userRestrictions?: UserRestrictions;
	};

	exec: (
		client: PolsecBotClient,
		message: Discord.Message,
		args: Array<string>,
	) => void;
}