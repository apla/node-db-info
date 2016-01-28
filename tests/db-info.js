
var DBInfo = require("../lib/db_info");

var assert = require ("assert");

var config = require ("./config");

describe ("DBInfo", function () {

	it ("without driver name", function (done) {
		try {
			var dbInfo = new DBInfo ({});
		} catch (e) {
			return done();
		}
		assert (true);
	});

	it ("without driver name (static)", function (done) {
		try {
			var dbInfo = DBInfo.getInfo ({});
		} catch (e) {
			return done();
		}
		assert (true);
	});

	it ("with bad driver name", function (done) {
		try {
			var dbInfo = new DBInfo ({driver: 'xxx'});
		} catch (e) {
			return done();
		}
		assert (true);
	});

	it ("with bad driver name (static)", function (done) {
		try {
			var dbInfo = DBInfo.getInfo ({driver: 'xxx'});
		} catch (e) {
			return done();
		}
		assert (true);
	});


});
