
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

	if (!this.connection) {
		return this.connect (opts || this.connParams, function (err) {
			if (err) return callback (err);
			this.fetchInfo (callback);
		}.bind (this));
	}

	this.fetchInfo (callback);
}

module.exports = Driver;
