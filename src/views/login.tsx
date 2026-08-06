import Button from "../components/button";
import Input from "../components/input";

export default function LoginPage() {
  return (
    <div>
      <form
        hx-post="/login"
        hx-target="#login-status"
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
        <Button class="my-4">Log in</Button>
        <p id="login-status" />
      </form>
    </div>
  );
}
