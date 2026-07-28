import type { Post } from "../db";
import PostCard from "../components/post-card";
import NavLink from "../components/navlink";

export default function DashboardPostsView({ posts }: DPVProps) {
  const cards = posts.map((post) => <PostCard post={post} />);

  return (
    <div class="p-4 pt-3 max-w-screen-lg w-full">
      <h1 class="text-xl">Posts ({posts.length})</h1>

      {posts.length == 0 && (
        <p>
          There doesn't seem to be any posts here.{" "}
          <NavLink
            hx-boost="true"
            href="/editor/new"
            hx-post="/editor/new"
            hx-trigger="click"
          >
            Create one?
          </NavLink>
        </p>
      )}
      <ul>{cards}</ul>
    </div>
  );
}

interface DPVProps {
  posts: Post[];
}
