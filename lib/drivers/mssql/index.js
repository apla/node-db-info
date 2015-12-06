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

MSSqlDriver.prototype.updateTableDbInfoWithIndex = function(tableInfo, indexRow) {

	var keyName = indexRow.Key_name || indexRow.INDEX_NAME;

	var	columnName = indexRow.Column_name || indexRow.COLUMN_NAME;

	if (indexRow.INDEX_TYPE) {
		if (indexRow.INDEX_TYPE === 'PRIMARY') {
			tableInfo.columns[columnName].primaryKey = true;
		} else if (indexRow.INDEX_TYPE === 'UNIQUE') {
			tableInfo.columns[columnName].unique = true;
		}
	}

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

MSSqlDriver.prototype.getTableDesc = function (tableName) {
	if (!this.schema.tables[tableName]) {
		this.schema.tables[tableName] = {
			name: tableName,
			columns: {},
			indexes: {}
		}
	}

	return this.schema.tables[tableName];
}

MSSqlDriver.prototype.parseColumnInfoRow = function (columnInfo) {
	var tableName = columnInfo.TABLE_NAME;

	var tableDesc = this.getTableDesc (tableName);

	tableDesc.columns[columnInfo.COLUMN_NAME] = this.columnToDbInfo (columnInfo);
}

MSSqlDriver.prototype.parseIndexInfoRow = function (indexInfo) {
	var tableName = indexInfo.TABLE_NAME;

	var tableDesc = this.getTableDesc (tableName);

	this.updateTableDbInfoWithIndex (tableDesc, indexInfo);
}


MSSqlDriver.prototype.fetchInfo = function (cb) {

	this.schema = {
		tables: {}
	};

	//this.do ([columnsSql, indexesSql, fkeysSql], function (err, results) {
	this.do ([columnsSql, indexesSql], function (err, results) {
		if (err) return cb (err);

		var columnInfoRows = results[0];

		// console.log (columnInfoRows);

		columnInfoRows.forEach (this.parseColumnInfoRow.bind (this));

		var indexesInfoRows = results[1];

		indexesInfoRows.forEach (this.parseIndexInfoRow.bind (this));

		// console.log (indexesInfoRows);

		cb (null, this.schema);

		// console.log ('>>>', this.schema.tables);
	}.bind (this));
}

MSSqlDriver.prototype.getInfo = function(opts, callback) {
	var self = this;
	var db = opts.db;

	if (!this.connection) {
		return this.connect (opts || this.connParams, function (err) {
			if (err) return callback (err);
			this.fetchInfo (callback);
		}.bind (this));
	}

	this.fetchInfo (callback);

}


module.exports = MSSqlDriver;
