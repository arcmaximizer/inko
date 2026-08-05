-- Migration number: 0003 	 2026-07-30T00:00:00.000Z
-- This migration, as well as the code changes, were AI-assisted.
ALTER TABLE posts RENAME COLUMN is_draft TO is_published;
UPDATE posts SET is_published = NOT is_published;
