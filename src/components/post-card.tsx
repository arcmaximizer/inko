import type { Post } from "../db";
import type { JSX } from "hono/jsx";

import clsx from "clsx";

export default function PostCard(props: PostCardProps) {
  const { post } = props;

  const href = `/post/${post.id}`;

  return (
    <a
      class={clsx("flex gap-2", props["class"])}
      href={props.href ?? href}
      {...props}
    >
      {post.post_image_url ? (
        <img src={post.post_image_url} class="aspect-[3/2] w-48" />
      ) : (
        <div class="aspect-[3/2] w-48" />
      )}
      <div>
        <h2 class="font-semibold text-lg">{post.title}</h2>
        <p>{post.subtitle}</p>
      </div>
    </a>
  );
}

type PostCardProps = {
  post: Post;
} & JSX.IntrinsicElements["a"];
