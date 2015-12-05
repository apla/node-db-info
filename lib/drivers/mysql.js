var util = require ('util');
var fs   = require ('fs');
var path = require ('path');

var Driver = require('../driver');
var dbInfo = require('../db_info');
var mysql = require('mysql');
var async = require('async');

var columnsSql = fs.readFileSync (path.join (__dirname, 'mysql/columns.sql')).toString ();
var indexesSql = fs.readFileSync (path.join (__dirname, 'mysql/indexes.sql')).toString ();
var fkeysSql   = fs.readFileSync (path.join (__dirname, 'mysql/fkeys.sql')).toString ();

var MysqlDriver = function (connParams) {
	this.connParams = connParams;
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

MysqlDriver.prototype.getTableDesc = function (tableName) {
	if (!this.schema.tables[tableName]) {
		this.schema.tables[tableName] = {
			name: tableName,
			columns: {},
			indexes: {}
		}
	}

	return this.schema.tables[tableName];
}

MysqlDriver.prototype.parseColumnInfoRow = function (columnInfo) {
	var tableName = columnInfo.TABLE_NAME;

	var tableDesc = this.getTableDesc (tableName);

	tableDesc.columns[columnInfo.COLUMN_NAME] = this.columnToDbInfo (columnInfo);
}

MysqlDriver.prototype.parseIndexInfoRow = function (indexInfo) {
	var tableName = indexInfo.TABLE_NAME;

	var tableDesc = this.getTableDesc (tableName);

	this.updateTableDbInfoWithIndex (tableDesc, indexInfo);
}


MysqlDriver.prototype.fetchInfo = function (cb) {

	this.schema = {
		tables: {}
	};

	this.do ([columnsSql, indexesSql, fkeysSql], function (err, results) {
		if (err) return cb (err);

		var columnInfoRows = results[0];

		columnInfoRows.forEach (this.parseColumnInfoRow.bind (this));

		var indexesInfoRows = results[1];

		indexesInfoRows.forEach (this.parseIndexInfoRow.bind (this));


		cb (null, this.schema);

		// console.log ('>>>', this.schema.tables);
	}.bind (this));
}

MysqlDriver.prototype.getInfo = function(opts, callback) {
	var self = this;
	var db = opts.db;

	if (!this.connection) {
		return this.connect (opts || this.connParams, function (err) {
			if (err) return callback (err);
			this.fetchInfo (callback);
		}.bind (this));
	}

	this.fetchInfo (callback);

	return;

	db.query("show tables;", function(err, rows) {
		if(err) { callback(err); return; }

		async.mapSeries(rows, function(row, callback) {
			var tableName;
			for(var col in row) {
				tableName = row[col];
				break;
			}

			db.query("desc " + tableName + ";", function(err, rows) {
				if(err) { callback(err); return; }
				self.tableToDbInfo(db, tableName, rows, callback);
			});
		}, function(err, results) {
			if(err) { callback(err); return; }
			if(createdDb) {
				db.end();
			}
			var info = {
				tables: {}
			};
			for(var i=0; i<results.length; i++) {
				info.tables[results[i].name] = results[i];
			}
			callback(null, info);
		});
	});
}


module.exports = MysqlDriver;
