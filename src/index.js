const { Client, Intents, Collection, MessageEmbed } = require("discord.js");
// the new client format
const db = require("../database");
const mongoose = require("mongoose");

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

	if (message.author.bot) return;

	var args = message.content.slice(1).trim().split(" ");

	if (message.content.toLocaleLowerCase() === `${prefix}ping`) {
		let botMsg = await message.channel.send("〽️ " + "Pinging");

		let b;
		if (Math.round(client.ws.ping) >= 300) b = "true";
		if (Math.round(client.ws.ping) < 300) b = "false";

		let d;

		if (Math.round(botMsg.createdAt - message.createdAt) >= 500) d = "true";
		if (Math.round(botMsg.createdAt - message.createdAt) < 500) d = "false";

		const embed = new MessageEmbed()
			.setAuthor(client.user.tag, client.user.avatarURL())
			.setThumbnail(client.user.avatarURL())
			.setTitle("Pong!")
			.setTimestamp(message.createdTimestamp)
			.addField(
				`Bots Ping`,
				`🏓${Math.round(botMsg.createdAt - message.createdAt)}ms!🏓 `,
				false
			)
			.addField("Api Ping", `🏓${Math.round(client.ws.ping)}ms!🏓`, true)

			.setFooter(
				`Requested By: ${message.author.tag}`,
				message.author.avatarURL({ dynamic: true })
			)
			.setColor("RANDOM");

		return botMsg.edit({ content: " ", embeds: [embed] });
	}
});

//logs in bot

client.login(token);
