# db-info

db-info is a utility module which provides a database independent way of
getting database metadata.

[![Build status](https://ci.appveyor.com/api/projects/status/122vpkwp96g0a49v?svg=true)](https://ci.appveyor.com/project/apla/node-db-info)
[![Travis](https://travis-ci.org/apla/node-db-info.svg)](https://travis-ci.org/apla/node-db-info)

The following databases are currently supported:

 * Sqlite3 - via: [node-sqlite3](https://github.com/developmentseed/node-sqlite3)
 * Mysql - via: [node-mysql](https://github.com/felixge/node-mysql)
 * PostgreSQL - via: [node-postgres](https://github.com/brianc/node-postgres)
 * Oracle - via: [node-oracledb](https://github.com/oracle/node-oracledb)
 * MSSQL Server - via: [node-tedious](https://github.com/pekim/tedious)

## Quick Examples

    var dbinfo = require("db-info");

    dbinfo.getInfo({
      driver: 'mysql',
      user: 'root',
      password: 'root',
      database: 'test'
    }, function(err, result) {
      /* result = {
        tables: {
          person: {
            name: 'person',
            columns: {
              'id': { name: 'id', notNull: true, primaryKey: true, type: 'integer', length: '11' },
              'name': { name: 'name', notNull: true, type: 'varchar', length: '255' },
              'email': { name: 'email', notNull: false, type: 'varchar', length: '100' },
              'age': { name: 'age', notNull: false, type: 'integer', length: '11' }
            }
          }
        }
      } */
    });

## Download

You can install using Node Package Manager (npm):

    npm install db-info

## Supported features

|**database**|**columns+keys**|**foreign keys**|
|------------|-------------|----------------|
|Oracle|✓|✓|
|MSSQL|✓|✓|
|Postgres|✓|✓|
|MySQL|✓|✓|
|SQLite|✓|-|

## Documentation

### Command Line

    db-info --driver=pg --connectionString=tcp://test:test@localhost/test

### getInfo(opts, callback)

Gets the metadata from a database.

__Arguments__

 * opts - A hash of options.
  * driver - can be either "mysql", "sqlite3", "db-oracle", or "pg" (PostgreSQL)
  * _db_ - if db is passed in this connection will be used instead of making a new connection.
  * _other_ - will be passed to the drivers connect.
 * callback(err, result) - Callback called once complete. result will contain a hash containing all the tables
   along with column information.

__Example__

    var db = new sqlite3.Database(':memory:');

    dbinfo.getInfo({
      driver: 'sqlite3',
      db: db
    }, function(err, result) {
    });
