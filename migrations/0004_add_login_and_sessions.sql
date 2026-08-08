-- Migration number: 0004 	 2026-08-04T15:14:50.057Z

-- id will be a randomly generated value uuid thingy
CREATE TABLE IF NOT EXISTS sessions (id TEXT PRIMARY KEY NOT NULL, created TIMESTAMP NOT NULL);

-- KV now
DROP TABLE settings;
