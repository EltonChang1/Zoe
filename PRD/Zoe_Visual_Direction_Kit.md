# Zoe — Launch-Ready Visual Direction Kit
**Version:** 2.0
**Purpose:** Brand and UI visual system direction for launch
**Platform:** Mobile-first
**Product DNA:** Instagram-familiar shell · RedNote-style taste utility · Beli-inspired ranking engine
**Brand name:** Zoe
**Brand inspiration:** ζωή — “life” in Greek
**Design source of truth:** `Design_guide/` (Home, Search, Rankings, Shorts, Profile prototypes + `DESIGN.md`). This kit expands those prototypes into tokens, rules, and content behavior for the rest of the app.

---

# 1. What this document is for

This visual direction kit helps the team make **fast, consistent visual decisions** for Zoe across:

- brand identity
- app UI
- content styling
- feed, ranking, and activity cards
- prototype polish
- early launch materials
- Figma foundations

It is designed to answer:

- What should Zoe feel like visually?
- What should the brand look like at launch?
- What colors define the product?
- What typography system fits the brand and product behavior?
- How should feed cards, ranking cards, activity cards, Shorts, and profile surfaces be art-directed?

This is not a pretty moodboard. It is a practical handoff for product design, engineering, and content.

---

# 2. Brand idea

## 2.1 Name meaning
**Zoe** comes from **ζωή**, meaning **life**.

That gives the brand an unusually strong emotional foundation:
- vitality
- aliveness
- appetite
- taste
- memory
- desire
- identity
- social energy

Zoe is about more than discovering things. It is about **how people live through taste**.

## 2.2 What Zoe should not feel like
- sterile
- corporate
- generic “tech startup”
- over-gamified
- cold or clinical
- playful and unserious

## 2.3 What Zoe should feel like
- alive
- elegant
- current
- intimate
- expressive
- premium without being inaccessible
- emotional without being dramatic

---

# 3. Visual positioning statement

Zoe should look like:

**a refined social app for people with taste.**

Not a review platform.
Not a delivery app.
Not a productivity tool.
Not a generic content app.

The launch look should communicate:
- lifestyle credibility
- social familiarity
- editorial taste
- emotional warmth
- premium minimalism
- visual sharpness
- content-first utility

---

# 4. Creative north star — "The Modern Curator"

The visual identity is anchored in **"The Modern Curator."** Unlike discovery apps that feel like utility-heavy marketplaces (Yelp) or chaotic mood boards (Pinterest), Zoe treats every interface like a page from a **high-end, bespoke editorial publication.**

Three governing principles:

## 4.1 Intentional Asymmetry
Elements are not always perfectly centered. Balance comes from weight and whitespace. A large serif headline can anchor a page; a small `label-sm` meta tag floats against it.

## 4.2 Tonal Depth (not lines)
Hierarchy is created through background color shifts, not 1px borders. Surfaces stack like fine paper. A card uses `surface-container-low` on a `background` section — the transition feels tactile, not digital.

## 4.3 High-Contrast Typography
A dialogue between evocative serifs (Newsreader / Cormorant Garamond) and functional sans (Inter). The tension between `display-lg` beauty and `label-sm` utility is what creates the **Editorial Luxury** feel.

The system should feel **quiet, authoritative, and expensive.**

---

# 5. Core visual attributes

Zoe’s visual system balances six qualities:

| Attribute | What it means |
| :--- | :--- |
| **Alive** | Because of ζωή — warm, human, never flat. |
| **Tasteful** | Everything feels selected, not noisy. |
| **Social** | Familiar enough that users understand it fast. |
| **Useful** | Search, ranking, and discovery remain clear. |
| **Premium** | Elevated, even when simple. |
| **Emotional** | Rankings, profiles, and saves feel personal. |

---

# 6. Launch direction: Soft Editorial Luxury

This is the **locked** launch direction for Zoe.

It combines:
- Instagram-style familiarity
- fashion/lifestyle editorial restraint
- warm premium neutrals (chalk, ivory, fig, espresso)
- sharp readable product UI
- just enough romance to support the ζωή concept

It should feel like:
- a social product with strong taste
- a design-conscious mobile app
- a brand that belongs naturally in food, fragrance, music, fashion, and lifestyle categories

It should **not** feel like:
- a museum or hard-luxury brand
- a hyper-feminine beauty app
- a neon nightlife app
- a fintech interface
- a Pinterest clone

---

# 7. Color system

The palette is a sophisticated blend of organic “Chalk” and “Ivory” neutrals punctuated by deep “Fig” and “Espresso” accents, plus restrained functional colors for ranking movement.

## 7.1 The "No-Line" Rule (mandatory)

**Do not use 1px solid borders to section off content.** Boundaries are defined exclusively through **background color shifts**. A card using `surface-container-low` (#F5F3F0) on a `background` (#FBF9F6) surface creates a soft, tactile transition — **stacked paper**, not a digital grid.

### The "Ghost Border" Fallback
If accessibility demands a border, use `outline-variant` at **15% opacity**. High-contrast, 100% opaque borders are strictly prohibited.

## 7.2 Surface hierarchy (stack of fine paper)

| Token | Hex | Role |
| :--- | :--- | :--- |
| `background` | `#FBF9F6` | Foundation — Chalk |
| `surface` | `#FBF9F6` | Default surface |
| `surface-container-lowest` | `#FFFFFF` | Highest-emphasis lifted content |
| `surface-container-low` | `#F5F3F0` | Secondary sections, card fills |
| `surface-container` | `#EFEEEB` | Tertiary fills |
| `surface-container-high` | `#EAE8E5` | Elevated inputs, media frames |
| `surface-container-highest` | `#E4E2DF` | Lifted / most prominent interactive elements |
| `surface-dim` | `#DBDAD7` | Dim states |

## 7.3 Text tokens

| Token | Hex | Role |
| :--- | :--- | :--- |
| `on-surface` | `#1B1C1A` | Primary headers and body (Espresso) |
| `on-surface-variant` | `#504446` | Editorial accents, secondary text (Fig) |
| `on-background` | `#1B1C1A` | Text on background |
| `outline` | `#827475` | Tertiary meta |
| `outline-variant` | `#D3C2C4` | Ghost borders @ 15% opacity |

## 7.4 Brand accent family

| Token | Hex | Role |
| :--- | :--- | :--- |
| `primary` | `#55343B` | Main CTA / brand accent (Fig) |
| `primary-container` | `#6F4B52` | Paired gradient end / elevated accent |
| `on-primary` | `#FFFFFF` | Text on primary |
| `tertiary` | `#5A3239` | Deeper dramatic accent (Wine) |
| `tertiary-container` | `#74494F` | Hero/campaign accent |
| `secondary` | `#5F5F4E` | Supporting accent (Olive Smoke) |
| `secondary-fixed` | `#E5E4CE` | Muted warm fill |

## 7.5 Ranking / functional colors

Ranking is the soul of the app. Movement indicators must be **subtle**, never gamified.

| Token | Hex | Role |
| :--- | :--- | :--- |
| `rank-up` | `#547C65` | Item moved up |
| `rank-down` | `#8B5D5D` | Item moved down |
| `new-entry` | `#8B6C3F` | Newly added ranking item |
| `error` | `#BA1A1A` | Destructive (use rarely) |

Use these **never** as standard success-green or error-red. They are part of the luxury palette.

## 7.6 The "Glass & Gradient" Rule

To elevate beyond flat design:

### Glassmorphism
For **floating navigation bars** and **overlay modals**: `surface` at **70–80% opacity** with `backdrop-blur` of **20px** (e.g. `bg-surface/70 backdrop-blur-xl`).

### Signature gradient (primary CTA)
**Do not use flat fill.** Use a subtle linear gradient from `primary` (#55343B) to `primary-container` (#6F4B52) at a **45° angle**. This adds soul and materiality.

### Floating image overlays
On Shorts / immersive dark surfaces, use `white/10` with `backdrop-blur-xl` and `border border-white/20` for action pills.

## 7.7 Dark mode direction

Dark mode should still feel warm and editorial — not flat black, never gamer-dark.

| Token | Hex | Role |
| :--- | :--- | :--- |
| `background` (dark) | `#1B1C1A` | Ink |
| `surface-container-low` (dark) | `#1F1916` | Night Brown |
| `surface-container-high` (dark) | `#2C2420` | Ash Brown |
| `on-surface` (dark) | `#F2ECE5` | Warm ivory text |
| `on-surface-variant` (dark) | `#C9BCB0` | Soft taupe text |
| `primary` (dark) | `#EABAC2` | Inverse primary / accent |

Dark mode should feel like a candlelit bar, luxury hotel lobby, or after-hours perfume counter.

---

# 8. Color usage rules

## 8.1 Background strategy
Use mostly warm neutrals — `background`, `surface-container-low`, `surface-container-lowest`. Content stays bright and Instagram-familiar.

## 8.2 Accent strategy
Use `primary` (Fig) **sparingly**. Too much accent color cheapens the product. Best uses:
- active tabs/icons
- selected chips
- small primary buttons
- ranking number highlights
- story ring tint accents
- onboarding emphasis
- hero campaign cards

## 8.3 Ranking movement
- **Up:** muted green (`rank-up`), not bright
- **Down:** muted wine/red (`rank-down`), not alarming
- **New:** bronze-gold (`new-entry`), not bright orange

## 8.4 Avoid
- saturated blue-heavy tech colors
- loud purple gradients
- bright orange CTA overload
- rainbow chips
- harsh black/white-only aesthetic
- visible 1px borders (see §7.1)

---

# 9. Typography

The typographic system is a dialogue between the functional and the evocative.

## 9.1 Font families

| Family | Usage |
| :--- | :--- |
| **Newsreader** | Display, headlines, card titles (`font-headline`, `font-display`) |
| **Cormorant Garamond** | Ranking numbers, hero pull-quotes (heritage feel) |
| **Inter** | All functional UI, body, labels, metadata (`font-body`, `font-label`) |

- Newsreader replaces generic serifs for editorial/pull-quote moments.
- Cormorant Garamond is reserved for ranking numbers to give them a collected, heritage feel.
- Inter provides the utility that makes discovery efficient.

Set display faces with **tight tracking (-2%)** to feel like a premium masthead.

## 9.2 Editorial scaling

Do not be afraid of the contrast between a `display-lg` serif headline and a `label-sm` Inter metadata tag. This tension is what creates the **Editorial Luxury** feel.

## 9.3 Weight strategy

### Inter
- Regular for body
- Medium for labels and metadata emphasis
- Semibold for card titles and section headers
- Bold very sparingly (nav active state, key counts)

### Newsreader / Cormorant
- 500–600 weights for titles and ranking numbers
- Italic for brand moments (e.g. `Zoe` wordmark)
- Avoid thin weights in small sizes

## 9.4 Usage rules

**Do serif for:**
- hero headlines
- card titles on feed
- list titles on Rankings
- ranking numbers (Cormorant)
- onboarding hero moments
- brand wordmark

**Do not serif for:**
- chat
- comments
- dense list rows
- tab labels
- search input
- inline metadata

## 9.5 Suggested type scale

| Role | Size / Line | Family / Weight |
| :--- | :--- | :--- |
| Display | 36 / 42 | Newsreader 500 (tight) |
| Hero / Page Title | 28 / 34 | Newsreader 500 or Inter 600 |
| Section Header | 20 / 26 | Inter Semibold |
| Card Title | 18–20 / 22 | Newsreader 500 (editorial) |
| Body | 15 / 22 | Inter Regular |
| Body Small | 13 / 18 | Inter Regular |
| Caption / Meta | 12 / 16 | Inter Medium (uppercase + widest tracking for labels) |
| Rank Number | 20–28 | Cormorant Garamond 500 |
| Button Label | 14 / 18 | Inter Medium |
| Label (all caps) | 10–12 | Inter Semibold, `tracking-widest`, `uppercase` |

---

# 10. Elevation & depth

We eschew traditional drop shadows in favor of **Tonal Layering**.

## 10.1 Layering principle
Depth is achieved by stacking. Place a `surface-container-lowest` card on a `surface-container-low` section. This creates a natural lift without muddy shadows.

## 10.2 Ambient shadows
If an element must float (FAB, floating nav):
- blur: **24px**
- opacity: **4%**
- color: tinted version of `on-surface` (#1B1C1A), **never pure black**

Example: `shadow-[0_-4px_24px_rgba(27,28,26,0.04)]` on the bottom tab bar.

## 10.3 Corner radius tokens (architectural, not bubbly)

| Token | Value |
| :--- | :--- |
| `DEFAULT` | `0.125rem` (2px) |
| `lg` | `0.25rem` (4px) |
| `xl` | `0.5rem` (8px) |
| `full` | `0.75rem` (12px) |

**Do not** use radii larger than `full` (12px) on cards. We want **architectural**, not bubbly. Avatars and pills may be fully circular.

---

# 11. Components

### 11.1 Cards & discovery (feed, masonry)

Inspired by high-end lookbooks.

- **Rule:** Forbid divider lines within cards. Use spacing and tonal shifts.
- **Spacing:** 24px or 32px of vertical whitespace between header, image, and description.
- **Metadata:** `on-surface-variant` (`#504446`, Fig-adjacent) for secondary info; focus on title in `on-surface` (Espresso).
- **Image radius:** `rounded-xl` (8px) on media, never more.
- **Hover:** `group-hover:scale-105` with `duration-700 ease-out` for premium, slow reveal.

### 11.2 Buttons

- **Primary:** Gradient fill from `primary` → `primary-container` at 45°. Radius: `DEFAULT` (2px) or `none` for sharp architectural feel. Text: `on-primary`.
- **Secondary:** Transparent with Ghost Border (`outline-variant` @ 15%). Text: `primary` (Fig).
- **Tertiary:** Pure text in `secondary` / Cocoa with underline only on hover.

### 11.3 Ranking indicators (the signature component)

Ranking must be subtle and elegant.

- **Rank badge (media overlay):** small pill, top-right or top-left, `bg-background/90` with `backdrop-blur-md`, `rounded-DEFAULT`. Contains:
  - A 1.5×1.5px dot in `rank-up` / `rank-down` / `new-entry` color
  - Number in **Cormorant Garamond** for heritage feel, or Inter for labels
- **Movement:** 8px arrow icon (Material Symbol `trending_up` or `arrow_upward`) in `rank-up` / `rank-down`.
- **New Entry:** `new-entry` color as a small dot or `label-sm` high-contrast label (e.g. `NEW` in uppercase + widest tracking).
- **Cross-time context:** Optional `RANKED #2 LAST MONTH` micro-label for taste memory.
- **Editorial pick:** Optional `EDITOR` badge in dark wine/brown — use rarely.

Typography inside badges: **Inter Medium**, tight tracking; background semi-opaque warm white or dark brown tint so text stays legible on busy photos.

### 11.4 Input fields

- **Style:** Underline-only, or very subtle `surface-container-high` fill.
- **Focus:** Transition underline to `primary` (Fig). **Avoid** standard blue focus rings.
- **Search input (header):** Large Newsreader italic placeholder (`placeholder:font-headline placeholder:italic`) for editorial effect — see `Design_guide/search_page/code.html`.

### 11.5 Navigation

#### Top app bar (global)
- `bg-surface/70 backdrop-blur-xl`
- Height: 16 (64px)
- Leading: menu (mobile) or desktop nav links
- Center: **Zoe** wordmark in Newsreader italic, tracking-tight, `primary` color
- Trailing: avatar (8×8 rounded-full) with `ring-1 ring-outline-variant/30`

#### Bottom tab bar (mobile)
- `bg-surface/80 backdrop-blur-2xl`
- Shadow: `shadow-[0_-4px_24px_rgba(27,28,26,0.04)]`
- 5 tabs: Discover, Search, Rank, Shorts, Profile
- **Active:** `primary` color, icon filled (`font-variation-settings: 'FILL' 1`), optional 1×1 dot below label
- **Inactive:** `secondary` color, icon outlined

### 11.6 Story ring / avatars
- Soft warm gradient ring, less saturated than Instagram
- Closer to fig/dusty rose/bronze than rainbow neon
- Avatars: `rounded-full` with `ring-1 ring-outline-variant/30`

### 11.7 Glass pills (Shorts, dark surfaces)
- `bg-white/10 backdrop-blur-xl border border-white/20`
- Shadow: `shadow-[0_8px_32px_rgba(0,0,0,0.12)]`
- Used for RANK, SAVE, SEND, and creator avatar on vertical video

---

# 12. Do’s and Don’ts

## Do
- Use generous whitespace. If you think there's enough, add 8px more.
- Use **Cormorant Garamond** for ranking numbers to give them heritage feel.
- Align text-heavy components to a strict left-margin to maintain an editorial grid.
- Prioritize content beauty.
- Let typography do a lot of the premium work.
- Use warm neutrals.
- Make ranking feel emotionally significant.
- Keep the shell familiar and frictionless.
- Make object cards and ranking cards visually distinct.

## Don’t
- Use standard "Success Green" or "Error Red." Use `rank-up` and `rank-down` muted tones.
- Over-use icons. A well-set word in `label-md` Inter is often more premium.
- Use cards with heavy shadows or rounded corners larger than `full` (12px).
- Make it look like Yelp.
- Make it look like a fintech dashboard.
- Overuse serif in dense UI.
- Rely on gradients everywhere.
- Use loud bright icon colors.
- Turn cards into information dumps.

---

# 13. Design tokens (quick reference)

Matches the Tailwind config embedded in every `Design_guide/*/code.html` prototype.

```js
colors: {
  "background": "#FBF9F6",
  "surface": "#FBF9F6",
  "surface-container-lowest": "#FFFFFF",
  "surface-container-low": "#F5F3F0",
  "surface-container": "#EFEEEB",
  "surface-container-high": "#EAE8E5",
  "surface-container-highest": "#E4E2DF",
  "primary": "#55343B",
  "primary-container": "#6F4B52",
  "on-primary": "#FFFFFF",
  "on-surface": "#1B1C1A",
  "on-surface-variant": "#504446",
  "outline": "#827475",
  "outline-variant": "#D3C2C4",
  "secondary": "#5F5F4E",
  "tertiary": "#5A3239",
  "rank-up": "#547C65",
  "rank-down": "#8B5D5D",
  "new-entry": "#8B6C3F"
}

borderRadius: {
  "DEFAULT": "0.125rem",
  "lg": "0.25rem",
  "xl": "0.5rem",
  "full": "0.75rem"
}

fontFamily: {
  "headline": ["Newsreader", "serif"],
  "display": ["Newsreader", "serif"],
  "body":    ["Inter", "sans-serif"],
  "label":   ["Inter", "sans-serif"],
  "serif":   ["Cormorant Garamond", "serif"]
}
```

---

# 14. Logo direction

Because Zoe is rooted in **ζωή**, the logo should feel elegant, alive, and ownable.

## 14.1 Wordmark
Use **Zoe** as the consumer-facing wordmark.
Set in **Newsreader italic**, tracking-tight, color `primary` (#55343B).

The wordmark appears centered in the top app bar on Home, Rankings, Shorts, and in the Search header.

Use **ζωή** only as:
- an accent symbol
- a launch campaign device
- a splash / onboarding detail
- subtle signature element in branded materials

Do not use Greek script in the main app wordmark — it creates usability friction.

## 14.2 Avoid
- cliché Greek column motifs
- literal olive branches
- overly mythological symbolism
- Mediterranean cliché
- hyper-fashion unreadable thin lettering

---

# 15. Photography and image mood

Content is central. The product relies on **good media art direction** more than heavy UI decoration.

## 15.1 Overall mood
- soft natural light
- tactile detail
- elegant composition
- emotionally suggestive, not over-staged
- visually rich but believable
- slightly cinematic
- not over-filtered

## 15.2 By category

### Food / café
- natural shadows, warm highlights
- clean table composition
- space matters as much as the dish
- avoid touristy overhead overload

### Perfume
- glass, fabric, stone
- reflective surfaces
- close crop
- editorial still-life energy
- avoid glossy e-commerce look

### Album / music
- album covers, vinyl, speakers
- listening environments
- late-night desk or room atmosphere
- emotional lighting over generic music iconography

### Travel / places
- architecture with human scale
- quiet, not tourist-peak
- directional light, long shadows

### Fashion
- editorial styling on textured walls
- directional shadows
- category pill overlays (`Style`, `Object Design`, etc.) in uppercase label

### Stories
- more immediate and less polished than feed posts

---

# 16. Card art direction

## 16.1 Feed post card (Home masonry)

### Goal
Feel visually desirable, socially familiar, readable fast, specific, premium but not stiff.

### Anatomy
1. **Media** (rounded-xl, optional aspect ratio: tall, square, 4/3)
2. **Optional rank badge** (top-right or top-left, glass pill)
3. **Optional editorial category tag** (bottom-left, e.g. `STYLE` in tracking-widest)
4. **Serif title** (Newsreader 18–20px, leading-tight)
5. **Optional short caption** (Inter 14px, `on-surface-variant`, `line-clamp-2`)
6. **Footer row:** avatar (5×5 rounded-full) · `@handle` in `label-xs` · heart + count on right

### Ratio
- **70% media**
- **30% metadata + action**

### Special: Editorial quote card
No media. `surface-container-low` fill, `border border-outline-variant/15` (one allowed use of ghost border). Contains:
- `format_quote` icon, `primary` @ 50% opacity
- Newsreader 24–28px serif pull quote
- Attribution in uppercase tracking-widest label

---

## 16.2 Ranking list preview card (Rankings hub)

### Goal
Feel **collectible and identity-rich** — like a personal cultural artifact, not a utility list.

### Treatments
- Soft collage or hero image cover
- Rank label or `No. 1` / `New` / `Hot` pill (top-right)
- Editorial title in Newsreader 18px
- Optional short descriptor in Inter 11px, line-clamp-2
- Footer: owner avatar (5×5) + `by @handle` in 10px · heart + count on right
- `bg-surface-container-lowest` lifted over `background`

See `Design_guide/ranking_page/code.html` for the canonical pattern (Community Hub / Trending Lists).

---

## 16.3 Ranking update card / social activity card (Search – Following Activity)

### Goal
Make ranking movement feel **intelligent and socially interesting** — not a dashboard activity log.

### Anatomy
- **Actor line (Inter)**: `<avatar 8×8>` `<strong>Maya</strong> added <italic Newsreader>Sumi Café</italic> to her Top 5`
- **Rich artifact card below**:
  - Background: `surface-container-low` or `surface-container-highest` (lifted)
  - Ambient shadow: `shadow-[0_4px_24px_rgba(27,28,26,0.02)]`
  - Hero image (aspect-video), rounded-DEFAULT
  - Object title (Newsreader 24px)
  - Location / artist subtitle (Inter uppercase, tracking-widest, `secondary`)
  - Body snippet (Inter, `on-surface-variant`, leading-relaxed)
  - Small movement arrow (`arrow_upward` in `rank-up`) in top-right corner
  - For places with multiple images: horizontal snap-scroll carousel of 48×64 thumbs

### Variants
- **Added to ranking:** standard card, no movement arrow
- **Moved up/down:** corner arrow in `rank-up` or `rank-down`
- **Saved:** standard card, no arrow, slight tonal shift
- **Published a list:** list preview card with entry count

---

## 16.4 Object detail hero card

### Goal
When a user opens a restaurant, perfume, or album, it should feel substantial.

### Treatment
- Large image (edge-to-edge or `rounded-xl`)
- Object name in Newsreader 28–32px
- Sublabel (Inter uppercase tracking-widest, `secondary`)
- Ranking / social proof row (who ranked it, trending badge)
- **Add to Ranking** CTA — primary gradient button, sharp corners
- Tags in low-noise chip style (`surface-container-low` fill, Inter 12px)

---

## 16.5 Shorts surface (immersive vertical)

### Goal
Dark, warm immersion — **never flat black**. Use editorial darks (`inverse-surface` #30312F or Ink #14110F).

### Anatomy
- Full-bleed media with two tonal gradients:
  - `bg-gradient-to-b from-black/30 via-transparent to-black/80` for text legibility
- **Right rail** (glass pills, 52×72 rounded-full):
  - Heart + count (filled on like)
  - Chat bubble + count
  - Bookmark / Save
  - More (52×52)
- **Bottom-left info:**
  - Curator badge: 10×10 avatar with `border-[1.5px] border-white/40` + name in Newsreader 18px + "CURATOR" label
  - Description (Inter 14px, 2 lines)
  - Location pill + audio pill (both `bg-black/40 backdrop-blur-md border border-white/10`)
- **RANK** action is a first-class button on the right rail when the short is tied to a rankable object.

---

# 17. Motion direction

Motion should be subtle and premium.

## 17.1 Principles
- quick, smooth, soft
- elegant, never bouncy for the sake of it
- content glides, it does not pop

## 17.2 Good motion moments
- tab switches
- story ring state change
- rank movement update animation (small arrow pulse)
- save action feedback
- share sheet rise
- card expansion into detail view
- image hover: `scale-105` over `duration-700 ease-out`

## 17.3 Avoid
- flashy overshoot
- loud playful bounce
- excessive spring on every interaction
- hyper-animated transitions that slow the app

---

# 18. Per-screen UI styling guide

All screen specs below correspond 1:1 to the prototypes in `Design_guide/`. Tailwind classes reference the Design_guide Tailwind config in §13.

## 18.1 Home / Discover (`Design_guide/home_page/`)

### Layout
- `background` (#FBF9F6) canvas
- **Glass top bar** (`bg-surface/70 backdrop-blur-xl`): menu · centered **Zoe** serif wordmark · avatar
- **Category filter row** (pt-20 pb-4, horizontal snap-scroll): "For You" in `primary` with white text + shadow `[0_4px_12px_rgba(85,52,59,0.15)]`; others `surface-container-low` rounded-xl
- **Editorial masonry feed** (`columns-2 md:columns-3 lg:columns-4`, gap-4):
  - Mixed aspect ratios (tall, square, 4/3)
  - Rank badges on select cards
  - Occasional editorial quote card with `format_quote` icon
  - Footer: avatar + @handle + heart count

### Content-first
Chrome stays minimal so the feed reads like a **curated magazine**.

---

## 18.2 Search / Following Activity (`Design_guide/search_page/`)

### Layout
- `background` canvas
- **Top bar** (glass): leading `search` icon + **large Newsreader italic input** ("Search your circle…") + avatar
- **Hero section header**: "Following Activity" in Newsreader italic 28–30px, `primary`
- **Stacked activity cards** with generous vertical rhythm (`space-y-10`):
  - Each card: actor line (avatar + short sentence with italic Newsreader object name in `primary`) → rich artifact card below
  - Two visual variants:
    - `surface-container-low` with ambient shadow (for saves and additions)
    - `surface-container-highest` with rank-up arrow (for rank moves)
- Horizontal image carousel for multi-image places

### Key behavior
Search in Zoe is **not a generic Explore grid** — it is a **taste-intimate following-activity feed** plus a search affordance at the top. See §16.3 for activity card anatomy.

---

## 18.3 Rankings / Community Hub (`Design_guide/ranking_page/`)

### Layout
- `background` canvas
- **Glass top bar** with desktop nav links + centered **Zoe** + avatar
- **Hero header** (center-aligned, pt-4): "Community Hub" in Newsreader 40–48px + small `on-surface-variant` body description
- **Filter tabs** (centered, `border-b border-outline-variant/30`): Trending Lists · New Tastemakers · Category Gems. Active: `primary` + bold underline `border-primary`
- **Discovery masonry** (`columns-2 md:columns-3 lg:columns-4`): ranking list preview cards (see §16.2)
- **Loading state** at bottom: thin spinner + "LOADING MORE" in label

### Personal hub view
When viewing **my rankings** (vs community), collapse the header and show:
- **Pinned** strip (celebrity / friend lists) at top — cards may use slight glass treatment
- **Your categories** stacked vertically, **reorderable** via drag in `[Edit]` mode
- **Tap to expand** category → shows ranked entries with Cormorant Garamond numbers

---

## 18.4 Shorts / Immersive vertical (`Design_guide/shorts_page/`)

### Layout
- `bg-black` body with `overflow-hidden`
- **Glass top bar** (`bg-[#FBF9F6]/70 backdrop-blur-xl`): menu · **Zoe** serif · avatar
- **Full-screen vertical media** (`snap-y snap-mandatory`)
- **Right rail glass pills** (see §16.5)
- **Bottom-left info**: curator + description + location/audio pills
- **Glass bottom tab bar** with fill-variant icon for active Shorts

### Tone
Dark, warm, atmospheric — never flat black. Use `inverse-surface` (#30312F) as fallback when media missing.

---

## 18.5 Profile (`Design_guide/profile_page/`)

### Layout
- `background` canvas
- **Glass top bar**: menu · **Zoe** serif · more_horiz
- **Profile header** (px-6, mt-4):
  - Avatar 24×24 (md:32×32) rounded-full with `border border-outline-variant/30`
  - Stats row (Posts / Followers / Following): counts in Newsreader 20–24px, labels in Inter 12px `on-surface-variant`
  - Display name in `font-display` 24–30px
  - Bio in Inter 14–16px, leading-relaxed
- **Tabs** (`border-t border-outline-variant/30`, one allowed structural separator): Posts · Shorts · Rankings. Active: `border-b-2 border-on-surface` + uppercase tracking-widest label
- **Posts grid** (`grid-cols-3 gap-0.5`): aspect-square tiles, some image tiles, some **text-only tiles** (`surface-container-highest` with category label + editorial title) — this is a signature Zoe move
- **Rankings tab** (when active): shows top lists as rich cards (see §16.2)

### Instagram-familiar, editorial-refined
Profile uses the Instagram mental model (3-column grid, stats row, tabs), but text tiles and serif titles elevate it beyond a photo-sharing app.

---

# 19. Rankings / momentum badge system (cross-screen)

Use **small pill-shaped overlays** on photography — top-left or top-right depending on composition.

## 19.1 Pill patterns

| Pattern | Example | Tokens |
| :--- | :--- | :--- |
| Rank + momentum | `#3 ▲` | bg `background/90` + `backdrop-blur-md` + dot in `rank-up` |
| Stable | `#1 STABLE` | same, neutral dot |
| New | `NEW` | `label-[10px]` in `new-entry` color, uppercase tracking-widest |
| Cross-time | `RANKED #2 LAST MONTH` | Inter 10px, `on-surface-variant`, uppercase |
| Editorial | `EDITOR` | Dark wine/brown background — rare |

## 19.2 Typography in badges
- Inter Medium, tight tracking
- Rank numbers may use **Cormorant Garamond** for the big-moment feel
- Backgrounds semi-opaque warm white or dark brown

## 19.3 Goal
Communicate **status** and **change** at a glance without looking like a sports scoreboard.

---

# 20. Launch marketing visual direction

Campaign visuals should focus on:
- people discovering life through taste
- ranking as emotional truth, not mechanics
- visual pairings of objects and identity
- social moments: "this feels like you"
- objects that carry mood: coffee, perfume, music, dinner

## 20.1 Campaign line directions
- Life, ranked.
- Taste is how you live.
- Find what fits your life.
- Discover through people you trust.
- Rank what stays with you.

---

# 21. Art direction for sample content

Use the following pairings in mockups, mapped to canonical sample users (see `Zoe_Content_Model_Sample_Data_Pack.md`).

| Persona | Mood |
| :--- | :--- |
| **Maya** / cafés | warm wood · soft daylight · ivory ceramics · muted matcha green · linen tones |
| **Elton** / perfumes | marble · white + charcoal · glass reflections · minimalist styling · skin-close softness |
| **Cody** / albums | dark room glow · headphone cable · vinyl texture · deep shadows · warm amber |
| **Nina** / desserts + perfume | pale green · dessert gloss · polished chrome spoon · creamy stone · blush styling |
| **Lila** / celebrity lifestyle | hotel room lighting · polished candid travel · expensive softness · campaign-frame crop |

---

# 22. Figma build checklist

## 22.1 Foundations (mirror Tailwind config §13)
1. Color styles for all tokens
2. Type styles for display, headline, body, label, ranking number
3. Corner-radius tokens
4. Shadow tokens (ambient only)
5. Grid/spacing tokens (base 4px)

## 22.2 Components
1. Top app bar (glass, 3 variants: logo-center / back-nav / search)
2. Bottom tab bar (glass, 5 tabs, active/inactive)
3. Feed masonry card (4 variants: image-only / image + caption / editorial quote / video)
4. Rank badge pills (rank+arrow / new / stable / editor)
5. Ranking list preview card (3 variants: image / no-image text card / small)
6. Following activity card (3 variants: saved / added / moved)
7. Profile text tile (editorial grid entry)
8. Shorts glass action pill (large / small)
9. Avatar w/ story ring
10. Primary button (gradient) / Secondary (ghost) / Tertiary (text)

## 22.3 Screens (use `Design_guide/*/code.html` as pixel truth)
1. Home / Discover
2. Search / Following Activity
3. Rankings / Community Hub + personal hub mode
4. Shorts / immersive vertical
5. Profile / self + other user
6. Post Detail
7. Object Detail
8. Ranking List Detail
9. Add to Ranking flow
10. Chat / Inbox / Thread
11. Notifications
12. Auth / Onboarding / Interest Selection

---

# 23. Launch-ready starting point summary

If the team wants the simplest actionable launch direction, use this.

## Brand direction
**The Modern Curator — Soft Editorial Luxury.**

## Base colors
- `background` `#FBF9F6`
- `surface-container-low` `#F5F3F0`
- `surface-container-highest` `#E4E2DF`
- `on-surface` `#1B1C1A`
- `on-surface-variant` `#504446`

## Accent
- `primary` `#55343B` (Fig)
- `primary-container` `#6F4B52` (gradient end)
- `secondary` `#5F5F4E` (Olive Smoke)

## Ranking
- `rank-up` `#547C65`
- `rank-down` `#8B5D5D`
- `new-entry` `#8B6C3F`

## Type
- **Newsreader** — display, card titles
- **Cormorant Garamond** — ranking numbers, pull quotes, brand wordmark italic
- **Inter** — everything else

## Visual content
- warm, soft, tactile, premium
- strong media-led cards
- ranking badges elegant, not gamified
- Editorial text tiles accepted on profile grid

---

# 24. Final recommendation to the team

In Figma, do this next:

1. Import the Tailwind tokens from §13 as Figma styles
2. Build component library per §22.2
3. Rebuild the five Design_guide reference screens as Figma frames (§22.3)
4. Apply the direction to the remaining screens:
   - Object Detail
   - Ranking List Detail
   - Add-to-Ranking flow
   - Chat inbox + thread
   - Notifications
   - Auth / Onboarding
5. Polish three signature cards until they feel right:
   - Feed masonry card (Home)
   - Following activity card (Search)
   - Ranking list preview card (Rankings)

If those three cards look right, the whole system will start to feel right.

---

# 25. Final brand line

**Zoe should look like life with taste.**

Not loud, not empty, not generic — but alive, social, elegant, and worth returning to.

That is the north star.
