import type { FC } from "hono/jsx";

type PostProps = {
  title: string;
  desc: string;
  children?: any;
};

const PostView: FC<PostProps> = (props) => {
  return (
    <div class="max-w-screen-lg mx-auto text-center">
      <section class="max-w-screen-md mx-auto space-y-4">
        <h1 class="text-4xl font-semibold">{props.title}</h1>
        <p>{props.desc}</p>
        <div class="rounded-xl w-full bg-linear-to-tr from-red-200 to-blue-400 aspect-[16/9]" />
      </section>
      <div class="text-left mt-4">{props.children}</div>
    </div>
  );
};

export default PostView;
