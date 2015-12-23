SELECT
				NULL as "PKTABLE_CAT", pg_catalog.quote_ident(uk_ns.nspname) as "PKTABLE_SCHEMA", pg_catalog.quote_ident(uk_class.relname) as "PKTABLE_NAME", pg_catalog.quote_ident(uk_col.attname) as "PKCOLUMN_NAME",
				NULL as "FKTABLE_CAT", pg_catalog.quote_ident(fk_ns.nspname) as "FKTABLE_SCHEMA", pg_catalog.quote_ident(fk_class.relname) as "FKTABLE_NAME", pg_catalog.quote_ident(fk_col.attname) as "FKCOLUMN_NAME",
				colnum.i as "KEY_SEQ",
				CASE constr.confupdtype
					WHEN 'c' THEN 'CASCADE' WHEN 'r' THEN 'RESTRICT' WHEN 'n' THEN 'SET NULL' WHEN 'a' THEN 'NO ACTION' WHEN 'd' THEN 'SET DEFAULT' ELSE ''
				END as "UPDATE_RULE",
				CASE constr.confdeltype
					WHEN 'c' THEN 'CASCADE' WHEN 'r' THEN 'RESTRICT' WHEN 'n' THEN 'SET NULL' WHEN 'a' THEN 'NO ACTION' WHEN 'd' THEN 'SET DEFAULT' ELSE ''
				END as "DELETE_RULE",
				pg_catalog.quote_ident(constr.conname) as "FK_NAME", pg_catalog.quote_ident(uk_constr.conname) as "PK_NAME",
				CASE
					WHEN constr.condeferrable = 'f' THEN 7
					WHEN constr.condeferred = 't' THEN 6
					WHEN constr.condeferred = 'f' THEN 5
					ELSE -1
				END as "DEFERABILITY",
				CASE coalesce(uk_constr.contype, 'u')
					WHEN 'u' THEN 'UNIQUE' WHEN 'p' THEN 'PRIMARY'
				END as "UNIQUE_OR_PRIMARY",
				pg_catalog.quote_ident(uk_type.typname) as "PK_TYPE", pg_catalog.quote_ident(fk_type.typname) as "FK_TYPE"
			FROM pg_catalog.pg_constraint constr
				JOIN pg_catalog.pg_class uk_class ON constr.confrelid = uk_class.oid
				JOIN pg_catalog.pg_namespace uk_ns ON uk_class.relnamespace = uk_ns.oid
				JOIN pg_catalog.pg_class fk_class ON constr.conrelid = fk_class.oid
				JOIN pg_catalog.pg_namespace fk_ns ON fk_class.relnamespace = fk_ns.oid
				-- can't do unnest() until 8.4, and would need WITH ORDINALITY to get the array indices,
				-- wich isn't available until 9.4 at the earliest, so we join against a series table instead
				JOIN pg_catalog.generate_series(1, pg_catalog.current_setting('max_index_keys')::integer) colnum(i)
					ON colnum.i <= pg_catalog.array_upper(constr.conkey,1)
				JOIN pg_catalog.pg_attribute uk_col ON uk_col.attrelid = constr.confrelid AND uk_col.attnum = constr.confkey[colnum.i]
				JOIN pg_catalog.pg_type uk_type ON uk_col.atttypid = uk_type.oid
				JOIN pg_catalog.pg_attribute fk_col ON fk_col.attrelid = constr.conrelid AND fk_col.attnum = constr.conkey[colnum.i]
				JOIN pg_catalog.pg_type fk_type ON fk_col.atttypid = fk_type.oid

				-- We can't match confkey from the fk constraint to conkey of the unique constraint,
				-- because the unique constraint might not exist or there might be more than one
				-- matching one. However, there must be at least a unique _index_ on the key
				-- columns, so we look for that; but we can't find it via pg_index, since there may
				-- again be more than one matching index.

				-- So instead, we look at pg_depend for the dependency that was created by the fk
				-- constraint. This dependency is of type 'n' (normal) and ties the pg_constraint
				-- row oid to the pg_class oid for the index relation (a single arbitrary one if
				-- more than one matching unique index existed at the time the constraint was
				-- created).  Fortunately, the constraint does not create dependencies on the
				-- referenced table itself, but on the _columns_ of the referenced table, so the
				-- index can be distinguished easily.  Then we look for another pg_depend entry,
				-- this time an 'i' (implementation) dependency from a pg_constraint oid (the unique
				-- constraint if one exists) to the index oid; but we have to allow for the
				-- possibility that this one doesn't exist.          - Andrew Gierth (RhodiumToad)

				JOIN pg_catalog.pg_depend dep ON (
					dep.classid = 'pg_catalog.pg_constraint'::regclass
					AND dep.objid = constr.oid
					AND dep.objsubid = 0
					AND dep.deptype = 'n'
					AND dep.refclassid = 'pg_catalog.pg_class'::regclass
					AND dep.refobjsubid=0
				)
				JOIN pg_catalog.pg_class idx ON (
					idx.oid = dep.refobjid AND idx.relkind='i'
				)
				LEFT JOIN pg_catalog.pg_depend dep2 ON (
					dep2.classid = 'pg_catalog.pg_class'::regclass
					AND dep2.objid = idx.oid
					AND dep2.objsubid = 0
					AND dep2.deptype = 'i'
					AND dep2.refclassid = 'pg_catalog.pg_constraint'::regclass
					AND dep2.refobjsubid = 0
				)
				LEFT JOIN pg_catalog.pg_constraint uk_constr ON (
					uk_constr.oid = dep2.refobjid AND uk_constr.contype IN ('p','u')
				)
			WHERE pg_catalog.pg_table_is_visible(uk_class.oid)
				AND uk_class.relkind = 'r'
				AND fk_class.relkind = 'r'
				AND constr.contype = 'f'
			ORDER BY constr.conname, colnum.i
