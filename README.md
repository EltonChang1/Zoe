# Zoe

> A taste-ranking app for slow curators.
> RedNote-scale discovery · Beli-style pairwise rankings · editorial luxury visual system ("The Modern Curator").

This repository contains the first vertical slice of the Zoe mobile app, built against the specifications in [`PRD/`](./PRD) and the design prototypes in [`Design_guide/`](./Design_guide).

## What is in this repo

- [`PRD/`](./PRD) — Product Requirements Document, Mobile IA / Wireframe Spec, Visual Direction Kit, and Content Model + Sample Data Pack. Treat these as the source of truth.
- [`Design_guide/`](./Design_guide) — Tailwind/HTML prototypes for each core surface (`home_page`, `search_page`, `ranking_page`, `shorts_page`, `profile_page`, and three `posts/*` detail templates).
- [`app/`](./app) — The Expo + expo-router application (5 tabs, 3 post-detail templates, pairwise Add-to-Ranking flow).
- [`components/`](./components) — Shared primitives (glass nav bars, cards, rank pill, buttons, typography).
- [`theme/`](./theme) — Design tokens + the font loader that mirrors `tailwind.config.js`.
- [`data/`](./data) — Typed mock data drawn from `Zoe_Content_Model_Sample_Data_Pack.md`.

## Stack

- **Expo SDK 52** with `expo-router` v4 (file-based navigation).
- **TypeScript** strict mode.
- **NativeWind v4** (Tailwind for React Native) — the same utility class model used in the design prototypes.
- **@expo-google-fonts/** — Newsreader, Cormorant Garamond, and Inter loaded at runtime.
- **expo-blur**, **expo-linear-gradient**, **expo-image** — for glassmorphism, gradient CTAs, and cached editorial photography.
- **@expo/vector-icons** (Material Icons) — the closest available match to the Material Symbols vocabulary used in the prototypes.

## Getting started

```bash
npm install
npx expo start
```

Then press `i` (iOS Simulator), `a` (Android emulator), or scan the QR with **Expo Go** on a physical device.

Fonts are loaded at app start; the first launch will briefly show a blank warm canvas (`#FBF9F6`) while typography initialises.

## What is built

- **Tab shell** with the glass bottom bar in the exact order defined in the Visual Direction Kit: **Discover · Search · Rank · Shorts · Profile** (no center Add tab).
- **Discover (Home)** — two-column editorial masonry, snap-scroll category chips, interleaved editor's-note quote card.
- **Search** — editorial italic search input + following-activity stacked cards (actor line → tonal artefact card with movement indicator).
- **Rankings** — Community Hub with filter tabs + Personal Hub toggle; `Add` CTA opens the pairwise flow.
- **Shorts** — immersive vertical pager with warm dark canvas, bottom-left curator block, glass right rail (Rank / Like / Comment / Save / More), tonal pills.
- **Profile (self)** — glass top bar, avatar + stats row, highlights strip, three tabs (Posts / Shorts / Rankings), mixed image + editorial text tiles.
- **Post detail** — a router that picks one of three editorial templates via `post.detailLayout`:
  - `discovery_photo` — place-focused (`Design_guide/posts/post_for_cafe`)
  - `album_review` — square artwork + gradient ranking ribbon (`post_for_album`)
  - `product_hero` — wide hero + floating rank chip + left-rule copy (`post_for_shoes`)
- **Add to Ranking** — full pairwise stepper (category → pick item → pairwise compare via binary search → caption → confirm), returning an insertion rank rather than a raw 1–10 score.

## Design system alignment

The entire visual system is derived from [`PRD/Zoe_Visual_Direction_Kit.md`](./PRD/Zoe_Visual_Direction_Kit.md):

- Color palette (warm neutrals, Fig `#55343B` primary, Cocoa secondary, muted rank-up/down/new) lives in [`tailwind.config.js`](./tailwind.config.js) and [`theme/tokens.ts`](./theme/tokens.ts).
- Type system: Newsreader (display/headline), Cormorant Garamond (rank numbers, pull-quotes), Inter (UI/body). Semantic wrappers in [`components/ui/Text.tsx`](./components/ui/Text.tsx).
- Radii cap at `0.75rem` (our `rounded-xl`); shadows are always ambient (`24px blur · 4% opacity`).
- Glass surfaces (top bar, tab bar, shorts overlays) use `expo-blur` over semi-transparent warm neutrals.
- No divider lines: separation is tonal through `surface-container-*` layers.

## Next steps (not in this slice)

- Replace mock data with a real backend + persistence (Supabase or a Next.js API).
- Wire real video for Shorts via `expo-video`.
- Swap Material Icons for true Material Symbols once an RN font is available.
- Onboarding flow, notifications, privacy/permissions (PRD §§10–12).
- Social graph: follows, saved lists, taste-match module (Profile other user).
- Figma mirror in the `Figma/` workspace (see VDK §24 checklist).

## Project structure

```
Zoe/
├── app/                          expo-router routes
│   ├── _layout.tsx               root stack, fonts, status bar
│   ├── (tabs)/                   tab shell + 5 primary screens
│   ├── post/[id].tsx             post detail router (3 templates)
│   └── rank/add.tsx              pairwise add-to-ranking flow (modal)
├── components/
│   ├── cards/                    MasonryCard, QuoteCard, ActivityCard, RankingListCard
│   ├── nav/                      GlassTopBar, GlassTabBar
│   ├── post/                     PostChrome + 3 detail layouts
│   ├── rank/                     RankPill (glass overlay, chip, floating)
│   └── ui/                       Text, Icon, Button, Avatar, Chip
├── data/                         typed mock content (users, objects, posts, rankings, activity, shorts, comments)
├── theme/                        tokens + useZoeFonts
├── PRD/                          source-of-truth product + design docs
└── Design_guide/                 HTML/Tailwind prototype references per screen
```

## Contributing

Style changes should be justified against a specific section of the Visual Direction Kit (e.g. "VDK §11.3 — ranking indicator"). Screen changes should mirror the matching prototype in `Design_guide/` and the corresponding `SCREEN` entry in `Zoe_Mobile_IA_Wireframe_Spec.md`.
