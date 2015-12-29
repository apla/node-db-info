// http://stackoverflow.com/questions/25100174/node-js-orm-mysql-connect-via-ssh-tunnel

// TODO: replace by using pure ssh2
var Client = require('ssh2').Client;
var net    = require('net');
var fs     = require('fs');
var path   = require('path');

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

	this.dbConfig = {};

	// TODO: replace by Object.assign when it's available or es6-shim
	for (var k in dbConfig) {
		this.dbConfig[k] = dbConfig[k];
	}

	var privateKeyName = dbConfig.tunnel.privateKeyPath;
	if (privateKeyName) {
		fs.readFile (privateKeyName, this.readPrivateKey.bind (this, cb));
		return;
	}

	this.listenPort (cb);
}

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

	console.log ('init');

	var me = this;

	var addr = server.address();

	var config = this.dbConfig;
	config.localHost = addr.address;
	config.localPort = addr.port;

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
		localPort: config.localPort
	};

	'password privateKey passphrase'.split(' ').forEach (function (k) {
		if (config.tunnel[k]) {
			ssh2Config[k] = config.tunnel[k];
		}
	});

	var client = new Client();
	var clientConnecting = false;
	var clientReady = false;
	var connection;

	client.on('error', function (err) {
		server.emit('error', err)
	});

	client.on('ready', function () {

		clientConnecting = false;
		clientReady = true;

		client.forwardOut (
			config.srcHost,
			config.srcPort,
			config.dstHost,
			config.dstPort,
			function (err, sshStream) {
				if (err) {
					clientReady = false;
					server.close();
					server.emit('error', err);
					return;
				}
				sshStream.once('close', function () {
					clientReady = false;
					server.close();
				});

				// sshStream.on ('error', function () {
				// 	// TODO?
				// });

				connection.pipe(sshStream).pipe(connection);

			}.bind (this));
	}.bind (this));

	server.on ('connected', function (c) {
		connection = c;
		if (!clientConnecting && !clientReady)
			client.connect (config);
	});

	this.onTunnelCreated (callback);
}

DBTunnel.prototype.onTunnelCreated = function (callback) {
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

module.exports = DBTunnel;
