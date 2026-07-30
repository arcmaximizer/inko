import type { FC, PropsWithChildren } from "hono/jsx";
import NavLink from "./navlink";

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
        {!props.noHeader && (
          <>
            <header className="fixed text-xl px-4 h-11 py-2 border-b w-full bg-white">
              <NavLink href="/">{props.title}</NavLink>
            </header>
            <div className="h-11" />
          </>
        )}

        {props.children}
      </body>
    </html>
  );
};

export interface LayoutProps extends PropsWithChildren {
  title: string;
  noHeader?: boolean;
}

export default Layout;
