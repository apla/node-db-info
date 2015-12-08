CREATE TABLE person (
	id INTEGER PRIMARY KEY,
	name VARCHAR(255) NOT NULL,
	email VARCHAR(100),
	age DECIMAL(3),
	gender CHAR(1),
	expenses NUMERIC(10,2) default 0,
-- 	photo BLOB,	-- not supported by postgres
-- 	note TEXT, -- not supported by oracle
	birtday DATE,
-- 	created_at DATETIME, -- not supported by pg
	modified_at TIMESTAMP
-- 	modified_at TIMESTAMP(2) -- not supported by mssql
)
