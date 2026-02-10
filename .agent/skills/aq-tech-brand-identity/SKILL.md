---
name: aq-tech-brand-identity
description: Official Brand Identity Guidelines for AQ Tech. Contains color palettes, typography, contact info, and design principles.
---

# AQ Tech Brand Identity

This skill provides the official brand assets and design guidelines for **AQ Tech**. Use this information whenever you are creating new pages, components, or marketing materials to ensure consistency.

## 1. Core Identity
- **Name:** AQ Tech
- **Taggline:** "Construimos el Futuro Digital"
- **Mission:** Transformar ideas en software de alto impacto con un enfoque futurista y profesional.
- **Tone of Voice:** Professional, Technical yet accessible, Futuristic, Confident.

## 2. Visual Style (Futuristic Tech)
- **Theme:** Dark Mode Only (`bg-slate-950`).
- **Aesthetics:** Glassmorphism, Neon Glows, Grid Backgrounds, Spotlight effects.
- **Keywords:** Clean, Minimalist, High-Performance, Cyberpunk-lite.

## 3. Color Palette (Tailwind CSS)

### Backgrounds
- **Main Background:** `bg-slate-950` (#020617) - Deep space blue/black.
- **Surface/Cards:** `bg-slate-900/50` with `backdrop-blur-md`.

### Accents & Gradients
- **Primary Cyan:** `text-cyan-400` (#22d3ee) to `text-cyan-500` (#06b6d4).
- **Secondary Blue:** `text-blue-500` (#3b82f6).
- **Gradient:** `bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500`.

### Typography Colors
- **Headings (White):** `text-white` (#ffffff) or `text-slate-50`.
- **Body Text (Muted):** `text-slate-300` (#cbd5e1).
- **Subtitles/Muted:** `text-slate-400` (#94a3b8).

## 4. Typography

### Primary Fonts
- **Headings:** `Sora` (Google Fonts). Weights: 600, 700, 800.
- **Body:** `Manrope` (Google Fonts). Weights: 300, 400, 500.
- **Display/Logo:** `Outfit` (Optional for large titles).

### Usage Rules
- Use `Sora` for all `<h1>` to `<h3>` titles.
- Use `Manrope` for paragraphs, buttons, and UI elements.
- Always use `leading-relaxed` for body text readability.

## 5. Contact Information (Prod Data)
- **WhatsApp:** `+54 9 3716 40-0743` (Link: `https://wa.me/5493716400743`)
- **Email:** `aquinopaul2002@gmail.com`
- **Instagram:** `@paulc_aquino` (Link: `https://instagram.com/paulc_aquino`)
- **Personal Portfolio:** [aqtech.dev](https://aqtech.dev)

## 6. UI Components Library (Reusables)
- **Buttons:** `GlowingButton` (Cyan glow effect).
- **Cards:** `SpotlightCard` (Hover reveal effect).
- **Backgrounds:** `GridBackground` (Particles + Radial Gradient).

## 7. Project Structure (Standard)
```
src/
├── components/
│   ├── sections/    # Hero, About, Services...
│   └── ui/          # Reusable atomic components
├── effects/         # Global animations (Particles)
└── lib/             # Utilities
```

## 8. Development Rules
- **Framework:** React + Vite.
- **Styling:** Tailwind CSS v4.
- **Animation:** Framer Motion.
- **Icons:** Lucide React.
- **Performance:** Always use `React.lazy` for heavy sections and `optimize-deps` in Vite.
