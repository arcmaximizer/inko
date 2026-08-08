import type { FC } from "hono/jsx";
import type { Post } from "../db";

import { QuillDeltaToHtmlConverter } from "quill-delta-to-html";

import { error, fault } from "../lib/error";

type PostProps = {
  post: Post;
  blog_title: string;
  base_uri: string;
  children?: any;
};

const PostView: FC<PostProps> = (props) => {
  if (!props.post.editor_content) throw error("No post content");
  if (!props.post.is_published) throw error("Not published");

  const delta = JSON.parse(props.post.editor_content);

  const converter = new QuillDeltaToHtmlConverter(delta.ops, {});
  const html = converter.convert();

  return (
    <>
      {/* Open Graph */}
      <meta property="og:type" content="article" />
      <meta property="og:title" content={props.post.title} />
      <meta property="og:description" content={props.post.subtitle} />
      <meta
        property="og:url"
        content={`${props.base_uri}/posts/${props.post.id}`}
      />
      <meta property="og:site_name" content={props.blog_title} />

      {props.post.post_image_url && (
        <>
          <meta property="og:image" content={props.post.post_image_url} />
          <meta property="og:image:alt" content={props.post.title} />
        </>
      )}
      <meta
        name="twitter:card"
        content={props.post.post_image_url ? "summary_large_image" : "summary"}
      />

      <div class="max-w-screen-xl mx-auto pt-12 pb-8">
        <h1 class="text-3xl text-center font-semibold w-fit mx-auto">
          {props.post.title}
        </h1>
        <p class="text-center w-fit mx-auto mt-2 mb-2">
          {props.post.subtitle ?? ""}
        </p>
        {props.post.post_image_url ? (
          <img
            src={props.post.post_image_url}
            class="w-full mx-auto max-w-screen-sm"
          />
        ) : (
          <hr class="my-4" />
        )}
        <div class="mb-8" />
        <div
          class="prose max-w-200 px-4 pb-4 w-full mx-auto"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    </>
  );
};

export default PostView;
