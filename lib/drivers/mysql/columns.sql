SELECT
	TABLE_CATALOG, TABLE_SCHEMA, TABLE_NAME,
	COLUMN_NAME, DATA_TYPE as TYPE_NAME,
	CASE
		WHEN NUMERIC_PRECISION IS NOT NULL THEN NUMERIC_PRECISION
		WHEN CHARACTER_MAXIMUM_LENGTH IS NOT NULL THEN CHARACTER_MAXIMUM_LENGTH
	END as DATA_LENGTH,
	CHARACTER_MAXIMUM_LENGTH as BUFFER_LENGTH,
	NUMERIC_PRECISION,
	CASE
		WHEN NUMERIC_SCALE IS NOT NULL THEN NUMERIC_SCALE
-- 		WHEN DATETIME_PRECISION IS NOT NULL THEN DATETIME_PRECISION -- MYSQL 5.6.4+
	END as NUMERIC_PRECISION_RADIX,
	IS_NULLABLE, COLUMN_COMMENT,
	COLUMN_DEFAULT,
	NULL as SQL_DATA_TYPE, NULL as SQL_DATETIME_SUB,
	CHARACTER_OCTET_LENGTH, ORDINAL_POSITION,
	DATETIME_PRECISION, CHARACTER_SET_NAME, COLLATION_NAME,
	COLUMN_TYPE, COLUMN_KEY, EXTRA, PRIVILEGES,
	IF(COLUMN_TYPE LIKE '%unsigned%', 'YES', 'NO') as IS_UNSIGNED
FROM `information_schema`.`COLUMNS`
WHERE
	`TABLE_SCHEMA` = DATABASE()
