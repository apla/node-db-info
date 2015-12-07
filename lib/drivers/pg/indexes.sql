SELECT
  U.usename                AS user_name,
  ns.nspname               AS "SCHEMA_NAME",
  idx.indrelid :: REGCLASS AS "TABLE_NAME",
  i.relname                AS "INDEX_NAME",
  idx.indisunique          AS is_unique,
  idx.indisprimary         AS is_primary,
  am.amname                AS "INDEX_TYPE",
  idx.indkey,
       ARRAY(
       SELECT pg_get_indexdef(idx.indexrelid, k + 1, TRUE)
       FROM
       generate_subscripts(idx.indkey, 1) AS k
       ORDER BY k
       ) AS "COLUMN_NAME",
  (idx.indexprs IS NOT NULL) OR (idx.indkey::int[] @> array[0]) AS is_functional,
  idx.indpred IS NOT NULL AS is_partial
FROM pg_index AS idx
  JOIN pg_class AS i
    ON i.oid = idx.indexrelid
  JOIN pg_am AS am
    ON i.relam = am.oid
  JOIN pg_namespace AS ns ON i.relnamespace = ns.oid
  JOIN pg_user AS U ON i.relowner = U.usesysid
AND    ns.nspname = ANY(current_schemas(false));
