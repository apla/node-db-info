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

OracleDriver.prototype.old_columnToDbInfo = function (columnRow, callback) {
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

	this.connection.execute (query, bindings, {
		resultSet: true, // return a result set.  Default is false
		prefetchRows: 100 // the prefetch size can be set for each query
	}, function (err, result) {

		if (err) {
			// console.error (1111, query, err.message);
			// doRelease(connection);
			cb (err);
			return;
		}

		var rows = [];

		fetchRowsFromRS (result.resultSet, 50, rows, function (err) {

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
		cb (err);
	});
}

module.exports = OracleDriver;
