
var DBInfo = require("../../lib/db_info");

var assert = require ("assert");

var config = require ("../config");

if (!config.connections.postgres)
	return;

describe ("postgres schema", function () {

	var db;
	var dbInfo;
	var connParams = config.connections.postgres;

	before (function (callback) {

		dbInfo = new DBInfo (connParams);
		dbInfo.connect (function (err, connection) {

			db = connection;

			dbInfo.do (config.sql.employees.concat([
				config.sql.person,
				'CREATE INDEX "nameIndex" ON person (name);',
				'CREATE UNIQUE INDEX "uniqueEmailIndex" ON person (email);',
				'CREATE INDEX "otherIndex" ON person (name,email);'
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

			if(err) { console.error(err); return; }

			//console.log(require('util').inspect(result, false, 10));

			assert.ok(result.tables['person']);

			done ();
		});
	});

	it ("single table", function (done) {
		DBInfo.getInfo(connParams, function(err, result) {

			// console.log (result);

			if(err) { console.error(err); return; }

			//console.log(require('util').inspect(result, false, 10));

			config.checkCommon (assert, result);

			done();
		});
	});

	it ("foreigh keys", function (done) {
		DBInfo.getInfo(connParams, function(err, result) {

			if (err) {
				// console.error(err);
				assert (false, err);
			}

			config.checkForeign (assert, result);

			done();
		});
	});

});
