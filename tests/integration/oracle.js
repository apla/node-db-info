var DBInfo = require("../../lib/db_info");

var assert = require ("assert");

var config = require ("../config");

if (!config.connections.oracle)
	return;

describe ("Oracle schema", function () {

	var db;
	var dbInfo;
	var connParams = config.connections.oracle;

	this.timeout (20000);

	before (function (callback) {

		this.timeout (20000);

		dbInfo = new DBInfo (connParams);
		dbInfo.connect (function (err, connection) {

			// console.log ('connected');

			db = connection;

			dbInfo.do (config.sql.employees.concat([
				config.sql.person,
				"CREATE INDEX nameIndex ON person (name)",
				"CREATE UNIQUE INDEX uniqueEmailIndex ON person (email)",
				"CREATE INDEX otherIndex ON person (name,email)"
			]), function (err, results) {

				callback (err);
			});
		});
	})

	after (function (callback) {

		dbInfo.do ([
			"DROP TABLE salaries",
			"DROP TABLE titles",
			"DROP TABLE dept_manager",
			"DROP TABLE dept_emp",
			"DROP TABLE departments",
			"DROP TABLE employees",
			"DROP TABLE person"
		], function (err, results) {
			callback (err);
		});
	});

	it ("with existing connection", function (done) {
		DBInfo.getInfo(connParams, function(err, result) {
			// DBInfo.getInfo({driver: connParams.driver, db: db}, function(err, result) {

			if (err) {
				// console.error(err);
				assert (false, err);
			}

			config.checkCommon (assert, result, 'oracle');

			// assert.ok(result.tables['person']);

			done ();
		});
	});

	it ("foreigh keys", function (done) {
		DBInfo.getInfo(connParams, function(err, result) {

			if (err) {
				// console.error(err);
				assert (false, err);
			}

			config.checkForeign (assert, result, 'oracle');

			done();
		});
	});
});

