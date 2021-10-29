const { Client, Intents, Collection, MessageEmbed } = require("discord.js");
// the new client format

const client = new Client({
	partials: ["MESSAGE", "CHANNEL", "REACTION"],
	intents: [
		Intents.FLAGS.DIRECT_MESSAGES,
		Intents.FLAGS.GUILDS,
		Intents.FLAGS.GUILD_BANS,
		Intents.FLAGS.GUILD_MEMBERS,
		Intents.FLAGS.GUILD_MESSAGES,
		Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
		Intents.FLAGS.GUILD_VOICE_STATES,
	],
}); // will add more intents

client.events = new Collection();

client.commands = new Collection();

//config
const { prefix, version } = require("../config");
//token
const { token } = require("../secure/token");

//ready event

["event", "command"].forEach((hand) => {
	require(`./utils/${hand}`)(client);
});

client.on("ready", async () => {
	await client.events.get("ready").execute(version, client);
});

//message event
client.on("messageCreate", async (message) => {
	client.config = {
		prefix,
		version,
	};
	await client.events
		.get("messageCreate")
		.execute(message, client, MessageEmbed);
});

//logs in bot

client.login(token);
