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
