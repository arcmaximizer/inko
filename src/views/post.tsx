import type { FC } from "hono/jsx";

type PostProps = {
  title: string;
  desc: string;
  children?: any;
};

const PostView: FC<PostProps> = (props) => {
  return (
    <div class="max-w-screen-md mx-auto text-center space-y-2">
      <h1 class="text-4xl font-semibold">{props.title}</h1>
      <p>{props.desc}</p>
      <div class="rounded w-full bg-red-200 aspect-[16/9]" />
      <div class="text-left">{props.children}</div>
    </div>
  );
};

export default PostView;
