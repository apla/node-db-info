var fs   = require ('fs');
var path = require ('path');

var DBInfo = require ('../lib/db_info');

var connections = {
	mysql: {
		driver: 'mysql',
		database: 'bookshelf_test',
		user: 'bookshelf',
		password: 'passbookword',
		encoding: 'utf8'
	},

	postgres: {
		driver: 'postgres',
		database: 'bookshelf_test',
		user: 'apla'
	},

	sqlite3: {
		driver: 'sqlite3',
		filename: ':memory:'
	},

	mssql: {
		driver: 'mssql',
		user: 'expressaccess',
		password: '2strongWa+er',
		host: '192.168.42.231',
		port: '1433',
		tunnel: {
			host: 'apla.me',
			user: 'apla',
			privateKeyPath: '/Users/apla/.ssh/local-dsa'
		}
	},
	oracle: {
		driver: 'oracle',
		user: 'oraxe',
		password: '2strongWa+er',
		database: 'XE',
		//connectString: "(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=192.168.42.231)(PORT=1521))(CONNECT_DATA=(SID=XE))"
		//connectString: '192.168.42.231:1521/XE'
		//connectString: '192.168.42.231:1521/XE',
		//connectString: 'sigrun/XE',
		host: '192.168.42.231',
		port: 1521,
		tunnel: {
			host: 'apla.me',
			user: 'apla',
			privateKeyPath: '/Users/apla/.ssh/local-dsa'
		}
	}
};

var personSql = fs.readFileSync (path.join (__dirname, 'integration/person.sql')).toString();
var employeesSql = fs.readFileSync (path.join (__dirname, 'integration/employees.sql')).toString();

function dbCase (name, dialect) {
	if (dialect === "oracle") {
		return name.toUpperCase();
	}
	return name;
}

function checkCommon (assert, result, dialect) {
	assert.ok(result.tables[dbCase('person', dialect)]);
	var personTable = result.tables[dbCase('person', dialect)];

	var id = dbCase('id', dialect);
	assert.ok(personTable.columns[id]);
	assert.equal(personTable.columns[id].name, id);
	assert.ok(personTable.columns[id].primaryKey);
	assert.ok(personTable.columns[id].notNull);

	// TODO: INT is actually losing precision over FLOAT, NUMERIC or DECIMAL
	// oracle reporting INTEGER as NUMERIC
	if (dialect !== 'oracle')
		assert.equal(personTable.columns[id].type, DBInfo.INTEGER);

	var name = dbCase('name', dialect);
	assert.ok(personTable.columns[name]);
	assert.equal(personTable.columns[name].name, name);
	assert.equal(personTable.columns[name].type, DBInfo.VARCHAR);
	assert.equal(personTable.columns[name].length, 255);
	assert.ok(!personTable.columns[name].primaryKey);
	assert.ok(personTable.columns[name].notNull);

	var email = dbCase('email', dialect);
	assert.ok(personTable.columns[email]);
	assert.equal(personTable.columns[email].name, email);
	assert.equal(personTable.columns[email].type, DBInfo.VARCHAR);
	assert.equal(personTable.columns[email].length, 100);
	assert.ok(!personTable.columns[email].primaryKey);
	assert.ok(!personTable.columns[email].notNull);

	var age = dbCase('age', dialect);
	assert.ok(personTable.columns[age]);
	assert.equal(personTable.columns[age].name, age);
	assert.equal(personTable.columns[age].type, DBInfo.DECIMAL);
	assert.ok(!personTable.columns[age].primaryKey);
	assert.ok(!personTable.columns[age].notNull);

	var nameIndex = dbCase ('nameIndex', dialect);
	assert.ok(personTable.indexes[nameIndex]);
	assert.equal(personTable.indexes[nameIndex].name, nameIndex);
	assert.ok(personTable.indexes[nameIndex].columns, [name]);

	var otherIndex = dbCase ('otherIndex', dialect);
	assert.ok(personTable.indexes[otherIndex]);
	assert.equal(personTable.indexes[otherIndex].name, otherIndex);
	assert.ok(personTable.indexes[otherIndex].columns, [name, email]);

}

function checkForeign (assert, result, dialect) {

	var salaries = dbCase('salaries', dialect)

	assert.ok(result.tables[salaries]);
	var salariesTable = result.tables[salaries];

	var employees = dbCase('employees', dialect);

	var emp_no = dbCase('emp_no', dialect);
	var empNoColumn = salariesTable.columns[emp_no];
	assert.ok(empNoColumn);
	assert.equal(empNoColumn.name, emp_no);

	assert.equal (empNoColumn.ref.table, employees);
	assert.equal (empNoColumn.ref.column, emp_no);

	// TODO: UPDATE/DELETE rules

	var titles = dbCase('titles', dialect);
	var titlesTable = result.tables[titles];
	var empNoColumn = titlesTable.columns[emp_no];
	assert.ok(empNoColumn);
	assert.equal(empNoColumn.name, emp_no);

	assert.equal (empNoColumn.ref.table, employees);
	assert.equal (empNoColumn.ref.column, emp_no);

	var dept_manager = dbCase('dept_manager', dialect);
	var deptManagerTable = result.tables[dept_manager];
	var empNoColumn = deptManagerTable.columns[emp_no];
	assert.ok(empNoColumn);
	assert.equal(empNoColumn.name, emp_no);

	assert.equal (empNoColumn.ref.table, employees);
	assert.equal (empNoColumn.ref.column, emp_no);

	var departments = dbCase('departments', dialect);
	var dept_no = dbCase('dept_no', dialect);
	var deptNoColumn = deptManagerTable.columns[dept_no];
	assert.ok(deptNoColumn);
	assert.equal(deptNoColumn.name, dept_no);

	assert.equal (deptNoColumn.ref.table, departments);
	assert.equal (deptNoColumn.ref.column, dept_no);

	var dept_emp = dbCase('dept_emp', dialect);
	var deptEmpTable = result.tables[dept_emp];
	var empNoColumn = deptEmpTable.columns[emp_no];
	assert.ok(empNoColumn);
	assert.equal(empNoColumn.name, emp_no);

	assert.equal (empNoColumn.ref.table, employees);
	assert.equal (empNoColumn.ref.column, emp_no);

	var deptNoColumn = deptEmpTable.columns[dept_no];
	assert.ok(deptNoColumn);
	assert.equal(deptNoColumn.name, dept_no);

	assert.equal (deptNoColumn.ref.table, departments);
	assert.equal (deptNoColumn.ref.column, dept_no);

}

module.exports = {
	sql: {
		person:    personSql,
		employees: employeesSql.split (';').map (function (s) {return s.trim()}).filter (function (s) {return s.length})
	},
	connections:  connections,
	checkCommon:  checkCommon,
	checkForeign: checkForeign,
}
