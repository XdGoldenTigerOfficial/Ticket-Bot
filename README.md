# Multi Purpose Bot

## NOTICE

Please edit code before using it and try to use it for personal use only. Thank You

### files missing in the github for security reasons

# Installation Guide
1. Create a folder in the main bot folder, and call it `secure`.
2. In the `secure` folder, Create a file called `token.js`.
3. In the `token.js` file, Copy this line inside the file you just opened: `exports.token = "";`, then add your bots token inside the quotation marks ("").
4. Now, In the main bot folder, Create a new file, and name it `config.js`, Inside this file, Copy the code from below into that file.
5. That is it, You are able to start the bot and start creating tickets!

### config.js file
```
exports.prefix = "ticket!"; // Change this to any prefix you want to use.
exports.version = "1.0.0-dev.2";
exports.logo = ""; // Add your bots logo here
exports.db_name = ""; // Add your MySQL database name here.
exports.db_user = ""; // Add your MySQL database username here.
exports.db_pass = ""; // Add your MySQL database password here.
exports.db_host = "localhost"; // Add your MySQL server IP here.
exports.staff = "Staff Role"; // .
exports.staffId = "staffRoleID"; // This is the role which will be added to the ticket once a user creates one.
exports.transcripts = "channelID"; // This channel will be used to store the transcripts when a ticket is closed.
exports.logs = "channelID"; // This is the channel that will be used to store all the logs the bot will send.

exports.mongourl = "mongodb://CONNECTION"; // If you are using MongoDB, and not MySQL. You will need to change `mysql` to `mongodb` on line 5 in the database.js file.

// These are all the departments that will be listed when a user goes to create a ticket.
// Feel free to add and remove departments in this list.
exports.deps = [
	"General Support",
	"Billing Help",
  "Partnership Requests"
];

// Not sure what this is used for tbh. Wait for an better comment.
exports.not = "ID";
```
