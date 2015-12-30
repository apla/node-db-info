var util = require ('util');
var fs   = require ('fs');
var path = require ('path');

var Driver = require('../../driver');
var dbInfo = require('../../db_info');
var oracledb = require('oracledb');

var columnsSql = fs.readFileSync (path.join (__dirname, 'columns.sql')).toString ();
var indexesSql = fs.readFileSync (path.join (__dirname, 'indexes.sql')).toString ();
var fkeysSql   = fs.readFileSync (path.join (__dirname, 'fkeys.sql')).toString ();

var OracleDriver = function (connParams) {
	this.connParams = connParams;

	this.sql = {
		columns: columnsSql,
		indexes: indexesSql,
		fkeys:   fkeysSql
	};
}

util.inherits (OracleDriver, Driver);

OracleDriver.prototype.init = function() {
	this._super();
}

OracleDriver.prototype.typeToDbInfo = function(typeStr) {
	switch(typeStr.toLowerCase()) {
		case 'text': return dbInfo.TEXT;
		case 'integer': return dbInfo.INTEGER;
		case 'number': return dbInfo.INTEGER;
		default: return dbInfo.UNKNOWN;
	}
}

OracleDriver.prototype._connect = function (opts, cb) {

	var connParams = opts || this.connParams;

	// useful for ssh tunnels
	if (!connParams.connectString) {
		connParams.connectString = connParams.host + (connParams.port ? ':' + connParams.port : '') + '/' + connParams.database;
	}

	oracledb.getConnection (connParams, function (err, connection){
		cb (err, connection);
	}.bind (this));

}

OracleDriver.prototype.disconnect = function (cb) {

	if (!this.connection) return cb ();

	this.connection = undefined;

	this.connection.release (function (err) {
		cb ();
	});
}

function closeRS (resultSet, cb) {
	resultSet.close (function(err) {
		cb (err);
	});
}

function fetchRowsFromRS (resultSet, numRows, rowStash, cb) {
	resultSet.getRows ( // get numRows rows
		numRows,
		function (err, rows) {
			if (err) {
				cb (err);
				closeRS (resultSet, cb.bind (this, err, [])); // always close the result set
			} else if (rows.length === 0) {    // no rows, or no more rows
				closeRS (resultSet, cb.bind (this, err, rowStash)); // always close the result set
			} else if (rows.length > 0) {
				// console.log("fetchRowsFromRS(): Got " + rows.length + " rows");
				// console.log(rows);

				rows.forEach (function (row) {rowStash.push (row)});

				fetchRowsFromRS(resultSet, numRows, rowStash, cb);
			}
		});
}

OracleDriver.prototype.fetchAll = function (query, bindings, options, cb) {

	if (!bindings) bindings = [];

	// TODO: sometimes cb is not called, uncomment long typed param in columns
	// console.log (q);

	// TODO: merge options

	var qOpts = {};

	for (var o in options) {
		qOpts[o] = options[o];
	}

	if (qOpts.rowMode === 'array') {
		qOpts.rowMode = oracledb.ARRAY;
	}

	if (!qOpts.prefetchRows) {
		qOpts.prefetchRows = 200; // the prefetch size can be set for each query
	}

	// https://github.com/oracle/node-oracledb/blob/master/doc/api.md#-4233-execute-options
	qOpts.resultSet = true; // return a result set.  Default is false
	qOpts.prefetchRows = qOpts.prefetchRows || 200;
	// qOpts.maxRows = 1000;
	// qOpts.outFormat = oracledb.OBJECT;

	this.connection.execute (query, bindings, qOpts, function (err, result) {

		// console.log (result.metaData);

		if (err) {
			// console.error (1111, query, err.message);
			// doRelease(connection);
			cb (err);
			return;
		}

		var rows = [];

		fetchRowsFromRS (result.resultSet, 200, rows, function (err) {

			var rowObjects = rows.map (function (row) {
				var rowObject = {};
				row.forEach (function (value, idx) {
					rowObject[result.metaData[idx].name] = value;
				});
				return rowObject;
			})

			// console.log (rowObjects);

			cb (err, rowObjects);
		});
	});
}

OracleDriver.prototype.execute = function (query, bindings, options, cb) {
	if (!bindings) bindings = [];
	this.connection.execute (query, bindings, function (err, result) {
		cb (err, result);
	});
}

module.exports = OracleDriver;
