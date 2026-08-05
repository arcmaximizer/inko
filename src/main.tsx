import { Hono } from "hono";
import { cors } from "hono/cors";

import { deleteCookie, getCookie, setCookie } from "hono/cookie";

import type { D1Database, KVNamespace } from "@cloudflare/workers-types";
import type { FC } from "hono/jsx";

import {
  getPost,
  getPosts,
  editPost,
  createPost,
  getSettings,
  putSettings,
  createSession,
  verifySession,
  deleteSession,
} from "./db";

import Layout from "./components/layout.tsx";
import PostView from "./views/post.tsx";
import EditorView from "./views/editor.tsx";

import DashboardLayout from "./views/dashboard.tsx";
import DashboardPostsView from "./views/dashboard-posts.tsx";
import DashboardSettingsView from "./views/dashboard-settings.tsx";

import SetupView from "./views/setup.tsx";
import LoginView from "./views/login.tsx";

import { hashPassword } from "./password";

import PostCard from "./components/post-card.tsx";

import { error, fault } from "./lib/error";

export type Env = {
  DB: D1Database;
  KV: KVNamespace;
  ASSETS: Fetcher;
  PEPPER: string;
};

const app = new Hono<{ Bindings: Env }>();

app.use("*", cors());

app.use("/dashboard/*", async (c, next) => {
  const cookie = getCookie(c, "Auth");

  if (cookie) {
    const session = await verifySession(c.env, cookie);
    if (session) await next();
  } else {
    c.status(401);
    return c.redirect("/login");
  }
});

app.get("/", async (c) => {
  const settings = await getSettings(c.env);
  const posts = await getPosts(c.env);

  if (!settings?.admin_username) return c.redirect("/setup");

  let cards = posts
    .filter((p) => p.is_published == 1)
    .map((post) => <PostCard post={post} />);

  if (cards.length == 0) {
    cards.push(<p>There doesn't seem to be anything here yet.</p>);
  }

  return c.html(
    <Layout title="Blog">
      <div class="max-w-screen-lg flex flex-col gap-4 p-4">{cards}</div>
    </Layout>,
  );
});

app.get("/setup", async (c) => {
  const settings = await getSettings(c.env);
  if (settings?.admin_username) return c.redirect("/dashboard/posts");

  return c.html(
    <Layout title="Blog">
      <SetupView />
    </Layout>,
  );
});

app.post("/setup", async (c) => {
  const settings = await getSettings(c.env);

  // We already did setup
  if (settings?.admin_username) {
    c.status(403);
    return c.text("Already set up");
  }

  const data = await c.req.formData();

  const [admin_username, password, blog_name] = [
    data.get("admin_username"),
    data.get("password"),
    data.get("blog_name"),
  ];

  // Password not hashed clientside - HTMX limitation
  if (admin_username && password && blog_name) {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const digest = await hashPassword(password, c.env.PEPPER, salt);
    await putSettings(c.env, {
      admin_username,
      password_hash: digest,
      blog_name,
      salt,
    });

    return c.redirect("/login");
  } else {
    c.status(400);

    return c.text("Incorrect data");
  }
});

app.get("/dashboard", async (c) => {
  return c.redirect("/dashboard/posts", 301);
});

app.get("/dashboard/posts", async (c) => {
  const posts = (await getPosts(c.env)).filter(
    (post) => post.is_published == 1,
  );

  return c.html(
    <Layout title="Blog">
      <DashboardLayout>
        <DashboardPostsView posts={posts} />
      </DashboardLayout>
    </Layout>,
  );
});

app.get("/dashboard/drafts", async (c) => {
  const posts = (await getPosts(c.env)).filter(
    (post) => post.is_published == 0,
  );

  return c.html(
    <Layout title="Blog">
      <DashboardLayout>
        <DashboardPostsView title="Drafts" posts={posts} />
      </DashboardLayout>
    </Layout>,
  );
});

app.get("/dashboard/settings", async (c) => {
  return c.html(
    <Layout title="Blog">
      <DashboardLayout>
        <DashboardSettingsView />
      </DashboardLayout>
    </Layout>,
  );
});

app.get("/login", async (c) => {
  const cookie = getCookie(c, "Auth");

  // Verify session
  if (cookie && (await verifySession(c.env, cookie))) {
    return c.redirect("/dashboard/posts");
  }

  return c.html(
    <Layout title="Blog">
      <LoginView />
    </Layout>,
  );
});

app.post("/login", async (c) => {
  const data = await c.req.formData();

  const settings = await getSettings(c.env);
  if (!settings?.password_hash || !settings?.admin_username || !settings?.salt)
    throw error("not set up correctly");

  const [username, password] = [data.get("username"), data.get("password")];
  if (!username || !password) {
    c.status(400);
    return c.text("No username or password");
  }

  // Hash the password w/ salt and pepper
  const digest = await hashPassword(password, c.env.PEPPER, settings.salt);

  // cf workers - non standard feature
  const isEq = crypto.subtle.timingSafeEqual(settings.password_hash, digest);

  const id = await createSession(c.env);

  setCookie(c, "Auth", id);
  c.header("HX-Redirect", "/dashboard/posts");
  return c.text("Logged in");
});

app.post("/logout", async (c) => {
  const auth = getCookie(c, "Auth");
  if (auth) await deleteSession(c.env, auth);

  deleteCookie(c, "Auth");
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
  return c.text("New draft created. ID is " + id);
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
