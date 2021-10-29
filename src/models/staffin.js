const mongoose = require("mongoose");

const PrefixSchema = new mongoose.Schema({
	Prefix: {
		type: Array,
		default: null,
	},

	TicketID: String,
});

const MessageModel = (module.exports = mongoose.model(
	"prefixes",
	PrefixSchema
));
