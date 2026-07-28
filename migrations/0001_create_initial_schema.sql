-- Migration number: 0001 	 2026-07-27T14:39:53.345Z
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS posts (id INTEGER PRIMARY KEY NOT NULL, title TEXT NOT NULL, subtitle TEXT, post_image_url TEXT, published_at TIMESTAMP, updated_at TIMESTAMP NOT NULL, html_content TEXT, is_draft BOOL NOT NULL);

CREATE TABLE IF NOT EXISTS tags (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT UNIQUE);

CREATE TABLE IF NOT EXISTS settings (blog_name TEXT, admin_username TEXT, password_hash TEXT);
