# Design System Strategy: The Modern Curator

## 1. Overview & Creative North Star
The visual identity of this design system is anchored in the concept of **"The Modern Curator."** Unlike traditional discovery apps that feel like utility-heavy marketplaces (Yelp) or chaotic mood boards (Pinterest), this system treats every interface like a page from a high-end, bespoke editorial publication. 

The goal is to move away from the "template" look of modern SaaS. We achieve this through **Intentional Asymmetry**, where elements are not always perfectly centered but balanced through weight and whitespace. We use **Tonal Depth** to create hierarchy instead of lines, and **High-Contrast Typography** to guide the eye. This system is designed to feel quiet, authoritative, and expensive.

---

## 2. Colors & Tonal Logic
Our palette is a sophisticated blend of organic "Chalk" and "Ivory" neutrals punctuated by deep, "Fig" and "Espresso" accents. 

### The "No-Line" Rule
**Explicit Instruction:** Do not use 1px solid borders to section off content. In this system, boundaries are defined exclusively through background color shifts. For example, a card component using `surface-container-low` (#f5f3f0) should sit on a `background` (#fbf9f6) surface. This creates a soft, tactile transition that feels like stacked paper rather than a digital grid.

### Surface Hierarchy & Nesting
Treat the UI as a physical stack of fine paper. 
- **Background (#fbf9f6):** Your foundation.
- **Surface-Container-Low (#f5f3f0):** Secondary content or layout sections.
- **Surface-Container-Highest (#e4e2df):** The most prominent interactive elements or "lifted" cards.

### The "Glass & Gradient" Rule
To elevate the experience beyond flat design, use Glassmorphism for floating navigation bars or overlay modals. Use a `surface` color at 70% opacity with a `backdrop-blur` of 20px. 
**Signature Textures:** For primary CTAs, do not use a flat fill. Use a subtle linear gradient from `primary` (#55343b) to `primary_container` (#6f4b52) at a 45-degree angle. This adds "soul" and a sense of materiality.

---

## 3. Typography
The typographic system is a dialogue between the functional and the evocative.

*   **Display & Headlines (Cormorant Garamond / Newsreader):** Used for titles, pull-quotes, and high-level discovery headers. These should be set with tight tracking (-2%) to feel like a premium masthead.
*   **Title, Body, & Labels (Inter):** Used for all functional UI, metadata, and descriptions. Inter provides the "utility" that makes the discovery process feel efficient.

**Editorial Scaling:** Do not be afraid of the contrast between a `display-lg` headline and a `label-sm` metadata tag. The tension between large, serif beauty and tiny, sans-serif utility is what creates the "Editorial Luxury" feel.

---

## 4. Elevation & Depth
We eschew traditional drop shadows in favor of **Tonal Layering**.

*   **The Layering Principle:** Depth is achieved by "stacking." Place a `surface-container-lowest` card on a `surface-container-low` section. This creates a natural "lift" without the "muddy" look of standard shadows.
*   **Ambient Shadows:** If an element must float (e.g., a floating action button), use a shadow with a 24px blur and only 4% opacity. The shadow color must be a tinted version of `on-surface` (#1b1c1a), never pure black.
*   **The "Ghost Border" Fallback:** If accessibility requirements demand a border, use the `outline_variant` token at 15% opacity. High-contrast, 100% opaque borders are strictly prohibited.

---

## 5. Components

### Cards & Discovery
Inspired by high-end lookbooks. 
- **Rule:** Forbid the use of divider lines within cards. 
- **Spacing:** Use 24px or 32px of vertical whitespace to separate header, image, and description. 
- **Metadata:** Use `Olive Smoke` (#71715F) for secondary metadata to keep the focus on the content title in `Espresso` (#2A211D).

### Buttons
- **Primary:** Gradient fill (Primary to Primary Container), `sm` (0.125rem) or `none` (0px) corner radius for a sharper, more architectural feel.
- **Secondary:** Transparent background with a `Ghost Border`. Text in `Fig` (#6F4B52).
- **Tertiary:** Purely text-based in `Cocoa` (#6A584C) with an underline that appears only on hover.

### Ranking Indicators
Ranking is the soul of this app. It must be subtle.
- **Movement:** Use a small 8px icon for `Rank Up` (#547C65) or `Rank Down` (#8B5D5D) placed asymmetrically in the top-right corner of a card.
- **New Entry:** Use the `New Entry` (#8B6C3F) color as a small, elegant "dot" or a high-contrast label in `label-sm` Inter.

### Input Fields
- **Style:** Underline-only or a very subtle `surface-container-high` fill. 
- **Focus State:** Transition the underline to `Fig` (#6F4B52). Avoid the standard blue focus rings.

---

## 6. Do’s and Don’ts

### Do:
- **Do** use generous whitespace. If you think there’s enough space, add 8px more.
- **Do** use `Cormorant Garamond` for numbers in rankings to give them a "heritage" feel.
- **Do** align text-heavy components to a strict left-margin to maintain an editorial "grid."

### Don’t:
- **Don't** use standard "Success Green" or "Error Red." Use our `Rank Up` and `Rank Down` muted tones to maintain the luxury palette.
- **Don't** use icons for everything. Sometimes a well-set word in `label-md` Inter is more premium than a generic icon.
- **Don't** use cards with heavy shadows or rounded corners larger than `xl` (0.75rem). We want "architectural," not "bubbly."

---

## 7. Design Tokens (Quick Ref)

| Token Name | Value | Role |
| :--- | :--- | :--- |
| `background` | #FBF9F6 | Base layer, "Chalk" |
| `surface-container-low` | #F5F3F0 | Secondary sections |
| `primary` | #55343B | Main CTA / Brand accent |
| `on-surface` | #1B1C1A | Primary headers (Inter) |
| `on-surface-variant` | #504446 | Editorial accents (Fig) |
| `rank-up` | #547C65 | Positive movement |
| `new-entry` | #8B6C3F | Highlight/New items |