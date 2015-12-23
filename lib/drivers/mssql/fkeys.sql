SELECT
    OBJECT_NAME(fk.parent_object_id) 'FKTABLE_NAME',
    c1.name 'FKCOLUMN_NAME',
    OBJECT_NAME(fk.referenced_object_id) 'PKTABLE_NAME',
    c2.name 'PKCOLUMN_NAME',
    fk.update_referential_action_desc 'UPDATE_RULE',
    fk.delete_referential_action_desc 'DELETE_RULE',
    fk.name AS FK_NAME
FROM
    sys.foreign_keys fk
INNER JOIN
    sys.foreign_key_columns fkc ON fkc.constraint_object_id = fk.object_id
INNER JOIN
    sys.columns c1 ON fkc.parent_column_id = c1.column_id AND fkc.parent_object_id = c1.object_id
INNER JOIN
    sys.columns c2 ON fkc.referenced_column_id = c2.column_id AND fkc.referenced_object_id = c2.object_id
