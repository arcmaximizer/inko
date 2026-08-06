import type { Env } from "./main.tsx";
import { error, AppError } from "./lib/error";

export interface Post {
  id: number;
  title: string;
  subtitle?: string;
  editor_content?: string;
  post_image_url?: string;
  published_at?: string;
  updated_at: string;
  is_published: 0 | 1;
}

export async function getPosts(
  env: Env,
  start?: number,
  limit?: number,
): Promise<Post[]> {
  const { results } = await env.DB.prepare(
    "SELECT * FROM posts WHERE id <= (?) ORDER BY published_at DESC LIMIT (?)",
  )
    .bind(start ?? 2_000_000_000, limit ?? 2_000_000_000)
    .run();

  return results as unknown as Post[];
}

export async function getPost(
  env: Env,
  id: number,
): Promise<Post | null | undefined | AppError> {
  const result = await env.DB.prepare("SELECT * FROM posts WHERE id = ?")
    .bind(id)
    .first();

  return result as unknown as Post | undefined | null;
}

export async function createPost(
  env: Env,
  post: Omit<Post, "id" | "updated_at"> & { updated_at?: string },
): Promise<number | AppError> {
  const {
    is_published,
    title,
    editor_content,
    subtitle,
    post_image_url,
    published_at,
    updated_at,
  } = post;

  const date = new Date().toISOString();

  const result = await env.DB.prepare(
    "INSERT INTO posts (is_published, title, editor_content, subtitle, post_image_url, published_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING id",
  )
    .bind(
      is_published,
      title,
      editor_content ?? "",
      subtitle ?? null,
      post_image_url ?? null,
      published_at ?? date,
      updated_at ?? date,
    )
    .first<{ id: number }>();

  return result?.id as number;
}

export async function deletePost(
  env: Env,
  id: number,
): Promise<void | AppError> {
  const result = await env.DB.prepare("DELETE FROM posts WHERE id = ?")
    .bind(id)
    .run();

  if (!result.meta.changes) return error("No post exists");
}

export async function editPost(
  env: Env,
  data: Partial<Omit<Post, "id">> & { id: number },
): Promise<Post | AppError> {
  type PartialPostKey = keyof Omit<Post, "id">;
  type Templates = Record<PartialPostKey, string>;

  const templates: Templates = {
    is_published: "is_published = ?",
    title: "title = ?",
    editor_content: "editor_content = ?",
    subtitle: "subtitle = ?",
    post_image_url: "post_image_url = ?",
    published_at: "published_at = ?",
    updated_at: "updated_at = ?",
  };

  let statements: PartialPostKey[] = [];
  let values = [];

  for (let k in data) {
    if (k == "id") continue;

    const key = k as PartialPostKey;
    const value = data[key];

    if (value != undefined) {
      statements.push(key);
      values.push(value);
    }
  }

  const date = new Date().toISOString();

  // The following feels hacky, but perfect is the enemy of good.

  // If there's no "updated at", then we should be smart
  if (!statements.includes("updated_at")) {
    statements.push("updated_at");
    values.push(date);
  }

  // This is a kind of publishing
  if (
    !statements.includes("published_at") &&
    statements.includes("is_published") &&
    data.is_published == 1
  ) {
    statements.push("published_at");
    values.push(date);
  }

  const statement = `UPDATE posts SET ${statements.map((k) => templates[k]).join(", ")} WHERE id = ? RETURNING *`;

  const compiled = env.DB.prepare(statement).bind(...values, data.id);

  const result = await compiled.run();
  if (result.meta.rows_written != 1) {
    return error("Post doesn't exist", result);
  }

  if (result.error) {
    return error(result.error, result);
  }

  return result.results[0] as unknown as Post;
}

export async function createSession(env: Env): Promise<string> {
  const id = crypto.randomUUID();

  const date = new Date().toISOString();

  await env.DB.prepare("INSERT INTO sessions (id, created) VALUES (?, ?)")
    .bind(id, date)
    .run();

  return id;
}

export async function verifySession(env: Env, id: string): Promise<boolean> {
  const session = await env.DB.prepare("SELECT * FROM sessions WHERE id = ?")
    .bind(id)
    .first();

  if (session) return true;
  return false;
}

export async function deleteSession(env: Env, id: string): Promise<void> {
  await env.DB.prepare("DELETE FROM sessions WHERE id = ?").bind(id).run();
}

interface Settings {
  blog_name?: string;
  admin_username?: string;
  password_hash?: Uint8Array;
  salt?: Uint8Array;
}

export async function getSettings(env: Env): Promise<Settings | null> {
  const settings = await env.KV.get(["blog_name", "admin_username"]);

  const password_hash = await env.KV.get("password_hash", {
    type: "arrayBuffer",
  });

  const salt = await env.KV.get("salt", {
    type: "arrayBuffer",
  });

  return {
    blog_name: settings.get("blog_name") ?? undefined,
    admin_username: settings.get("admin_username") ?? undefined,
    password_hash: password_hash ? new Uint8Array(password_hash) : undefined,
    salt: salt ? new Uint8Array(salt) : undefined,
  };
}

export async function putSettings(env: Env, settings: Settings): Promise<void> {
  const pairs = [
    settings.blog_name
      ? env.KV.put("blog_name", settings.blog_name)
      : undefined,
    settings.admin_username
      ? env.KV.put("admin_username", settings.admin_username)
      : undefined,
    settings.password_hash
      ? env.KV.put("password_hash", settings.password_hash)
      : undefined,
    settings.salt ? env.KV.put("salt", settings.salt) : undefined,
  ];

  console.log(settings);

  await Promise.all(pairs);
}
