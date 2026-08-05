import type { Post } from "../db";
import Button from "../components/button";
import ImageInput from "../components/image-input";

export default function EditorView(props: EditorProps) {
  return (
    <div>
      <input type="hidden" id="content" name="content" />

      <link
        href="https://cdn.jsdelivr.net/npm/quill@2.0.3/dist/quill.snow.css"
        rel="stylesheet"
      />

      <div class="max-w-screen-2xl mx-auto fixed left-0 right-0 top-0 p-4 flex justify-between pointer-events-none">
        <div>
          <Button asChild>
            <a href="/dashboard/posts" class="pointer-events-auto">
              Back to dashboard
            </a>
          </Button>
        </div>
        <div class="flex flex-col gap-2 pointer-events-auto">
          <Button
            hx-put={"/api/publish/" + props.post.id}
            hx-include="#content, #title, #subtitle"
            hx-trigger="click"
            onclick="syncQuill()"
          >
            Publish
          </Button>
          <Button
            hx-put={"/api/save/" + props.post.id}
            hx-include="#content, #title, #subtitle"
            hx-trigger="click"
            onclick="syncQuill()"
          >
            Save Draft
          </Button>
        </div>
      </div>
      <div class="max-w-screen-xl mx-auto pt-12 pb-8 px-4">
        <input
          class="text-3xl text-center font-semibold w-full max-w-screen-sm mx-auto block"
          value={props.post.title}
          type="text"
          name="title"
          id="title"
        ></input>
        <input
          class="text-center w-full mx-auto mt-2 max-w-screen-sm mb-2 block"
          type="text"
          name="subtitle"
          id="subtitle"
          value={props.post.subtitle ?? "Insert subtitle here"}
        ></input>
        {/* Following label component taken from Claude (Anthropic) */}
        <ImageInput
          post_image_url={props.post.post_image_url}
          id={props.post.id}
        />
        <div class="mb-8" />
        <div id="editor"></div>
      </div>

      <script
        dangerouslySetInnerHTML={{
          __html: `

  const quill = new Quill('#editor', {
    theme: 'snow'
  });

  // This is really hacky - it's just server side concatenation of JS. TODO: Make this good
  const initialContent = ${props.post.editor_content || '""'}

  quill.setContents(initialContent)


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
