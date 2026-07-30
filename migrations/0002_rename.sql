-- Migration number: 0002 	 2026-07-29T15:36:34.588Z
ALTER TABLE posts RENAME COLUMN html_content TO editor_content;
