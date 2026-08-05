import type { Post } from "../db";

// Following component taken and modified from Claude (Anthropic)
export default function ImageInput(props: ImageInputProps) {
  return (
    <label
      class={
        `relative mx-auto block max-w-screen-sm cursor-pointer border
              overflow-hidden
              focus-within:ring-2 focus-within:ring-neutral-400 ` +
        (props.post_image_url ? "" : "aspect-[3/2]")
      }
    >
      <input
        type="file"
        name="post_image"
        accept="image/*"
        class="sr-only"
        hx-put={`/api/image/${props.id}`}
        hx-encoding="multipart/form-data"
        hx-trigger="change"
        hx-target="closest label"
        hx-swap="outerHTML"
      />

      {props.post_image_url ? (
        <img src={props.post_image_url} class="w-full object-fit" />
      ) : (
        <span class="absolute inset-0 grid place-items-center text-sm text-neutral-500">
          Click to add an image
        </span>
      )}
    </label>
  );
}

interface ImageInputProps {
  post_image_url?: string;
  id: number;
}
