# Zoe — Screen-by-Screen Mobile IA + Wireframe Spec
**Version:** 2.0
**Platform:** Mobile-first (iOS and Android)
**Product direction:** Instagram-familiar shell · RedNote-style discovery utility · Beli-inspired ranking integrated into profiles, feeds, and updates
**Visual reference:** `Design_guide/` prototypes (Home / Search / Rankings / Shorts / Profile) + **post detail** layouts in `Design_guide/posts/` (`post_for_cafe`, `post_for_album`, `post_for_shoes`) + `Design_guide/*/DESIGN.md` ("The Modern Curator"). Design tokens and component rules live in `PRD/Zoe_Visual_Direction_Kit.md` §7, §11, §13, §16.5–§16.6, §18–§18.6.
**Document purpose:** Define the full screen-level information architecture, wireframe structure, navigation model, states, and end-to-end user flows for the Zoe mobile MVP.

---

# 1. Product framing

Zoe should feel visually and behaviorally closer to **Instagram** than to a traditional review app.

However, Zoe is **not** a generic photo-sharing app. Its product purpose is:

- discover places, products, and lifestyle recommendations with RedNote-like utility
- build and display identity through Beli-like ranking
- keep discovery, discussion, and ranking inside one elegant mobile product

The app should feel like:

- an Instagram-native experience
- a recommendation engine that users can actually use
- a social taste network
- a place where rankings are living identity artifacts

---

# 2. Core shell and navigation model

## 2.1 Bottom tab bar
Zoe uses a fixed **5-button bottom navigation bar** rendered as a **glass surface** (`bg-surface/80 backdrop-blur-2xl`, soft ambient shadow) per Visual Direction Kit §11.5.

There is **no Add tab**.

### Tab order (Design_guide-aligned)
1. **Home** (Discover)
2. **Search** (see §SCREEN 13 — combines search + following activity)
3. **Rankings** (Rank)
4. **Shorts**
5. **Profile**

### Interaction rules
- Tapping the current tab again should return to the top/root of that tab.
- Home re-tap should instantly scroll the feed back to the top.
- Search re-tap should clear any active search state and return to the Following Activity landing.
- **Rankings** re-tap should return to the user's rankings hub root (Community Hub landing or personal hub root).
- **Shorts** re-tap should reset to the top/current first item.
- Profile re-tap should return to the user's profile root.

## 2.2 Create content entry points
There is **no bottom-nav Add button**.

Users create content in two ways:

### A. From Profile
Like Instagram, the primary static creation entry lives on the user’s own profile.

### B. Swipe right from the Home feed
Opens the **camera / capture** flow (Instagram-like).

This flow supports:
- Story-like content
- quick capture
- optional transition into full post creation
- **Rank new item:** choose category → pairwise compare → caption
- optional ranking-related post creation

## 2.3 Secondary global surfaces
Accessible from icons, modals, or deep links:
- Inbox / Chat
- Notifications
- Comments
- Share sheet
- Post detail
- Place detail
- Product detail
- Ranking detail
- Settings
- Saved / Collections
- Followers / Following
- Story viewer

---

# 3. Core information architecture

## 3.1 Top-level IA map

- Auth / Onboarding
- Main App Shell
  - Home (Discover)
  - Search (Following Activity + search)
  - Rankings (Community Hub + personal hub)
  - Shorts
  - Profile
- Overlay / Secondary Surfaces
  - Camera / Story
  - Create Post
  - Create Ranking Entry
  - Inbox / Chat
  - Notifications
  - Comments
  - Share to Chat
  - Search Results
  - Post Detail
  - Place Detail
  - Product Detail
  - Album / Film / Other ranked-object detail
  - Ranking List Detail
  - User profile detail
  - Settings / Privacy / Account
  - Saved
  - Story viewer

## 3.2 Ranked object scope for MVP
The app shell should support ranking multiple types of things eventually, but the MVP should be structured to start with strong categories.

### MVP ranking object types
- Restaurants
- Cafés
- Bars
- Perfumes
- Albums

This gives the **Rankings** hub and Home feed enough variety to feel alive while still keeping the product coherent around taste and identity.

---

# 4. Global design language

**Source of truth:** `Design_guide/` prototypes + `PRD/Zoe_Visual_Direction_Kit.md`. The system is called **"The Modern Curator" — Soft Editorial Luxury**.

## 4.1 Visual direction

### Modern Curator (primary)
- warm chalk/ivory canvas (`#FBF9F6`)
- tonal depth instead of lines (no 1px borders — see Visual Direction Kit §7.1)
- glassmorphic top bar and bottom tab bar
- Newsreader serif for titles, Inter for UI, Cormorant Garamond for ranking numbers
- generous whitespace, editorial left-align
- slow, elegant motion (700ms ease-out image hovers)

### Instagram-familiar shell
- edge-to-edge or `rounded-xl` media
- circular avatars with warm ring
- 5-tab bottom nav, no Add button
- posting from Profile or swipe-right camera
- stories where appropriate

### RedNote-style utility
- recommendation-rich content
- searchable taste notes
- object tags and context
- "why this matters" metadata

### Beli-inspired ranking
- ranking badges on feed cards (`#3 ▲`, `NEW`, `STABLE`)
- Cormorant Garamond rank numbers
- movement in muted `rank-up` (#547C65) / `rank-down` (#8B5D5D) / `new-entry` (#8B6C3F)
- comparison-first ranking UX

## 4.2 Persistent interaction patterns
Across most cards and posts:
- Like / Appreciate or Save signal
- Comment
- Share
- Save / Collect
- Open ranked object
- Open creator profile

## 4.3 Global badges and labels
Used lightly, always as glass pills on media (`bg-background/90 backdrop-blur-md rounded-DEFAULT`). See Visual Direction Kit §19:
- `#x ▲` / `#x ▼` / `#x STABLE` — rank + momentum
- `NEW` — new entry (in `new-entry` color, uppercase tracking-widest)
- `RANKED #2 LAST MONTH` — taste memory
- `EDITOR` — editorial pick (dark wine, rare)
- `Hot` / `Trending` with `local_fire_department` icon
- Story ring (soft warm gradient, not rainbow neon)
- Taste Match % — optional, label-sm

---

# 5. Primary user journeys this IA must support

1. Browse home feed and discover useful content
2. Search a place or product and make a decision
3. Watch short-form content in **Shorts**
4. Check what people you follow recently ranked or changed
5. Open profiles and inspect ranking lists
6. Add a post from Profile
7. Swipe right to camera and create Story / post
8. Share any card to chat
9. Comment on posts
10. Rank an item into a personal list
11. View ranking changes from friends, creators, celebrities
12. Chat with others about places and rankings

---

# 6. Screen inventory

This section lists every primary MVP screen.

## 6.1 Auth + onboarding
- Splash / boot
- Sign up / log in
- Welcome
- Interest selection
- Seed ranking onboarding
- Follow suggestions
- Permissions setup

## 6.2 Main app tabs
- Home feed (editorial masonry — `Design_guide/home_page/`)
- Search / Following Activity (`Design_guide/search_page/`)
- **Rankings** hub — Community Hub + personal hub (`Design_guide/ranking_page/`)
- **Shorts** feed (`Design_guide/shorts_page/`)
- Profile — self (`Design_guide/profile_page/`)

## 6.3 Content detail screens
- Post detail
- Short detail (vertical video)
- Story viewer
- Ranking list detail
- Ranking object detail
- User profile (other user)

## 6.4 Social and communication screens
- Notifications center
- Inbox list
- Chat thread
- Share to chat sheet
- Comments sheet

## 6.5 Creation screens
- Camera / Story capture
- Story editor
- Create post from profile
- Attach ranked object
- Write caption / note
- Publish settings
- Add to ranking flow
- Edit ranking list

## 6.6 Utility/settings screens
- Saved / Collections
- Followers list
- Following list
- Settings
- Privacy
- Account
- Notification preferences

---

# 7. Screen-by-screen spec

---

## SCREEN 01 — Splash / App Boot

### Purpose
Load brand and determine whether the user goes to auth or into the app.

### Entry points
- app open
- cold launch

### Required components
- Zoe logo
- subtle motion or still mark
- loading state

### States
- loading
- authenticated route
- unauthenticated route
- maintenance / error fallback

### Navigation
- to Welcome / Auth
- to Main App Shell

### Wireframe
```text
+----------------------------------+
|                                  |
|                                  |
|             ZOE                  |
|            ζωή                  |
|                                  |
|                                  |
+----------------------------------+
```

---

## SCREEN 02 — Welcome / Auth Landing

### Purpose
Introduce Zoe and get the user into sign-up or log-in.

### Required components
- hero image or collage
- one-line value prop
- Continue with Apple
- Continue with Google
- Continue with Email / Phone
- Log in link

### States
- default
- loading auth
- auth error

### Primary actions
- sign up
- log in

### Wireframe
```text
+----------------------------------+
|           [hero collage]         |
|                                  |
|  Discover. Rank. Share taste.    |
|                                  |
| [Continue with Apple]            |
| [Continue with Google]           |
| [Continue with Email / Phone]    |
|                                  |
| Already have an account? Log in  |
+----------------------------------+
```

---

## SCREEN 03 — Interest Selection

### Purpose
Seed **Home**, **Search (Following Activity)**, **Shorts**, and suggested **Rankings** lists.

### Required components
- title
- **large imagery tiles** per topic (editorial cards, not bare checkboxes)
- multi-select topics
- next CTA

### Example interests
- **fashion**
- **sports**
- **music**
- **film / TV**
- coffee & cafés
- fine dining
- perfumes & beauty
- albums
- bars & nightlife
- travel & places
- desserts

### States
- nothing selected
- some selected
- max selected
- loading

---

## SCREEN 04 — Seed Ranking Onboarding

### Purpose
Introduce ranking as a core mechanic and collect initial taste signals.

### Required components
- prompt: rank or compare items you already know
- swipe card or comparison module
- skip option
- progress bar

### Behavior
The system shows known restaurants / cafés / perfumes / albums depending on chosen interests.

### Example tasks
- Which do you prefer?
- Add this to your ranking?
- Have you tried this?

### States
- no data yet
- in progress
- completed minimum threshold

### Wireframe
```text
+----------------------------------+
| Step 2 of 4                      |
| Rank a few things you know       |
|                                  |
|  [Sushi Spot A]  vs  [Spot B]    |
|                                  |
|   Prefer A   /   Prefer B        |
|                                  |
| [Skip]                  [Next]   |
+----------------------------------+
```

---

## SCREEN 05 — Follow Suggestions

### Purpose
Seed social graph and relevance.

### Required components
- suggested users
- follow button
- skip
- import contacts optional later

### User types shown
- friends
- local creators
- celebrities / known tastemakers
- category specialists

---

## SCREEN 06 — Permissions Setup

### Purpose
Request notifications, camera, photo library, location in context.

### Required components
- permission explanation cards
- enable CTA
- skip / later

### Notes
Request location only when needed. Do not front-load too aggressively.

---

# MAIN APP SHELL

---

## SCREEN 07 — Home Feed (Discover)

### Purpose
Primary discovery feed with Instagram-familiar structure and editorial/RedNote-style utility.

### Reference prototype
`Design_guide/home_page/code.html` — two-column editorial masonry with mixed aspect ratios, rank pills on media, occasional editorial quote card, and a desktop variant that expands to 3–4 columns.

### Entry points
- tab tap
- app launch after auth
- deep link to feed

### Top bar (glass, `bg-surface/70 backdrop-blur-xl`, h-16)
- **Menu** button (left, mobile) / desktop nav links (hidden on mobile): Discover · Search · Rank
- **Zoe** wordmark (center), **Newsreader italic**, 3xl, tracking-tight, `primary`
- **Avatar** (right): 8×8 rounded-full with `ring-1 ring-outline-variant/30`
- Optional **story tray** directly below top bar when Stories ship; v1 may omit

### Category filter row (horizontal snap-scroll)
- Active chip: `bg-primary text-on-primary rounded-xl px-5 py-2` with shadow `[0_4px_12px_rgba(85,52,59,0.15)]` — e.g. "For You"
- Inactive chips: `bg-surface-container-low text-on-surface rounded-xl px-5 py-2`
- Example chips: For You · Architecture · Ceramics · Minimalism · Botanical · Interiors · Cafés · Perfume · Albums

### Main content: Editorial Masonry
`columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4`

Card variants (see Visual Direction Kit §16.1):
1. **Image-only card** with rank badge top-right (e.g. `• 12` with `rank-up` dot)
2. **Image + caption card** (Newsreader title, body snippet, avatar footer with heart count)
3. **Image + editorial category tag** (bottom-left label e.g. `STYLE` uppercase tracking-widest)
4. **Image + NEW entry** (top-left `NEW` label in `new-entry` color)
5. **Editorial quote card** (no media; `surface-container-low` fill with `border border-outline-variant/15`; `format_quote` icon + Newsreader 24px pull quote + uppercase attribution)
6. **Ranking activity card** (see SCREEN 13 — social taste movement)
7. **Sponsored** (post-MVP, clearly labeled)

### Feed post types
- recommendation photo post
- carousel post
- short video post
- ranking-post update
- saved-list preview card
- place/product recommendation post
- “added to ranking” activity card

### Required post card anatomy
- **Media** wrapped in `rounded-xl overflow-hidden bg-surface-container-low`
- Optional **ranking badge** overlay (see Visual Direction Kit §19 — glass pill, top-right or top-left)
- Optional **editorial category tag** bottom-left (`bg-surface-container-highest/90 backdrop-blur-sm rounded-DEFAULT`, `label-[10px] uppercase tracking-widest` in `primary`)
- **Newsreader title** (`font-headline text-xl text-on-surface leading-tight tracking-tight`)
- Optional short caption (Inter 14px, `on-surface-variant`, `line-clamp-2`, leading-relaxed)
- Footer row: **avatar 5×5** · `@handle` in `label-xs` `on-surface-variant` · heart icon + count in `outline`
- On hover: `group-hover:scale-105 transition-transform duration-700 ease-out`

### Primary actions
- open profile
- like / appreciate
- comment
- share
- save
- open place/product/album detail
- open ranking list
- open chat from share sheet

### States
- default populated feed
- first-time feed
- empty / no follows
- poor connection
- new posts available
- scrolled deep state
- refresh state

### Re-tap behavior
If user is already on Home and taps Home again:
- instantly scroll to top
- optionally refresh if already near top

### Wireframe
```text
+-----------------------------------------+
| ☰               Zoe              [av]   |  glass top bar
|-----------------------------------------|
| [For You][Architecture][Ceramics][…]   |  snap-scroll chips
|-----------------------------------------|
| +-----------+  +-----------+            |
| | img  •12▲ |  |   img     |            |  masonry, mixed ratios
| +-----------+  +-----------+            |
| Serif title    Serif title              |
| snippet        snippet                  |
| av @handle ♥4.2k  av @handle ♥856      |
|                                         |
| +-----------+  +----------------------+ |
| | img NEW   |  | "quote in Newsreader"| | editorial card
| +-----------+  |   — Le Corbusier     | |
| Serif title    +----------------------+ |
| av @handle     …                        |
+-----------------------------------------+
| discover | search | rank | shorts | profile |  glass bottom nav
+-----------------------------------------+
```

### Story tray requirements
- user’s own story at first position
- followed users with active stories
- ranked-object story cards possible later
- tap opens Story Viewer

---

## SCREEN 08 — Post Detail

### Purpose
Full-screen post consumption and interaction. The UI **routes among three editorial templates** (see `Design_guide/posts/` and `Zoe_Visual_Direction_Kit.md` §16.5, §18.6) so place posts, album posts, and product posts each feel native — not a single generic “Instagram clone” sheet.

### Entry points
- tap feed post
- tap shared post
- tap profile grid item

### Template selection (`detail_layout`)
| `detail_layout` | Prototype folder | Best for |
| :--- | :--- | :--- |
| `discovery_photo` | `post_for_cafe/` | Places, food, travel — tall hero, glass location chip, **tonal ranking strip** with left gradient accent |
| `album_review` | `post_for_album/` | Music / square artwork — centered title + artist, **gradient ranking ribbon**, nested editorial card |
| `product_hero` | `post_for_shoes/` | Fashion, sneakers, objects — **wide hero** + **floating rank chip** overlapping bottom-right, left-rule body copy, Collection CTA |

**Default inference (if field unset):** album-like `object` category → `album_review`; fashion / footwear / product SKUs → `product_hero`; else `discovery_photo`.

### Shared chrome (all templates)
- Glass **top app bar**: `arrow_back` · contextual center title (Newsreader italic **Zoe** or e.g. “Album Review”) · overflow (`more_horiz` or `more_vert` per template).
- **Save** affordance: bookmark in header (café) or in-body action row (album) — product template may emphasize **Add to Collection** instead of duplicating save.
- **Ranking → list:** tapping the ranking banner / ribbon / chip opens **Ranking Detail** for that list (deep link preserves entry rank context).

### Required components (union across templates)
- hero media (aspect and width vary by template)
- curator attribution (avatar + name + relative time — inline row or inside editorial card per variant)
- headline + long-form caption / review body
- tags (rounded-full ghost chips on discovery; optional elsewhere)
- **ranking context** surfaced as strip, ribbon, or floating chip (never identical across all three)
- linked object (implicit via ranking banner or explicit “View Details” on product)
- **Discussion** — section naming varies (“Curator Notes”, “Discussion”, “Thoughts”); supports threaded reply + **Author** badge on discovery template
- like + comment counts + share (`ios_share` or `share`)
- related ranking list link (from ranking UI)
- **Follow** CTA in header or composer-adjacent row when viewer does not follow author (not shown in HTML prototypes; required for MVP parity)

### Per-template wireframes

**A — `discovery_photo` (`post_for_cafe`)**
```text
+-----------------------------------------+
| ←        Zoe (italic)            ⋯      |  glass
| [avatar] Elena Rostova      [bookmark]  |
|            2 hours ago                  |
| ┌─────────────────────────────────────┐ |
| │         [4:5 hero image]              │ |
| │  📍 Kurasu, Kyoto    (glass chip)   │ |
| └─────────────────────────────────────┘ |
| │#3│ RANKED IN  Best Matcha Spots  +1↑ │  tonal strip + gradient spine
|                                         |
| The perfect balance of umami…           |  Newsreader ~3xl
| [body Inter on-surface-variant]         |
| #Matcha #KyotoCafes …                   |
| ─────────────────────────────────────   |  hairline 15%
| ♥ 1.2k    💬 48              share →    |
| ┌─ Curator Notes ───────── [Discussion]┐ |
| │ [avatar] Add a note or question…    │ |
| │ thread + Author pill on replies       │ |
| └─────────────────────────────────────┘ |
+-----------------------------------------+
```

**B — `album_review` (`post_for_album`)**
```text
+-----------------------------------------+
| ←    Album Review (italic)        ⋮     |
| ┌──────── square artwork ─────────────┐ |
| └─────────────────────────────────────┘ |
|        Blonde                           |  Newsreader 4xl centered
|     FRANK OCEAN                         |  Inter uppercase
| ████ RANKED #1 ████ All-Time Albums ████|  gradient ribbon + Cormorant
| ┌─ surface-container-low card ────────┐ |
| │ curator row                         │ |
| │ pull quote Newsreader xl            │ |
| │ body Inter                          │ |
| │ ♥ counts  💬    [bookmark] [share]  │ |
| └─────────────────────────────────────┘ |
| Discussion                              |
| [rounded cards…]  [pill input] [send] │
+-----------------------------------------+
```

**C — `product_hero` (`post_for_shoes`)**
```text
+-----------------------------------------+
| ←        Zoe                    ⋯      |
| ┌────────── wide 4:3 / 16:9 ──────────┐ |
| │         [hero product shot]          │ │
| └─────────────────────────────────────┘ |
|              ┌─ #5 │ ALL-TIME SNEAKERS ─┐|  floating chip -bottom-4
|              └─────────────────────────┘|
| Aether "Concrete" High                  |  Newsreader 4xl–5xl
| Curated by Alex M. · 2 hours ago        |
| │ long-form body with left vertical rule│
| [ Add to Collection ] [ View Details ]  |  gradient + ghost
| Thoughts                                |
| [comments + underline composer]         |
+-----------------------------------------+
```

### States
- photo post (any `detail_layout`)
- carousel post (default to `discovery_photo` carousel until a dedicated carousel detail exists)
- short video post (may reuse `discovery_photo` chrome with video hero, or push to Shorts viewer — product decision)
- post unavailable
- deleted/private

---

## SCREEN 09 — Comments Sheet / Comments Screen

### Purpose
Allow threaded lightweight conversation on a post.

### Entry points
- tap comment icon
- tap “view comments”

### Required components
- post preview header
- comment list
- reply action
- input field
- emoji/reaction support optional
- report/delete own comment
- pinned useful comment optional later

### States
- no comments
- some comments
- reply thread expanded
- loading older comments
- blocked / disabled comments

### Wireframe
```text
+----------------------------------+
| Comments                         |
|----------------------------------|
| user1: Is it good for studying?  |
|   Reply                          |
| user2: Better than Arriviste imo |
|   Reply                          |
|----------------------------------|
| [Add a comment...]        [Send] |
+----------------------------------+
```

---

## SCREEN 10 — Share Sheet

### Purpose
Share any object internally or externally.

### Entry points
- share icon on post, short, ranking item, profile, object detail

### Required components
- share target preview
- recent chats row
- send to group / friend
- copy link
- external share
- add message field

### States
- internal share only if external disabled
- with recent chats
- with no chats yet

---

## SCREEN 11 — Inbox List

### Purpose
Central messaging hub.

### Entry points
- inbox icon from Home top bar
- share action prompt
- deep links

### Required components
- search chats
- recent chats list
- new message button
- request / invite state if needed later
- unread badges
- pinned chats later

### States
- empty inbox
- populated inbox
- unread-heavy state
- chat requests later

### Wireframe
```text
+----------------------------------+
| Inbox                     [new]  |
| [Search messages]                |
|----------------------------------|
| avatar  Maya          2m   (2)   |
| sent Sumi Café                  |
|----------------------------------|
| avatar  Weekend Plan     1h      |
| “Which one for Friday?”          |
+----------------------------------+
```

---

## SCREEN 12 — Chat Thread

### Purpose
Support in-app conversation about posts, places, rankings, and plans.

### Required components
- thread header
- messages
- rich shared cards
- composer
- media share
- quick actions for shared object
- seen/unseen status optional MVP-lite

### Supported message types
- text
- shared post
- shared ranking update
- shared place/product/album
- shared list
- shared profile

### States
- 1:1 thread
- group thread
- empty thread
- attachment sending
- deleted unavailable shared object

### Wireframe
```text
+----------------------------------+
| Maya                             |
|----------------------------------|
| [shared card: Sumi Café]         |
| Best quiet café for solo work    |
| [Open]                           |
|                                  |
| You: Want to go Saturday?        |
| Maya: yes this feels very us     |
|----------------------------------|
| [Message...]     [+]       [→]   |
+----------------------------------+
```

---

## SCREEN 13 — Search / Following Activity

### Purpose
Zoe's **Search** tab is not a generic grid-style explore page. It is a **taste-intimate following-activity feed** with an editorial search affordance on top. Users come here to see what people they trust just ranked, saved, or added — and to search with depth (people, objects, lists, topics).

### Reference prototype
`Design_guide/search_page/code.html`

### Entry points
- bottom tab **Search**
- search interactions from elsewhere (deep link, share)

### Top bar (glass, `bg-surface/70 backdrop-blur-xl`)
- Leading `search` icon (Material Symbol, text-2xl, `primary`)
- **Large Newsreader italic input** — `placeholder="Search your circle…"`, `text-xl font-headline tracking-tight`, no border, no focus ring (editorial feel)
- Trailing avatar 8×8

### Main content: stacked following-activity cards
- Section header: **"Following Activity"** in Newsreader italic 28–30px, `primary` color
- Vertical stack with generous spacing (`space-y-10`)
- Each activity is two parts:
  1. **Actor line row** (avatar 8×8 + short sentence): `"Maya added Sumi Café to her Top 5"` with actor name in Inter strong and object name in **Newsreader italic** `primary`
  2. **Rich artifact card** (rounded-DEFAULT, ambient shadow `shadow-[0_4px_24px_rgba(27,28,26,0.02)]`)

### Activity card variants (see Visual Direction Kit §16.3)
- **Added to ranking / Saved:** `bg-surface-container-low` · aspect-video hero image · Newsreader title · uppercase tracking-widest subtitle in `secondary` · body snippet
- **Moved up/down (rank change):** `bg-surface-container-highest` (lifted) · inline layout with 24×24 object image on the left, details on right · corner arrow in `rank-up` or `rank-down`
- **Saved a multi-image place:** card with horizontal snap-scroll of 48×64 image thumbs

### Search bar behavior
When user taps/types, the Following Activity feed collapses and results surface per SCREEN 14. Search supports:
- people (creators, friends, celebrities)
- places (restaurants, cafés, bars)
- products (perfumes, beauty, fashion)
- albums / artists
- ranked lists
- tags, topics, neighborhoods

### States
- default: Following Activity feed (most recent taste moves from people you follow)
- typing: results + recent searches
- results: per SCREEN 14
- empty (no follows): prompt to follow creators + trending lists suggestion
- loading
- offline

### Wireframe
```text
+-----------------------------------------+
| 🔍  [Search your circle…]         [av] |  glass top bar
|-----------------------------------------|
| Following Activity                      |  Newsreader italic
|                                         |
| [av] Maya added *Sumi Café* to Top 5   |
| +-------------------------------------+ |
| | [aspect-video image]                | |
| | Sumi Café                           | |  Newsreader 24px
| | KYOTO, JAPAN                        | |  label uppercase
| | "The matcha pours here are…"        | |  body
| +-------------------------------------+ |
|                                         |
| [av] Elton just ranked *Blonde* #1     |
| +-------------------------------------+ |
| | [cover]  Blonde          ↑          | |  rank-up arrow
| |          FRANK OCEAN                | |
| |          "Finally clicked for me…"  | |
| +-------------------------------------+ |
|                                         |
| [av] Nina saved *Kyo Omakase*          |
| +-------------------------------------+ |
| | Kyo Omakase                         | |
| | WEST VILLAGE, NY                    | |
| | [thumb][thumb][thumb]               | |  horiz scroll
| +-------------------------------------+ |
+-----------------------------------------+
| discover | search | rank | shorts | profile |
+-----------------------------------------+
```

---

## SCREEN 14 — Search Results

### Purpose
Return relevant results across object types.

### Result tabs
- Top
- Posts
- People
- Places
- Products
- Albums
- Rankings

### Required components
- query shown
- type tabs
- filter/sort
- result cards
- save recent search

### States
- mixed results
- filtered results
- empty result
- typo / suggested spellings

---

## SCREEN 15 — Object Detail (Generic Ranked Object Detail)

### Purpose
Unified detail page for any ranked object:
- restaurant
- café
- perfume
- album

### Required components
- hero media
- object title
- category
- creator/friend ranking context
- average public activity
- your ranking status
- add to ranking CTA
- associated posts
- related objects
- comments/discussion snippet optional later
- share
- save

### Subtype requirements

#### Restaurant / Café
- map/address
- hours
- tags
- price band
- who ranked it

#### Perfume
- fragrance notes
- scent family
- projection/longevity fields later

#### Album
- artist
- release year
- genre
- track count

### States
- not ranked by user
- already ranked
- user follows many who ranked it
- limited data

---

## SCREEN 16 — Shorts Feed

### Purpose
Short-form **immersive** vertical video surface. Dark and warm (never flat black), with glass-pill controls and an elegant curator footer.

### Reference prototype
`Design_guide/shorts_page/code.html`

### Entry points
- bottom tab **Shorts**
- tap video post from feed
- tap **RANK** object path from a shared short

### Body
- `bg-black` body with `overflow-hidden`
- Full-screen vertical media stack (`snap-y snap-mandatory`)
- Each item: full-bleed `img`/`video` + two tonal gradients for text legibility (`from-black/30 via-transparent to-black/80`)

### Top bar (glass, translucent)
- Menu left · centered **Zoe** Newsreader italic · avatar right

### Right rail (glass action pills, 52×72 rounded-full)
- **Heart + count** — filled on like (`font-variation-settings: 'FILL' 1`)
- **Chat bubble + count** — comments
- **Bookmark + "Save"** — save to collections
- **More (52×52)** — overflow

Each pill: `bg-white/10 backdrop-blur-xl border border-white/20` with `shadow-[0_8px_32px_rgba(0,0,0,0.12)]`.

**Optional RANK action**: when the short is tied to a rankable object, promote a `RANK` pill (gradient fill `primary → primary-container`) above the rail — first-class entry to the add-to-ranking flow.

### Bottom-left info block (left-6 bottom-28)
- **Curator badge**: 10×10 avatar with `border-[1.5px] border-white/40`, creator name in **Newsreader 18px white drop-shadow**, label "CURATOR" in uppercase tracking-widest
- **Description**: Inter 14px medium, white/95, `line-clamp-2`
- **Metadata pills** (location + audio): `bg-black/40 backdrop-blur-md border border-white/10 rounded-full px-3 py-1.5` with Material Symbols `location_on` and `music_note`

### States
- playing / paused (tap-hold to pause)
- muted / unmuted
- loading next item (`swipe_up` icon pulsing on placeholder)
- no more items
- poor connection
- rank-flow open (modal over short)

### Wireframe
```text
+----------------------------------+
| ☰         Zoe           [av]     |  glass top bar
|----------------------------------|
|                                  |
|   [full-bleed vertical media]    |
|                                  |
|                           ♥ 24.5k|  glass pill
|                           💬 412 |
|                           🔖 Save|
|                            ⋯     |
|                                  |
| ○ The Daily Grind                |  curator, white serif
|   CURATOR                        |
|  "Exploring the hidden gem…"     |  body
|  📍 Kyoto · 🎵 Lo-Fi             |  glass pills
+----------------------------------+
| discover | search | rank | shorts | profile |
+----------------------------------+
```

---

## SCREEN 17 — Rankings Hub (MVP)

### Purpose
Two modes in one tab:
- **Community Hub** (default landing) — browse trending lists and tastemakers across the platform in an editorial masonry, like a magazine's "Community" section.
- **Personal Hub** — browse the user's **own** ranked items grouped by **interest categories**, plus **Pinned** lists from friends/celebrities.

A top tab toggle or horizontal affordance switches between the two. Both modes share the "Modern Curator" language (background `#FBF9F6`, serif titles, rank pills, glass chrome).

### Reference prototype
`Design_guide/ranking_page/code.html` — this prototype shows the **Community Hub** mode. Personal hub is a derivative view.

### Entry points
- bottom tab **Rankings**
- deep link to a specific category, list, or community section
- **RANK** from Shorts
- **Swipe-right** camera → rank flow
- From Home ranking activity card

### Shell (always present)
- Bottom tab bar remains visible (glass, 5 tabs); **Rankings** is active.
- Top bar (glass, `bg-surface/70 backdrop-blur-xl`, h-16): desktop nav links (left) · centered **Zoe** Newsreader italic · avatar (right). Mobile shows menu + Zoe + avatar.

### Hero header (Community Hub)
- Centered, `pt-4`
- "Community Hub" in Newsreader 40–48px `on-surface`, tight tracking
- Subline body in `on-surface-variant`: "Explore living rankings curated by the Zoe community. Find your next obsession."

### Filter tabs (under hero)
Centered, `border-b border-outline-variant/30`:
- **Trending Lists** (active) · **New Tastemakers** · **Category Gems**
- Active: `primary` bold + `border-b-2 border-primary pb-2`
- Inactive: `secondary`, uppercase tracking-widest

### Discovery masonry (Community Hub)
`columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4`

Each card = **ranking list preview** (see Visual Direction Kit §16.2):
- `bg-surface-container-lowest` with subtle shadow `shadow-sm hover:shadow-md`
- Hero image (mixed aspect ratios: 3/4, square, 4/3, 3/5, 16/9)
- Overlay pill top-right: `No. 1` + `trending_up`, `New` + `grade`, or `Hot` + `local_fire_department`
- Newsreader 18–20px list title (e.g. "The Brutalist Revival in Interior Spaces")
- Optional 11px body snippet (2 lines)
- Footer: owner avatar (5×5) + `by @handle` in 10px · heart + count on right

### Personal Hub mode (toggle from top)
When user switches to personal view:

#### Header
Replace hero with simpler row: "Your Rankings" in Newsreader + `[Edit]` (reorder) + `[+]` (add).

#### Pinned strip
Horizontal scroll at top: other users' public lists the user has pinned. Cards show avatar, `@handle`, list title, and preview strip — Home-style editorial cards.

#### Your categories (stacked, reorderable)
- Vertical stack of **category blocks**: Film, Music, Fashion, Sports, Restaurants, Perfume, Cafés, Albums
- **Collapsed row:** category name in Newsreader 20px · count or "updated 2d ago" in `on-surface-variant` · chevron (▾/▴)
- **Expanded:** ordered entries rendered as editorial rows — **Cormorant Garamond rank number** (22–28px), 12×12 object thumb (rounded-DEFAULT), object name in Newsreader 16px, subtitle in `on-surface-variant` uppercase label, optional movement arrow (`rank-up` / `rank-down`)
- Tap row → **Ranking Detail (SCREEN 18)**

#### Reorder mode
Tap `[Edit]` or long-press a category to enter reorder mode. Drag-and-drop categories into any order. Persist via `user.category_order`.

### Add flow (high level)
1. `[+]` → pick category (or create new) → add item
2. Photo upload, camera capture, or music link (Spotify / Apple Music)
3. Pairwise compare within that category
4. Optional caption; respect visibility rules

### Wireframe — Community Hub (default)
```text
+-----------------------------------------+
| (links)         Zoe            (rank*)  [av] |  glass top bar
|-----------------------------------------|
|         Community Hub                   |  Newsreader 44
|  Explore living rankings curated by…    |  body
|                                         |
|  TRENDING LISTS · New Tastemakers · …   |  tabs
|-----------------------------------------|
| +-----------+  +-----------+            |
| | img No.1▲ |  |    img    |            |  masonry
| +-----------+  +-----------+            |
| Brutalist…     Tactile Ceramics…        |  serif title
| av @arch_curator  av @maya  ♥1.8k       |
|                                         |
| +-----------+  +-----------+            |
| |   img     |  | img Hot   |            |
| +-----------+  +-----------+            |
| Third-Wave…    Gallery Whites…          |
+-----------------------------------------+
|    [loading more spinner]               |
+-----------------------------------------+
| discover | search | rank | shorts | profile |
+-----------------------------------------+
```

### Wireframe — Personal Hub
```text
+-----------------------------------------+
| Your Rankings       [edit] [+]          |
|-----------------------------------------|
| PINNED                                  |
| [card @lila · Tour Favorites]  →        |
| [card @maya · Top Cafés]       →        |
|-----------------------------------------|
| YOUR CATEGORIES   (reorderable)         |
| ▴ Film — 12 items                       |
|    I  [thumb] Past Lives                |  Cormorant "I"
|    II [thumb] Perfect Days       ▲      |
|    III[thumb] Aftersun                  |
| ▾ Music — 8 items                       |
| ▾ Fashion — 3 items                     |
+-----------------------------------------+
```

### Privacy (viewer)
- **Pinned** and browsing others' lists **only** when the owner's **rankings visibility** allows (see SCREEN 31 / PRD §36). **Private** accounts: non-followers see **locked** rankings until **Follow** is accepted.

### Social ranking activity
Others' **move** feeds stay primary in **Home** and the **Search / Following Activity** surface; this tab is **yours + pins + community**.

---

## SCREEN 18 — Ranking Detail List

### Purpose
Show a full ranking list owned by a user.

### Examples
- Maya’s Top 20 Cafés
- Elton’s Favorite Perfumes
- Cody’s All-Time Favorite Albums

### Required components
- list title
- owner
- cover/collage
- description
- ordered ranking entries
- last updated
- list followers/saves
- follow ranking / save list
- compare to your ranking optional later
- comments/discussion later
- edit if owner

### Entry card requirements
Each ranked item row shows:
- rank number
- object image
- object name
- category/type
- movement indicator if recent
- optional note snippet

### States
- public list
- private list
- list unavailable
- owner edit mode
- empty list

### Wireframe
```text
+----------------------------------+
| Maya’s Top Cafés                 |
| updated 2d ago                   |
|----------------------------------|
| #1  Arriviste                    |
| #2  Kyo Matcha                   |
| #3  Sumi Café   ↑3               |
| #4  ...                          |
+----------------------------------+
```

---

## SCREEN 19 — Add to Ranking Flow

### Purpose
Let user add an object into a ranking using Beli-like attraction mechanics.

### Entry points
- object detail
- post composer
- profile rankings section
- Home ranking activity card prompt

### Step structure
1. select ranking list
2. compare against nearby entries or choose approximate slot
3. adjust final position
4. add short ranking note
5. publish ranking update if desired

### Required components
- selected object preview
- list selector
- comparison prompt
- position slider / placement tool
- publish toggle

### States
- first item in a list
- existing list insertion
- move item in list
- duplicate prevention state

### Wireframe
```text
+----------------------------------+
| Add to Ranking                   |
|                                  |
| Sumi Café                        |
| Add to: [Top Cafés v]            |
|----------------------------------|
| Better than Kyo Matcha?          |
| [Yes] [No]                       |
|----------------------------------|
| Final position: #3               |
| [Publish update]                 |
| [Save]                           |
+----------------------------------+
```

---

## SCREEN 20 — Profile (Self)

### Purpose
Instagram-familiar personal hub with rankings integrated deeply, rendered in the Modern Curator language.

### Reference prototype
`Design_guide/profile_page/code.html`

### Entry points
- bottom tab Profile
- avatar taps where self

### Top bar (glass)
- Menu (left) · **Zoe** Newsreader italic (center) · `more_horiz` (right)

### Header section (`px-6 mt-4`)
- **Avatar**: 24×24 (md:32×32) rounded-full, `bg-surface-container-high border border-outline-variant/30` (Ghost Border — one allowed use)
- **Stats row** (flex, right of avatar): Posts · Followers · Following counts in Newsreader 20–24px, labels in Inter 12–14px `on-surface-variant`. Followers/Following counts are **tappable** → Followers / Following lists (Instagram-familiar rows)
- **Display name**: `font-display` (Newsreader) 24–30px, tight tracking
- **Bio**: Inter 14–16px, `on-surface-variant`, `leading-relaxed`

### Story / highlights row
Soft warm gradient ring (less saturated than Instagram). Example highlights:
- Cafés · Travel · Perfumes · Albums · Date Spots

### Tabs (full-width, `border-t border-outline-variant/30`)
One structural separator allowed. Each tab: `flex-1 py-3 text-center` with uppercase tracking-widest Inter 14px label + icon.

1. **Posts** (`grid_on`) — default active, `border-b-2 border-on-surface`
2. **Shorts** (`play_circle`)
3. **Rankings** (`star`)

For MVP, three visible content tabs.

### Posts grid (active tab)
`grid-cols-3 gap-0.5 md:gap-1`

**Mixed tile variants** (this is a signature Zoe move — editorial profile grid):
- **Image tile** (aspect-square): photo with hover `scale-105 duration-700`
- **Text-only editorial tile** (`bg-surface-container-highest`): no image, just category label at bottom (e.g. `OBJECT DESIGN` in uppercase tracking-widest) + Newsreader title (e.g. "Tactile Materiality") — gives the profile a magazine-contents-page feel
- **Image + tint overlay**: photo with `mix-blend-multiply` color tint for editorial consistency

### Shorts grid (when active)
Aspect-portrait (`aspect-[3/5]`) thumbnails, 3 columns, small play-count overlay on each.

### Rankings tab (when active)
Shows user's top lists as rich ranking-list preview cards (see Visual Direction Kit §16.2), not a grid. Includes:
- top ranking lists preview (hero cards)
- recently updated list
- ranking summary stats
- "Add ranking" CTA (primary gradient)

### Ranking section requirements
- top ranking lists preview
- recently updated ranking list
- ranking summary stats
- “Add ranking” CTA
- object categories
- movement indicators

### Create content entry points from profile
- plus button near profile header
- create post
- create ranking list
- add to ranking
- create story/highlight

### States
- fully populated profile
- new user sparse profile
- creator-heavy profile
- ranking-heavy profile

### Wireframe
```text
+-----------------------------------------+
| ☰              Zoe              ⋯       |  glass top bar
|-----------------------------------------|
| ⬤           142      12.4K      845    |
|           Posts  Followers  Following   |
|                                         |
| Clara V.                                |  Newsreader 28
| Curator of aesthetic minimalism…        |  bio
|                                         |
| [Cafés][Travel][Perfume][Albums][+]     |  highlights row
|-----------------------------------------|
| ▣ POSTS  ▷ SHORTS  ★ RANKINGS           |  tabs
|-----------------------------------------|
| [img][img][text tile: "Tactile          |
|                       Materiality" +    |
|                       OBJECT DESIGN]    |
| [img][img][text tile]                   |
| [img][img][img]                         |
+-----------------------------------------+
| discover | search | rank | shorts | profile |
+-----------------------------------------+
```

---

## SCREEN 21 — Profile (Other User)

### Purpose
Inspect another curator's identity, content, and ranking taste when discovered via **Search / Following Activity**, a **Ranking Detail**, a post attribution, or direct link. Shares the **same Modern Curator profile shell** as `SCREEN 20` so a viewer immediately recognizes the format; differences are only in the **action row** and **visibility gating**.

### Structural deltas vs. self profile (`Design_guide/profile_page/code.html` baseline)
- Glass top bar: `arrow_back` (left) replaces the hamburger; center shows **@handle**; right shows `more_horiz` (report / block / share profile / mute).
- **Header section** retains the same avatar + stats + Newsreader name + bio layout.
- **Stats row** remains tappable: Posts scrolls to the grid; **Followers** and **Following** counts open their respective list screens.
- **Action row** (below bio, above highlights) — two glass buttons sitting on the `surface-container-low` band:
  - Primary: **Follow** (gradient fill `from-primary to-primary-container`, `on-primary` text) → becomes **Following** (`bg-transparent border-outline-variant/60`) → **Requested** (disabled-style, `text-on-surface-variant`, italic) for private accounts.
  - Secondary: **Message** (`bg-transparent`, ghost border `border-outline-variant/60`, Inter label).
  - Optional tertiary icon button: **notify bell** (`notifications_none`) once following, `rounded-full` glass chip.
- **Taste match module** (optional, shown inline under the action row when viewer is signed in):
  - Small label-caps `TASTE MATCH` + Newsreader italic percent (e.g. _"84%"_) + a faint Fig progress bar on `surface-container`.
  - Tap → breakdown sheet showing overlapping categories and mutuals.
- **Highlights row** reuses the same horizontal scroller; when the other user has no highlights, the row collapses (no empty state chip on other profiles).
- **Tabs**: Posts · Shorts · Rankings — identical style to self profile.

### Visibility & locked states (rankings visibility)
Follow the Visual Direction Kit §18 "Empty & Locked" pattern — never use hard error tones.

- **Public profile, Public rankings:** full parity with self profile grid & rankings list. Public lists can be **Pinned** into the viewer's Rankings Hub (see SCREEN 17) via an action sheet from `more_horiz` or from the ranking detail.
- **Public profile, Private rankings:** Posts and Shorts grids render normally. The Rankings tab shows a **locked card**:
  - `surface-container-low` card, `rounded-xl`, Material `lock_outline` icon in `on-surface-variant`.
  - Newsreader headline _"Rankings are private"_ + Inter body _"Only approved followers see @handle's lists."_
  - Inline **Follow** gradient button if not yet following, or **Requested** state if pending.
- **Private profile (not yet approved):** Header, bio, and stats visible; grids and tabs replaced by a single full-bleed locked state card with the same visual language plus a muted preview strip (blurred thumbnails at 30% opacity, Fig vignette).
- **Blocked / suspended user:** minimal state — avatar silhouette, _"This profile is unavailable"_ (Newsreader italic), no counts, no tabs. No functional actions except back.

### Grid & ranking rendering rules
- The posts grid reuses the **mixed tile system** (image tiles + text-only editorial tiles) from SCREEN 20 so other profiles inherit the same editorial rhythm.
- Ranking category cards on another user's profile show the **same rank-up / rank-down / new-entry** pills, but add a small **viewer comparison** chip (`rank-up` dot + _"+12 overlap"_) when a taste match is available.
- Numbers in ranking previews always use **Cormorant Garamond** per VDK §7.

### Micro-interactions
- Follow tap: 120ms scale-down on press, then crossfade label; a faint `rank-up` sage pulse (one cycle, 300ms) confirms the state change — no toast.
- Long-press avatar: opens a glass preview card (280×280, `backdrop-blur-xl`, `bg-surface/80`) with the latest 3 cover tiles — matches the Modern Curator "peek" pattern used elsewhere.
- Pull-to-refresh uses the same bouncy curve and Fig hairline indicator as Home.

### Wireframe
```text
+-----------------------------------------+
| ←           @clara.v              ⋯    |  glass top bar
|-----------------------------------------|
| ⬤            142     12.4K      845    |
|            Posts  Followers  Following  |
|                                         |
| Clara Vance                             |  Newsreader 28
| Curator of quiet aesthetics and slow…   |  Inter body
|                                         |
| [ Follow (gradient) ] [ Message ] [🔔]  |  action row
|                                         |
| TASTE MATCH  84% ▁▃▅▇▉▉ (Fig hairline)  |  optional
|                                         |
| [Cafés][Travel][Perfume][Albums]        |  highlights (if any)
|-----------------------------------------|
| ▣ POSTS  ▷ SHORTS  ★ RANKINGS           |
|-----------------------------------------|
| [img][img][text tile]                   |
| [img][img][img]                         |
|  ——or if Rankings tab + private——       |
| ┌────────── locked card ──────────┐     |
| | 🔒 Rankings are private          |     |
| | Only approved followers see…     |     |
| | [ Follow (gradient) ]            |     |
| └──────────────────────────────────┘     |
+-----------------------------------------+
| discover | search | rank | shorts | profile |
+-----------------------------------------+
```

---

## SCREEN 22 — Create Menu from Profile

### Purpose
Primary non-camera create entry.

### Entry points
- plus/create button on self profile

### Menu options
- New Post
- New Reel
- Add Story
- Add to Ranking
- New Ranking List

### States
- full create menu
- if permissions missing, prompt later in flow

---

## SCREEN 23 — New Post Composer

### Purpose
Create static feed content from Profile.

### Steps
1. select media
2. crop/edit
3. write caption
4. attach object
5. attach ranking context
6. publish settings

### Required components
- media preview
- caption field
- attach restaurant/perfume/album/place button
- tag people
- location
- ranking toggle
- audience selector if supported later
- publish button

### Ranking context options
- added to ranking
- current rank number
- moved up/down
- “top 5-worthy”
- “not ranking-worthy”

### States
- single image
- carousel
- video
- no media selected
- draft
- failed upload

---

## SCREEN 24 — Swipe-Right Camera

### Purpose
Instagram-like quick capture flow.

### Entry points
- swipe right from Home
- tap own story ring
- create menu -> story

### Modes
- Story
- Post
- Reel

### Required components
- shutter button
- media library shortcut
- flash
- camera switch
- close
- mode selector
- optional quick object-attach after capture

### States
- camera live
- permission denied
- photo captured
- video recording
- low light / low storage warning

### Wireframe
```text
+----------------------------------+
| x                            ⚡   |
|                                  |
|                                  |
|          [camera view]           |
|                                  |
|                                  |
| library   [shutter]    switch    |
| Story       Post        Reel     |
+----------------------------------+
```

---

## SCREEN 25 — Story Editor

### Purpose
Edit and publish story-style content.

### Required components
- media canvas
- text
- stickers later
- draw later
- object tag
- ranking sticker later
- audience
- share to story

### MVP must-have
- text overlay
- object tagging
- post to story
- send to chat

---

## SCREEN 26 — Story Viewer

### Purpose
Consume stories from followed users.

### Required components
- progress bars
- user header
- story media
- quick reply / share
- open tagged object
- next/previous tap zones

### States
- single story
- story sequence
- viewed/unviewed
- expired/unavailable

---

## SCREEN 27 — Notifications Center

### Purpose
System and social notifications (ranking-related alerts can also appear **in Home** as cards).

### Distinction from Home ranking cards
**Notifications** are about:
- follows
- likes
- comments
- message alerts
- story replies
- post engagement
- optional digest of ranking moves

**Home** can surface **ranking activity** inline in the feed; **Notifications** is the explicit inbox for alerts.

### Required components
- grouped notifications
- unread state
- filter tabs optional
- deep links

---

## SCREEN 28 — Saved / Collections

### Purpose
Let users save posts, objects, and ranking lists.

### Entry points
- profile shortcut
- save actions

### Required components
- collection folders or default saves
- tabs for Posts / Objects / Rankings
- edit collections later
- private by default

### States
- empty
- populated
- filtered by type

---

## SCREEN 29 — Followers / Following

### Purpose
Support social graph inspection and management.

### Required components
- segmented tabs
- search
- follow/unfollow
- message shortcut
- mutual indicator

---

## SCREEN 30 — Settings

### Purpose
Account and behavior controls.

### Sections
- account
- privacy
- notifications
- blocked users
- ranking visibility
- story settings
- chats
- saved
- help
- about

---

## SCREEN 31 — Ranking Visibility / Preferences

### Purpose
Allow control over **who can see the user’s rankings** (aligned with Instagram-style **public account** vs **private account** expectations).

### Account-level rankings visibility (product default to confirm)
- **Public rankings:** anyone can open the user’s **Rankings** surfaces from profile or search; **pinning** by others is allowed for lists the owner exposes as public.
- **Private rankings (followers only):** only **approved followers** can view ranking lists on profile and in **Rankings hub pins**; everyone else sees **Follow to view** (or equivalent). Search still surfaces the **profile shell** (Instagram-like) with **follower/following counts** visible as on IG, but **ranking content** stays gated.

### Per-list options (optional later)
- private lists
- hide ranking changes from Home / notifications
- show recent ranking moves on profile
- allow comments on ranking updates

---

# 8. Tab-by-tab IA map

## 8.1 Home tab IA
- Home Feed
  - Post Detail
  - Comments
  - Share Sheet
  - Profile
  - Object Detail
  - Inbox
  - Notifications
  - Story Viewer
- Swipe Right → Camera / Story

## 8.2 Search tab IA
- Search Landing (**Following Activity** feed + search input)
  - Search Results (typed query, tabbed by type)
  - Post Detail
  - Profile
  - Object Detail
  - Ranking Detail
  - Comments
  - Share

## 8.3 Rankings tab IA
- Rankings Hub — dual mode
  - **Community Hub** (default): trending lists masonry, filter tabs (Trending / New Tastemakers / Category Gems)
  - **Personal Hub**: categories **expand/collapse**, **reorder** mode, **Pinned** strip for others' public lists
  - Ranking Detail List
  - Add to Ranking / Compare flow
  - Music link pickers (Spotify / Apple Music)
  - Camera capture (from hub or swipe-right)
  - Object Detail

## 8.4 Shorts tab IA
- Shorts Feed
  - Short Detail if needed
  - Comments
  - Share
  - Object Detail
  - Profile
  - Add to Ranking (via **RANK**)

## 8.5 Profile tab IA
- Self Profile
  - Edit Profile
  - Create Menu
  - Posts Grid item → Post Detail
  - Shorts Grid item → Short Detail
  - Ranking Preview → Ranking Detail
  - Saved
  - Followers / Following
  - Settings

---

# 9. Ranking system surfaces in the UI

The ranking mechanic should be integrated in multiple places, not isolated.

## 9.1 In feed posts
Posts can carry ranking labels like:
- Ranked #4 in my cafés
- Just added to my top perfumes
- Moved to #2 all-time albums

## 9.2 In object detail
Users can:
- add to ranking
- see who ranked it
- see recent moves
- see lists it appears in

## 9.3 In profile
Rankings are a core tab, not a hidden subpage.

## 9.4 In Home (and Notifications)
Surfacing of **others’** ranking changes—activity feed for taste movement, not buried in settings.

## 9.5 In share/chat
Users can share ranking updates as rich cards.

---

# 10. Chat and comments integration

## 10.1 Chat placement
Chat is not a bottom tab in this layout. It is accessed from:
- top-right inbox icon in Home
- share flows
- message button on profiles

## 10.2 Why this works
It preserves the Instagram-like 5-tab shell while keeping messaging deeply integrated.

## 10.3 Shareable objects in chat
- post
- short (vertical video)
- ranking update
- object detail
- ranking list
- profile

## 10.4 Comments placement
Comments live on:
- posts
- Shorts
- ranking updates optionally
- ranking lists later if desired

---

# 11. End-to-end user flows

## FLOW A — Browse and save from Home
1. user opens app
2. lands on Home
3. watches stories or scrolls feed
4. taps a recommendation post
5. opens object detail or saves post
6. optionally shares to chat
7. returns to feed

## FLOW B — Swipe-right story creation
1. user is on Home
2. swipes right
3. camera opens
4. captures photo/video
5. edits story
6. tags object
7. shares to story or sends to chat

## FLOW C — Create a full post from Profile
1. user taps Profile
2. taps create button
3. chooses New Post
4. selects media
5. writes caption
6. attaches object
7. optionally attaches ranking context
8. publishes

## FLOW D — Add object into ranking
1. user opens café detail
2. taps Add to Ranking
3. chooses ranking list
4. compares against nearby entries
5. confirms slot
6. saves
7. optionally publishes ranking update
8. appears in Home (as activity), notifications, and profile rankings

## FLOW E — Discover via Search / Following Activity
1. user taps **Search** tab
2. lands on Following Activity feed (stacked activity cards from followed curators)
3. taps the large Newsreader italic search input
4. enters query → result tabs appear (Top / People / Places / Objects / Rankings / Tags)
5. opens object, post, or ranking detail
6. saves, shares, pins ranking, or adds to their own ranking

## FLOW F — Follow ranking activity (Home)
1. user stays on **Home** (or opens **Notifications**)
2. sees friends/creators ranking changes as **cards**
3. taps ranking card
4. opens full ranking list
5. comments or shares to chat
6. maybe adds same object to own ranking

## FLOW G — Shorts discovery to ranking
1. user taps **Shorts** tab
2. swipes through short-form videos
3. sees a clip about perfume
4. taps object tag or **RANK**
5. opens perfume detail
6. saves or adds to ranking

## FLOW H — Profile-driven identity browsing
1. user opens another user profile
2. browses posts and Shorts
3. taps Rankings tab
4. views top lists
5. follows user or messages them
6. saves ranking list or object

## FLOW I — Share post to chat
1. user taps share on post
2. share sheet opens
3. selects existing chat
4. adds message
5. sends rich card
6. recipient opens post/object

---

# 12. Empty, sparse, and loading states

## 12.1 Home empty state
If user follows nobody and has little data:
- show onboarding-like recommended content
- explain that following people and ranking items improves the feed

## 12.2 Home ranking activity empty state
If user follows no one with ranking activity:
- suggest creators to follow
- suggest making own first ranking
- highlight trending ranking lists

## 12.3 Profile sparse state
For new user:
- prompt to add first post
- prompt to create first ranking list
- prompt to add story highlight

## 12.4 Search empty results
- suggest related tags
- suggest creators
- suggest nearby/trending alternatives

## 12.5 Chat empty state
- show “share a post or ranking to start a conversation”

---

# 13. Interaction rules and gestures

## 13.1 Home
- vertical scroll feed
- pull to refresh
- re-tap home to top
- swipe right to camera
- tap story to open story viewer

## 13.2 Shorts
- vertical swipe for next item
- tap hold to pause
- tap audio for sound options later

## 13.3 Stories
- tap right/left for next/previous
- long press to pause
- swipe down to dismiss

## 13.4 Ranking insertion
- tap-driven compare
- drag reorder in own ranking list edit mode

---

# 14. Content hierarchy rules

## 14.1 Home feed priorities
Priority order:
1. followed users’ high-quality posts
2. recommended posts aligned to taste
3. useful content tied to ranked objects
4. ranking-linked content
5. general explore-style content

## 14.2 Home ranking activity priorities
1. people user follows directly
2. strong taste-match users
3. high-signal creators/celebrities
4. grouped trend cards

## 14.3 Search priorities
1. relevance
2. user taste match
3. object utility and social proof
4. freshness

---

# 15. MVP exclusions for focus

Not required in the first build unless capacity allows:
- live streaming
- marketplace shopping
- advanced group planning tools
- collaborative ranking lists
- public comments on all object detail pages
- advanced moderation dashboards
- desktop-optimized shell
- complex edit history UI
- polls in chat
- multi-layer thread systems

---

# 16. Build order recommendation

## Phase 1
- Auth
- Home
- Search / Following Activity
- **Rankings** hub
- Profile
- Post detail
- Comments
- Share sheet
- Object detail
- Add to ranking
- Ranking list detail
- Inbox + basic chat
- **Shorts**
- Camera/story MVP

## Phase 2
- Saved
- Notifications
- Followers/following
- Highlights
- Advanced ranking filters
- More object types
- Better grouping of ranking activity in Home

---

# 17. Summary of the shell

Zoe’s final MVP shell should feel like this:

- **Instagram-like navigation and familiarity**
- **RedNote-like discovery, utility, and searchable recommendations**
- **Beli-like ranking attraction embedded into profile, feed, a dedicated Rankings hub, and ranking activity in Home**
- **Chat and sharing kept inside the app**
- **Creation centered on Profile and swipe-right camera, not a bottom Add tab**

That is the right structural balance between familiarity, stickiness, and differentiation.
