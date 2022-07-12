const mysql = require("mysql");
const conf = require("./db_info").dev;

module.exports = function(){
	return {
		init : function(){
			return mysql.createConnection({
				host: conf.host,
				port: conf.port,
				user: conf.user,
				password: conf.password,
				database: conf.database
			});
		}
	}
}