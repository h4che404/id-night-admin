import { render, screen } from "@testing-library/react";
import type { ComponentPropsWithoutRef } from "react";
import { describe, expect, it, vi } from "vitest";

const usePathnameMock = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => usePathnameMock(),
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: ComponentPropsWithoutRef<"a"> & { href: string }) => (
    <a href={href} {...props}>
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

    const eventsLink = screen.getByRole("link", { name: /events/i });

    expect(eventsLink).toHaveAttribute("href", "/venue/events");
  });
});
