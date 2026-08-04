import type { PropsWithChildren, JSX } from "hono/jsx";
import clsx from "clsx";

export default function Input(props: InputProps) {
  return <input {...props} class={clsx("py-1 px-2 border w-full")} />;
}

type InputProps = PropsWithChildren<JSX.IntrinsicElements["input"]>;
