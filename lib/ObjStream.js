var stream = require ('stream');
var util   = require ('util');

function ObjStream(rows) {

	this._rows = rows;
	stream.Writable.call(this, { highWaterMark: 200, objectMode: true });
	this._writableState.objectMode = true;
	// this._readableState.encoding = 'utf8';
}

util.inherits(ObjStream, stream.Writable);

ObjStream.prototype._write = function (chunk, encoding, next) {

	this._rows.push (chunk);

	next();
};

module.exports = ObjStream;
