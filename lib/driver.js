var dbInfo = require('./db_info');

var Driver = function () {

}

Driver.prototype.init = function() {
}

Driver.prototype.fetchSingleQuery = function () {
	throw "Not implemented in driver!";
}

/**
 * do sequence of queries until last one or error
 * @param {Array|String} queryList list of queries
 * @param {object}       opts      options (not used for now)
 * @param {function}     cb        callback when it's done
 */
Driver.prototype.do = function (queryList, opts, cb) {

	var self = this;

	if (typeof opts === "function" && cb === undefined) {
		cb = opts;
		opts = {};
	}

	var queryQueue = queryList.constructor !== Array ? [queryList] : queryList.map (function (query) {return query})

	var results = [], err;

	function queue () {
		var query = queryQueue.shift ();

		try {
		self.fetchSingleQuery (query, function (err, rows) {

			results.push (rows);

			if (!err && queryQueue.length) {
				queue ();
				return;
			}

			cb (err, results);
		});
		} catch (e) {
			cb (e);
		}
	}

	queue ();
}

/**
 * parses column type
 * @param   {string}   columnType    string like VARCHAR2(25)
 * @param   {string}   typeName      only type name, like VARCHAR2
 * @param   {string}   dataMaxLength maximum column data length, in bytes or chars for strings, decimal digits for decimal and number and bits in case of int/float
 * @param   {string}   dataPrecision [[Description]]
 * @returns {[[Type]]} [[Description]]
 */
Driver.prototype.parseColumnType = function (columnType, typeName, dataMaxLength, dataPrecision, dataScale) {
	var colType = {
		type: typeName,
		length: dataMaxLength,
		precision: dataPrecision,
		radix: dataScale
	};

	if (!colType.type) {
		var match = columnType.match(/([a-zA-Z0-9]+)\(([0-9]+)\)/);
		if(match) {
			colType.type = match[1];
			colType.length = match[2];
		}
	}

	if (colType.type === 'int') {
		colType.type = dbInfo.INTEGER;
	} else if (colType.type === 'character varying') {
		colType.type = dbInfo.VARCHAR;
	}

	return colType;
}

Driver.prototype.columnToDbInfo = function(column) {
	var info = {
		name: column.Field || column.COLUMN_NAME,
		notNull: (column.Null || column.IS_NULLABLE) === 'NO' ? true : false,
		type: column.TYPE_NAME,
		length:  column.DATA_LENGTH,
		precision: column.NUMERIC_PRECISION,
		radix: column.NUMERIC_PRECISION_RADIX
	};

	if (column.Key || column.COLUMN_KEY) {
		var colKey = column.Key || column.COLUMN_KEY;
		if (colKey === 'PRI' || colKey === 'PRIMARY') {
			info.primaryKey = true;
		} else if (colKey === 'UNI' || colKey === 'UNIQUE') {
			info.unique = true;
		}
	}

	var columnType = column.Type || column.COLUMN_TYPE;

	if (!info.type) {
		var match = columnType.match(/([a-zA-Z0-9]+)\(([0-9]+)\)/);
		if(match) {
			info.type = match[1];
			info.length = match[2];
		}
	}

	if (info.type === 'int') {
		info.type = dbInfo.INTEGER;
	} else if (info.type === 'character varying') {
		// postgres
		info.type = dbInfo.VARCHAR;
	} else if (info.type === 'numeric') {
		// postgres
		info.type = dbInfo.DECIMAL;
	}

	return info;
}

Driver.prototype.getTableDesc = function (tableName) {
	if (!this.schema.tables[tableName]) {
		this.schema.tables[tableName] = {
			name: tableName,
			columns: {},
			indexes: {}
		}
	}

	return this.schema.tables[tableName];
}

Driver.prototype.parseColumnInfoRow = function (columnInfo) {
	var tableName = columnInfo.TABLE_NAME;

	var tableDesc = this.getTableDesc (tableName);

	tableDesc.columns[columnInfo.COLUMN_NAME] = this.columnToDbInfo (columnInfo);
}

Driver.prototype.parseIndexInfoRow = function (indexInfo) {
	var tableName = indexInfo.TABLE_NAME;

	var tableDesc = this.getTableDesc (tableName);

	this.updateTableDbInfoWithIndex (tableDesc, indexInfo);
}


Driver.prototype.fetchInfo = function (cb) {

	this.schema = {
		tables: {}
	};

	this.do ([this.sql.columns, this.sql.indexes, this.sql.fkeys], function (err, results) {
		if (err) return cb (err);

		var columnInfoRows = results[0];

		//var fs = require ('fs');
		//fs.writeFileSync ('oraschema.json', JSON.stringify (columnInfoRows, null, "\t"));
		// console.log (columnInfoRows.filter (function (row) {if (row.TABLE_NAME === 'PERSON') return true}));

		columnInfoRows.forEach (this.parseColumnInfoRow.bind (this));

		var indexesInfoRows = results[1];

		indexesInfoRows.forEach (this.parseIndexInfoRow.bind (this));

		cb (null, this.schema);

		// console.log ('>>>', this.schema.tables);
	}.bind (this));
}

Driver.prototype.getInfo = function(opts, callback) {
	var self = this;
	var db = opts.db;

	// TODO:
//	var db = opts.db;
//	if(!db) {
//		db.connect(function(err) {
//				db.disconnect(); // !!!!!!!!!!!!!!!!!!!!!!!!!
//		});
//	}

	if (!this.connection) {
		return this.connect (opts || this.connParams, function (err) {
			if (err) return callback (err);
			this.fetchInfo (callback);
		}.bind (this));
	}

	this.fetchInfo (callback);
}

module.exports = Driver;
