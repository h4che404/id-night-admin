import { cloneElement, isValidElement, type ReactElement, type ReactNode } from "react";

/**
 * Renders an async Server Component tree far enough for a test to assert on it.
 *
 * React's test renderer will not await an async component, so a page that fetches before it
 * returns arrives as an unresolved element. This walks the tree, awaits any async component it
 * finds, and clones the result back into place.
 *
 * It lived in four test files as four hand-copied variants, each typed a little differently and
 * three of them not quite correctly — seven of this repository's fifteen standing type errors
 * came from that duplication rather than from anything the tests were trying to say.
 *
 * The type that was missing: an async Server Component returns a promise of something
 * renderable. Saying so is what removes the casts.
 */
export async function resolveAsyncNode(node: ReactNode): Promise<ReactNode> {
  if (Array.isArray(node)) {
    return Promise.all(node.map((child) => resolveAsyncNode(child)));
  }

  if (!isValidElement(node)) {
    return node;
  }

  const element = node as ReactElement<{ children?: ReactNode }>;

  if (typeof element.type === "function" && element.type.constructor.name === "AsyncFunction") {
    const renderAsync = element.type as (props: unknown) => Promise<ReactNode>;
    return resolveAsyncNode(await renderAsync(element.props));
  }

  if (element.props.children === undefined) {
    return element;
  }

  const resolvedChildren = await resolveAsyncNode(element.props.children);

  return Array.isArray(resolvedChildren)
    ? cloneElement(element, undefined, ...resolvedChildren)
    : cloneElement(element, undefined, resolvedChildren);
}
