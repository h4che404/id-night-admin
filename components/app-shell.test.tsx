import { render, screen } from "@testing-library/react";
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
    expect(eventsLink).toHaveAttribute("data-prefetch", "false");
  });
});
