const {
	Client,
	Intents,
	Collection,
	MessageEmbed,
	MessageButton,
	MessageActionRow,
} = require("discord.js");
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
	if (message.author.bot) return;
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

	if (
		args[0].toLocaleLowerCase() === `setup` &&
		message.member.roles.cache.find((r) => r.name === process.env.staff)
	) {
		try {
			const filter = (m) => m.author.id === message.author.id;

			//const text = args.slice(1).join(" ");

			message.channel.send(
				"Please enter the category id for the tickets to go too!"
			);
			const catId = await message.channel
				.awaitMessages({
					filter,
					max: 1,
					time: 30000,
					errors: ["time"],
				})
				.first().content;
			const catChan = client.channels.cache.get(catId);

			message.channel.send(
				"Please enter the Department for the tickets to go too!"
			);
			const dep = await message.channel
				.awaitMessages({ filter, max: 1 })
				.first().content;

			let ticketembed = new MessageEmbed()
				.setDescription(
					`department: ${dep}. \n Server Ticket: A Ticket in this server \n Dm/Pm Ticket: A Ticket sent to your Dms/Pms \n Select a option Below!`
				)
				.setColor("RANDOM");

			let button = new MessageButton()
				.setCustomId("1")
				.setLabel("Open A Server Ticket!")
				.setStyle("SUCCESS");
			let button2 = new MessageButton()
				.setStyle("SUCCESS")
				.setLabel("Open a Dm/Pm Ticket!")
				.setCustomId("6");
			let row = new MessageActionRow.addComponents(button, button2);
			const msg = await message.channel.send({
				embeds: [ticketembed],
				components: [row],
			});

			if (msg && catChan) {
				const ticketConfig = TicketConfig.create({
					messageId: msg.id,
					guildId: message.guild.id,
					parentId: catChan.id,
					department: dep,
				});
				message.channel.send("Successfully added to db!");
			} else {
				message.channel.send("ERROR!");
			}
		} catch (error) {
			console.log(error);
		}
	}
});

//logs in bot

client.login(token);
