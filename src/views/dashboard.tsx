import NavLink from "../components/navlink";
import Button from "../components/button";
import type { PropsWithChildren } from "hono/jsx";

export default function DashboardLayout({ children }: PropsWithChildren) {
  return (
    <div class="flex flex-row">
      <nav class="border-r w-36 p-4 fixed h-[calc(100vh-2.75rem)] bg-white flex flex-col justify-between">
        <ul class="h-full space-y-2">
          <li>
            <NavLink href="/dashboard/posts">Posts</NavLink>
          </li>
          <li>
            <NavLink href="/dashboard/drafts">Drafts</NavLink>
          </li>
          <li>
            <NavLink href="/dashboard/settings">Settings</NavLink>
          </li>
        </ul>
        <div>
          <Button
            hx-post="/logout"
            class="w-full"
            hx-target="body"
            hx-push-url="/"
            hx-boost
          >
            Log out
          </Button>
        </div>
      </nav>
      <div class="min-w-36" />
      {children}
    </div>
  );
}
