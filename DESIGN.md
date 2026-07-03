---
name: Obsidian Trace
colors:
  surface: '#131315'
  surface-dim: '#131315'
  surface-bright: '#39393b'
  surface-container-lowest: '#0e0e10'
  surface-container-low: '#1c1b1d'
  surface-container: '#201f22'
  surface-container-high: '#2a2a2c'
  surface-container-highest: '#353437'
  on-surface: '#e5e1e4'
  on-surface-variant: '#c7c4d7'
  inverse-surface: '#e5e1e4'
  inverse-on-surface: '#313032'
  outline: '#908fa0'
  outline-variant: '#464554'
  surface-tint: '#c0c1ff'
  primary: '#c0c1ff'
  on-primary: '#1000a9'
  primary-container: '#8083ff'
  on-primary-container: '#0d0096'
  inverse-primary: '#494bd6'
  secondary: '#ddb7ff'
  on-secondary: '#490080'
  secondary-container: '#6f00be'
  on-secondary-container: '#d6a9ff'
  tertiary: '#ffb783'
  on-tertiary: '#4f2500'
  tertiary-container: '#d97721'
  on-tertiary-container: '#452000'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e1e0ff'
  primary-fixed-dim: '#c0c1ff'
  on-primary-fixed: '#07006c'
  on-primary-fixed-variant: '#2f2ebe'
  secondary-fixed: '#f0dbff'
  secondary-fixed-dim: '#ddb7ff'
  on-secondary-fixed: '#2c0051'
  on-secondary-fixed-variant: '#6900b3'
  tertiary-fixed: '#ffdcc5'
  tertiary-fixed-dim: '#ffb783'
  on-tertiary-fixed: '#301400'
  on-tertiary-fixed-variant: '#703700'
  background: '#09090b'
  on-background: '#e5e1e4'
  surface-variant: '#353437'
  foreground: '#fafafa'
  muted: '#71717a'
  border: '#27272a'
  verified: '#10b981'
  manual: '#f59e0b'
  rejected: '#f43f5e'
  warning: '#f97316'
  indigo-accent: '#4f46e5'
typography:
  headline-lg:
    fontFamily: Geist
    fontSize: 30px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Geist
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Geist
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Geist
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  label-md:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Geist
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 12px
    letterSpacing: 0.05em
  mono:
    fontFamily: Geist
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 20px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  container-max: 1440px
  gutter: 1rem
  margin-mobile: 1rem
  margin-desktop: 2rem
  row-height-dense: 2.5rem
  row-height-standard: 3.5rem
---

## Brand & Style

The design system is an **Audit-First, High-Density** framework designed for professional security environments. It prioritizes operational traceability and objective neutrality, moving away from "policing" aesthetics toward a refined, secure, and clinical interface.

The design style is **Corporate Modern with a Minimalist/Linear influence**. It utilizes a deep-space background to reduce eye strain during long shifts, high-contrast typography for immediate legibility, and a rigorous adherence to functional hierarchy. Every pixel is dedicated to information density, ensuring that security operators can process high volumes of data without visual fatigue.

Key stylistic pillars:
- **Clinical Neutrality:** Using objective color coding and language to maintain professional distance.
- **Security through Minimization:** Hiding sensitive data (DNI masking) by default.
- **Precision Engineering:** Subtle borders and strict grid alignment to convey reliability.

## Colors

The palette is anchored in a **Deep Charcoal and Black** foundation to create a sophisticated, high-contrast environment. The primary accent is a refined **Electric Indigo**, moving away from generic blues to a more distinctive, technological hue.

### Semantic Mapping
- **VERIFIED (Success):** Emerald is used for trusted entries and approved states.
- **MANUAL (Neutral/Pending):** Amber represents manual audits and pending reviews, signaling a need for human attention without indicating an error.
- **REJECTED (Danger):** Rose is reserved for rejected entries and critical terminal states.
- **WARNING (Attention):** Orange identifies operational alerts and non-blocking issues.

### Application
Surface colors use varying degrees of the neutral scale (from `#09090b` for the canvas to `#18181b` for cards) to create depth. Borders are kept thin and subtle using the `#27272a` token to define structure without adding visual noise.

## Typography

This design system uses **Geist** for its exceptional clarity and technical aesthetic. The typographic scale is optimized for **High Information Density**, favoring slightly smaller font sizes with generous line-heights and tight letter-spacing for headlines.

**Usage Guidelines:**
- **Mono Stylings:** For DNI numbers (masked), capacity indicators `[420 / 500]`, and timestamps, use the Mono-spaced variant of Geist to ensure vertical alignment in tables.
- **Labels:** Use `label-sm` for table headers and status badges.
- **Headlines:** Use `headline-lg` sparingly, primarily for main dashboard views. Content-heavy detail views should default to `headline-md`.
- **Privacy:** All DNI text must be rendered with a subtle blur or masking pattern (e.g., `80***123`) until hovered or explicitly toggled.

## Layout & Spacing

The layout utilizes a **Fixed-Fluid Hybrid Grid**. The sidebar and navigation are fixed, while the primary content area expands to a `container-max` of 1440px.

### Operational Density
- **Tables:** Optimized for at least 7 columns. Use `row-height-dense` for large data logs (Entries Tab) to maximize visible records.
- **Tabs:** The Detail View must strictly support 6 tabs (Summary, Entries, Guest list, Simple incidents, Operators, Basic report) with horizontal scrolling on mobile.
- **Dashboards:** A responsive grid of 1 to 4 columns depending on screen width, prioritizing metric "Cards" at the top.

**Breakpoints:**
- **Mobile (<768px):** Single column, 16px margins, bottom-sheet menus for filters.
- **Desktop (1024px+):** 12-column grid, 24px margins, sidebar navigation persistent.

## Elevation & Depth

Visual hierarchy is achieved through **Tonal Layering** rather than traditional shadows. In this dark-mode environment, depth is conveyed by shifting the background lightness and using subtle borders.

- **Level 0 (Canvas):** `#09090b` — The base layer.
- **Level 1 (Cards/Sections):** `#18181b` — Slightly lighter, used for dashboard widgets and table containers.
- **Level 2 (Popovers/Modals):** `#27272a` — Used for floating elements like dropdowns and manual entry modals.

**Borders:** All interactive components use a 1px border (`#27272a`). For active states or focus, the border transitions to the primary Indigo or the respective semantic color.

**Motion:** Utilize subtle Framer Motion-style transitions (200ms ease-out) for tab switching and row expansion. Table rows should have a very slight vertical "lift" (1px Y-offset) on hover to indicate interactivity.

## Shapes

The shape language is **Soft and Precise**. A 0.25rem (4px) base radius is used for all UI components, including inputs, buttons, and badges. This creates a professional, "tool-like" feel that is more approachable than sharp corners but more serious than rounded pill shapes.

- **Small elements (Badges/Checkboxes):** 4px (`rounded`).
- **Containers (Cards/Modals):** 8px (`rounded-lg`).
- **Status Indicators:** Use small circular dots or squares with 2px radius for status iconography within lists.

## Components

### Buttons
- **Primary:** Electric Indigo background with white text. High contrast, 4px radius.
- **Secondary:** Ghost style, `#27272a` border, subtle hover state.
- **Destructive:** Rose background, used for "Reject Entry" or "Suspend Venue."

### Badges (Status Indicators)
Badges are essential for the "Product Language." They use a low-opacity background of the semantic color with high-opacity text.
- **VERIFIED:** Emerald tint, labeled "Ingreso verificado por ID-Night."
- **MANUAL:** Amber tint, labeled "Ingreso manual con DNI físico."
- **WARNING:** Orange tint, labeled "Advertencia operativa."

### Input Fields
- Dark backgrounds (`#09090b`) with a 1px border (`#27272a`).
- Text color `#fafafa` with `#71717a` for placeholders.
- Focus state: Border transitions to Indigo with a subtle glow (2px spread).

### Tables & Lists
- High-density rows. Alternating "Zebra" striping is discouraged; use subtle 1px bottom borders instead.
- **Filtering:** A dedicated filter bar above tables supporting up to 5 concurrent filters (Status, Date, Method, etc.).

### Cards
- Used for aggregate metrics (Capacity, Total Entries). 
- Format for capacity: `[Current] / [Max]` in large, high-contrast Mono font.