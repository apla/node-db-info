// http://stackoverflow.com/questions/25100174/node-js-orm-mysql-connect-via-ssh-tunnel

var Client       = require ('ssh2').Client,
	net          = require ('net'),
	fs           = require ('fs'),
	path         = require ('path'),
	EventEmitter = require ('events').EventEmitter,
	util         = require ('util');

function listenPort (host, port, callback) {

	if (callback === undefined) {
		if (typeof port === 'function') {
			callback = port;
			port = host;
			host = undefined;
		} else if (port === undefined) {
			callback = host;
			port = 0; // get random port in userland
			host = undefined;
		}
	}

	(function createServer(_host, _port, _callback) {
		var server = net.createServer ();
		server.on ('error', function (e) {
			if (e.code == 'EADDRINUSE') {
				// TODO: if portNum !== 0, try to wait a little and reconnect
				createServer (_host, _port, _callback);
				return;
			}
		});
		server.listen (_port, _host, function () {
			_callback (server);
		});
	})(host, port || 0, callback);

}

/**
 * Create new tunnel
 * Usage:
 *

``` javascript
new DBConfig ({
	// database host and port
	host: dbConfig.host, // db server host
	port: dbConfig.port, // db server port
	// ... other database params like username, database and so on

	verbose: true, // dump information to stdout
	tunnel: { //ssh2 configuration (https://github.com/mscdex/ssh2)
		host: "your host", // required
		port: 22, // optional, 22 by default
		// local port to bind
		localHost: '127.0.0.1', // optional
		localPort: 0, // fixed port or 0 for a random
		username: "user", // ssh user
		privateKey: "host-key",
		//or password: ""vErys1critPass\/\/ord, // please do not use
		//or passphrase: 'verySecretString' // option see ssh2 config
	}
}, function (err, dbConf, tunnel) {

	// Don't forget to subscribe on tunnel events
	db.connect (dbConf);
});
```

 * @param   {object}   dbConfig database configuration with tunnel section
 * @param   {function} cb       callback to call when tunnel is created
 */
var DBTunnel = function (dbConfig, cb) {

	if (!dbConfig.tunnel) {
		return cb (null, dbConfig);
	}

	this.dbConfig = {tunnel: {}};

	// TODO: replace by Object.assign when it's available or es6-shim
	for (var k in dbConfig) {
		if (k !== 'tunnel') // we will change tunnel
			this.dbConfig[k] = dbConfig[k];
	}

	for (k in dbConfig.tunnel) {
		this.dbConfig.tunnel[k] = dbConfig.tunnel[k];
	}

	var privateKeyPath = dbConfig.tunnel.privateKeyPath;
	if (privateKeyPath) {
		fs.readFile (privateKeyPath, this.readPrivateKey.bind (this, cb));
		return;
	}

	this.listenPort (cb);
}

util.inherits (DBTunnel, EventEmitter);

DBTunnel.prototype.readPrivateKey = function (callback, err, fileContents) {
	if (err)
		return callback (err);

	this.dbConfig.tunnel.privateKey = fileContents;

	this.listenPort (callback);
}

DBTunnel.prototype.listenPort = function (cb) {
	listenPort (
		this.dbConfig.tunnel.localHost || 'localhost',
		this.dbConfig.tunnel.localPort,
		this.init.bind (this, cb)
	);
}

DBTunnel.prototype.init = function (callback, server) {

	var addr = server.address();

	this.server = server;

	server.on ('error', function (err) {
		err.scope = 'net';
		this.emit ('error', err);
	}.bind (this));

	var config = this.dbConfig;

	config.localHost = addr.address;
	config.localPort = addr.port;

	server.on ('connection', this.onLocalConnect.bind (this));

	var dbConfigTunnel = {};
	// TODO: replace by Object.assign when it's available
	for (var k in this.dbConfig) {
		if (k !== 'tunnel')
			dbConfigTunnel[k] = this.dbConfig[k];
	}

	dbConfigTunnel.host = this.dbConfig.localHost;
	dbConfigTunnel.port = this.dbConfig.localPort;

	callback (null, dbConfigTunnel, this.tunnel);
}

DBTunnel.prototype.onLocalConnect = function (connection) {

	var client = this.client = new Client();

	var ssh2Config = makeSSH2Config (this.dbConfig);

	client.on ('error', function (err) {
		connection.destroy ();

		err.scope = 'ssh2';
		this.emit ('error', err);
	}.bind (this));

	client.on ('ready', function () {
		client.forwardOut (
			ssh2Config.srcHost,
			ssh2Config.srcPort,
			ssh2Config.dstHost,
			ssh2Config.dstPort,
			this.onRemoteConnect.bind (this)
		);
	}.bind (this));

	// TODO: allow multiple connections
	this.connection = connection;

	client.connect (ssh2Config);
}

DBTunnel.prototype.onRemoteConnect = function (err, sshStream) {

	if (err) {
		err.scope = 'ssh2';
		this.emit ('error', err);
		return;
	}

	sshStream.once ('close', function () {
		this.emit ('close');
	});

	sshStream.on ('error', function (err) {
		err.scope = 'ssh2';
		this.emit ('error', err);
	}.bind (this));

	this.connection.pipe(sshStream).pipe(this.connection);
}

function makeSSH2Config (config) {
	var ssh2Config = {
		// tunelling host
		username: config.tunnel.user,
		port: config.tunnel.port || 22,
		host: config.tunnel.host,
		dstPort: config.port,
		dstHost: config.host,
		sshPort: 22,
		srcPort: 0,
		srcHost: config.localHost || 'localhost',
		localHost: config.localHost || 'localhost',
		localPort: config.localPort,
		// debug: console.log
	};

	'password privateKey passphrase'.split(' ').forEach (function (k) {
		if (config.tunnel[k]) {
			ssh2Config[k] = config.tunnel[k];
		}
	});

	return ssh2Config;
}

module.exports = DBTunnel;
