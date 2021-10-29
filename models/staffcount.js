const mongoose = require("mongoose");

const PrefixSchema = new mongoose.Schema({
	number: {
		type: String,
		default: null,
	},

	TicketID: String,
});

const MessageModel = (module.exports = mongoose.model("counts", PrefixSchema));
