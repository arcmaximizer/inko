import { Hono } from "hono";
import { cors } from "hono/cors";
import type { D1Database } from "@cloudflare/workers-types";
import type { FC } from "hono/jsx";

import { getPost, getPosts, createPost } from "./db";

import Layout from "./components/layout.tsx";
import PostView from "./views/post.tsx";
import EditorView from "./views/editor.tsx";

import DashboardLayout from "./views/dashboard.tsx";
import DashboardPostsView from "./views/dashboard-posts.tsx";

export type Env = {
  DB: D1Database;
  ASSETS: Fetcher;
};

const app = new Hono<{ Bindings: Env }>();

app.use("*", cors());

app.get("/", async (c) => {
  const posts = await getPosts(c.env);
  console.log(posts);

  return c.html(<Layout title="Blog">i'm a homepage</Layout>);
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

app.get("/editor/new", async (c) => {
  // Create a new post
  const id = await createPost(c.env, {
    title: "Untitled",
    updated_at: new Date().toISOString(),
    is_draft: true,
  });

  if (id instanceof Error) {
    throw console.error(id);
  }

  return c.redirect("/editor/" + id, 302);
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

  if (!post) {
    return c.html(notFoundPage, 404);
  }

  return c.html(
    <Layout title="Blog">
      <PostView title={post.title} desc={post.subtitle ?? ""}>
        <div dangerouslySetInnerHTML={{ __html: post.html_content ?? "" }} />
      </PostView>
    </Layout>,
  );
});

export default app;
