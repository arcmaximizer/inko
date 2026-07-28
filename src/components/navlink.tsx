import type { PropsWithChildren, JSX } from "hono/jsx";
import clsx from "clsx";

type Classable = {
  class: string;
};

export default function NavLink(
  props: PropsWithChildren<JSX.IntrinsicElements["a"]>,
) {
  return (
    <a
      class={clsx(
        "text-blue-600 underline hover:text-blue-800",
        props["class"],
      )}
      {...props}
    >
      {props.children}
    </a>
  );
}
