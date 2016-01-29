var driverAlias = {
	pg: "pg",
	postgres: "pg",
	sqlite3: "sqlite3",
	sqlite: "sqlite3",
	oracle: "oracle",
	mysql: "mysql",
	mariadb: "mysql",
	mssql: "mssql"
};

function getDriver (opts) {
	if (!opts.driver && !driverAlias[opts.driver]) {
		throw new Error ("db-info: 'driver' key is required.");
	}

	var driverName = driverAlias[opts.driver];

	try {
		var Driver = require('./drivers/' + driverName);
		return Driver;
	} catch (e) {
		throw new Error ("db-info: invalid driver '" + driverName + "', error:" + e);
	}

}

function DBInfo (opts) {
	var Driver = getDriver (opts);

	var driver = new Driver (opts);

	return driver;
}

module.exports = DBInfo;

DBInfo.INTEGER = "integer";
DBInfo.DECIMAL = "decimal";
DBInfo.TEXT = "text";
DBInfo.VARCHAR = "varchar";
DBInfo.REAL = "real";
DBInfo.UNKNOWN = "unknown";

DBInfo.getInfo = function(opts, callback) {

	var Driver = getDriver (opts);

	var driver = new Driver();
	driver.getInfo(opts, callback);

	return driver;
}

