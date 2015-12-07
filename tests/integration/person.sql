CREATE TABLE person (
	id INTEGER PRIMARY KEY,
	name VARCHAR(255) NOT NULL,
	email VARCHAR(100),
	age DECIMAL(3),
	gender CHAR(1),
	expenses NUMERIC(10,2) default 0,
	note TEXT,
	birtday DATE,
	modified_at TIMESTAMP
);
