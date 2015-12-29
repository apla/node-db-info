var util = require ('util');
var fs   = require ('fs');
var path = require ('path');

var Driver = require('../../driver');
var dbInfo = require('../../db_info');

var ObjStream = require ('../../ObjStream');

var pg = require('pg');
var QueryStream = require('pg-query-stream')

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

PostgreSqlDriver.prototype.fetchAll = function (query, bindings, options, cb) {
//	this.connection.query (query, bindings, function (err, result) {
//		cb (err, result ? result.rows : undefined);
//	});
//
//	return;

	var qOpts = {};

	for (var o in options) {
		qOpts[o] = options[o];
	}

	if (qOpts.rowMode === 'array') {
		qOpts.rowMode = 'array';
	}

	if (qOpts.prefetchRows) {
		qOpts.batchSize = qOpts.prefetchRows;
		delete qOpts.prefetchRows;
	} else {
		qOpts.batchSize = 200;
	}

	var rows = [];
	var oStream = new ObjStream (rows);

	var query = new QueryStream (query, bindings, qOpts);
	var qStream = this.connection.query (query);

//	con.once('noData', ifNoData)
//	con.once('rowDescription', function () {

	qStream.on ('error', function (err) {
		cb (err);
	});

	qStream.on ('end', function (result) {
		cb (undefined, rows);
	});

	qStream.pipe (oStream);

}

PostgreSqlDriver.prototype.execute = function (query, bindings, options, cb) {

	var queryStart = Date.now();

	var stm = this.connection.query (query, bindings);

	stm.on ('error', function(err) {
		cb (err);
	});

	stm.on ('end', function (evt) {
		//fired once and only once, after the last row has been returned and after all 'row' events are emitted
		//in this example, the 'rows' array now contains an ordered set of all the rows which we received from postgres
		var result = {
			// command: The sql command that was executed (e.g. "SELECT", "UPDATE", etc.)
			// rowCount: The number of rows affected by the SQL statement (more information)
			// oid
			rowsAffected: evt.rowCount,
			time: Date.now() - queryStart
		};

		cb (undefined, result);
	})
}


PostgreSqlDriver.prototype._connect = function (opts, cb) {

	var connection;

	if (typeof opts === "function" && cb === undefined) {
		cb = opts;
		opts = null;
		connection = new pg.Client (this.connParams);
	} else {
		connection = new pg.Client (opts.connectionString || opts);
	}

	connection.connect(function(err) {
		cb (err, connection);
	}.bind (this));
}

PostgreSqlDriver.prototype.disconnect = function (cb) {

	if (!this.connection) return cb ();

	this.connection = undefined;

	this.connection.end ();

	cb ();
}

module.exports = PostgreSqlDriver;


