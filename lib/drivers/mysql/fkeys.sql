SELECT
       NULL AS PKTABLE_CAT,
       A.REFERENCED_TABLE_SCHEMA AS PKTABLE_SCHEM,
       A.REFERENCED_TABLE_NAME AS PKTABLE_NAME,
       A.REFERENCED_COLUMN_NAME AS PKCOLUMN_NAME,
       A.TABLE_CATALOG AS FKTABLE_CAT,
       A.TABLE_SCHEMA AS FKTABLE_SCHEM,
       A.TABLE_NAME AS FKTABLE_NAME,
       A.COLUMN_NAME AS FKCOLUMN_NAME,
       A.ORDINAL_POSITION AS KEY_SEQ,
       C.UPDATE_RULE AS UPDATE_RULE,
       C.DELETE_RULE AS DELETE_RULE,
       A.CONSTRAINT_NAME AS FK_NAME,
       NULL AS PK_NAME,
       NULL AS DEFERABILITY,
       NULL AS UNIQUE_OR_PRIMARY
FROM
       INFORMATION_SCHEMA.KEY_COLUMN_USAGE A,
       INFORMATION_SCHEMA.TABLE_CONSTRAINTS B,
       INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS C
WHERE
       A.TABLE_SCHEMA = B.TABLE_SCHEMA
       AND A.TABLE_NAME = B.TABLE_NAME
       AND A.CONSTRAINT_NAME = B.CONSTRAINT_NAME
       AND A.CONSTRAINT_NAME = C.CONSTRAINT_NAME
       AND B.CONSTRAINT_TYPE = 'FOREIGN KEY'
       AND A.TABLE_SCHEMA = DATABASE()
ORDER BY
       A.TABLE_SCHEMA, A.TABLE_NAME, A.ORDINAL_POSITION;
