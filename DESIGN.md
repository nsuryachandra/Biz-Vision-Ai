---
name: BizVision AI
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf6'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e6eeff'
  surface-container-high: '#dde9ff'
  surface-container-highest: '#d3e3ff'
  on-surface: '#0b1c30'
  on-surface-variant: '#464555'
  inverse-surface: '#213146'
  inverse-on-surface: '#ebf1ff'
  outline: '#777587'
  outline-variant: '#c7c4d8'
  surface-tint: '#4d44e3'
  primary: '#3323cc'
  on-primary: '#ffffff'
  primary-container: '#4d44e3'
  on-primary-container: '#d7d4ff'
  inverse-primary: '#c3c0ff'
  secondary: '#565e74'
  on-secondary: '#ffffff'
  secondary-container: '#d7dff9'
  on-secondary-container: '#5a6278'
  tertiary: '#444749'
  on-tertiary: '#ffffff'
  tertiary-container: '#5c5f61'
  on-tertiary-container: '#d7d9db'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e2dfff'
  primary-fixed-dim: '#c3c0ff'
  on-primary-fixed: '#0f0069'
  on-primary-fixed-variant: '#3323cc'
  secondary-fixed: '#dae2fc'
  secondary-fixed-dim: '#bec6e0'
  on-secondary-fixed: '#131b2e'
  on-secondary-fixed-variant: '#3e465b'
  tertiary-fixed: '#e1e3e5'
  tertiary-fixed-dim: '#c5c7c9'
  on-tertiary-fixed: '#191c1e'
  on-tertiary-fixed-variant: '#444749'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e3ff'
  background-alt: '#f8f9ff'
  glass-border: rgba(77, 68, 227, 0.2)
  primary-glow: rgba(77, 68, 227, 0.15)
  error-alert: '#ba1a1a'
typography:
  display-lg:
    fontFamily: Bricolage Grotesque
    fontSize: 64px
    fontWeight: '800'
    lineHeight: 72px
    letterSpacing: -0.04em
  display-lg-mobile:
    fontFamily: Bricolage Grotesque
    fontSize: 40px
    fontWeight: '800'
    lineHeight: 44px
    letterSpacing: -0.04em
  headline-md:
    fontFamily: Bricolage Grotesque
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
    letterSpacing: normal
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
    letterSpacing: normal
  label-caps:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  nav-link:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 32px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 48px
  container-max: 1280px
---

## Brand & Style

BizVision AI embodies **Illuminated Intelligence**. The brand personality is professional, visionary, and high-tech, targeted at venture capitalists and startup founders who require industrial-grade data analysis. 

The design style is a sophisticated blend of **Modern Corporate** and **Glassmorphism**. It utilizes a clean, white-dominant aesthetic punctuated by vibrant violet accents and "intelligent" visual cues like asymmetric gradients and glowing neural-network textures. The interface feels light and breathable yet carries the weight of authority through bold, high-contrast typography and structured bento-style layouts. 

Key emotional responses should be:
- **Precision:** Through sharp layouts and data-driven visualizations.
- **Innovation:** Through subtle motion, blur effects, and futuristic glow.
- **Trust:** Through a grounded, neutral background and clear information hierarchy.

## Colors

The palette is anchored by **Deep Indigo (#3525cd)**, representing intelligence and depth. This is supported by a sophisticated "Off-White" system for backgrounds and containers to maintain a premium, airy feel.

- **Primary:** Used for brand identity, primary actions, and high-importance highlights.
- **Secondary:** Used for supporting text, navigation items, and less-critical UI elements.
- **Surface System:** Uses a range of cool-toned blues and grays (from `#f8f9ff` to `#eff4ff`) to create subtle tonal separation without relying on heavy borders.
- **High-Contrast Accents:** The use of "On-Background" (near black) for specific bento cards provides a dramatic visual break and highlights premium features.
- **Functional Colors:** A clear Error red is reserved for risk modeling and anomaly detection to ensure immediate user attention.

## Typography

The typography system is tiered to balance character with utility:

1. **Display & Headlines:** Use **Bricolage Grotesque**. This font provides a distinctive, quirky, yet professional edge that defines the brand's creative-tech crossover. Tight letter spacing and aggressive line heights are preferred for large headings.
2. **Body Copy:** Use **Inter**. Chosen for its exceptional legibility in data-rich environments. It remains neutral and lets the headlines shine.
3. **Labels & Technical Data:** Use **Geist**. This mono-influenced sans-serif is used for uppercase badges, secondary metadata, and "developer-style" UI accents to reinforce the AI/Technical theme.

## Layout & Spacing

The system follows a **12-column Fixed Grid** logic for desktop, constrained to a max-width of 1280px. 

- **Asymmetry:** Layouts should embrace asymmetrical compositions, especially in the hero sections, using large offset images or radial background glows to break the rigid grid.
- **Bento Grid Logic:** Content-heavy sections should use a Bento Grid layout with varying column/row spans (e.g., 8-4 or 5-7 splits) to create visual interest and hierarchy.
- **Rhythm:** A 4px base unit governs all spacing. Vertical "stacks" typically use 16px or 32px to maintain breathing room between modules.
- **Mobile Adaptation:** At the 768px breakpoint, the 12-column grid collapses to a single-column stack. Margins reduce from 48px to 16px. Display font sizes scale down significantly (approx 40% reduction) to ensure readability.

## Elevation & Depth

Depth is primarily achieved through **Glassmorphism** and **Asymmetric Blurs** rather than traditional drop shadows.

- **Surface Layers:** The background is an asymmetric gradient mix. Above this, "Glass Panels" use 16px backdrop blurs and semi-transparent white fills (`rgba(255,255,255,0.6)`).
- **Outer Borders:** Elements are defined by thin, low-contrast borders (20% opacity primary color) instead of heavy shadows.
- **Interactive Depth:** On hover, bento items and cards should slightly scale (1.01x) and increase their border opacity or background brightness.
- **Glows:** Key interactive areas (like the primary search input) use a custom `primary-glow` (15% opacity primary color) to indicate focus and activity, creating a "pulsing" digital effect.

## Shapes

The shape language is modern and approachable with a "Rounded" (Level 2) baseline.

- **Standard Elements:** Buttons and small containers use a **0.5rem (8px)** radius.
- **Large Containers/Cards:** Bento grid items and hero sections use **1.5rem (24px)** or **2rem (32px)** to feel distinct and substantial.
- **Specialty Shapes:** Pill shapes (999px) are reserved exclusively for status badges, tags, and tertiary "capsule" buttons.
- **Decorative:** Decorative background elements (glows, data visuals) use extreme blurs and organic, rounded-polygon paths to soften the technical layout.

## Components

### Buttons
- **Primary:** Solid `#3525cd` fill with white text. High-contrast, bold weight. Includes a subtle box-shadow with a 30% primary color tint on hover.
- **Secondary/Ghost:** Transparent background with `#3525cd` text and a light hover state (surface-container fill).
- **Icon Support:** Use Material Symbols (Outlined) consistently within buttons for directional cues (e.g., `arrow_forward_ios`).

### Input Fields
- **Glass Input:** Large, high-height (py-5) inputs with no background fill (transparent), relying on a glass-morphic container. Focus states must trigger the `primary-glow` and a border color shift to `#3525cd`.

### Bento Cards
- **Variations:** 
    1. **Light:** Surface-container-low fill with a light border.
    2. **Dark:** On-background fill with primary-fixed-dim text for high-impact features.
    3. **Hybrid:** Split cards with one side containing text and the other a blurred image or data visualization.

### Chips & Badges
- **Status Badges:** Pill-shaped, using 5% primary fill with a 10% primary border. Text is `label-caps`.
- **Category Tags:** Small, uppercase labels with a leading dot indicator for taxonomy.

### Navigation
- **Top Bar:** Fixed, blurring the background as it scrolls. Height reduces from 80px to 64px on scroll to maximize viewport space.