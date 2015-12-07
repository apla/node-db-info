SELECT
         to_char( NULL )     TABLE_CAT
       , tc.OWNER            TABLE_SCHEM
       , tc.TABLE_NAME       TABLE_NAME
       , tc.COLUMN_NAME      COLUMN_NAME
       , CASE WHEN tc.DATA_TYPE LIKE 'TIMESTAMP% WITH% TIME ZONE' THEN 95
     WHEN tc.DATA_TYPE LIKE 'TIMESTAMP%'                 THEN 93
     WHEN tc.DATA_TYPE LIKE 'INTERVAL DAY% TO SECOND%'   THEN 110
     WHEN tc.DATA_TYPE LIKE 'INTERVAL YEAR% TO MONTH'    THEN 107
ELSE decode( tc.DATA_TYPE
            , 'MLSLABEL' , -9106
            , 'ROWID'    , -9104
            , 'UROWID'   , -9104
            , 'BFILE'    ,    -4 -- 31?
            , 'LONG RAW' ,    -4
            , 'RAW'      ,    -3
            , 'LONG'     ,    -1
            , 'UNDEFINED',     0
            , 'CHAR'     ,     1
            , 'NCHAR'    ,     1
            , 'NUMBER'   ,     decode( tc.DATA_SCALE, NULL, 8, 3 )
            , 'FLOAT'    ,     8
            , 'VARCHAR2' ,    12
            , 'NVARCHAR2',    12
            , 'BLOB'     ,    30
            , 'CLOB'     ,    40
            , 'NCLOB'    ,    40
            , 'DATE'     ,    93
            , NULL
           ) END      DATA_TYPE          -- ...
       , tc.DATA_TYPE        TYPE_NAME          -- std.?
       , decode( tc.DATA_TYPE
                , 'LONG RAW' , 2147483647
                , 'LONG'     , 2147483647
                , 'CLOB'     , 2147483647
                , 'NCLOB'    , 2147483647
                , 'BLOB'     , 2147483647
                , 'BFILE'    , 2147483647
                , 'NUMBER'   , decode( tc.DATA_SCALE
                                      , NULL, 126
                                      , nvl( tc.DATA_PRECISION, 38 )
                                     )
                , 'FLOAT'    , tc.DATA_PRECISION
                , 'DATE'     , 19
                , 'VARCHAR2' , tc.CHAR_LENGTH
                , 'CHAR'     , tc.CHAR_LENGTH
                , 'NVARCHAR2', tc.CHAR_LENGTH
                , 'NCHAR'    , tc.CHAR_LENGTH
                , tc.DATA_LENGTH
               )                   COLUMN_SIZE
       , decode( tc.DATA_TYPE
                , 'LONG RAW' , 2147483647
                , 'LONG'     , 2147483647
                , 'CLOB'     , 2147483647
                , 'NCLOB'    , 2147483647
                , 'BLOB'     , 2147483647
                , 'BFILE'    , 2147483647
                , 'NUMBER'   , nvl( tc.DATA_PRECISION, 38 ) + 2
                , 'FLOAT'    ,  8 -- ?
                , 'DATE'     , 16
                , tc.DATA_LENGTH
               )                   BUFFER_LENGTH
       , decode( tc.DATA_TYPE
                , 'DATE'     ,  0
                , tc.DATA_SCALE
               )                   DECIMAL_DIGITS     -- ...
       , decode( tc.DATA_TYPE
                , 'FLOAT'    ,  2
                , 'NUMBER'   ,  decode( tc.DATA_SCALE, NULL, 2, 10 )
                , NULL
               )                   NUM_PREC_RADIX
       , decode( tc.NULLABLE
                , 'Y'        ,  1
                , 'N'        ,  0
                , NULL
               )                   NULLABLE
       , cc.COMMENTS         REMARKS
--       , tc.DATA_DEFAULT     COLUMN_DEF         -- Column is LONG! TODO: currently not supported by node driver
       , decode( tc.DATA_TYPE
                , 'MLSLABEL' , -9106
                , 'ROWID'    , -9104
                , 'UROWID'   , -9104
                , 'BFILE'    ,    -4 -- 31?
                , 'LONG RAW' ,    -4
                , 'RAW'      ,    -3
                , 'LONG'     ,    -1
                , 'UNDEFINED',     0
                , 'CHAR'     ,     1
                , 'NCHAR'    ,     1
                , 'NUMBER'   ,     decode( tc.DATA_SCALE, NULL, 8, 3 )
                , 'FLOAT'    ,     8
                , 'VARCHAR2' ,    12
                , 'NVARCHAR2',    12
                , 'BLOB'     ,    30
                , 'CLOB'     ,    40
                , 'NCLOB'    ,    40
                , 'DATE'     ,     9 -- not 93!
                , NULL
               )                   SQL_DATA_TYPE      -- ...
       , decode( tc.DATA_TYPE
                , 'DATE'     ,     3
                , NULL
               )                   SQL_DATETIME_SUB   -- ...
       , to_number( NULL )   CHAR_OCTET_LENGTH  -- TODO
       , tc.COLUMN_ID        ORDINAL_POSITION
       , CAST (decode( tc.NULLABLE
                , 'Y'        , 'YES'
                , 'N'        , 'NO'
                , NULL
               ) as varchar2(3))   IS_NULLABLE
    FROM ALL_TAB_COLUMNS  tc
       , ALL_COL_COMMENTS cc
   WHERE tc.OWNER         = cc.OWNER
     AND tc.TABLE_NAME    = cc.TABLE_NAME
     AND tc.COLUMN_NAME   = cc.COLUMN_NAME
