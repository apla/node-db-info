-- taken with modifications from http://cpansearch.perl.org/src/TURNSTEP/DBD-Pg-3.5.3/Pg.pm

SELECT
	NULL::text AS "TABLE_CATALOG"
	, quote_ident(n.nspname) AS "TABLE_SCHEMA"
	, quote_ident(c.relname) AS "TABLE_NAME"
	, quote_ident(a.attname) AS "COLUMN_NAME"
	, a.atttypid AS "DATA_TYPE"
	, pg_catalog.format_type(a.atttypid, NULL) AS "TYPE_NAME"
	, a.attlen AS "COLUMN_SIZE"
	, NULL::text AS "BUFFER_LENGTH"
	, NULL::text AS "DECIMAL_DIGITS"
	, NULL::text AS "NUM_PREC_RADIX"
	, CASE a.attnotnull WHEN 't' THEN 0 ELSE 1 END AS "NULLABLE"
	, pg_catalog.col_description(a.attrelid, a.attnum) AS "REMARKS"
	, pg_catalog.pg_get_expr(af.adbin, af.adrelid) AS "COLUMN_DEF"
	, NULL::text AS "SQL_DATA_TYPE"
	, NULL::text AS "SQL_DATETIME_SUB"
	, NULL::text AS "CHAR_OCTET_LENGTH"
	, a.attnum AS "ORDINAL_POSITION"
	, CASE a.attnotnull WHEN 't' THEN 'NO' ELSE 'YES' END AS "IS_NULLABLE"
	, pg_catalog.format_type(a.atttypid, a.atttypmod) AS "pg_type"
	, '?' AS "pg_constraint"
	, n.nspname AS "pg_schema"
	, c.relname AS "pg_table"
	, a.attname AS "pg_column"
	, a.attrelid AS "pg_attrelid"
	, a.attnum AS "pg_attnum"
	, a.atttypmod AS "pg_atttypmod"
	, t.typtype AS "_pg_type_typtype"
	, t.oid AS "_pg_type_oid"
	, CASE
		WHEN a.attnum = ANY(i.indkey) AND i.indisprimary = 't' THEN 'PRIMARY'
		WHEN a.attnum = ANY(i.indkey) AND i.indisunique = 't' THEN 'UNIQUE'
		ELSE ''
	END AS "INDEX"
	, i.indkey
FROM
	pg_catalog.pg_type t
	JOIN pg_catalog.pg_attribute a ON (t.oid = a.atttypid)
	JOIN pg_catalog.pg_class c ON (a.attrelid = c.oid)
	JOIN pg_catalog.pg_index i ON (i.indrelid = c.oid)
	LEFT JOIN pg_catalog.pg_attrdef af ON (a.attnum = af.adnum AND a.attrelid = af.adrelid)
	JOIN pg_catalog.pg_namespace n ON (n.oid = c.relnamespace)
WHERE
	a.attnum >= 0
	AND c.relkind IN ('r','v','m')
	AND n.nspname = 'public'
ORDER BY "TABLE_SCHEMA", "TABLE_NAME", "ORDINAL_POSITION";
