import { Hono } from "hono";
import { cors } from "hono/cors";

import { deleteCookie, getCookie, setCookie } from "hono/cookie";

import type { D1Database } from "@cloudflare/workers-types";
import type { FC } from "hono/jsx";

import { getPost, getPosts, editPost, createPost } from "./db";

import Layout from "./components/layout.tsx";
import PostView from "./views/post.tsx";
import EditorView from "./views/editor.tsx";

import DashboardLayout from "./views/dashboard.tsx";
import DashboardPostsView from "./views/dashboard-posts.tsx";

import LoginView from "./views/login";

import PostCard from "./components/post-card.tsx";

export type Env = {
  DB: D1Database;
  ASSETS: Fetcher;
};

const app = new Hono<{ Bindings: Env }>();

app.use("*", cors());

app.get("/", async (c) => {
  const posts = await getPosts(c.env);

  const cards = posts
    .filter((p) => p.is_published == 1)
    .map((post) => <PostCard post={post} />);

  return c.html(
    <Layout title="Blog">
      <div class="max-w-screen-lg flex flex-col gap-4 p-4">{cards}</div>
    </Layout>,
  );
});

app.get("/dashboard", async (c) => {
  return c.redirect("/dashboard/posts", 301);
});

app.get("/dashboard/posts", async (c) => {
  const posts = await getPosts(c.env);
  return c.html(
    <Layout title="Blog">
      <DashboardLayout>
        <DashboardPostsView posts={posts} />
      </DashboardLayout>
    </Layout>,
  );
});

app.get("/dashboard/drafts", async (c) => {
  return c.html(
    <Layout title="Blog">
      <DashboardLayout />
    </Layout>,
  );
});

app.get("/dashboard/settings", async (c) => {
  return c.html(
    <Layout title="Blog">
      <DashboardLayout />
    </Layout>,
  );
});

app.get("/login", async (c) => {
  return c.html(
    <Layout title="Blog">
      <LoginView />
    </Layout>,
  );
});

app.post("/login", async (c) => {
  const data = await c.req.formData();
  setCookie(c, "Authorization", "access yay");
  c.header("HX-Redirect", "/dashboard");
  return c.text("Logged in");
});

app.post("/logout", async (c) => {
  const data = await c.req.formData();
  deleteCookie(c, "Authorization");
  c.header("HX-Redirect", "/");
  return c.text("Logged out");
});

app.post("/editor/new", async (c) => {
  // Create a new post
  const id = await createPost(c.env, {
    title: "Untitled",
    is_published: 0,
  });

  if (id instanceof Error) {
    throw console.error(id);
  }

  c.header("HX-Location", "/editor/" + id);
  return c.text("New post created. ID is " + id);
  //return c.redirect("/editor/" + id, 302);
});

app.get("/editor/:id", async (c) => {
  const id = c.req.param("id");

  // Fetch the post
  const post = await getPost(c.env, Number(id));
  if (post instanceof Error) {
    // Return the error page
    throw post;
  }

  if (!post) {
    return c.html(notFoundPage, 404);
  }

  return c.html(
    <Layout title="Blog" noHeader>
      <EditorView post={post} />
    </Layout>,
  );
});

const errorPage = (
  <Layout title="Blog">We've experienced a strange error. Apologies!</Layout>
);

const notFoundPage = <Layout title="Blog">404</Layout>;

app.onError((err, c) => {
  console.error(err);
  return c.html(errorPage, 500);
});

app.get("/post/:id", async (c) => {
  const id = c.req.param("id");

  // Fetch the post
  const post = await getPost(c.env, Number(id));
  if (post instanceof Error) {
    // Return the error page
    throw post;
  }

  if (!post || !post.editor_content || !post.is_published) {
    return c.html(notFoundPage, 404);
  }

  return c.html(
    <Layout title="Blog">
      <PostView post={post} />
    </Layout>,
  );
});

app.put("/api/save/:id", async (c) => {
  const id = c.req.param("id");
  const data = await c.req.formData();

  const newPostData = await editPost(c.env, {
    id: Number(id),
    editor_content: data.get("content") ?? undefined,
  });

  return c.text("Saved");
});

app.put("/api/publish/:id", async (c) => {
  const id = c.req.param("id");
  const data = await c.req.formData();

  const newPostData = await editPost(c.env, {
    id: Number(id),
    editor_content: data.get("content") ?? undefined,
    is_published: 1,
  });

  return c.text("Published");
});

export default app;
