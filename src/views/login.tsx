import Button from "../components/button";
import Input from "../components/input";

export default function LoginPage() {
  return (
    <div>
      <form
        action="/login"
        method="post"
        hx-boost
        class="max-w-screen-sm mx-auto mt-24 gap-2"
      >
        <label>
          <p>Username</p>
          <Input type="text" name="username" />
        </label>
        <label>
          <p>Password</p>
          <Input type="password" name="password" />
        </label>
        <Button>Log in</Button>
      </form>
    </div>
  );
}
