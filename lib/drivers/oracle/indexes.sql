SELECT
         NULL              TABLE_CAT
       , t.OWNER           TABLE_SCHEM
       , t.TABLE_NAME      TABLE_NAME
       , to_number( NULL ) NON_UNIQUE
       , NULL              INDEX_QUALIFIER
       , NULL              INDEX_NAME
       ,'table'            TYPE
       , to_number( NULL ) ORDINAL_POSITION
       , NULL              COLUMN_NAME
       , NULL              ASC_OR_DESC
       , t.NUM_ROWS        CARDINALITY
       , t.BLOCKS          PAGES
       , NULL              FILTER_CONDITION
    FROM ALL_TABLES        t
   UNION
  SELECT NULL              TABLE_CAT
       , t.OWNER           TABLE_SCHEM
       , t.TABLE_NAME      TABLE_NAME
       , decode( t.UNIQUENESS,'UNIQUE', 0, 1 ) NON_UNIQUE
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
       , ALL_IND_COLUMNS   c
   WHERE t.OWNER           = c.INDEX_OWNER
     AND t.INDEX_NAME      = c.INDEX_NAME
     AND t.TABLE_OWNER     = c.TABLE_OWNER
     AND t.TABLE_NAME      = c.TABLE_NAME
 ORDER BY NON_UNIQUE, TYPE, INDEX_QUALIFIER, INDEX_NAME, ORDINAL_POSITION
