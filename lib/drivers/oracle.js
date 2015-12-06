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

OracleDriver.prototype.columnToDbInfo = function(db, columnRow, callback) {
	var columnInfo = {
		name: columnRow['COLUMN_NAME'],
		type: this.typeToDbInfo(columnRow['DATA_TYPE'])
	};

	if(columnRow['character_maximum_length']) {
		columnInfo.length = columnRow['character_maximum_length'];
	}

	callback(null, columnInfo);
}

OracleDriver.prototype.tableToDbInfo = function(db, tableRow, callback) {
	var self = this;
	var tableInfo = {
		name: tableRow['TNAME'],
		columns: {},
		indexes: {}
	};
	var sql = util.format("SELECT column_name, data_type, data_length FROM all_tab_columns WHERE table_name = '%s'", tableInfo.name);
	db.query(sql).execute(function(err, results) {
		if(err) { callback(err); return; }
		async.mapSeries(results, self.columnToDbInfo.bind(self, db), function(err, columnResults) {
			if(err) { callback(err); return; }
			for(var i=0; i<columnResults.length; i++) {
				tableInfo.columns[columnResults[i].name] = columnResults[i];
			}
			callback(null, tableInfo);
		});
	});
}

OracleDriver.prototype.getInfoFromDb = function(db, callback) {
	var self = this;
	var sql = "SELECT * FROM tab";
	db.query(sql).execute(function(err, results) {
		if(err) { callback(err); return; }
		async.mapSeries(results, self.tableToDbInfo.bind(self, db), function(err, results) {
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


OracleDriver.prototype.connect = function (opts, cb) {

	if (typeof opts === "function" && cb === undefined) {
		cb = opts;
		opts = null;
	}

	var connParams = opts || this.connParams;

	oracledb.getConnection (connParams, function (err, connection){
		if (err) {
			console.log(err.code); // 'ECONNREFUSED'
			console.log(err.fatal); // true
			return cb (err);
		}

		this.connection = connection;

		cb (null, connection);

	}.bind (this));

}

OracleDriver.prototype.fetchSingleQuery = function (query, cb) {
	// TODO: use ResultSet
	this.connection.execute (query, [], function (err, result) {
		cb (err, result.rows);
	});
}

module.exports = OracleDriver;
