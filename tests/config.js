var fs   = require ('fs');
var path = require ('path');

var DBInfo = require ('../lib/db_info');

var connections = {
	mysql: {
		database: 'bookshelf_test',
		user: 'bookshelf',
		password: 'passbookword',
		encoding: 'utf8'
	},

	postgres: {
		database: 'bookshelf_test',
		user: 'apla'
	},

	sqlite3: {
		filename: ':memory:'
	},

	mssql: {
		userName: 'expressaccess',
		password: '2strongWa+er',
		server: '192.168.42.231'
	},
	xoracle: {
		user: 'oraxe',
		password: '2strongWa+er',
		//connectString: "(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=192.168.42.231)(PORT=1521))(CONNECT_DATA=(SID=XE))"
		//connectString: '192.168.42.231:1521/XE'
		connectString: '192.168.42.231:1521/XE'
		//connectString: 'sigrun/XE'
	}
};

var personSql = fs.readFileSync (path.join (__dirname, 'integration/person.sql')).toString();

function checkCommon (assert, result) {
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
	assert.equal(personTable.columns['age'].type, DBInfo.DECIMAL);
	assert.ok(!personTable.columns['age'].primaryKey);
	assert.ok(!personTable.columns['age'].notNull);

	assert.ok(personTable.indexes['nameIndex']);
	assert.equal(personTable.indexes['nameIndex'].name, 'nameIndex');
	assert.ok(personTable.indexes['nameIndex'].columns, ['name']);

	assert.ok(personTable.indexes['otherIndex']);
	assert.equal(personTable.indexes['otherIndex'].name, 'otherIndex');
	assert.ok(personTable.indexes['otherIndex'].columns, ['name', 'email']);

}

module.exports = {
	sql: {
		person: personSql,
	},
	connections: connections,
	checkCommon: checkCommon,
}
