 SELECT NULL              TABLE_CAT
    , t.OWNER           TABLE_SCHEM
    , t.TABLE_NAME      TABLE_NAME
    , CASE WHEN cc.CONSTRAINT_TYPE = 'P' THEN 'PRIMARY' WHEN t.UNIQUENESS = 'UNIQUE' THEN 'UNIQUE' END INDEX_TYPE
    , c.INDEX_OWNER     INDEX_QUALIFIER
    , c.INDEX_NAME      INDEX_NAME
    , decode( t.INDEX_TYPE,'NORMAL','btree','CLUSTER','clustered','other') TYPE
    , c.COLUMN_POSITION ORDINAL_POSITION
    , c.COLUMN_NAME     COLUMN_NAME
    , decode( c.DESCEND,'ASC','A','DESC','D') ASC_OR_DESC
    , t.DISTINCT_KEYS   CARDINALITY
    , t.LEAF_BLOCKS     PAGES
    , NULL              FILTER_CONDITION
 FROM ALL_INDEXES       t
    JOIN ALL_IND_COLUMNS   c ON (t.OWNER = c.INDEX_OWNER AND t.INDEX_NAME = c.INDEX_NAME AND t.TABLE_OWNER = c.TABLE_OWNER AND t.TABLE_NAME = c.TABLE_NAME)
  LEFT JOIN ALL_CONSTRAINTS cc ON (t.OWNER = cc.OWNER AND c.INDEX_NAME = cc.INDEX_NAME AND cc.CONSTRAINT_TYPE = 'P')
   WHERE t.OWNER           = c.INDEX_OWNER
  AND t.INDEX_NAME      = c.INDEX_NAME
  AND t.TABLE_OWNER     = c.TABLE_OWNER
  AND t.TABLE_NAME      = c.TABLE_NAME
 ORDER BY INDEX_QUALIFIER, INDEX_NAME, ORDINAL_POSITION

