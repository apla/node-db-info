
var DBInfo = require("../../lib/db_info");

var assert = require ("assert");

var config = require ("../config");

if (!config.postgres)
	return;

describe ("postgres schema", function () {

	var db;
	var dbInfo;
	var connParams = {
		driver: 'postgres',
		user: config.postgres.user,
		password: config.postgres.password,
		database: config.postgres.database
	};

	before (function (callback) {

		dbInfo = new DBInfo (connParams);
		dbInfo.connect (function (err, connection) {

			db = connection;

			dbInfo.do ([
				"CREATE TABLE IF NOT EXISTS person (id INTEGER PRIMARY KEY, name VARCHAR(255) NOT NULL, email VARCHAR(100), age INTEGER);",
				'CREATE INDEX "nameIndex" ON person (name);',
				'CREATE UNIQUE INDEX "uniqueEmailIndex" ON person (email);',
				'CREATE INDEX "otherIndex" ON person (name,email);'
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

			// console.log (result);

			if(err) { console.error(err); return; }

			//console.log(require('util').inspect(result, false, 10));

			assert.ok(result.tables['person']);
			var personTable = result.tables['person'];

			assert.ok(personTable.columns['id']);
			assert.equal(personTable.columns['id'].name, 'id');
			assert.equal(personTable.columns['id'].type, DBInfo.INTEGER);
			assert.ok(personTable.columns['id'].primaryKey);
			assert.ok(personTable.columns['id'].notNull);

			assert.ok(personTable.columns['name']);
			assert.equal(personTable.columns['name'].name, 'name');
			assert.equal(personTable.columns['name'].type, DBInfo.VARCHAR);
			assert.equal(personTable.columns['name'].length, 255);
			assert.ok(!personTable.columns['name'].primaryKey);
			assert.ok(personTable.columns['name'].notNull);

			assert.ok(personTable.columns['email']);
			assert.equal(personTable.columns['email'].name, 'email');
			assert.equal(personTable.columns['email'].type, DBInfo.VARCHAR);
			assert.equal(personTable.columns['email'].length, 100);
			assert.ok(!personTable.columns['email'].primaryKey);
			assert.ok(!personTable.columns['email'].notNull);

			assert.ok(personTable.columns['age']);
			assert.equal(personTable.columns['age'].name, 'age');
			assert.equal(personTable.columns['age'].type, DBInfo.INTEGER);
			assert.ok(!personTable.columns['age'].primaryKey);
			assert.ok(!personTable.columns['age'].notNull);

			assert.ok(personTable.indexes['nameIndex']);
			assert.equal(personTable.indexes['nameIndex'].name, 'nameIndex');
			assert.ok(personTable.indexes['nameIndex'].columns, ['name']);

			assert.ok(personTable.indexes['otherIndex']);
			assert.equal(personTable.indexes['otherIndex'].name, 'otherIndex');
			assert.ok(personTable.indexes['otherIndex'].columns, ['name', 'email']);

			done();
		});
	});
});
