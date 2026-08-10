import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentPropsWithoutRef } from "react";
import { describe, expect, it, vi } from "vitest";

const usePathnameMock = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => usePathnameMock(),
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    prefetch,
    ...props
  }: ComponentPropsWithoutRef<"a"> & { href: string; prefetch?: boolean }) => (
    <a href={href} data-prefetch={String(prefetch)} {...props}>
      {children}
    </a>
  ),
}));

import { AppShell } from "@/components/app-shell";

describe("AppShell", () => {
  it("renders a reachable Events navigation entry", () => {
    usePathnameMock.mockReturnValue("/venue/events");

    render(
      <AppShell userName="Admin User" userEmail="admin@example.com">
        <div>Dashboard content</div>
      </AppShell>,
    );

    const eventsLink = screen.getByRole("link", { name: /eventos/i });

    expect(eventsLink).toHaveAttribute("href", "/venue/events");
    // At rest, nothing is warmed. Seven sidebar links prefetched on sight meant seven routes
    // reaching the backend on every page load, paid for whether or not anybody clicked.
    expect(eventsLink).toHaveAttribute("data-prefetch", "false");
  });

  it("warms a route once somebody shows they are going there", async () => {
    usePathnameMock.mockReturnValue("/venue");

    render(
      <AppShell userName="Admin User" userEmail="admin@example.com">
        <div>Dashboard content</div>
      </AppShell>,
    );

    const eventsLink = screen.getByRole("link", { name: /eventos/i });
    await userEvent.hover(eventsLink);

    // Hover is the moment somebody has decided, and it buys the fraction of a second between
    // deciding and clicking. Null rather than true: the default warms the loading boundary and
    // the shared layout, not a fully rendered page.
    expect(eventsLink).toHaveAttribute("data-prefetch", "null");
  });
});
