# Zoe — Screen-by-Screen Mobile IA + Wireframe Spec
**Version:** 1.1  
**Platform:** Mobile-first (iOS and Android)  
**Product direction:** Instagram-like shell and interaction model, RedNote-like discovery utility, Beli-like ranking integrated into profiles, feeds, and updates  
**Visual reference:** Stitch **Home** (cream masonry + ranking badges + hamburger / Zoe / bell) and **Shorts** (dark immersive + glass actions). See `PRD/Zoe_Visual_Direction_Kit.md` §24–24.2.  
**Document purpose:** Define the full screen-level information architecture, wireframe structure, navigation model, states, and end-to-end user flows for the Zoe mobile MVP

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
Zoe uses a fixed **5-button bottom navigation bar**.

There is **no Add tab**.

### Tab order (Stitch-aligned)
1. **Home**
2. **Explore**
3. **Rankings**
4. **Shorts**
5. **Profile**

### Interaction rules
- Tapping the current tab again should return to the top/root of that tab.
- Home re-tap should instantly scroll the feed back to the top.
- Explore re-tap should return to the Explore landing state.
- **Rankings** re-tap should return to the user’s rankings hub root (top of list index).
- **Shorts** re-tap should reset to the top/current first item.
- Profile re-tap should return to the user’s profile root.

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
  - Home
  - Explore
  - Rankings
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

## 4.1 Visual direction
Instagram-like:
- clean white or dark-neutral surfaces
- edge-to-edge media
- circular avatars
- strong image/video emphasis
- lightweight chrome
- bottom-tab-first navigation
- emphasis on profiles, stories, Shorts, and creator identity

RedNote-like:
- recommendation-rich content
- searchable useful notes
- tags and context
- “why this matters” metadata

Beli-like:
- ranking counts
- ordered lists
- “moved up / moved down”
- comparison and taste identity

## 4.2 Persistent interaction patterns
Across most cards and posts:
- Like / Appreciate or Save signal
- Comment
- Share
- Save / Collect
- Open ranked object
- Open creator profile

## 4.3 Global badges and labels
Used lightly:
- Taste Match %
- New in ranking
- Moved up
- Recently added
- Trending in your circle
- Ranked #x in creator’s list
- Story ring for new story

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
- Home feed
- Explore landing
- **Rankings** hub (personal lists index)
- **Shorts** feed
- Profile (self)

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
Seed **Home**, **Explore**, **Shorts**, and suggested **Rankings** lists.

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

## SCREEN 07 — Home Feed

### Purpose
Primary discovery feed with Instagram-like structure and RedNote-like utility.

### Entry points
- tab tap
- app launch after auth
- deep link to feed

### Top bar components (Stitch)
- **Hamburger** (left): account, settings, saved, help
- **Zoe** wordmark (center), **serif**
- **Notifications** (right) with **unread dot** when applicable
- Optional **story tray** below the top bar when Stories ship; v1 may omit if not built yet

### Main content components
1. **Optional story tray**
2. **Masonry feed** (two-column): editorial cards, strong photography, **ranking badges** on media when relevant
3. **Recommended posts**
4. **Posts from followed users**
5. **Utility cards embedded in feed**
6. **Ranking activity cards** (what friends/creators moved or added—**social ranking loop**)
7. **Sponsored content later, not MVP**

### Feed post types
- recommendation photo post
- carousel post
- short video post
- ranking-post update
- saved-list preview card
- place/product recommendation post
- “added to ranking” activity card

### Required post card anatomy
- **Media** with optional **ranking badge** overlay (rank #, ↑/↓/STABLE, editorial tag)
- **Serif title** + short **sans** description (magazine-style)
- Footer: **avatar**, **name**, **♥ count**
- ranking context line if applicable
- caption / useful note snippet
- object tags
- comments preview
- save action

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
+----------------------------------+
| ☰        Z o e            🔔 ·    |
| [optional story tray]          |
|----------------------------------|
| [card img #2▲] [card img #1 ST]|
| serif title    serif title     |
| snippet...     snippet...       |
| av name ♥2.1k  av name ♥890    |
|----------------------------------|
| [ranking activity card]          |
| “Maya moved Sumi Café → #2”    |
+----------------------------------+
| home | explore | rank | shorts | profile |
+----------------------------------+
```

### Story tray requirements
- user’s own story at first position
- followed users with active stories
- ranked-object story cards possible later
- tap opens Story Viewer

---

## SCREEN 08 — Post Detail

### Purpose
Full-screen post consumption and interaction.

### Entry points
- tap feed post
- tap shared post
- tap profile grid item

### Required components
- media
- user header
- caption
- tags
- linked ranked object
- ranking context
- comments section or preview
- share
- save
- related ranking list link
- follow CTA if not following

### States
- photo post
- carousel post
- short video post
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

## SCREEN 13 — Explore Landing

### Purpose
Instagram-like explore shell with RedNote-like utility and search depth.

### Entry points
- bottom tab **Explore**
- search interactions from elsewhere

### Top components
- persistent search bar
- optional category chips

### Main content layout
- discover grid / editorial layout
- trending posts
- recommended places/products
- topic clusters
- suggested ranking lists
- creator suggestions
- recent searches

### Search bar behavior
Supports:
- users
- places
- perfumes
- albums
- tags
- categories
- neighborhoods
- ranking lists

### States
- default explore
- typing search
- results
- no results
- loading

### Wireframe
```text
+----------------------------------+
| [Search Zoe]                     |
| coffee  perfume  albums  bars    |
|----------------------------------|
| [grid tile][grid tile][grid tile]|
| [wide tile      ][grid tile]     |
| [grid tile][grid tile][grid tile]|
+----------------------------------+
| home | explore | rank | shorts | profile |
+----------------------------------+
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
Short-form **immersive** vertical video (Stitch: dark UI, glass controls).

### Entry points
- bottom tab **Shorts**
- tap video post from feed

### Required components
- full-screen vertical **image/video** (warm dark blacks, not pure #000)
- **Top-left** contextual pill (e.g. consensus / trend—optional)
- **Right rail:** **RANK**, **SAVE**, **SEND**, creator avatar
- **Bottom:** @handle, **Follow**, **large serif title**, **More detail**
- swipe for next

### Right-side action stack (priority order)
- **RANK** (entry to ranking flow when relevant)
- **SAVE**
- **SEND** (share)
- creator avatar

### States
- playing
- paused
- muted/unmuted
- loading next item
- no more items
- poor connection

### Wireframe
```text
+----------------------------------+
| [ Popular consensus ]            |
|                           RANK   |
|  [fullscreen media]       SAVE   |
|                           SEND   |
|                            [av]  |
| @user  [Follow]                  |
| Serif Title Here                 |
| MORE DETAIL ▾                    |
+----------------------------------+
| home | explore | rank | shorts | profile |
+----------------------------------+
```

---

## SCREEN 17 — Rankings Hub (MVP)

### Purpose
Primary place to **browse and edit the user’s own rankings** across categories (movies, music, fashion, sports, restaurants, perfumes, etc.) and to **add** new items via compare flows, **music links**, or **camera**.

### Entry points
- bottom tab **Rankings**
- deep link to a specific list
- “RANK” from Shorts
- **Swipe-right** camera → rank flow

### Core layout
- **Calm, editorial** index: category sections or **filter chips** (My lists / Music / Film / Fashion / Sports / Food…)
- Each list shows **cover**, **title** (serif), **last updated**, **movement** hints
- **Primary add:** prominent “**Add to ranking**” (opens capture, library pick, or **Spotify / Apple Music** picker for music)

### Add flow (high level)
1. Choose **category / list** (only lists the user maintains—or create new)
2. **Photo** upload or **music** link → item preview
3. **Pairwise compare** against existing entries until position stabilizes
4. Optional **caption** / note; publish to profile or Home as ranking update

### Wireframe
```text
+----------------------------------+
| Rankings              [+] add    |
|  My lists   Music   Film   ...   |
|----------------------------------|
| [cover] All-Time Movies          |
|         updated 2d ago      →    |
|----------------------------------|
| [cover] Sneakers                 |
|         updated 1w ago      →    |
|----------------------------------|
| [cover] Late Night Albums        |
|         updated 3h ago      →    |
+----------------------------------+
| home | explore | rank | shorts | profile |
+----------------------------------+
```

### Design note
This tab should feel like a **personal museum** of taste—**not** a spreadsheet. Comparison screens should use **side-by-side** imagery wherever possible.

### Social ranking activity
Feeds of **other people’s** ranking moves are **not** the primary job of this tab in MVP; that content belongs in **Home** (and notifications). A future **“Friends’ moves”** sub-segment or tab is optional.

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
Instagram-like personal hub with rankings integrated deeply.

### Entry points
- bottom tab Profile
- avatar taps where self

### Top components
- avatar
- username
- bio
- link / city / short identity line
- stats row
- edit profile
- add/create button
- settings button

### Story/highlights row
Supports highlights like:
- Cafés
- Travel
- Perfumes
- Albums
- Date Spots

### Main profile content tabs
1. Posts grid
2. Shorts grid
3. Tagged / mentions later
4. Rankings
5. Saved optional shortcut, not primary tab in MVP

For MVP, if limited to three visible content tabs:
- Posts
- Shorts
- Rankings

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
+----------------------------------+
| profile pic        [edit] [☰]    |
| username                          |
| bio                               |
| 45 posts  1,204 followers  38 fol|
| [highlights][highlights][+]       |
|----------------------------------|
| [Posts] [Shorts] [Rankings]      |
|----------------------------------|
| [grid][grid][grid]               |
| [grid][grid][grid]               |
+----------------------------------+
| home | explore | rank | shorts | profile |
+----------------------------------+
```

---

## SCREEN 21 — Profile (Other User)

### Purpose
Inspect another user’s identity, content, and ranking taste.

### Differences from self profile
- follow / message button
- taste match % badge
- mutual follows
- follow status
- shared rankings highlights

### Required components
- avatar
- username
- bio
- follow button
- message button
- taste match module
- ranking previews
- posts/shorts/rankings tabs

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
Allow control over how public ranking identity is.

### Options
- public rankings
- followers only
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

## 8.2 Explore tab IA
- Explore Landing
  - Search Results
  - Post Detail
  - Profile
  - Object Detail
  - Ranking Detail
  - Comments
  - Share

## 8.3 Rankings tab IA
- Rankings Hub
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

## FLOW E — Discover via Explore
1. user taps Explore tab
2. sees explore grid
3. enters query
4. result tabs appear
5. opens object or post
6. saves, shares, or adds to ranking

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
- Explore
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
