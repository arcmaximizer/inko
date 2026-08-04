import type { Post } from "../db";
import PostCard from "../components/post-card";
import NavLink from "../components/navlink";
import Button from "../components/button";

export default function DashboardPostsView({
  posts,
  title = "Posts",
}: DPVProps) {
  const cards = posts.map((post) => (
    <li>
      <PostCard href={"/editor/" + post.id} post={post} />
    </li>
  ));

  return (
    <div class="p-4 pt-3 max-w-screen-lg w-full">
      <div class="flex items-center gap-4 mb-4">
        <h1 class="text-xl">
          {title} ({posts.length})
        </h1>

        <Button hx-post="/editor/new" hx-target="body">
          Create
        </Button>
      </div>

      {posts.length == 0 && (
        <p>
          There doesn't seem to be any posts here.{" "}
          <Button variant="link" hx-post="/editor/new" hx-target="body">
            Create one?
          </Button>
        </p>
      )}
      <ul class="space-y-4">{cards}</ul>
    </div>
  );
}

interface DPVProps {
  posts: Post[];
  title?: string;
}
