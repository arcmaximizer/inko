export default function PostView({ title, desc, content }: PostViewProps) {
  return (
    <article>
      <h1>{title}</h1>
      <p>{desc}</p>
      <hr />
      <main>{children}</main>
    </article>
  );
}

export interface PostViewProps {
  title: string;
  desc: string;
  children: ReactNode;
}
