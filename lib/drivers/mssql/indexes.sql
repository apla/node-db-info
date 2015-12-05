SELECT
     TABLE_NAME = t.name,
     INDEX_NAME = ind.name,
     COLUMN_NAME = col.name,
     CASE WHEN ind.is_primary_key = 1 THEN 'PRIMARY' WHEN ind.is_unique = 1 THEN 'UNIQUE' ELSE '' END as INDEX_TYPE,
     IndexId = ind.index_id,
     SEQ_IN_INDEX = ic.index_column_id
--     ind.*,
--     ic.*,
--     col.*
FROM
     sys.indexes ind
INNER JOIN
     sys.index_columns ic ON  ind.object_id = ic.object_id and ind.index_id = ic.index_id
INNER JOIN
     sys.columns col ON ic.object_id = col.object_id and ic.column_id = col.column_id
INNER JOIN
     sys.tables t ON ind.object_id = t.object_id
WHERE
     t.is_ms_shipped = 0
ORDER BY
     t.name, ind.name, ind.index_id, ic.index_column_id;
