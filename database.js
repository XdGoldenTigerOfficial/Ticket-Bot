const { Sequelize } = require("sequelize");
const { db_name, db_user, db_pass, db_host } = require("./config");

module.exports = new Sequelize(db_name, db_user, db_pass, {
	dialect: "mysql",
	logging: false,
	host: db_host,
});
