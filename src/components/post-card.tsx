import type { Post } from "../db";
import type { JSX } from "hono/jsx";
import Link from "../components/navlink";

import clsx from "clsx";

export default function PostCard(props: PostCardProps) {
  const { post } = props;

  const href = `/post/${post.id}`;

  const date = new Date(
    (post.is_draft ? post.updated_at : post.published_at) ?? post.updated_at,
  );

  return (
    <div
      class={clsx("flex gap-2", props["class"])}

      {...props}
    >
      {post.post_image_url ? (
        <img src={post.post_image_url} class="aspect-[3/2] w-36" />
      ) : (
        <div class="aspect-[3/2] w-36 border" />
      )}
      <div>
        <Link href={props.href ?? href}>
          <h2 class="font-semibold text-lg">{post.title}</h2>
        </Link>
        <p>
          {post.is_draft
            ? `Last updated ${date.toLocaleString()}`
            : `Published ${date.toLocaleDateString()}`}
        </p>
        <p>{post.subtitle}</p>
      </div>
    </div>
  );
}

type PostCardProps = {
  post: Post;
} & JSX.IntrinsicElements["div"];
