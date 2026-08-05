import Button from "../components/button";
import Input from "../components/input";

export default function SetupPage() {
  return (
    <div>
      <form
        action="/setup"
        method="post"
        hx-boost
        class="max-w-screen-sm mx-auto mt-24 space-y-4"
      >
        <h1 class="text-center text-xl font-semibold">Set up your blog</h1>
        <label class="block">
          <p>Blog name</p>
          <Input type="text" name="blog_name" placeholder="ARC Blog" />
        </label>
        <label class="block">
          <p>Username</p>
          <Input type="text" name="admin_username" placeholder="arcmaximizer" />
        </label>
        <label class="block">
          <p>Password</p>
          <Input type="password" name="password" />
        </label>
        <Button>Set up</Button>
      </form>
    </div>
  );
}
