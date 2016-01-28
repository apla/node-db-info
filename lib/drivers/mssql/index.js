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


MSSqlDriver.prototype._connect = function (opts, cb) {

	var connParams = opts || this.connParams;

	var tediousConfig = {
		server:   connParams.host,
		domain:   connParams.domain,
		userName: connParams.user,
		password: connParams.password,
		options: {}
	};

	if (connParams.options) {
		for (var o in connParams.options) {
			tediousConfig.options[o] = connParams.options[o];
		}
	}

	if (connParams.port)
		tediousConfig.options.port = connParams.port;
	if (connParams.database)
		tediousConfig.options.database = connParams.database;

	var connection = new mssql.Connection (tediousConfig);

	connection.on ('connect', function(err) {
		cb (err, connection);
	}.bind (this));

	connection.on ('error', function (err) {
		console.error (err);
		this.disconnect ();
	}.bind (this));

	connection.on ('errorMessage', function (msg) {
		console.error (msg);
	});

}

MSSqlDriver.prototype.disconnect = function (cb) {

	if (!this.connection) return cb && cb ();

	this.connection.removeAllListeners ('end');

	this.connection.on ('end', function () {
		cb && cb ();
	});

	this.connection.close ();

	this.connection = undefined;
}

// column metadata:
//var metadata = {
//	userType: 0,
//	flags: 8,
//	type: {
//		type: 'BIGVARCHR',
//		name: 'VarChar', // UniqueIdentifierN - we probably can use it for row id
//		hasCollation: true,
//		dataLengthLength: 2,
//		maximumLength: 8000,
//		declaration: [Function: declaration],
//		resolveLength: [Function: resolveLength],
//		writeTypeInfo: [Function: writeTypeInfo],
//		writeParameterData: [Function: writeParameterData],
//		validate: [Function: validate],
//		id: 167
//	},
//	colName: 'PCT_number',
//	collation: {
//		lcid: 1033,
//		codepage: 'CP1252',
//		flags: 208,
//		version: 0,
//		sortId: 106
//	},
//	precision: undefined,
//	scale: undefined,
//	udtInfo: undefined,
//	dataLength: 32,
//	tableName: undefined
//}

MSSqlDriver.prototype.fetchAll = function (query, bindings, options, cb) {

	var colMeta, rows = [];

	// Bad practice. In case of error we have wrong line and char position
	// TODO: remove
	query = query.replace (/[\r\n]\-\-[^\r\n]+/gm, "");

	var statement = new mssql.Request (query, function (err, rowCount) {
		// TODO: rowCount
		cb (err, rows);
	});

	if (bindings) {
		for (var binding in bindings) {
			statement.addParameter (binding, bindings[binding].type, bindings[binding].value, bindings[binding].options);
		}
	}

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


MSSqlDriver.prototype.execute = function (query, bindings, options, cb) {

	var colMeta, rows = [];

	query = query.replace (/[\r\n]\-\-[^\r\n]+/gm, "");

	var statement = new mssql.Request (query, function (err, rowCount) {
		cb (err, rows);
	});

	if (bindings) {
		for (var binding in bindings) {
			statement.addParameter (binding, bindings[binding].type, bindings[binding].value, bindings[binding].options);
		}
	}

	statement.on ('done', function (rowCount, more, rows) {
		// cb (null, rows);
	});

	this.connection.execSql (statement);
}


module.exports = MSSqlDriver;
