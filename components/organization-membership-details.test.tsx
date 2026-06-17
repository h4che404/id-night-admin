import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { OrganizationMembershipDetails } from "@/components/organization-membership-details";

describe("OrganizationMembershipDetails", () => {
  it("renders organization name, translated role, and membership state", () => {
    render(
      <OrganizationMembershipDetails
        organizationName="Club Prisma Group"
        membershipRole="OWNER"
        membershipActive={true}
      />,
    );

    expect(screen.getByText("Organización")).toBeInTheDocument();
    expect(screen.getByText("Club Prisma Group")).toBeInTheDocument();
    expect(screen.getByText("Rol en la organización")).toBeInTheDocument();
    expect(screen.getByText("Propietario")).toBeInTheDocument();
    expect(screen.getByText("Membresía")).toBeInTheDocument();
    expect(screen.getByText("Activa")).toBeInTheDocument();
  });

  it("renders nothing when organization context is unavailable", () => {
    const { container } = render(
      <OrganizationMembershipDetails
        organizationName={null}
        membershipRole={null}
        membershipActive={null}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });
});
