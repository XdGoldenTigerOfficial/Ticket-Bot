module.exports = {
	name: "ready",
	async execute(version, client) {
		console.log(`Ready! On Version: ${version}`);

		client.user.setPresence({
			activities: [{ name: "Helping with Tickets!" }],
		});
	},
};
