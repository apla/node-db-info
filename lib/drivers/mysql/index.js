var util = require ('util');
var fs   = require ('fs');
var path = require ('path');

var Driver = require('../../driver');
var dbInfo = require('../../db_info');

var ObjStream = require ('../../ObjStream');

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

MysqlDriver.prototype._connect = function (opts, cb) {

	var connection = mysql.createConnection (opts || this.connParams);

	connection.connect(function(err) {
		cb (err, connection);
	}.bind (this));
}

MysqlDriver.prototype.disconnect = function (cb) {

	if (!this.connection) return cb ();

	this.connection.destroy ();

	this.connection = undefined;

	cb ();
}

MysqlDriver.prototype.fetchAll = function (query, bindings, options, cb) {
	var rows = [], error;

	var oStream = new ObjStream (rows);

	var qStream = this.connection.query (query, bindings).stream ({highWaterMark: 200});

	qStream.on ('error', function (err) {
		error = err;
		// console.log (err);
		cb (err);
	});

	qStream.on ('end', function (err) {
		if (!error) cb (err, rows);
	});

	qStream.pipe (oStream);

}

MysqlDriver.prototype.execute = function (query, bindings, options, cb) {

	/*
	fieldCount: 0,
	affectedRows: 0,
	insertId: 0,
	serverStatus: 2,
	warningCount: 0,
	message: '',
	protocol41: true,
	changedRows: 0
	*/

	this.connection.query (query, function (err, result) {
		cb (err, result);
	});
}

module.exports = MysqlDriver;

