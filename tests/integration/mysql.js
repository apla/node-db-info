
var DBInfo = require("../../lib/db_info");
var mysql = require("mysql");

var assert = require ("assert");

var config = require ("../config");

if (!config.connections.mysql)
	return;

describe ("Mysql schema", function () {

	var db;
	var dbInfo;
	var connParams = {
		driver: 'mysql',
		user: config.connections.mysql.user,
		password: config.connections.mysql.password,
		database: config.connections.mysql.database
	};

	before (function (callback) {

		dbInfo = new DBInfo (connParams);
		dbInfo.connect (function (err, connection) {

			db = connection;

			dbInfo.do ([
				config.sql.person,
				"CREATE INDEX nameIndex ON person (name);",
				"CREATE UNIQUE INDEX uniqueEmailIndex ON person (email);",
				"CREATE INDEX otherIndex ON person (name,email);"
			], function (err, results) {
				callback (err);
			});
		});
	})

	after (function (callback) {
		dbInfo.do ([
			"DROP TABLE person;"
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

			if(err) { console.error(err); return; }

			config.checkCommon (assert, result);

			done();
		});
	});
});
