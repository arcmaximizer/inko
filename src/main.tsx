import { Hono, type MiddlewareHandler } from "hono";
import { cors } from "hono/cors";

import { deleteCookie, getCookie, setCookie } from "hono/cookie";

import type {
  D1Database,
  KVNamespace,
  R2Bucket,
} from "@cloudflare/workers-types";
import type { FC } from "hono/jsx";

import {
  getPost,
  getPosts,
  editPost,
  createPost,
  deletePost,
  getSettings,
  putSettings,
  createSession,
  verifySession,
  deleteSession,
  deleteAllSessionsExcept,
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
import ImageInput from "./components/image-input.tsx";

import { error, fault } from "./lib/error";

export type Env = {
  DB: D1Database;
  KV: KVNamespace;
  R2: R2Bucket;
  ASSETS: Fetcher;
  BASE_URI: string;
  PEPPER: string;
};

const app = new Hono<{ Bindings: Env }>();

app.use("*", cors());

const auth: MiddlewareHandler = async (c, next) => {
  const cookie = getCookie(c, "Auth");

  if (cookie) {
    const session = await verifySession(c.env, cookie);
    if (session) {
      await next();
    } else {
      c.status(401);
      return c.redirect("/login");
    }
  } else {
    c.status(401);
    return c.redirect("/login");
  }
};

app.use("/dashboard/*", auth);
app.use("/api/*", auth);

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
    <Layout title={settings.blog_name ?? "Your New Blog"}>
      <div class="max-w-screen-lg flex flex-col gap-4 p-4">{cards}</div>
    </Layout>,
  );
});

app.get("/setup", async (c) => {
  const settings = await getSettings(c.env);
  if (settings?.admin_username) return c.redirect("/dashboard/posts");

  return c.html(
    <Layout title={settings?.blog_name ?? "Your New Blog"}>
      <SetupView />
    </Layout>,
  );
});

app.post("/setup", async (c) => {
  // TOCTOU
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

  // Password not hashed clientside - simplicity reasons
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
  const settings = await getSettings(c.env);
  const posts = (await getPosts(c.env)).filter(
    (post) => post.is_published == 1,
  );

  return c.html(
    <Layout title={settings?.blog_name ?? "Your New Blog"}>
      <DashboardLayout>
        <DashboardPostsView posts={posts} />
      </DashboardLayout>
    </Layout>,
  );
});

app.get("/dashboard/drafts", async (c) => {
  const settings = await getSettings(c.env);
  const posts = (await getPosts(c.env)).filter(
    (post) => post.is_published == 0,
  );

  return c.html(
    <Layout title={settings?.blog_name ?? "Your New Blog"}>
      <DashboardLayout>
        <DashboardPostsView title="Drafts" posts={posts} />
      </DashboardLayout>
    </Layout>,
  );
});

app.get("/dashboard/settings", async (c) => {
  const settings = await getSettings(c.env);

  return c.html(
    <Layout title={settings?.blog_name ?? "Your New Blog"}>
      <DashboardLayout>
        <DashboardSettingsView />
      </DashboardLayout>
    </Layout>,
  );
});

app.post("/dashboard/settings", async (c) => {
  const data = await c.req.formData();

  const title = data.get("title");
  if (title) {
    await putSettings(c.env, {
      blog_name: title,
    });
    return c.html(
      <>
        <span id="blog-title" hx-swap-oob="true">
          {title}
        </span>
        <span class="text-green-600">Title changed successfully</span>
      </>,
    );
  } else {
    return c.html(<span class="text-red-600">No title specified</span>);
  }
});

app.post("/dashboard/settings/auth", async (c) => {
  const settings = await getSettings(c.env);

  if (!settings?.password_hash || !settings?.salt)
    throw error("not set up correctly");

  const data = await c.req.formData();

  const [old_password, new_password, repeat_new_password] = [
    data.get("old_password"),
    data.get("new_password"),
    data.get("repeat_new_password"),
  ];

  if (!old_password || !new_password || !repeat_new_password)
    return c.html(
      <span class="text-red-600">All fields must be filled in</span>,
    );

  if (old_password == new_password) {
    return c.html(
      <span class="text-red-600">Old password is the same as the new one</span>,
    );
  }

  if (new_password != repeat_new_password) {
    return c.html(<span class="text-red-600">Password not repeated</span>);
  }

  const digest = await hashPassword(old_password, c.env.PEPPER, settings.salt);

  // cf workers - non standard feature
  const isEq = crypto.subtle.timingSafeEqual(settings.password_hash, digest);

  if (!isEq)
    return c.html(<span class="text-red-600">Invalid old password</span>);

  // Rotate salt
  const newSalt = crypto.getRandomValues(new Uint8Array(16));
  const newDigest = await hashPassword(new_password, c.env.PEPPER, newSalt);

  await putSettings(c.env, {
    password_hash: newDigest,
    salt: newSalt,
  });

  // byebye all other sessions
  await deleteAllSessionsExcept(c.env, getCookie(c, "Auth") ?? "");

  return c.html(<span class="text-green-600">Password changed</span>);
});

app.get("/login", async (c) => {
  const settings = await getSettings(c.env);
  const cookie = getCookie(c, "Auth");

  // Verify session
  if (cookie && (await verifySession(c.env, cookie))) {
    return c.redirect("/dashboard/posts");
  }

  return c.html(
    <Layout title={settings?.blog_name ?? "Your New Blog"}>
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
    return c.html(
      <span class="text-red-600">All fields must be filled in</span>,
    );
  }

  // Hash the password w/ salt and pepper
  const digest = await hashPassword(password, c.env.PEPPER, settings.salt);

  // cf workers - non standard feature
  const isEq = crypto.subtle.timingSafeEqual(settings.password_hash, digest);

  if (!isEq || settings.admin_username != username)
    return c.html(
      <span class="text-red-600">Invalid username or password</span>,
    );

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
  const settings = await getSettings(c.env);
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
    <Layout noHeader title={settings?.blog_name ?? "Your New Blog"}>
      <EditorView post={post} />
    </Layout>,
  );
});

app.delete("/editor/:id", async (c) => {
  const id = c.req.param("id");

  const posts = await getPosts(c.env);

  const post = posts.filter((p) => p.id == Number(id));

  const result = await deletePost(c.env, Number(id));

  if (result instanceof Error) {
    c.status(404);
    return c.body(null);
  }

  const published = post[0]?.is_published == 0;

  return c.html(
    <>
      <h1 class="text-xl" id="post-count" hx-swap-oob="true">
        {published ? "Drafts" : "Posts"} (
        {published
          ? posts.filter((p) => p.is_published == 1).length
          : posts.filter((p) => p.is_published == 0).length}
        )
      </h1>
    </>,
  );
});

const errorPage = (
  <Layout title="return to home">
    We've experienced a strange error. Apologies!
  </Layout>
);

const notFoundPage = <Layout title="return to home">404</Layout>;

app.onError((err, c) => {
  console.error(err);
  return c.html(errorPage, 500);
});

app.get("/post/:id", async (c) => {
  const settings = await getSettings(c.env);
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
    <Layout title={settings?.blog_name ?? "Your New Blog"}>
      <PostView
        post={post}
        base_uri={c.env.BASE_URI}
        blog_title={settings?.blog_name ?? ""}
      />
    </Layout>,
  );
});

app.put("/api/save/:id", async (c) => {
  const id = c.req.param("id");
  const data = await c.req.formData();

  const newPostData = await editPost(c.env, {
    id: Number(id),
    editor_content: data.get("content") ?? undefined,
    title: data.get("title") ?? undefined,
    subtitle: data.get("subtitle") ?? undefined,
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
    title: data.get("title") ?? undefined,
    subtitle: data.get("subtitle") ?? undefined,
  });

  return c.text("Published");
});

app.put("/api/image/:id", async (c) => {
  const id = Number(c.req.param("id"));

  const body = await c.req.parseBody();
  const file = body["post_image"];

  if (file instanceof File == false) {
    c.status(400);
    return c.text("No file");
  }

  const date = Date.now();
  const object = await c.env.R2.put("image" + id + date, file);

  const post_image_url = "/img/image" + id + date;

  await editPost(c.env, {
    id,
    post_image_url,
  });

  return c.html(<ImageInput id={id} post_image_url={post_image_url} />);
});

app.get("/img/:key", async (c) => {
  const obj = await c.env.R2.get(c.req.param("key"));
  if (!obj) return c.notFound();

  return new Response(obj.body, {
    headers: {
      "Content-Type":
        obj.httpMetadata?.contentType ?? "application/octet-stream",
      ETag: obj.httpEtag,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
});

export default app;
