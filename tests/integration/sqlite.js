var assert = require ('assert');

var dbinfo = require("../../lib/db_info");
var sqlite3 = require("sqlite3");

describe ("SQLite schema", function () {

	var db = new sqlite3.Database(':memory:');

	before (function(callback) {

		db.serialize (function () {
			db.run(
				"CREATE TABLE person (id INTEGER PRIMARY KEY, name TEXT NOT NULL, email TEXT, age INTEGER);",
				function() {
				});

			db.run("CREATE TABLE \"event\" (id INTEGER PRIMARY KEY AUTOINCREMENT, str TEXT UNIQUE, txt TEXT NOT NULL, intg INTEGER , rel REAL , dt INTEGER );", function() {});
			db.run("CREATE INDEX strIndex on event (str);", function() {});
			db.run("CREATE INDEX txtIndex on event (txt);", function() {
				callback();
			});

			// TODO: parser not ready for this
			// db.run("CREATE TABLE t1(a, b COLLATE BINARY, c COLLATE RTRIM, d COLLATE NOCASE);");

//			db.all ("PRAGMA table_info (\"event\");", function (err, data) {
//				console.log ('!!!!', err, data);
//			});
//			db.all ("PRAGMA index_list (\"event\");", function (err, data) {
//				console.log ('!!!!', err, data);
//				data.forEach (function (idx) {
//					db.all ("PRAGMA index_xinfo (\""+idx.name+"\");", function (err, data) {
//						console.log ('%%%%', err, data);
//					});
//				});
//			});
//			db.all ("PRAGMA foreign_key_list (\"event\");", function (err, data) {
//				console.log ('!!!!', err, data);
//			});
//			db.all ("PRAGMA table_info (\"t1\");", function (err, data) {
//				console.log ('!!!!', err, data);
//			});
//			db.all ("select * from sqlite_master;", function (err, data) {
//				console.log (789);
//				callback();
//				console.log ('!!!!', err, data);
//			});

		});
	});

	after (function(callback) {
		callback();
	});

	it ("single table", function (done) {
		dbinfo.getInfo({
			driver: 'sqlite3',
			db: db
		}, function(err, result) {
			if(err) { console.error(err); return; }

			//console.log(require('util').inspect(result, false, 10));

			assert.ok(result.tables['person']);
			var personTable = result.tables['person'];

			assert.ok(personTable.columns['id']);
			assert.equal(personTable.columns['id'].name, 'id');
			assert.equal(personTable.columns['id'].type, dbinfo.INTEGER);
			assert.ok(personTable.columns['id'].primaryKey);
			assert.ok(personTable.columns['id'].notNull);

			assert.ok(personTable.columns['name']);
			assert.equal(personTable.columns['name'].name, 'name');
			assert.equal(personTable.columns['name'].type, dbinfo.TEXT);
			assert.ok(!personTable.columns['name'].primaryKey);
			assert.ok(personTable.columns['name'].notNull);

			assert.ok(personTable.columns['email']);
			assert.equal(personTable.columns['email'].name, 'email');
			assert.equal(personTable.columns['email'].type, dbinfo.TEXT);
			assert.ok(!personTable.columns['email'].primaryKey);
			assert.ok(!personTable.columns['email'].notNull);

			assert.ok(personTable.columns['age']);
			assert.equal(personTable.columns['age'].name, 'age');
			assert.equal(personTable.columns['age'].type, dbinfo.INTEGER);
			assert.ok(!personTable.columns['age'].primaryKey);
			assert.ok(!personTable.columns['age'].notNull);

			// db.close(); // Segmentation fault with next test
			done();
		});
	});

	it ("more complex table", function (done) {
		dbinfo.getInfo({
			driver: 'sqlite3',
			db: db
		}, function(err, result) {
			if(err) { console.error(err); return; }

			//console.log(require('util').inspect(result, false, 10));

			assert.ok(result.tables['event']);
			var eventTable = result.tables['event'];

			assert.ok(eventTable.columns['id']);
			assert.equal(eventTable.columns['id'].name, 'id');
			assert.equal(eventTable.columns['id'].type, dbinfo.INTEGER);
			assert.ok(eventTable.columns['id'].primaryKey);
			assert.ok(eventTable.columns['id'].autoIncrement);

			assert.ok(eventTable.columns['str']);
			assert.equal(eventTable.columns['str'].name, 'str');
			assert.equal(eventTable.columns['str'].type, dbinfo.TEXT);
			assert.ok(eventTable.columns['str'].unique);

			assert.ok(eventTable.columns['txt']);
			assert.equal(eventTable.columns['txt'].name, 'txt');
			assert.equal(eventTable.columns['txt'].type, dbinfo.TEXT);
			assert.ok(eventTable.columns['txt'].notNull);

			assert.ok(eventTable.columns['intg']);
			assert.equal(eventTable.columns['intg'].name, 'intg');
			assert.equal(eventTable.columns['intg'].type, dbinfo.INTEGER);

			assert.ok(eventTable.columns['rel']);
			assert.equal(eventTable.columns['rel'].name, 'rel');
			assert.equal(eventTable.columns['rel'].type, dbinfo.REAL);

			assert.ok(eventTable.columns['dt']);
			assert.equal(eventTable.columns['dt'].name, 'dt');
			assert.equal(eventTable.columns['dt'].type, dbinfo.INTEGER);

			assert.ok(eventTable.indexes['strIndex']);
			assert.ok(eventTable.indexes['strIndex'].name, 'strIndex');
			assert.ok(eventTable.indexes['strIndex'].columns, ['str']);

			assert.ok(eventTable.indexes['txtIndex']);
			assert.ok(eventTable.indexes['txtIndex'].name, 'txtIndex');
			assert.ok(eventTable.indexes['txtIndex'].columns, ['txt']);

			db.close();
			done();
		});
	});

});
