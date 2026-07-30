import type { Post } from "../db";
import Button from "../components/button";

export default function EditorView(props: EditorProps) {
  return (
    <div>
      <input type="hidden" id="content" name="content" />

      <link
        href="https://cdn.jsdelivr.net/npm/quill@2.0.3/dist/quill.snow.css"
        rel="stylesheet"
      />
      <script src="https://cdn.jsdelivr.net/npm/quill@2.0.3/dist/quill.js"></script>

      <div class="max-w-screen-2xl mx-auto fixed left-0 right-0 top-0 p-4 flex justify-between">
        <div>
          <Button asChild>
            <a href="/dashboard/posts">Back to dashboard</a>
          </Button>
        </div>
        <div class="flex flex-col gap-2">
          <Button
            hx-put={"/api/publish/" + props.post.id}
            hx-include="#content"
            hx-trigger="click"
            onclick="syncQuill()"
          >
            Publish
          </Button>
          <Button
            hx-put={"/api/save/" + props.post.id}
            hx-include="#content"
            hx-trigger="click"
            onclick="syncQuill()"
          >
            Save Draft
          </Button>
        </div>
      </div>
      <div class="max-w-screen-xl mx-auto pt-12 pb-8 px-4">
        <h1 class="text-3xl text-center font-semibold w-fit mx-auto">
          {props.post.title}
        </h1>
        <p class="text-center w-fit mx-auto mt-2 mb-2">
          {props.post.subtitle ?? "Insert subtitle here"}
        </p>
        {props.post.post_image_url ? (
          <img
            src={props.post.post_image_url}
            class="w-full mx-auto max-w-screen-sm"
          />
        ) : (
          <div class="w-full aspect-[3/2] border max-w-screen-sm mx-auto" />
        )}
        <div class="mb-8" />
        <div id="editor"></div>
      </div>

      <script
        dangerouslySetInnerHTML={{
          __html: `
htmx.onLoad((content) => {
  const quill = new Quill('#editor', {
    theme: 'snow'
  });

  const initialContent = ${props.post.editor_content}

  quill.setContents(initialContent)
})

function syncQuill() {
  document.getElementById('content').value = JSON.stringify(quill.getContents());
}
`,
        }}
      ></script>
    </div>
  );
}

interface EditorProps {
  post: Post;
}
