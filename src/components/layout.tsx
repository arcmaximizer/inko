import type { FC, PropsWithChildren } from "hono/jsx";

const Layout = (props: LayoutProps) => {
  return (
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{props.title}</title>
        <script src="/htmx.min.js"></script>
        <link rel="stylesheet" href="/style.css" />
      </head>

      <body>
        <header className="fixed text-xl px-4 h-11 py-2 border-b w-full bg-white">
          {props.title}
        </header>
        <div className="h-11" />

        {props.children}
      </body>
    </html>
  );
};

export interface LayoutProps extends PropsWithChildren {
  title: string;
}

export default Layout;
