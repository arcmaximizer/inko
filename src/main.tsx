import { Hono } from "hono";
import { cors } from "hono/cors";
import type { D1Database } from "@cloudflare/workers-types";
import type { FC } from "hono/jsx";

import Layout from "./components/layout.tsx";
import PostView from "./views/post.tsx";

export type Env = {
  DB: D1Database;
  ASSETS: Fetcher;
};

const app = new Hono<{ Bindings: Env }>();

app.use("*", cors());

app.get("/", async (c) => {
  return c.html(<Layout title="Blog">i'm a homepage</Layout>);
});

app.get("/post/:id", async (c) => {
  /*
  const list = await c.env.MY_KV.list()
  const items = await Promise.all(
    list.keys.map(async (k: { name: string }) => {
      const value = await c.env.MY_KV.get(k.name)
      return html`<div class="flex justify-between p-2 bg-gray-600 rounded">
        <span class="font-mono">${k.name}</span>
        <span>${value}</span>
      </div>`
    })
  )*/

  const id = c.req.param("id");

  return c.html(
    <Layout title="Blog">
      <PostView title="Lorem ipsum sit amet" desc="Blabla">
        <p>I'm the body of a post! My ID is {id}</p>
      </PostView>
    </Layout>,
  );
});

export default app;
