var util = require ('util');
var fs   = require ('fs');
var path = require ('path');

var Driver = require('../../driver');
var dbInfo = require('../../db_info');
var mysql = require('mysql');

var columnsSql = fs.readFileSync (path.join (__dirname, 'columns.sql')).toString ();
var indexesSql = fs.readFileSync (path.join (__dirname, 'indexes.sql')).toString ();
var fkeysSql   = fs.readFileSync (path.join (__dirname, 'fkeys.sql')).toString ();

var MysqlDriver = function (connParams) {
	this.connParams = connParams;

	this.sql = {
		columns: columnsSql,
		indexes: indexesSql,
		fkeys:   fkeysSql
	};
}

util.inherits (MysqlDriver, Driver);

MysqlDriver.prototype.init = function() {
	this._super();


}

MysqlDriver.prototype.parseColumnType = function(columnType) {
	var results = {
		type: columnType
	};

	var match = columnType.match(/([a-zA-Z]+)\(([0-9]+)\)/);
	if(match) {
		results.type = match[1];
		results.length = match[2];
	}

	if(results.type == 'int') {
		results.type = dbInfo.INTEGER;
	}

	return results;
}

MysqlDriver.prototype.columnToDbInfo = function(column) {
	var info = {
		name: column.Field || column.COLUMN_NAME,
		notNull: (column.Null || column.IS_NULLABLE) === 'NO' ? true : false,
	};

	if (column.Key || column.COLUMN_KEY) {
		var colKey = column.Key || column.COLUMN_KEY;
		if(colKey === 'PRI') {
			info.primaryKey = true;
		} else if (colKey === 'UNI') {
			info.unique = true;
		}
	}

	var columnTypeInfo = this.parseColumnType(column.Type || column.COLUMN_TYPE, column.TYPE_NAME);
	for(var c in columnTypeInfo) {
		info[c] = columnTypeInfo[c];
	}

	return info;
}

MysqlDriver.prototype.updateTableDbInfoWithIndex = function(tableInfo, indexRow) {

	var keyName = indexRow.Key_name || indexRow.INDEX_NAME;

	if (keyName === 'PRIMARY') {
		return;
	}

	var	columnName = indexRow.Column_name || indexRow.COLUMN_NAME;

	if(tableInfo.indexes[keyName]) {
		tableInfo.indexes[keyName].columns.push(columnName);
	} else {
		var result = {
			tableName: indexRow.Table || indexRow.TABLE_NAME,
			name: keyName,
			type: indexRow.CONSTRAINT_TYPE,
			columns: [ columnName ]
		};
		tableInfo.indexes[keyName] = result;
	}
}

MysqlDriver.prototype.connect = function (opts, cb) {

	if (typeof opts === "function" && cb === undefined) {
		cb = opts;
		opts = null;
	}

	var connection = mysql.createConnection (opts || this.connParams);

	connection.connect(function(err) {
		if (err) {
			console.log(err.code); // 'ECONNREFUSED'
			console.log(err.fatal); // true
			return cb (err);
		}

		this.connection = connection;

		cb (null, connection);
	}.bind (this));
}

MysqlDriver.prototype.fetchSingleQuery = function (query, cb) {
	this.connection.query (query, function (err, rows) {
		cb (err, rows);
	});
}

module.exports = MysqlDriver;
