
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

		self.fetchSingleQuery (query, function (err, rows) {

			results.push (rows);

			if (!err && queryQueue.length) {
				queue ();
				return;
			}

			cb (err, results);
		});
	}

	queue ();
}

Driver.prototype.getInfo = function(opts, callback) {
		if (!this.connection) {
			this.connect (opts, this.fetchColumnInfo.bind (this, callback));
			return;
		}

		this.fetchColumnInfo (callback);
	}


module.exports = Driver;
