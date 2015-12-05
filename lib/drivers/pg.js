var util = require ('util');

var Driver = require('../driver');
var dbInfo = require('../db_info');
var pg = require('pg');
var async = require('async');

var PostgreSqlDriver = function (connParams) {
	this.connParams = connParams;
}

util.inherits (PostgreSqlDriver, Driver);


PostgreSqlDriver.prototype.init = function() {
	this._super();
}

PostgreSqlDriver.prototype.typeToDbInfo = function(typeStr) {
	switch(typeStr.toLowerCase()) {
		case 'text': return dbInfo.TEXT;
		case 'integer': return dbInfo.INTEGER;
		default: return dbInfo.UNKNOWN;
	}
}

PostgreSqlDriver.prototype.columnToDbInfo = function(db, columnRow, callback) {
	var columnInfo = {
		name: columnRow['column_name'],
		type: this.typeToDbInfo(columnRow.data_type)
	};

	if(columnRow['character_maximum_length']) {
		columnInfo.length = columnRow['character_maximum_length'];
	}

	callback(null, columnInfo);
}

PostgreSqlDriver.prototype.tableToDbInfo = function(db, tableRow, callback) {
	var self = this;
	var tableInfo = {
		name: tableRow['table_name'],
		columns: {},
		indexes: {}
	};
	var sql = util.format("SELECT * FROM information_schema.columns WHERE table_name = '%s'", tableRow['table_name']);
	db.query(sql, function(err, results) {
		if(err) { callback(err); return; }
		async.mapSeries(results.rows, self.columnToDbInfo.bind(self, db), function(err, columnResults) {
			if(err) { callback(err); return; }
			for(var i=0; i<columnResults.length; i++) {
				tableInfo.columns[columnResults[i].name] = columnResults[i];
			}
			callback(null, tableInfo);
		});
	});
}

PostgreSqlDriver.prototype.getInfoFromDb = function(db, callback) {
	var self = this;
	var sql = "SELECT * FROM information_schema.tables WHERE table_type = 'BASE TABLE' AND table_schema NOT IN ('pg_catalog', 'information_schema');";
	db.query(sql, function(err, results) {
		if(err) { callback(err); return; }
		async.mapSeries(results.rows, self.tableToDbInfo.bind(self, db), function(err, results) {
			if(err) { callback(err); return; }
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

PostgreSqlDriver.prototype.fetchSingleQuery = function (query, cb) {
	this.connection.query (query, function (err, rows) {
		cb (err, rows);
	});
}

PostgreSqlDriver.prototype.connect = function (opts, cb) {

	var connection;

	if (typeof opts === "function" && cb === undefined) {
		cb = opts;
		opts = null;
		connection = new pg.Client (this.connParams);
	} else {
		connection = new pg.Client (opts.connectionString || opts);
	}

	connection.connect(function(err) {
		if (err) {
			// console.log(err.code); // 'ECONNREFUSED'
			// console.log(err.fatal); // true
			return cb (err);
		}

		this.connection = connection;

		cb (err, connection);
	}.bind (this));
}

PostgreSqlDriver.prototype.getInfo = function(opts, callback) {
	var self = this;
	var db = opts.db;
	if(!db) {
		db = new pg.Client(opts.connectionString || opts);
		db.connect(function(err) {
			if(err) { callback(err); return; }
			self.getInfoFromDb(db, function(err, dbInfo) {
				db.end();
				callback(err, dbInfo);
			});
		});
	} else {
		self.getInfoFromDb(db, callback);
	}
}

module.exports = PostgreSqlDriver;
