module.exports = {
	name: "hello",
	desc: "get a hello from the bot",
	category: "Fun",
	usage: "hello",
	async execute(client, message, args, MessageEmbed) {
		message.reply({
			content: "Hello!",
			allowedMentions: { repliedUser: true },
		});
	},
};
