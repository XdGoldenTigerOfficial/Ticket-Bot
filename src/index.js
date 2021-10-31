const {
	Client,
	Intents,
	Collection,
	MessageEmbed,
	MessageButton,
	MessageActionRow,
	Message,
	MessageSelectMenu,
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
const {
	prefix,
	version,
	mongourl,
	staff,
	logo,
	staffId,
	deps,
	parentid,
	holdid,
	logs,
} = require("../config");
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

	if (args[0].toLocaleLowerCase() === `findoptions`) {
		const getTicket = await Ticket.findOne({
			where: { channelId: message.channel.id },
		});

		const url = `https://discord.com/channels/${
			message.guild.id
		}/${await getTicket.channelId}/${await getTicket.optionsMessageId}`;
		// const url = msg.url; //879859356622000188

		const Button22 = new MessageButton()
			.setURL(`${url}`)
			.setStyle("LINK")
			.setLabel("Options Message");

		const row = new MessageActionRow().addComponents(Button22);
		message.channel.send({
			content: "Found One message in this channel with options!",
			components: [row],
		});
	}

	if (
		args[0].toLocaleLowerCase() === `setup` &&
		message.member.roles.cache.find((r) => r.name === staff)
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
				.then((collected) => {
					return collected.first().content;
				});
			const catChan = client.channels.cache.get(catId);

			message.channel.send(
				"Please enter the Department for the tickets to go too!"
			);
			const dep = await message.channel
				.awaitMessages({ filter, max: 1 })
				.then((collected) => {
					return collected.first().content;
				});

			let ticketembed = new MessageEmbed()
				.setDescription(`Department: ${dep}. \n\n Select a option Below!`)
				.setColor("RANDOM");

			let button = new MessageButton()
				.setCustomId("1")
				.setLabel("Open A Ticket!")
				.setStyle("SUCCESS");

			let row = new MessageActionRow().addComponents(button);
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

client.on("interactionCreate", async (interaction) => {
	interaction.deferReply();
	interaction.deleteReply();

	if (interaction.isButton) {
		switch (interaction.customId) {
			case "1":
				console.log("hello");
				const ticketConfig = await TicketConfig.findOne({
					where: { messageId: interaction.message.id },
				});
				if (ticketConfig) {
					const findTicket = await Ticket.findOne({
						where: { authorId: interaction.user.id, resolved: false },
					});

					if (findTicket) {
						let existing = new MessageEmbed()
							.setAuthor(interaction.guild.name)
							.setDescription("Error While Making The Ticket (Duplicate)")
							.addField("Current Ticket:", `<#${findTicket.channelId}>`)

							.setColor("RED")
							.setThumbnail(interaction.guild.iconURL())

							.setFooter("You have a ticket already", logo);
						interaction.user.send({ embeds: [existing] });
					} else {
						console.log("Making Ticket....");
						try {
							const channel = await interaction.guild.channels.create(
								"ticket",
								{
									parent: await ticketConfig.getDataValue("parentId"),
									topic: `Department: ${await ticketConfig.getDataValue(
										"department"
									)} Type: Server Ticket`,
									permissionOverwrites: [
										{ deny: "VIEW_CHANNEL", id: interaction.guild.id },
										{ allow: "VIEW_CHANNEL", id: interaction.user.id },
										{ allow: "VIEW_CHANNEL", id: staffId },
									],
									reason: `${interaction.user.tag} Had Reacted To Open this ticket!`,
								}
							);
							let openembed = new MessageEmbed()
								.setColor("RANDOM")
								.setDescription(
									`Dear ${
										interaction.user
									}, \n Your support Ticket has been created. \n Please wait for a member of the Support Team to help you out. \n Department: ${await ticketConfig.getDataValue(
										"department"
									)} \n\n Below are ticket options!`
								);

							let warn = {
								label: "Transfer Department",
								value: "TRANS",
								description: "Transfer to another Department",
							};
							let kick = {
								label:
									"Request a copy of the ticket (NOTE! this will only take effect on close)!",
								value: "COPY",
								description: "Will send you a copy of the transcript",
							};
							let ban = {
								label: "Place on hold/unhold!",
								value: "HOLD",
								description: "Will place it on hold or unhold!",
							};

							let mute = {
								label: "Close!",
								value: "CLOSE",
								description: "Closes the ticket",
							};
							let cancel = {
								label: "Force Close",
								value: "STOP",
								description:
									"Will bypass transcripts (only staff can use this)",
							};

							const options = new MessageSelectMenu()
								.setCustomId("newticket")
								.setPlaceholder("Chose A Option!")
								.addOptions([warn, kick, ban, mute, cancel]);

							const row = new MessageActionRow().addComponents(options);

							const msg = await channel.send({
								embeds: [openembed],
								components: [row],
							});
							msg.pin();

							const ticket = await Ticket.create({
								authorId: interaction.user.id,
								channelId: channel.id,
								guildId: interaction.guild.id,
								resolved: false,
								optionsMessageId: msg.id,
								department: await ticketConfig.getDataValue("department"),
								original: await ticketConfig.getDataValue("department"),
								type: "Server Ticket",
							});

							const ticketId = String(ticket.getDataValue("ticketId")).padStart(
								4,
								0
							);

							await channel.edit({ name: `ticket-${ticketId}` });
						} catch (error) {
							console.log(error);
						}
					}
				}

				break;
		}
	}

	if (interaction.isSelectMenu) {
		if (interaction.customId !== "newticket") return;
		const getTicket = await Ticket.findOne({
			where: { channelId: interaction.message.channel.id },
		});
		let warn22 = {
			label: "Transfer Department",
			value: "TRANS",
			description: "Transfer to another Department",
		};
		let kick22 = {
			label:
				"Request a copy of the ticket (NOTE! this will only take effect on close)!",
			value: "COPY",
			description: "Will send you a copy of the transcript",
		};
		let ban222 = {
			label: "Place on hold/unhold!",
			value: "HOLD",
			description: "Will place it on hold or unhold!",
		};

		let mute22 = {
			label: "Close!",
			value: "CLOSE",
			description: "Closes the ticket",
		};
		let cancel22 = {
			label: "Force Close",
			value: "STOP",
			description: "Will bypass transcripts (only staff can use this)",
		};

		const options22 = new MessageSelectMenu()
			.setCustomId("newticket")
			.setPlaceholder("Chose A Option!")
			.addOptions([warn22, kick22, ban222, mute22, cancel22]);

		const row22 = new MessageActionRow().addComponents(options22);
		interaction.message.edit({ components: [row22] });
		switch (interaction.values[0]) {
			case "TRANS":
				let filter = (r) => r.author.id === interaction.user.id;
				interaction.message.channel
					.send(
						`Please Say a department you would like to transfer to \n allowed departments: ${deps
							.map((d) => d)
							.join(", ")}`
					)
					.then(async () => {
						interaction.channel
							.awaitMessages({ filter, max: 1, time: 30000, errors: ["time"] })
							.then(async (collected) => {
								if (!deps.includes(collected.first().content))
									return interaction.followUp(
										`Error! Must be one of the following departments \n ${deps
											.map((d) => d)
											.join(", ")}`
									);
								getTicket.department = collected.first().content;
								getTicket.save();
								interaction.message.channel.setTopic(
									` Department: ${await getTicket.getDataValue(
										"department"
									)} Type: ${getTicket.getDataValue("type")}`
								);
								let openembed22 = new MessageEmbed()
									.setColor("RANDOM")
									.setDescription(
										`Dear ${
											interaction.user
										}, \n Your support Ticket has been created. \n Please wait for a member of the Support Team to help you out. \n Department: ${await getTicket.getDataValue(
											"department"
										)} \n\n Below are ticket options!`
									);
								interaction.message.edit({ embeds: [openembed22] });
								interaction.message.channel.send(
									`Set Department Too ${collected.first().content}!`
								);
							})
							.catch(async (collected) => {
								console.log(collected);
								interaction.message.channel.send(
									"Time Ran out to change department"
								);
							});
					});

				break;
			case "COPY":
				if (getTicket.copy) {
					getTicket.copy = false;
					getTicket.save();
					interaction.message.channel.send(
						`I will No longer remind Staff on close to send you a transcript!`
					);
				} else {
					getTicket.copy = true;
					getTicket.save();
					interaction.message.channel.send(
						"I will remind staff to send you a copy when the ticket closes!"
					);
				}

				break;
			case "HOLD":
				if (getTicket.hold) {
					getTicket.hold = false;
					getTicket.save();
					interaction.message.channel.send(
						"Took the hold off the ticket it can now be closed!"
					);
				} else {
					getTicket.hold = true;
					getTicket.save();
					interaction.message.channel.send(
						"Placed the ticket on hold i will prevent it from being closed!"
					);
				}
				break;
			case "STOP":
				if (interaction.member.roles.cache.get(staffId)) {
					const options223 = new MessageSelectMenu()
						.setCustomId("newticket")
						.setPlaceholder("Chose A Option!")
						.setDisabled()
						.addOptions([warn22, kick22, ban222, mute22, cancel22]);

					const row223 = new MessageActionRow().addComponents(options223);

					interaction.message.edit({ components: [row223] });

					interaction.message.channel.send("Closing Now.....");

					getTicket.resolved = true;
					getTicket.save();

					setTimeout(() => {
						const channel = interaction.guild.channels.cache.get(logs);

						const forceembed = new MessageEmbed()
							.setTitle("Forced Closed Ticket")
							.setDescription(
								`Ticket forced closed. \n\n Name: ${interaction.channel.name}. \n\n no more info on ticket`
							);

						channel.send({ embeds: [forceembed] });

						interaction.channel.delete();
					}, 5000);
				} else {
					interaction.message.channel.send(
						"only staff can force close a ticket!"
					);
				}

				break;
			default:
				interaction.message.channel.send(
					"Error! This option is disabled or isn't coded  anymore!"
				);
				break;
		}
	}
});

//logs in bot

client.login(token);
