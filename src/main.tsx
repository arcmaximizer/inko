import { Hono } from "hono";
import { cors } from "hono/cors";
import type { D1Database } from "@cloudflare/workers-types";
import type { FC } from "hono/jsx";

import { getPost, getPosts, createPost } from "./db";

import { QuillDeltaToHtmlConverter } from "quill-delta-to-html";

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

app.post("/editor/new", async (c) => {
  // Create a new post
  const id = await createPost(c.env, {
    title: "Untitled",
    is_draft: true,
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

  if (!post || !post.editor_content) {
    return c.html(notFoundPage, 404);
  }

  const delta = JSON.parse(post.editor_content); // the ops array you stored

  const converter = new QuillDeltaToHtmlConverter(delta.ops, {});
  const html = converter.convert();

  return c.html(
    <Layout title="Blog">
      <PostView title={post.title} desc={post.subtitle ?? ""}>
        <div dangerouslySetInnerHTML={{ __html: html }} />
      </PostView>
    </Layout>,
  );
});

export default app;
