## Querying

|feature|oracle|pg|mysql|mssql|sqlite|any-db|db-connect|
|-----|||
|`rowMode=array`|query|query|no|*connection*|no|no|yes|
|`prefetchRows=100`|query|query|no|no|no|no|no|
|named/positional binding|named|positional|both|named|both|varies|varies|
|maxRows|yes|no|no|no|no|no|yes|
|multiple statemens|no|no|yes|yes|yes|no|array|
|column metadata evt|names|*|*|+|-|-|+|
|affected rows|+|+|+|+|+|+|+|
|last insert id|-|-|+|-|+|-|+|

>rename prefetchRows to rows streaming: no streaming (callback with rows), streams, events, recordSet

||||||||

### rowMode

allows to fetch every row as array of column values or object.

default: 'object', available values: 'object', 'array'

any-db support: no

 * oracle: yes
 * pg: yes
 * mysql note: https://github.com/felixge/node-mysql/blob/1e40f08c0c643ceb1e475c61460c1e1fbcf7745b/lib/protocol/packets/RowDataPacket.js#L42
 * mssql: yes, by default return array, WIP: check config.options.useColumnNames, but don't allow to set format per query: https://github.com/pekim/tedious/blob/e3f0a59f213e97bf284b32922aea0969af537a52/src/connection.js#L646
 * sqlite: not supported, function RowToJS explicitly format results as object https://github.com/mapbox/node-sqlite3/blob/master/src/statement.cc#L749

### prefetchRows: allows to prefetch some rows as well as set highWatermark on stream

> rows streaming: no streaming (callback with rows), streams, events, recordSet

any-db support: no

 * oracle: yes, using resultSet
 * pg: yes, using cursor
 * mysql: yes/no, need to add pause after row fetch?
 * mssql: events, unstoppable
 * sqlite: developer side

### Named/positional parameters

any-db support: varies, used driver, cannot pass same values to mssql and postgres

 * oracle: ":param" named/positional
 * mssql: "@param" named only
 * mysql: named/positional
 * postgres: positional
 * sqlite: yes and unknown https://github.com/mapbox/node-sqlite3/issues/3163

requirement: query tokenizer, entity/string escaping

### maxRows: only supported in oracle

any-db support: no

### Multiple statements per query

 * mssql: yes, `execSqlBatch`
 * mysql: yes
 * postgres: no
 * sqlite: yes, until null byte, remove comments
 * oracle: no

## Query response

### response metadata event: column info from request and data type as well

any-db support: no

 * mysql: event `fields` on query with numeric datatypes
 * pg: undocumented event `rowDescription` from db connection returns object with dataTypeID and some other attributes. maybe make use of https://github.com/brianc/node-pg-types
 * oracle: [metaData property of result set](https://github.com/oracle/node-oracledb/blob/master/doc/api.md#-71-resultset-properties)
is limited to names. Oracle driver can report at types too, but this is not implemented.
You can check out `Connection::Async_Execute`, `Connection::DoDefines`  methods along with
`ResultSet::Async_GetRows` where all things already available: column names and column types.
 * mssql: 'columnMetadata' event from query: http://pekim.github.io/tedious/api-request.html
 * sqlite: not supported

### affectedRows

any-db support: no

 * mssql: `rowCount`, will it work for select limit?
 * oracle: yes https://github.com/oracle/node-oracledb/blob/master/doc/api.md#result-object-properties
 * mysql: +changedRows https://github.com/felixge/node-mysql#getting-the-number-of-affected-rows
 * pg: yes
 * sqlite: yes https://github.com/mapbox/node-sqlite3/wiki/API#databaserunsql-param--callback

### lastInsertId

 * mssql: developer side with query modification and using `returnValue`
 * mysql: yes: https://github.com/felixge/node-mysql#getting-the-id-of-an-inserted-row
 * sqlite: yes: https://github.com/mapbox/node-sqlite3/wiki/API#databaserunsql-param--callback
 * pg: on a developer side — with returning
 * oracle: on a developer side — with returning

### stream backpressure

 * mysql: yes/no: https://github.com/felixge/node-mysql#piping-results-with-streams2
 * sqlite: no support — https://github.com/mapbox/node-sqlite3/issues/375

### Notifications

 * pg: yes

### Prepare

### Blob/Clob

 * mssql: yes, without streaming https://github.com/pekim/tedious/issues/316
 * sqlite: no — https://github.com/mapbox/node-sqlite3/issues/424

### Queued execution

* sqlite: supported, notes: https://github.com/mapbox/node-sqlite3/issues/304


### Transactions

 * sqlite: supported, notes: https://github.com/mapbox/node-sqlite3/issues/304


### Bulk inserts

 * mssql: yes, `execBulkLoad`
 * sqlite: no — https://github.com/mapbox/node-sqlite3/issues/2

### Cancel query

 * sqlite: https://github.com/mapbox/node-sqlite3/pull/518


------------------------

database notes:
===

mssql:
-----

config.options.rowCollectionOnDone - turn off when you're accumulate rows in user code



sqlite:
------

supporting data modification events: https://github.com/mapbox/node-sqlite3/issues/419

----------------------------

SELECT generate_series(1,10) AS id, md5(random()::text) AS descr;
