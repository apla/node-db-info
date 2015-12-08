var util = require ('util');
var fs   = require ('fs');
var path = require ('path');

var Driver = require('../../driver');
var dbInfo = require('../../db_info');
var pg = require('pg');

var columnsSql = fs.readFileSync (path.join (__dirname, 'columns.sql')).toString ();
var indexesSql = fs.readFileSync (path.join (__dirname, 'indexes.sql')).toString ();
var fkeysSql   = fs.readFileSync (path.join (__dirname, 'fkeys.sql')).toString ();

var PostgreSqlDriver = function (connParams) {
	this.connParams = connParams;

	this.sql = {
		columns: columnsSql,
		indexes: indexesSql,
		fkeys:   fkeysSql
	};
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

PostgreSqlDriver.prototype.columnToDbInfo = function(column) {
	var typeMod = column.pg_atttypmod;
	var dataLength = column.DATA_LENGTH;

	if ((dataLength !== undefined) && (dataLength > 0)) {
	} else if (typeMod > 0xffff) {
		column.NUMERIC_PRECISION = (typeMod & 0xffff) - 4;
		typeMod >>= 16;
		column.NUMERIC_PRECISION_RADIX = typeMod;
	} else if (typeMod >= 4) {
		column.DATA_LENGTH = typeMod - 4;
	}

	return PostgreSqlDriver.super_.prototype.columnToDbInfo.call (this, column);
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

PostgreSqlDriver.prototype.fetchAll = function (query, bindings, options, cb) {
	this.connection.query (query, bindings, function (err, result) {
		cb (err, result ? result.rows : undefined);
	});

	return;

	// TODO: use node-pg-query-stream

	var query = client.query(stream)
	spec(query)
		.readable()
		.pausable({strict: true})
		.validateOnExit()
	stream.on('end', done);
}

PostgreSqlDriver.prototype.execute = function (query, bindings, options, cb) {
	this.connection.query (query, bindings, function (err, result) {
		cb (err, result ? result.rows : undefined);
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

module.exports = PostgreSqlDriver;


