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

	var q = query.trim ();

	if (q.match (/[\r\n\t\s]*SELECT/im)) {

		var rows = [], error;

		var oStream = new ObjStream (rows);

		var qStream = this.connection.query (query)
			.stream ({highWaterMark: 10});

		qStream.on ('error', function (err) {
			error = err;
			console.log (err);
			cb (err);
		});

		qStream.on ('end', function (err) {
			if (!error) cb (err, rows);
		});

		qStream.pipe (oStream);

	} else {

		this.connection.query (query, function (err, rows) {
			cb (err, rows);
		});
	}
}

module.exports = MysqlDriver;

var stream = require('stream');

function ObjStream(rows) {

	this._rows = rows;
	stream.Writable.call(this, { highWaterMark: 10, objectMode: true });
	this._writableState.objectMode = true;
	// this._readableState.encoding = 'utf8';
}

util.inherits(ObjStream, stream.Writable);

ObjStream.prototype._write = function (chunk, encoding, next) {

	this._rows.push (chunk);

	next();
};
