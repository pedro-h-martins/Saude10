---
name: Interstellar Deep
colors:
  surface: '#10131a'
  surface-dim: '#10131a'
  surface-bright: '#363940'
  surface-container-lowest: '#0b0e14'
  surface-container-low: '#181c22'
  surface-container: '#1c2026'
  surface-container-high: '#272a31'
  surface-container-highest: '#31353c'
  on-surface: '#e0e2eb'
  on-surface-variant: '#c1c6d5'
  inverse-surface: '#e0e2eb'
  inverse-on-surface: '#2d3037'
  outline: '#8b919f'
  outline-variant: '#414753'
  surface-tint: '#aac7ff'
  primary: '#aac7ff'
  on-primary: '#002f64'
  primary-container: '#1275e2'
  on-primary-container: '#000512'
  inverse-primary: '#005db8'
  secondary: '#aec7f7'
  on-secondary: '#143057'
  secondary-container: '#2d476f'
  on-secondary-container: '#9db6e4'
  tertiary: '#ffb68c'
  on-tertiary: '#532200'
  tertiary-container: '#c05900'
  on-tertiary-container: '#0d0300'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#d6e3ff'
  primary-fixed-dim: '#aac7ff'
  on-primary-fixed: '#001b3e'
  on-primary-fixed-variant: '#00458d'
  secondary-fixed: '#d6e3ff'
  secondary-fixed-dim: '#aec7f7'
  on-secondary-fixed: '#001b3d'
  on-secondary-fixed-variant: '#2d476f'
  tertiary-fixed: '#ffdbc9'
  tertiary-fixed-dim: '#ffb68c'
  on-tertiary-fixed: '#321200'
  on-tertiary-fixed-variant: '#763400'
  background: '#10131a'
  on-background: '#e0e2eb'
  surface-variant: '#31353c'
typography:
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.5px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  gutter: 16px
  margin: 24px
---

# Design System: Interstellar Deep

## Brand & Style
Interstellar Deep is a professional, high-trust digital environment characterized by a "Corporate Modern" aesthetic with a technical edge. The brand identity has shifted from a warm, high-energy orange palette to a cool, deep blue-centric system, evoking reliability, precision, and a calm focus. 

The style is influenced by modern high-fidelity interfaces, utilizing dark mode as the primary canvas to reduce eye strain and emphasize information hierarchy. It avoids unnecessary flourishes, opting instead for a balanced, balanced layout that feels both sophisticated and accessible to power users.

## Colors
The color palette is anchored in a deep, vibrant blue (#1275e2), serving as the primary action color. This provides a clear focal point against the dark mode background. The secondary blue-grey (#5f78a3) provides a sophisticated bridge for less critical UI elements, while a burnt orange tertiary color (#c55b00) is reserved for moments of high emphasis or functional contrast.

Neutral tones are grounded in a cool grey (#74777f), ensuring that text and structural borders remain legible and harmonious within the dark interface. The shift to dark mode allows for better use of luminescence to guide user attention.

## Typography
The system uses **Inter** for all typographic roles, providing a highly legible, geometric sans-serif aesthetic that excels in digital interfaces. The use of a single variable font family ensures technical performance and visual consistency across headlines, body copy, and UI labels.

Headlines are set with tighter tracking and bold weights to establish a clear hierarchy, while body text prioritizes comfortable line heights for readability in dark mode. Labels utilize a slightly increased letter spacing and medium weight to ensure clarity at small sizes.

## Layout & Spacing
The layout follows a fluid grid system with a base 8px rhythmic unit. This ensures all components, margins, and gutters scale proportionally. 

- **Desktop:** 12-column grid with 24px margins and 16px gutters.
- **Tablet:** 8-column grid with 24px margins.
- **Mobile:** 4-column grid with 16px margins.

The spacing philosophy emphasizes organized density—providing enough breathing room to separate distinct functional areas without sacrificing the data-rich nature of the interface.

## Elevation & Depth
In this dark mode system, depth is communicated through **tonal layering** rather than heavy shadows. Surfaces higher in the stack use lighter grey values of the neutral palette to appear closer to the user.

Subtle ambient shadows (low-opacity, blurred) are used sparingly on floating elements like menus or modals to provide a sense of separation from the background. High-contrast outlines in the secondary color can be used to define containers where tonal separation is insufficient.

## Shapes
The shape language uses a "Rounded" philosophy (Level 2). Standard UI elements like buttons and input fields feature a 0.5rem (8px) corner radius. Larger containers, such as cards, utilize a 1rem (16px) radius, while extra-large surfaces like modals use 1.5rem (24px).

This moderate rounding softens the professional "Corporate Modern" aesthetic, making the interface feel approachable and modern without appearing toy-like.

## Components
- **Buttons:** Primary buttons use the vivid primary blue (#1275e2) with white text. Secondary buttons use an outlined style with the secondary grey-blue.
- **Input Fields:** Styled with a 1px border using the neutral-74777f palette, transitioning to primary blue on focus. Backgrounds should be slightly lighter than the main page surface.
- **Cards:** Use a tonal background (slightly lighter than the base surface) with an 8px radius to define sections of content.
- **Chips:** Small, rounded-pill indicators using the secondary color for categorization and the tertiary color for status alerts or highlights.
- **Lists:** Clean rows with 1px dividers in a low-opacity neutral tone, ensuring clear scannability.