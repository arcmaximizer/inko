import type { PropsWithChildren, JSX } from "hono/jsx";
import { isValidElement, cloneElement } from "hono/jsx";
import clsx from "clsx";

import { fault, error } from "../lib/error";

const variantClasses = {
  default: "px-2 py-1 border bg-zinc-100 hover:bg-zinc-200",
  link: "text-blue-600 underline hover:text-blue-800",
};

export default function Button(
  props: PropsWithChildren<JSX.IntrinsicElements["button"]> & {
    variant?: "default" | "link";
    asChild?: boolean;
  },
) {
  const { asChild, variant, class: className, children, ...other } = props;

  const merged = clsx(
    "hover:cursor-pointer",
    variantClasses[variant ?? "default"],
    className,
  );

  if (asChild) {
    const child = Array.isArray(children) ? children[0] : children;
    if (!isValidElement(child)) throw fault("Invalid child!");

    const childProps = child.props as Record<string, any>;

    return cloneElement(child, {
      class: clsx(merged, childProps["class"]),
      ...other,
    }) as any;
  }

  return (
    <button class={merged} {...other}>
      {children}
    </button>
  );
}
