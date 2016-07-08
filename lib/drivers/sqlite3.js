var util = require ('util');

var sqliteParser = require('./sqlite3_parser');
var Driver = require('../driver');
var dbInfo = require('../db_info');
var sqlite3 = require("sqlite3");

var SqliteDriver = function (connParams) {
	this.connParams = connParams;
}

util.inherits (SqliteDriver, Driver);

SqliteDriver.prototype.init = function() {
	this._super();
}

SqliteDriver.prototype.tableToDbInfo = function(tree) {
	var results = {
		name: tree.tableName,
		columns: {},
		indexes: {}
	};

	for(var i=0; i<tree.columns.length; i++) {
		var col = this.columnToDbInfo(tree.columns[i]);
		results.columns[col.name] = col;
	}

	return results;
}

SqliteDriver.prototype.columnToDbInfo = function(columnDef) {
	var results = {
		name: columnDef.name
	};

	if(columnDef.type == 'INTEGER') {
		results.type = dbInfo.INTEGER;
	} else if(columnDef.type == 'TEXT') {
		results.type = dbInfo.TEXT;
	} else if(columnDef.type == 'REAL') {
		results.type = dbInfo.REAL;
	} else {
		results.type = dbInfo.UNKNOWN;
	}

	for(var i=0; i<columnDef.columnConstraints.length; i++) {
		var columnConstraint = columnDef.columnConstraints[i];
		if(columnConstraint == "PRIMARY KEY") {
			results.primaryKey = true;
			results.notNull = true;
		} else if(columnConstraint == "NOT NULL") {
			results.notNull = true;
		} else if(columnConstraint == "AUTOINCREMENT") {
			results.autoIncrement = true;
		} else if(columnConstraint == "UNIQUE") {
			results.unique = true;
		} else if(columnConstraint.name && columnConstraint.name == "DEFAULT") {
			results.defaultValue = columnConstraint.value;
		} else if(columnConstraint.name && columnConstraint.name == "COLLATE") {
			results.collate = columnConstraint.value;
		}
	}

	return results;
}

SqliteDriver.prototype.indexToDbInfo = function(tree) {
	var result = {
		tableName: tree.tableName,
		name: tree.indexName,
		columns: tree.columns
	};
	return result;
}

sqlite3.verbose();

SqliteDriver.prototype._connect = function(opts, cb) {

	var connParams = opts || this.connParams;

	// console.trace (opts.filename || opts.database);

	var db = new sqlite3.Database(opts.filename || opts.database, function (err) {
		if (err) this.disconnect();

		cb (err, db)
	}.bind (this));
}

SqliteDriver.prototype.disconnect = function (cb) {

	if (!this.connection) return cb && cb ();

	this.connection.close ();

	this.connection = undefined;
}

SqliteDriver.prototype.fetchAll = function (query, bindings, options, cb) {

	var colMeta, rows = [];

	var statement = this.connection.all (query, bindings, function (err, rows) {
		// TODO: rowCount
		cb (err, rows);
	});

}

SqliteDriver.prototype.execute = function (query, bindings, options, cb) {

	var colMeta, rows = [];

	var statement = this.connection.run (query, bindings, function (err) {

		// TODO: If execution was successful, the this object will contain two
		// properties named `lastID` and `changes` which contain the value
		// of the last inserted row ID and the number of rows affected by this query respectively.
		// Note that lastID only contains valid information when the query was a successfully
		// completed INSERT statement and changes only contains valid information when the query
		// was a successfully completed UPDATE or DELETE statement. In all other cases,
		// the content of these properties is inaccurate and should not be used.
		// The .run() function is the only query method that sets these two values;
		// all other query methods such as .all() or .get() don't retrieve these values.

		// TODO: rowCount
		cb (err, {});
	});

}


SqliteDriver.prototype.getInfo = function(opts, callback) {
	var self = this;
	var db = opts.db;
	var createdDb = false;
	  if(!db) {
		  db = new sqlite3.Database(opts.filename);
		  createdDb = true;
	  }

	  db.all("SELECT * FROM sqlite_master", function(err, rows) {
			if(err) { callback(err); return; }

			var results = {
				tables: {}
			};

			// clean up sql
			for(var i=0; i<rows.length; i++) {
				if(rows[i]['sql'] && !rows[i]['sql'].match(/;$/)) {
					rows[i]['sql'] += ';';
				}
			}


			for(var i=0; i<rows.length; i++) {

				// process tables
				if(rows[i]['type'] == 'table') {
					if(rows[i]['sql'].match(/sqlite_sequence/)) {
						continue;
					}

					var tree = self.parseSql(rows[i]['sql']);
					results.tables[tree.tableName] = self.tableToDbInfo(tree);
				}

				// process indexes
				if(rows[i]['type'] == 'index' && rows[i]['sql']) {
					var tree = self.parseSql(rows[i]['sql']);
					var idx = self.indexToDbInfo(tree);
					results.tables[idx.tableName].indexes[idx.name] = idx;
				}
			}

			if(createdDb) {
				db.close();
			}

			callback(null, results);
	  });
}

SqliteDriver.prototype.parseSql = function(sql) {
	var errorOffsets = new Array();
	var errorLookaheads = new Array();
	var errorCount = sqliteParser.parse(sql, errorOffsets, errorLookaheads);

	if(errorCount > 0)
	{
		var errstr = "";
		for(var i = 0; i < errorCount; i++) {
			errstr += 'Parse error near "' + sql.substr(errorOffsets[i]) + '", expecting "' + errorLookaheads[i].join() + '"\n' + sql;
		}
		throw new Error(errstr);
	} else {
		return parserResult;
	}
}

module.exports = SqliteDriver;
