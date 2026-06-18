---
name: Lumina Nexus
colors:
  surface: '#f7f9fb'
  surface-dim: '#d8dadc'
  surface-bright: '#f7f9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f6'
  surface-container: '#eceef0'
  surface-container-high: '#e6e8ea'
  surface-container-highest: '#e0e3e5'
  on-surface: '#191c1e'
  on-surface-variant: '#424754'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eff1f3'
  outline: '#727785'
  outline-variant: '#c2c6d6'
  surface-tint: '#005ac2'
  primary: '#0058be'
  on-primary: '#ffffff'
  primary-container: '#2170e4'
  on-primary-container: '#fefcff'
  inverse-primary: '#adc6ff'
  secondary: '#565e74'
  on-secondary: '#ffffff'
  secondary-container: '#dae2fd'
  on-secondary-container: '#5c647a'
  tertiary: '#924700'
  on-tertiary: '#ffffff'
  tertiary-container: '#b75b00'
  on-tertiary-container: '#fffbff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d8e2ff'
  primary-fixed-dim: '#adc6ff'
  on-primary-fixed: '#001a42'
  on-primary-fixed-variant: '#004395'
  secondary-fixed: '#dae2fd'
  secondary-fixed-dim: '#bec6e0'
  on-secondary-fixed: '#131b2e'
  on-secondary-fixed-variant: '#3f465c'
  tertiary-fixed: '#ffdcc6'
  tertiary-fixed-dim: '#ffb786'
  on-tertiary-fixed: '#311400'
  on-tertiary-fixed-variant: '#723600'
  background: '#f7f9fb'
  on-background: '#191c1e'
  surface-variant: '#e0e3e5'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Inter
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.015em
  body-base:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: -0.01em
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: 0em
  label-caps:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  mono-data:
    fontFamily: Geist
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 18px
    letterSpacing: 0em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base-unit: 4px
  container-max: 1280px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 40px
  stack-xs: 4px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 32px
  stack-xl: 64px
---

## Brand & Style

The design system is engineered for high-performance SaaS environments where clarity, speed, and precision are paramount. It draws inspiration from the "utility-luxe" aesthetic—combining the functional rigor of developer tools with the polished elegance of premium consumer software.

The visual narrative is built on **Modern Minimalism** infused with **Glassmorphism**. It prioritizes a "content-first" approach, using expansive whitespace and high-quality typography to reduce cognitive load. The emotional response is one of absolute reliability, technical sophistication, and forward-thinking innovation. Every interaction should feel intentional, frictionless, and premium.

## Colors

The palette is anchored by a pure white background to maximize contrast and clarity. 

- **Primary (Electric Blue):** Used sparingly for critical actions, active states, and focus indicators to maintain its "vibrant" impact.
- **Neutrals (Slate Grays):** A refined scale of slates provides the structural hierarchy. `#0f172a` is reserved for headings and primary text to ensure maximum legibility, while `#475569` handles secondary information.
- **Glass Surfaces:** Elements use a semi-transparent white (`rgba(255, 255, 255, 0.7)`) combined with a heavy backdrop-blur (20px+) to create a sense of physical layering without clutter.
- **Borders:** A consistent 1px stroke in `#e2e8f0` defines boundaries with surgical precision.

## Typography

This design system utilizes **Inter** for its neutral, highly legible character, specifically tuned with tight tracking (`-0.01em` to `-0.02em`) to achieve a modern, "tucked-in" look characteristic of high-end dashboards. 

For technical data, code snippets, or secondary labels, **Geist** is introduced to provide a subtle developer-centric nod, offering a monospaced-adjacent feel that enhances the "next-generation" tech mood. Typography should follow a strict hierarchy where the largest displays are bold and tight, while body text remains breathable and functional.

## Layout & Spacing

The system employs a **Fluid-Fixed Hybrid Grid**. While the layout expands to fill the screen, content is typically housed within a maximum-width container of 1280px to maintain readability. 

- **Grid:** A 12-column grid system is used for desktop, shifting to a 4-column grid for mobile.
- **Rhythm:** Spacing follows a 4px base unit. Internal component padding should prioritize generous horizontal breathing room (e.g., a button with 12px vertical and 24px horizontal padding).
- **Reflow:** On mobile, margins reduce from 40px to 16px. Glass panels that float on desktop may transition to full-width pinned elements on mobile to maximize screen real estate.

## Elevation & Depth

Hierarchy is established through a combination of **Tonal Layering** and **Multi-Layered Ambient Shadows**. 

1.  **Level 0 (Base):** Pure white background (`#ffffff`).
2.  **Level 1 (Subtle):** Floating cards or navigation bars using the Glassmorphism effect (Semi-transparent white + 24px Backdrop Blur).
3.  **Level 2 (Active):** High-elevation elements like modals or dropdowns. 

**Shadow Specification:** Shadows should be ultra-diffused. Use a triple-layer approach for Level 2 elements:
- Layer 1: `0 1px 2px rgba(0,0,0,0.05)` (Sharp definition)
- Layer 2: `0 4px 6px rgba(0,0,0,0.02)` (Soft spread)
- Layer 3: `0 10px 15px rgba(0,0,0,0.03)` (Ambient depth)

## Shapes

The shape language is consistently "Rounded" to soften the technical edge of the SaaS data. 

- **Standard Elements:** Buttons, inputs, and small chips use a `0.5rem` (8px) radius.
- **Surface Containers:** Cards and large panels use `rounded-lg` (`1rem` / 16px) to create a distinct frame for content. 
- **Interactive States:** Hovering over list items should reveal a `0.5rem` rounded background highlight in a subtle neutral tone (`#f1f5f9`).

## Components

- **Buttons:** Primary buttons use the Electric Blue background with white text. Ghost buttons use a 1px border (`#e2e8f0`) and subtle slate text. All buttons have a high-gloss hover state where the background opacity increases slightly.
- **Glass Navigation:** The top navigation bar must be sticky, utilizing the `glass_surface` token and a 1px bottom border.
- **Analytics Cards:** These feature a subtle internal gradient (White to `#f8fafc`), 16px corner radius, and contain "Sparklines" in Electric Blue for data visualization.
- **Input Fields:** Minimalist design with a 1px border. On focus, the border transitions to Electric Blue with a soft 4px blue outer glow (0.15 opacity).
- **Chips/Badges:** Small, `label-caps` typography, with a light gray background (`#f1f5f9`) and slate text. Status badges (Success/Error) use low-saturation tinted backgrounds.
- **Data Tables:** No vertical borders. Only subtle 1px horizontal dividers. The header row uses `label-caps` for clear distinction.