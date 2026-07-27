import type { Env } from "./main.tsx";
import { error, AppError } from "./lib/error";

interface Post {
  id: number;
  title: string;
  subtitle?: string;
  html_content?: string;
  post_image_url?: string;
  published_at?: string;
  updated_at: string;
  is_draft: boolean;
}

async function getPosts(env: Env, limit?: number) {
  const limitFloored = Math.floor(limit ?? 0);

  const { results } = await env.DB.prepare(
    "SELECT * FROM posts ORDER BY published_at DESC LIMIT (?)",
  )
    .bind(limitFloored != 0 ? limitFloored : 2_000_000_000)
    .run();

  return results;
}

async function getPost(
  env: Env,
  id: number,
): Promise<Post | null | undefined | AppError> {
  const result = await env.DB.prepare("SELECT * FROM posts WHERE id = ?")
    .bind(id)
    .first();

  return result as unknown as Post | undefined | null;
}

async function createPost(
  env: Env,
  post: Omit<Post, "id">,
): Promise<number | AppError> {
  const {
    is_draft,
    title,
    html_content,
    subtitle,
    post_image_url,
    published_at,
    updated_at,
  } = post;

  const date = new Date().toISOString();
  const result = await env.DB.prepare(
    "INSERT INTO posts (is_draft, title, html_content, subtitle, post_image_url, published_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING id",
  )
    .bind(
      is_draft,
      title,
      html_content,
      subtitle ?? null,
      post_image_url ?? null,
      published_at ?? date,
      updated_at ?? date,
    )
    .first<{ id: number }>();

  return result?.id as number;
}

async function editPost(
  env: Env,
  data: Partial<Post> & { id: number },
): Promise<Post | AppError> {
  type PartialPostKey = keyof Omit<Post, "id">;
  type Templates = Record<PartialPostKey, string>;

  const templates: Templates = {
    is_draft: "is_draft = ?",
    title: "title = ?",
    html_content: "html_content = ?",
    subtitle: "subtitle = ?",
    post_image_url: "post_image_url = ?",
    published_at: "published_at = ?",
    updated_at: "updated_at = ?",
  };

  let statements: PartialPostKey[] = [];
  let values = [];

  for (let k in data) {
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
    statements.includes("is_draft") &&
    data.is_draft == false
  ) {
    statements.push("published_at");
    values.push(date);
  }

  const compiled = env.DB.prepare(
    `UPDATE posts SET ${statements.map((k) => templates[k]).join(", ")} WHERE id = ? RETURNING *`,
  ).bind(values, data.id);

  const result = await compiled.run();
  if (result.meta.rows_written != 1) {
    return error("Post doesn't exist", result);
  }

  if (result.error) {
    return error(result.error, result);
  }

  return result.results[0] as unknown as Post;
}
