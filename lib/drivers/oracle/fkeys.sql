SELECT /*+ CHOOSE */
         to_char( NULL )    PKTABLE_CAT
       , uk.OWNER           PKTABLE_SCHEMA
       , uk.TABLE_NAME      PKTABLE_NAME
       , uc.COLUMN_NAME     PKCOLUMN_NAME
       , to_char( NULL )    FKTABLE_CAT
       , fk.OWNER           FKTABLE_SCHEMA
       , fk.TABLE_NAME      FKTABLE_NAME
       , fc.COLUMN_NAME     FKCOLUMN_NAME
       , uc.POSITION        ORDINAL_POSITION
       , 'NO ACTION'        UPDATE_RULE
       , fk.DELETE_RULE     DELETE_RULE
       , fk.CONSTRAINT_NAME FK_NAME
       , uk.CONSTRAINT_NAME PK_NAME
       , to_char( NULL )    DEFERABILITY
       , decode( uk.CONSTRAINT_TYPE, 'P', 'PRIMARY', 'U', 'UNIQUE')
                            UNIQUE_OR_PRIMARY
    FROM ALL_CONSTRAINTS    uk
       , ALL_CONS_COLUMNS   uc
       , ALL_CONSTRAINTS    fk
       , ALL_CONS_COLUMNS   fc
   WHERE uk.OWNER            = uc.OWNER
     AND uk.CONSTRAINT_NAME  = uc.CONSTRAINT_NAME
     AND fk.OWNER            = fc.OWNER
     AND fk.CONSTRAINT_NAME  = fc.CONSTRAINT_NAME
     AND uk.CONSTRAINT_TYPE IN ('P','U')
     AND fk.CONSTRAINT_TYPE  = 'R'
     AND uk.CONSTRAINT_NAME  = fk.R_CONSTRAINT_NAME
     AND uk.OWNER            = fk.R_OWNER
     AND uc.POSITION         = fc.POSITION
     AND uk.OWNER = (SELECT sys_context( 'userenv', 'current_schema' ) FROM DUAL)
