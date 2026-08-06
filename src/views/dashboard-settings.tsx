import Button from "../components/button";
import Input from "../components/input";

export default function DashboardSettingsView() {
  return (
    <div class="p-4 pt-3 max-w-screen-lg w-full">
      <h1 class="text-xl">Settings</h1>
      <form
        hx-post="/dashboard/settings"
        hx-target="#title-status"
        hx-disabled-elt="find button"
        class="max-w-screen-sm gap-2"
      >
        <label>
          <p>Blog title</p>
          <Input type="text" name="title" />
        </label>
        <Button class="mt-4">Update</Button>
        <p id="title-status" class="text-sm" />
      </form>

      <hr class="max-w-screen-sm my-8" />

      <form
        hx-post="/dashboard/settings/auth"
        hx-target="#auth-status"
        hx-on-htmx-after-request="if(event.detail.successful) this.reset()"
        hx-disabled-elt="find button"
        class="max-w-screen-sm gap-2"
      >
        <label>
          <p>Old password</p>
          <Input
            type="password"
            name="old_password"
            autocomplete="current-password"
          />
        </label>
        <label>
          <p>New password</p>
          <Input
            type="password"
            name="new_password"
            autocomplete="new-password"
          />
        </label>
        <label>
          <p>Repeat new password</p>
          <Input
            type="password"
            name="repeat_new_password"
            autocomplete="new-password"
          />
        </label>
        <Button class="mt-4">Update password</Button>
        <p id="auth-status" class="text-sm" />
      </form>
    </div>
  );
}
