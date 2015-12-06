SELECT
    fk.name,
    OBJECT_NAME(fk.parent_object_id) 'Parent table',
    c1.name 'Parent column',
    OBJECT_NAME(fk.referenced_object_id) 'Referenced table',
    c2.name 'Referenced column',
    ON_UPDATE = fk.update_referential_action_desc,
    ON_DELETE = fk.delete_referential_action_desc
FROM
    sys.foreign_keys fk
INNER JOIN
    sys.foreign_key_columns fkc ON fkc.constraint_object_id = fk.object_id
INNER JOIN
    sys.columns c1 ON fkc.parent_column_id = c1.column_id AND fkc.parent_object_id = c1.object_id
INNER JOIN
    sys.columns c2 ON fkc.referenced_column_id = c2.column_id AND fkc.referenced_object_id = c2.object_id
