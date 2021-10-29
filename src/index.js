const { Client, Intents, Collection, MessageEmbed } = require("discord.js");
// the new client format
const db = require("./database");

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
const { prefix, version, mongourl } = require("../config");
//token
const { token } = require("../secure/token");

//ready event

["event", "command"].forEach((hand) => {
	require(`./utils/${hand}`)(client);
});

const Ticket = require("./models/Ticket");
const TicketConfig = require("./models/TicketConfig");
const DMTicket = require("./models/DmTickets");
const counts = require("./models/staffcount");

mongoose
	.connect(mongourl, {
		useNewUrlParser: true,
		useUnifiedTopology: true,
		useFindAndModify: true,
	})
	.then(console.log("Mongo Activated.. On Bot!"));

client.on("ready", async () => {
	await client.events.get("ready").execute(version, client);

	db.authenticate()
		.then(async () => {
			console.log("Connected to DataBase!");
			Ticket.init(db);
			DMTicket.init(db);
			TicketConfig.init(db);
			Ticket.sync();
			DMTicket.sync();
			TicketConfig.sync();
			console.log("Completed!");
		})
		.catch((err) => error(err));
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
