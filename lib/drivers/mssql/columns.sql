-- http://stackoverflow.com/questions/2729126/how-to-find-column-names-for-all-tables-in-all-databases-in-sql-server
SELECT o.Name                   as TABLE_NAME
     , c.Name                   as COLUMN_NAME
     , CASE
             WHEN t.name IN ('char','varchar') THEN t.name+'('+CASE WHEN c.max_length<0 then 'MAX' ELSE CONVERT(varchar(10),c.max_length) END+')'
             WHEN t.name IN ('nvarchar','nchar') THEN t.name+'('+CASE WHEN c.max_length<0 then 'MAX' ELSE CONVERT(varchar(10),c.max_length/2) END+')'
            WHEN t.name IN ('numeric') THEN t.name+'('+CONVERT(varchar(10),c.precision)+','+CONVERT(varchar(10),c.scale)+')'
             ELSE t.name
         END AS COLUMN_TYPE
     , CASE WHEN c.is_nullable = 1 THEN 'YES' ELSE 'NO' END as IS_NULLABLE
     , c.max_length             as DATA_LENGTH
     , c.precision              as NUMERIC_PRECISION
     , c.scale                  as NUMERIC_PRECISION_RADIX
     , t.name                   as TYPE_NAME
     , t.*
FROM sys.columns c
     INNER JOIN sys.objects o ON c.object_id=o.object_id
     LEFT JOIN  sys.types t on c.system_type_id=t.user_type_id and t.is_user_defined=0
WHERE o.type = 'U'
ORDER BY o.Name, c.Name;
