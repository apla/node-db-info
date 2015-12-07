var util = require ('util');
var fs   = require ('fs');
var path = require ('path');

var Driver = require('../../driver');
var dbInfo = require('../../db_info');
var mssql  = require('tedious');

var columnsSql = fs.readFileSync (path.join (__dirname, 'columns.sql')).toString ();
var indexesSql = fs.readFileSync (path.join (__dirname, 'indexes.sql')).toString ();
var fkeysSql   = fs.readFileSync (path.join (__dirname, 'fkeys.sql')).toString ();

var MSSqlDriver = function (connParams) {
	this.connParams = connParams;

	this.sql = {
		columns: columnsSql,
		indexes: indexesSql,
		fkeys:   fkeysSql
	};
}

util.inherits (MSSqlDriver, Driver);

MSSqlDriver.prototype.init = function() {
	this._super();
}

MSSqlDriver.prototype.parseColumnType = function(columnType) {
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

MSSqlDriver.prototype.columnToDbInfo = function(column) {
	var info = {
		name: column.Field || column.COLUMN_NAME,
		notNull: !(column.Null || column.IS_NULLABLE),
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

MSSqlDriver.prototype.connect = function (opts, cb) {

	if (typeof opts === "function" && cb === undefined) {
		cb = opts;
		opts = null;
	}

	var connection = new mssql.Connection (opts || this.connParams);

	connection.on ('connect', function(err) {
		if (err) {
			console.log(err);
			return cb (err);
		}

		this.connection = connection;

		cb (null, connection);
	}.bind (this));

	connection.on ('error', function (err) {
		console.error (err);
	});

	connection.on ('errorMessage', function (msg) {
		console.error (msg);
	});

}

MSSqlDriver.prototype.fetchSingleQuery = function (query, cb) {

	var colMeta, rows = [];

	query = query.replace (/[\r\n]\-\-[^\r\n]+/gm, "");

	var statement = new mssql.Request (query, function (err, rowCount) {
		cb (err, rows);
	});

	statement.on('columnMetadata', function (_colMeta) {
		colMeta = _colMeta;
	});

	statement.on ('row', function (cols) {
		if (cols.constructor === Array) {
			var row = {};
			cols.forEach (function (col) {row[col.metadata.colName] = col.value});
			rows.push (row);
		}
	});

	statement.on ('done', function (rowCount, more, rows) {
		// cb (null, rows);
	});


	this.connection.execSql (statement);
}


module.exports = MSSqlDriver;
