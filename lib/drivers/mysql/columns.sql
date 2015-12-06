SELECT
	TABLE_CATALOG, TABLE_SCHEMA, TABLE_NAME,
	COLUMN_NAME, "", DATA_TYPE as TYPE_NAME,
	NULL as COLUMN_SIZE, CHARACTER_MAXIMUM_LENGTH as BUFFER_LENGTH,
	(NUMERIC_PRECISION - NUMERIC_SCALE) as DECIMAL_DIGITS, NUMERIC_SCALE,
	IS_NULLABLE, COLUMN_COMMENT,
	COLUMN_DEFAULT,
	NULL as SQL_DATA_TYPE, NULL as SQL_DATETIME_SUB,
	IS_NULLABLE,
	CHARACTER_OCTET_LENGTH, ORDINAL_POSITION,
	DATETIME_PRECISION, CHARACTER_SET_NAME, COLLATION_NAME,
	COLUMN_TYPE, COLUMN_KEY, EXTRA, PRIVILEGES
FROM `information_schema`.`COLUMNS` WHERE (`TABLE_SCHEMA` = DATABASE());