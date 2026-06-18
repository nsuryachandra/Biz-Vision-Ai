---
name: Visionary Edge
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#464555'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#777587'
  outline-variant: '#c7c4d8'
  surface-tint: '#4d44e3'
  primary: '#3525cd'
  on-primary: '#ffffff'
  primary-container: '#4f46e5'
  on-primary-container: '#dad7ff'
  inverse-primary: '#c3c0ff'
  secondary: '#565e74'
  on-secondary: '#ffffff'
  secondary-container: '#dae2fd'
  on-secondary-container: '#5c647a'
  tertiary: '#46494b'
  on-tertiary: '#ffffff'
  tertiary-container: '#5e6163'
  on-tertiary-container: '#dadcde'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e2dfff'
  primary-fixed-dim: '#c3c0ff'
  on-primary-fixed: '#0f0069'
  on-primary-fixed-variant: '#3323cc'
  secondary-fixed: '#dae2fd'
  secondary-fixed-dim: '#bec6e0'
  on-secondary-fixed: '#131b2e'
  on-secondary-fixed-variant: '#3f465c'
  tertiary-fixed: '#e0e3e5'
  tertiary-fixed-dim: '#c4c7c9'
  on-tertiary-fixed: '#191c1e'
  on-tertiary-fixed-variant: '#444749'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  display-lg:
    fontFamily: Bricolage Grotesque
    fontSize: 72px
    fontWeight: '800'
    lineHeight: '1.1'
    letterSpacing: -0.04em
  headline-lg:
    fontFamily: Bricolage Grotesque
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Bricolage Grotesque
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Bricolage Grotesque
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  label-mono:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '500'
    lineHeight: '1'
    letterSpacing: 0.05em
  caption:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1.4'
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 4px
  container-max: 1440px
  grid-gutter: 24px
  grid-margin: 40px
  bento-gap: 12px
---

## Brand & Style
The design system embodies a Neo-Minimalist aesthetic tailored for high-end SaaS and AI-driven platforms. It aims to evoke a sense of precision, authority, and "next-gen" sophistication. The interface balances the cold efficiency of technical data with the warmth of high-end editorial layouts.

The visual direction moves away from traditional rounded card containers in favor of a "Bento-grid" philosophy—modular, structured, and dense with information but breathing through expansive white space. It utilizes high-contrast interactions, where the primary focus is on content, supported by sharp 1px strokes and sophisticated glassmorphic overlays to create a sense of digital craftsmanship.

## Colors
The palette is rooted in a high-contrast foundation. Pure white (#FFFFFF) is the primary surface color to maintain an airy, premium feel. 

- **Primary (Deep Indigo):** Used sparingly as a "surgical" accent for call-to-actions, active states, and critical data points.
- **Secondary (Slate Black):** Used for heavy headlines and primary UI text to provide a grounded, authoritative weight.
- **Surface & Borders:** A combination of ultra-light grays and semi-transparent strokes ensures the Bento-grid structure remains visible but unobtrusive.
- **Glows:** Subtle primary-tinted glows are used as background accents behind glass layers to imply energy and depth.

## Typography
This design system employs a tri-font strategy to achieve an editorial yet technical atmosphere.

- **Headlines:** Bricolage Grotesque provides a high-weight, expressive display feel that differentiates the brand from standard corporate SaaS. Use tight letter-spacing for large headlines.
- **Interface & Body:** Inter is the workhorse for all functional UI elements, ensuring maximum legibility and a neutral, systematic tone.
- **Technical Data:** JetBrains Mono is used for metrics, timestamps, and technical metadata, reinforcing the AI/Visionary nature of the product.

## Layout & Spacing
The layout follows a strict **Bento-grid** model based on a 12-column fluid system. 

- **Data Clusters:** Group related information into high-density cells with tight internal padding (16px - 24px) to create "information richness."
- **White Space:** Counter-balance dense clusters with generous external margins and sections separated by significant vertical padding (80px - 120px).
- **Responsive Behavior:** On mobile, the Bento cells stack vertically. The 24px gutter reduces to 16px. Glassmorphic effects should be simplified on mobile to ensure performance.

## Elevation & Depth
Depth is expressed through layering and transparency rather than traditional heavy drop shadows.

- **Glassmorphism:** Use heavy backdrop-blur (20px - 40px) on navigation bars and secondary overlay panels. Surfaces should have a low-opacity white fill (60-80%) to allow background colors to bleed through subtly.
- **The Stacking Model:** Instead of elevated cards, use "stacking" where layers are separated by 1px borders (#E2E8F0).
- **Subtle Glows:** Use a 0% to 10% opacity Indigo glow behind primary components to simulate a "next-gen" powered state.
- **Shadows:** When necessary, use "Ambient Shadows"—extremely diffused (30px+ blur), low-opacity (4%) shadows that feel like natural light rather than a digital drop shadow.

## Shapes
The shape language is sharp and disciplined. While "Soft" roundedness is the baseline, it is applied with restraint to maintain a professional, architectural feel.

- **Bento Cells:** Use `rounded-lg` (8px) for grid containers to soften the high-contrast edges.
- **Buttons & Inputs:** Use `rounded` (4px) for a more technical, "pro-tool" appearance.
- **Strokes:** Always use a consistent 1px width. In dark mode or over dark images, use a semi-transparent white stroke (10-15% opacity).

## Components

- **Buttons:** 
  - *Primary:* Solid Deep Indigo with white text. High-contrast, no gradient.
  - *Secondary:* Pure white background with a 1px Slate Black border.
  - *Ghost:* No background, text only, becomes Indigo on hover.
- **Bento Cards:** 1px border, white background. Inner content should use `label-mono` for headers to distinguish data types.
- **Input Fields:** Minimalist. Only a bottom border (1px) in a resting state, transitioning to a full 1px Indigo border on focus. No heavy background fills.
- **Chips:** Small, rectangular (4px radius), using `label-mono` text. Use subtle Indigo backgrounds (5% opacity) for active tags.
- **Lists:** Clean rows separated by 1px horizontal lines. High-density padding. Use mono-spaced fonts for numerical data in lists.
- **Data Visualizations:** Use the Deep Indigo for primary trend lines, paired with ultra-thin grid lines. Avoid fills under lines to keep the "Minimalist" look.