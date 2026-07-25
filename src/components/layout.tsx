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
        <div className="p-4">
          <header className="text-xl mb-2">{props.title}</header>

          {props.children}
        </div>
      </body>
    </html>
  );
};

export interface LayoutProps extends PropsWithChildren {
  title: string;
}

export default Layout;
