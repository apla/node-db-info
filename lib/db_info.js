var driverAlias = {
	pg: "pg",
	postgres: "pg",
	sqlite3: "sqlite3",
	sqlite: "sqlite3",
	oracle: "oracle",
	mysql: "mysql",
	mariadb: "mysql"
};

function getDriver (opts) {
	if (!opts.driver && !driverAlias[opts.driver]) {
		throw new Error("'driver' is required.");
	}

	var driverName = driverAlias[opts.driver];

	var Driver = require('./drivers/' + driverName);
	if (!Driver) {
		throw new Error("invalid driver '" + driverName + "'");
	}

	return Driver;
}

function DBInfo (opts) {
	var Driver = getDriver (opts);

	var driver = new Driver (opts);

	return driver;
}

module.exports = DBInfo;

DBInfo.INTEGER = "integer";
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

