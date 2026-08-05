import Button from "../components/button";
import Input from "../components/input";

export default function DashboardSettingsView() {
  return (
    <div class="p-4 pt-3 max-w-screen-lg w-full">
      <h1 class="text-xl">Settings</h1>
      <form
        action="/dashboard/settings"
        method="post"
        hx-boost
        class="max-w-screen-sm gap-2"
      >
        <label>
          <p>Blog title</p>
          <Input type="text" name="title" />
        </label>

        <Button>Update</Button>
      </form>

      <hr class="max-w-screen-sm my-8" />

      <form
        action="/dashboard/settings/auth"
        method="post"
        hx-boost
        class="max-w-screen-sm gap-2"
      >
        <label>
          <p>Old password</p>
          <Input type="password" name="old_password" />
        </label>
        <label>
          <p>New password</p>
          <Input type="password" name="new_password" />
        </label>
        <Button>Update password</Button>
      </form>
    </div>
  );
}
