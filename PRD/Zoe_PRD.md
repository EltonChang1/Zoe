# Product Requirements Document (PRD)
## Zoe
**Brand foundation:** The app name is **Zoe**, inspired by the Greek word **ζωή**, meaning **life**.  
**Document version:** 2.2  
**Platform:** Mobile app first (iOS and Android)  
**Product type:** Consumer social discovery, ranking, and taste graph app  
**Design direction:** Instagram-like shell and interaction model; RedNote-like utility/discovery; Beli-like ranking engine, refined through **"The Modern Curator — Soft Editorial Luxury"** aesthetic — editorial Home, immersive Shorts, curated Rankings hub. Canonical visual reference: `Design_guide/` prototypes (`home_page`, `search_page`, `ranking_page`, `shorts_page`, `profile_page`, `posts/post_for_*`) + `PRD/Zoe_Visual_Direction_Kit.md` §2, §7, §11, §16.5–§16.6, §18–§18.6.  
**Document purpose:** Define the updated product vision, navigation model, core systems, engagement loops, requirements, constraints, and launch plan for Zoe.

---

# 1. Executive summary

Zoe is a mobile social app for discovering, saving, discussing, and **ranking** the things that shape people’s taste and lifestyle.

The product is intentionally built from three strong inspirations:

- **Instagram-like layout and habits**
  - clean visual shell
  - five bottom navigation buttons
  - swipe-right camera/story entry
  - profile-centered posting
  - **Shorts**-style vertical video browsing (product name **Shorts**; immersive dark “glass” chrome)

- **RedNote-like purpose**
  - practical recommendation notes
  - searchable lifestyle discovery
  - trend + utility + community
  - users come for answers, not only entertainment

- **Beli-like ranking attraction**
  - users build living ranked lists
  - ranking becomes identity
  - the system learns what a user prefers
  - ranking activity becomes social and sticky

Zoe is not just a content app and not just a ranking app. It is a **taste platform**.

Users should feel like they can:
- browse useful content like RedNote
- navigate the app as naturally as Instagram
- build ranked lists the way people love doing in Beli
- follow ranking updates from friends, creators, and celebrities
- talk about all of it inside the app through comments and chat

The app’s ultimate retention thesis is simple:

**People come back often when content is useful, the UI is familiar, the ranking system reflects identity, and social updates make taste feel alive.**

---

# 2. Product vision

Make Zoe the place where people go to **discover life through taste**.

Zoe should become the default mobile app users open when they want to:
- find what is worth trying
- see what people with taste are into
- follow ranking changes from friends and public figures
- build their own ranked lists
- post visually and socially
- search for ideas that are practical and current
- send recommendations to friends without leaving the app

Long term, Zoe becomes the most compelling social graph for:
- what people love
- how people rank things
- how taste changes over time

---

# 3. Mission

Help users discover, express, compare, and evolve their taste through content, search, ranking, and social interaction.

---

# 4. Product thesis

Most social apps do one or two of these well:
- visual content consumption
- creator/follow graph
- search and recommendation utility
- personal curation
- ranking and identity expression

Zoe aims to combine all of them in one coherent product.

The product wins if it successfully combines:
1. **Instagram’s familiar mobile behavior**
2. **RedNote’s search-first recommendation usefulness**
3. **Beli’s highly engaging ranking psychology**

That means users should return for multiple reasons:
- to browse
- to search
- to watch
- to rank
- to check ranking updates
- to post
- to comment
- to chat
- to see what changed

This multi-reason return pattern is core to Zoe’s retention strategy.

---

# 5. Core concept

Zoe is a social lifestyle app where users:
- consume posts, stories, and short videos
- search for recommendations and trends
- build and update ranked lists
- follow other people’s rankings and changes
- comment and message inside the app
- share cards, posts, and ranking updates in chat

The app should support rankable categories such as:
- restaurants
- cafés
- bars
- perfumes
- skincare / beauty products
- albums
- songs
- movies
- shows
- fashion items
- books
- destinations
- niche culture objects over time

At its heart, Zoe is about **tasteful discovery + ranking desire**.

---

# 6. Product principles

## 6.1 Familiar shell, differentiated purpose
The interaction model should feel instinctively familiar like Instagram, but the reason to use the product should be more useful and identity-driven.

## 6.2 Utility over empty scrolling
The feed should be beautiful and scrollable, but still solve real recommendation and discovery needs.

## 6.3 Ranking is a core behavior, not a side feature
Ranking must be visible, socially alive, and emotionally rewarding.

## 6.4 Profile is identity
A user’s profile should not only archive posts. It should reveal who they are through rankings, taste, and highlights.

## 6.5 Search is strategic
Zoe should be a place users actively search when they want answers, trends, or recommendations.

## 6.6 Posting should feel native
Posting should happen from the profile or through camera/story entry, not through a generic bottom-center add tab.

## 6.7 Social interaction keeps the graph alive
Comments, shares, DMs, group chats, and ranking activity are required for network depth and retention.

## 6.8 Rankings must feel dynamic
Users should be able to follow what changed:
- someone added a restaurant to a list
- someone moved a perfume higher
- someone updated their all-time album ranking
- a creator or celebrity posted a new favorite

## 6.9 Multi-format content matters
The product should support:
- feed posts
- short-form video
- stories
- notes/captions
- list previews
- ranking cards
- activity cards
- chat-shared cards

---

# 7. Design and layout philosophy

Zoe adopts **"The Modern Curator — Soft Editorial Luxury"** as its design system (see `Design_guide/*/DESIGN.md` and `PRD/Zoe_Visual_Direction_Kit.md`). The app uses the **Instagram shell** as its mental model but renders every surface with the restraint, typographic care, and tactile warmth of a bespoke editorial publication.

## 7.1 Interaction shell (Instagram-like)
- strong visual hierarchy
- elegant full-screen mobile composition
- familiar five-tab bottom navigation (glassmorphic bar)
- swipe-right-to-camera behavior
- stories / highlights at the top where appropriate
- **Shorts**-style vertical video feed (dark immersive UI)
- profile as the place where users create posts and manage identity

## 7.2 Utility intent (RedNote-like)
- useful discovery
- searchable recommendations
- practical categories
- trend + advice + social proof

## 7.3 Ranking identity (Beli-like, refined)
- ranking lists as living identity artifacts
- pairwise or ordered ranking flows
- taste profile development
- ranking activity surfaced in **Home** and **Search / Following Activity**, plus the **Rankings** hub
- public and private ranked identity
- Cormorant Garamond numerals + small glass pills for rank-up / rank-down / new-entry states

## 7.4 Visual signature (Modern Curator)
- **Tonal depth, not lines** — hierarchy through layered warm neutrals (`background` → `surface-container-highest`); horizontal rules are effectively forbidden
- **High-contrast typography** — Newsreader serif display against Inter sans metadata; Cormorant Garamond reserved for rank numerals and hero pull-quotes
- **Intentional asymmetry** — layouts balanced by weight and whitespace, never perfect centering
- **Glass & gradient** — floating nav bars and modals use `backdrop-blur` glass; primary CTAs use subtle linear gradients (`from-primary to-primary-container`) instead of flat fills
- **Architectural radii** — corners capped at `0.75rem` (12px) for an editorial, non-juvenile feel
- **Ambient depth** — 24px blur / 4% opacity shadows only; no crisp drop shadows

---

# 8. Primary goals

## 8.1 Product goal
Create a high-retention social mobile app that users open repeatedly for discovery, search, ranking, and social updates.

## 8.2 User goal
Help users discover what is good, express what they love, and follow what others value.

## 8.3 Engagement goal
Maximize repeat opens through:
- content consumption
- Shorts usage
- search utility
- ranking behavior
- ranking update curiosity
- profile management
- stories
- social conversation

## 8.4 Brand goal
Make Zoe feel alive, tasteful, modern, and culturally current—consistent with the concept of **ζωή / life**.

---

# 9. Non-goals for v1

The following are not v1 priorities:
- desktop-first experience
- full commerce checkout platform
- direct reservation and delivery infrastructure
- merchant self-serve tools
- long-form publishing platform
- open public forum / Reddit-style threading
- large-scale creator monetization system
- heavy enterprise analytics tools

---

# 10. Target users

## 10.1 Primary users
Gen Z and Millennials who:
- already use Instagram, TikTok, RedNote, or similar
- care about trends, aesthetics, and recommendations
- enjoy ranking or curating favorites
- like following people with taste
- want to share interests with friends

## 10.2 Secondary users
Creators and taste curators who:
- like influencing others through recommendations
- want to be known for taste, not just visuals
- enjoy list-making and ranking
- want their profile to reflect personal identity

## 10.3 Tertiary users
Fans and followers of public figures or niche communities who:
- want to track the evolving favorites of celebrities, creators, or friends
- care about rankings across music, food, beauty, and culture

---

# 11. Personas

## 11.1 The social browser
Uses Zoe like Instagram, but expects more useful content and searchable recommendations.

## 11.2 The ranker
Gets genuine satisfaction from ordering favorites and updating ranked lists.

## 11.3 The curator
Creates beautiful, useful posts and wants people to save, reference, and trust them.

## 11.4 The tracker
Checks the app to see who changed their rankings, what is trending, and what people they follow are newly obsessed with.

## 11.5 The planner
Uses Zoe to decide what to try, what to buy, what to listen to, and what to do.

---

# 12. Product scope

Zoe is broader than a restaurant-only app.

## 12.1 Core verticals at launch or near-launch
The system should be designed to support multiple ranking verticals:
- food and drink
- beauty and fragrance
- music and albums
- media and culture
- fashion and lifestyle products

## 12.2 Initial focus recommendation
For operational simplicity, v1 may prioritize:
- restaurants / cafés / bars
- perfumes / beauty
- albums / music

These categories all perform well with:
- visual content
- recommendation culture
- ranking desire
- repeat updates
- fandom and identity

---

# 13. Core product surfaces

The app is built around:
- Home (editorial masonry; ranking context on cards)
- Search / Following Activity (taste-intimate activity feed + search affordance)
- **Rankings** (Community Hub + personal taste library and add/compare flows)
- **Shorts** (immersive vertical video)
- Profile

Supporting surfaces:
- Camera / Story (via swipe right or camera entry)
- Post creation from profile
- Chats / Inbox
- Comments
- List pages
- Ranking detail pages
- Search result pages
- Hashtag / topic pages
- Settings

---

# 14. Bottom navigation model

Zoe must use a **five-button bottom navigation layout**, with **no add button**.

## 14.1 Bottom tabs (Design_guide-aligned labels)
1. **Home** (Discover)
2. **Search** (combines search + Following Activity feed — see `Design_guide/search_page`)
3. **Rankings**
4. **Shorts**
5. **Profile**

**Note:** Social **ranking activity** from people you follow can surface inside **Home** (cards and snippets) so the tab bar stays simple. A separate “ranking-only social inbox” tab is optional later.

## 14.2 Important rule
There is **no persistent Add tab** in bottom navigation.

Posting behavior should instead follow the Instagram mental model:
- user goes to their profile to create a post
- or user swipes right to access the camera / story composer
- or user uses contextual creation entry points from profile, story, ranking screen, or saved object

This is central to the product identity.

---

# 15. Navigation behavior requirements

## 15.1 Home button
- Opens the main personalized feed
- Shows posts from followed accounts and recommended content
- If user is already on Home and taps Home again, feed scrolls instantly to top

## 15.2 Search button
- Opens the **Search / Following Activity** page (`Design_guide/search_page`), which combines:
  - a **large Newsreader italic search input** at the top (_"Search for inspiration…"_) with an integrated camera/visual-search affordance
  - a **Following Activity** feed of stacked activity cards (new rankings, ranking changes, saved items, posts from followed curators)
- Typing reveals Search Results tabbed by Top / People / Places / Objects / Rankings / Tags
- Search supports places, objects, people, lists, topics, and rankings

## 15.3 Rankings button (MVP)
- Opens the **Rankings** hub: the user’s own ordered lists by category (e.g. all-time movies, music, fashion picks, athletes), plus entry points to **add** items (camera, compare flow, linked music)
- Supports **pairwise** placement (“better than X?”), captions/notes on entries, and calm editorial layout (see Visual Direction Kit)

## 15.4 Shorts button
- Opens the **Shorts** vertical feed (full-bleed, dark immersive UI)
- Swipe for next item
- Supports recommendation clips, ranking reactions, and quick “send to Rankings” behavior via the **Rank** action

## 15.5 Profile button
- Opens user profile
- Shows bio, highlights, posts, ranked lists, story archive/highlights, and ranking identity
- Contains the main posting entry points

## 15.6 Swipe-right gesture
- Swiping right from Home (and other primary feeds where appropriate) opens the **camera / capture** workflow (Instagram-like)
- Use for quick photo of an object to rank (food, shoes, a vinyl cover, etc.), story capture, or drafting a post—then route into **choose category → compare → caption** when ranking

---

# 16. Information architecture

## 16.1 Main screens
- Home feed
- Search / Following Activity (landing) + Search Results
- **Shorts** feed
- **Rankings** hub (lists, categories, add to ranking)
- Profile
- Post detail
- Ranking list detail
- Object detail (place/product/album/etc.)
- Topic page
- Story viewer
- Story composer
- Chat inbox
- Chat thread
- Comment sheet
- Create post from profile
- Create ranking list or ranking update
- Settings

## 16.2 Core entities
- User
- Post
- Story
- Short (vertical video; internal schema may still use “reel”)
- Rankable object
- Ranked list
- Ranking entry
- Ranking update
- Comment
- Chat message
- Topic/tag

---

# 17. What Zoe is really about

Most social apps let people show what they are doing.  
Zoe should let people show:

- what they love
- what they rank
- what changed
- what is worth knowing
- how their taste evolves

This is why the ranking update system is so important. It transforms taste from a static profile into a live social stream.

---

# 18. Home feed requirements

## 18.1 Purpose
The Home feed is the main mixed-content stream.

It should combine:
- followed accounts
- recommended content
- useful recommendation posts
- ranking-related cards
- story row
- topic relevance
- personalized suggestions

This should feel like Instagram in layout, but like RedNote in practical value.

## 18.2 Content types allowed in Home
- standard image or carousel post
- recommendation post
- useful note post
- ranking card preview
- list preview
- ranking update card
- video post preview
- friend activity card
- sponsored content later, clearly labeled

## 18.3 Home feed objectives
- keep users browsing
- surface useful content
- convert to saves, follows, comments, and profile visits
- feed future ranking activity
- keep taste discovery alive

## 18.4 Home feed behavior
- personalized ranking
- infinite vertical feed
- story row at top
- tap profile avatars to open stories
- pull to refresh
- tap Home again to scroll to top

## 18.5 Home feed ranking signals
- follow graph
- interest graph
- taste similarity
- save likelihood
- engagement quality
- freshness
- cultural relevance
- local relevance when appropriate
- ranking interest alignment

## 18.6 Post detail presentation
When a user opens a feed or profile post, the **detail screen is not a single generic layout**. Zoe uses **three editorial templates** aligned to `Design_guide/posts/` — **discovery_photo** (place / food / travel, tall hero + tonal ranking strip + “Curator Notes” discussion), **album_review** (square artwork + gradient ranking ribbon + nested review card), and **product_hero** (wide hero + floating rank chip + left-rule copy + collection CTAs). The correct template is selected by `post.detail_layout` or inferred from the linked object category. Visual and component rules: `PRD/Zoe_Visual_Direction_Kit.md` §16.5 and §18.6; screen IA: `PRD/Zoe_Mobile_IA_Wireframe_Spec.md` SCREEN 08.

---

# 19. Search / Following Activity requirements

## 19.1 Purpose
The **Search** tab (see `Design_guide/search_page`) is where Zoe becomes both **highly useful** and **taste-intimate**. It is **not a generic explore grid** — the default landing is a **Following Activity feed** of the curators you follow, combined with a search affordance at the top.

## 19.2 Key functions
- a **large Newsreader italic search input** at top (_"Search for inspiration…"_) with an integrated camera/visual-search icon
- **Following Activity feed** — stacked, tonally varied cards surfacing: new rankings, ranking movement, saves, reviews, and posts from followed curators
- search reveals results tabbed by Top / People / Places / Objects / Rankings / Tags
- trending content, topics, and categories surface under an empty / "no activity yet" state
- personalized suggestions
- editorial and algorithmic discovery
- surfacing of popular and emerging ranking conversations

## 19.3 Search targets
Users can search for:
- people
- creators
- celebrities
- places
- perfumes
- restaurants
- albums
- ranked lists
- hashtags
- topics
- categories
- specific items
- genres or moods

## 19.4 Search experience
Search should support:
- direct lookups
- discovery queries
- topical browsing
- category suggestions
- query auto-complete
- recent searches

## 19.5 Example search use cases
- best matcha in NYC
- perfumes people rank with Delina
- top breakup albums
- restaurants celebrities added lately
- jazz albums ranked highest by people I follow
- date-night places in Pittsburgh
- best vanilla perfumes under $150

This is how Zoe inherits RedNote’s usefulness.

---

# 20. Shorts requirements

## 20.1 Purpose
**Shorts** is the short-form **vertical video** surface (see `Design_guide/shorts_page` for the canonical prototype): full-bleed dark media, glassmorphic action pills on the right rail (**Rank** / Like / Comment / Share / Save), and a bottom-left curator attribution block using Newsreader display + Inter metadata. The white gradient "RANK" CTA uses the primary gradient token (`from-primary to-primary-container`) inverted for dark contexts.

## 20.2 Content types
- quick recommendations
- mini reviews
- ranking reactions
- list breakdown videos
- “top 5” videos
- trend clips
- taste comparisons
- haul/reveal videos
- “I moved this album to #1” videos

## 20.3 Behavioral requirements
- full-screen vertical video
- swipe for next
- like/comment/share/save
- **Rank** action to attach or update a ranked item where relevant
- open creator profile
- open attached object or ranking list
- open sound/topic if applicable

## 20.4 Strategic purpose
Shorts serves:
- discovery
- entertainment
- creator growth
- viral ranking conversations
- faster onboarding into category interest

---

# 21. Ranking activity + Rankings hub (MVP split)

## 21.1 Rankings hub (bottom tab)
The **Rankings** tab is the user’s **taste command center**, visually **consistent with Home and Shorts** (cream editorial base, same typography and ranking badges; optional glass accents for pinned celebrity rows). It **always keeps the bottom tab bar**. The screen groups the user’s items by **interest categories** (film, music, fashion, sports, etc.): **tap a category to expand** and see ordered entries; **collapse** to scan. Users **reorder categories** (drag-and-drop) into any order they want. A **Pinned** section lets users attach **friends’ or celebrities’ lists** that are **public** (or otherwise visible); **private** accounts gate rankings so only **followers** can view or pin—see §36.1.

## 21.2 Social ranking movement (not a separate tab in v1)
Updates from people you follow (“moved X up,” “added Y”) should appear as **first-class cards in Home** and/or **notifications**, preserving the curiosity loop without crowding the tab bar.

## 21.3 Examples of ranking activity content
- a friend added a new restaurant to their top 10
- a celebrity updated their favorite perfume list
- a creator moved an album from #5 to #2
- a singer’s new album is entering users’ all-time lists
- a followed user started a new ranking category
- someone published a “current top cafés” ranking

## 21.4 Why this still matters psychologically
Visible movement creates:
- curiosity (variable reward)
- social comparison (benign)
- identity momentum (“my list is alive”)
- reasons to return outside passive scrolling

## 21.5 Sorting signals (Home ranking cards & notifications)
- follow graph
- closeness / friend graph
- celebrity or creator affinity
- category interest (from onboarding + behavior)
- novelty
- item popularity within user interest graph
- recency
- likely curiosity / tap-through

## 21.6 Account onboarding: topics and feed personalization
On first account creation, ask which **worlds of taste** matter (e.g. **fashion**, **sports**, **music**, **film**, food, fragrance, etc.) using **large imagery-led choices** (not bare checkboxes)—consistent with the editorial Home aesthetic.

Outcomes:
- Seed **Home** and **Search / Following Activity** with relevant creators, lists, and Shorts
- Pre-create or suggest **starter Rankings** lists matching selected topics
- Improve ranking comparisons and notifications relevance

## 21.7 Add-to-ranking flows (photo, music, camera gesture)
**Photo-first ranking (places, fashion, food, etc.):** capture or upload → pick **category / list** → **pairwise compare** against existing entries → optional **caption** or entry note.

**Music:** **Spotify** and **Apple Music** linking to pick tracks/albums; rank with the same comparison mechanics; use provider metadata and artwork where possible.

**Global camera entry:** **Swipe right** from Home opens capture; route into **ranking** (category → compare → caption) or story/post.

---

# 22. Profile requirements

## 22.1 Purpose
Profile is the user’s visual identity hub and ranking headquarters.

## 22.2 Required sections
- profile photo
- username
- display name
- bio
- **follower / following counts** (tappable → **Followers** / **Following** lists, **Instagram-like** rows and search—discoverable from **Search**)
- highlights / stories
- posts grid
- Shorts tab (grid of short videos)
- ranked lists section
- taste highlights
- category badges or top categories
- posting entry point
- list creation entry point
- ranking management entry point

## 22.3 Posting behavior
Users create posts from Profile, not from a bottom add tab.

Possible creation entry points on Profile:
- Create Post
- Create Short
- Create Story
- Create Ranking List
- Share Ranking Update

This mirrors the user’s requested interaction model.

## 22.4 Ranking on profile
The profile must prominently display rankings.

This can include:
- top ranked lists
- current obsessions
- all-time top lists
- category-specific lists
- recent ranking changes
- pinned rankings
- public or private ranking controls

## 22.5 Profile objectives
- communicate identity
- communicate taste
- communicate activity
- support creation
- support follows
- support exploration of a user’s preferences

---

# 23. Stories and camera requirements

## 23.1 Camera entry
Swipe right from core feed surfaces to open camera / story workflow.

## 23.2 Story use cases
- quick recommendation
- “here right now”
- live taste moment
- ranking teaser
- first impression
- current favorite
- event or outing update

## 23.3 Story design
Should be familiar to Instagram users:
- full-screen
- tappable progression
- reply or react
- highlight support on profile

## 23.4 Strategic role
Stories support daily lightweight activity without requiring polished permanent posts.

---

# 24. Posting and creation model

## 24.1 Core creation principle
There is no persistent Add tab.

Creation happens via:
- profile action
- story camera via swipe-right
- contextual “share ranking update” entry
- contextual “post about this” from object pages

## 24.2 Content creation types
- feed post
- carousel post
- reel
- story
- ranked list
- ranking update
- reaction post to ranking change

## 24.3 Creation flow requirements
Creation should allow:
- media upload
- caption / note
- tag object(s)
- tag category
- tag people
- attach ranking list or ranking action
- choose public/private scope
- preview before publish

---

# 25. Ranking system requirements

Ranking is central to Zoe.

## 25.1 Why ranking matters
Ranking satisfies strong user psychology:
- self-expression
- control
- comparison
- identity
- status
- curiosity
- change over time

## 25.2 Ranking objects
The system must support ranking many object types, not just places.

## 25.3 Ranking formats
Possible supported forms:
- ordered lists
- top 5 / top 10 / all-time favorites
- category lists
- current favorites
- seasonal favorites
- pairwise-assisted ranking
- manual drag-and-drop ranking
- ranking with confidence or revision support

## 25.4 Ranking UX goals
- easy to start
- fun to update
- socially shareable
- visible on profile
- easily publishable to feed, Home ranking cards, or notifications
- can be revised over time

## 25.5 Ranking engine principles
Like Beli, the system should encourage comparative thinking rather than only flat stars.

Potential ranking mechanisms:
- pairwise suggestions
- “does this go above or below X?”
- rank insertion prompts
- reorder drag interactions
- updated list publishing

## 25.6 Ranking outputs
The app may show:
- list position
- movement up/down
- recent addition marker
- hottest newly ranked items
- personal taste graph features later

---

# 26. Ranking update system requirements

## 26.1 Ranking update object
A ranking update is a publishable event generated when a user:
- creates a new list
- adds an item
- moves an item
- changes top positions
- republishes a list
- posts a ranking reaction

## 26.2 Shareability
Every ranking update should be easily:
- visible in Home ranking activity and notifications
- shareable to chat
- commentable
- optionally postable to Home
- attachable to stories
- referenceable from profile

## 26.3 Social value
Ranking updates should be treated as meaningful content, not background metadata.

---

# 27. Comments requirements

## 27.1 Purpose
Comments allow social discussion around posts, Shorts, ranking updates, and shared taste moments.

## 27.2 Commentable surfaces
At minimum, users should be able to comment on:
- feed posts
- Shorts
- ranking updates
- ranked lists
- optionally object pages in limited form later

## 27.3 Comment behavior
- comment sheet or detail page
- one-level replies in MVP if feasible
- like/react to comments
- report or delete own comment
- notifications for replies and mentions

## 27.4 Tone goals
Comments should encourage:
- reaction
- taste discussion
- practical questions
- comparison
- discovery conversation

---

# 28. Chat and sharing requirements

## 28.1 Requirement
Zoe must support in-app chat.

## 28.2 Why
Without chat, users will leave to share objects in iMessage, Instagram DM, Discord, or WhatsApp.  
That weakens the product loop.

## 28.3 Chat features for MVP
- inbox
- 1:1 chat
- group chat
- rich card sharing
- unread indicators
- push notifications
- basic reactions
- link back into content

## 28.4 Share to chat
Every major content card should support:
- share to chat
- external share
- copy link

Supported shareable objects:
- post
- reel
- story reference if allowed
- ranked list
- ranking update
- object detail page
- creator profile

## 28.5 Rich preview requirements
When shared in chat, the object should render as a rich preview with:
- image or thumbnail
- title
- short context
- ranking or category context if relevant
- open CTA

---

# 29. Search and utility requirements

## 29.1 Search must feel powerful
Zoe is not only a passive social feed. Search should make the app useful like RedNote.

## 29.2 Search categories
- people
- items
- ranked lists
- recommendations
- categories
- topics
- tags
- trending conversations

## 29.3 Utility-driven discovery
Search should answer real taste questions, not just surface viral content. The **Following Activity** default keeps discovery feeling socially grounded rather than algorithmically cold.

## 29.4 Result surfaces
- posts
- Shorts
- ranked lists
- creators
- objects
- topic clusters

---

# 30. Content model

## 30.1 Post
A standard content unit containing:
- image or carousel
- caption
- tags
- linked object(s)
- optional ranking context
- author
- comments
- shares
- likes or saves

## 30.2 Short (vertical video)
Short-form video with similar social actions plus attached objects and ranking context.

## 30.3 Story
Ephemeral or highlightable content.

## 30.4 Ranked list
An ordered set of objects within a category.

## 30.5 Ranking update
A socially visible event representing ranking movement.

## 30.6 Object page
A page for a place, album, perfume, or other entity.

Object pages may include:
- summary
- media
- related posts
- ranking appearances
- recent ranking movement
- creators who rank it highly

---

# 31. Social graph requirements

## 31.1 Follow graph
Users can follow:
- friends
- creators
- celebrities
- niche tastemakers

## 31.2 Social signals used in feed
- follows
- mutual follows
- chat sharing
- frequent engagement
- ranking overlap
- category affinity

## 31.3 Taste graph
Over time, Zoe may calculate:
- taste similarity
- overlap in rankings
- shared category preferences
- influence graph

But the MVP can begin with activity + follows + category interest.

---

# 32. Feed ranking systems

## 32.1 Home ranking signals
- follow graph
- content quality
- engagement quality
- category affinity
- ranking behavior affinity
- freshness
- save/share probability
- watch probability
- discussion potential

## 32.2 Search / Following Activity ranking signals
- trend strength
- personalization
- novelty
- category interest
- broader platform popularity
- object/topic heat

## 32.3 Shorts ranking signals
- completion rate
- rewatch
- share rate
- relevance
- category interest
- creator affinity

## 32.4 Ranking activity (Home / notifications) signals
- follow graph
- category interest
- ranking curiosity likelihood
- creator importance to user
- recency
- novelty
- public figure interest

---

# 33. Engagement design

Zoe’s retention should come from multiple reinforcing loops.

## 33.1 Browse loop
Open app → Home / Search / Shorts → consume → save/share/follow → return later

## 33.2 Search loop
Need recommendation → Search → find useful answer → save/follow → come back again next time

## 33.3 Ranking loop
Discover object → rank it or add to list → publish update → get reactions → revise again later

## 33.4 Ranking curiosity loop
Open Home (ranking cards) or notifications → see who changed what → tap through → react/comment/share → return tomorrow

## 33.5 Story loop
Post quick story → get reactions → keep daily habit alive

## 33.6 Social loop
Share to chat → discussion → profile visit → follow → future feed relevance improves

## 33.7 Profile identity loop
User refines profile, highlights, posts, and ranked lists → emotional investment grows → switching cost rises

---

# 34. Notifications strategy

## 34.1 Notification categories
- social
- messages
- comments
- follows
- content relevance
- ranking updates
- trending items in user categories
- story reactions

## 34.2 Key ranking-related notifications
- someone you follow added a new #1
- a creator you like updated a ranked list
- a trending new item is being added to lists in a category you care about
- someone replied to your ranking update
- a friend shared a ranked list with you

## 34.3 Notification principle
Notifications must reinforce curiosity and utility, not feel spammy.

---

# 35. Accessibility requirements

Zoe must support accessible mobile use:
- screen reader compatibility
- clear touch targets
- caption support where possible
- accessible contrast
- readable typography
- motion sensitivity considerations
- non-color-only status indicators

---

# 36. Privacy and safety requirements

## 36.1 Privacy
- **Rankings visibility (account-level):** user chooses **public** or **private (followers only)** for their **rankings** as a whole (aligned with Instagram’s public vs private account mental model).
  - **Public:** anyone can view the user’s rankings (subject to any per-list controls added later); others may **pin** that user’s public lists in their own **Rankings** hub.
  - **Private (followers only):** only **approved followers** can view rankings on profile and in **Rankings hub pins**; non-followers see a **follow-gated** state. **Search** still surfaces the profile in an **Instagram-like** way (avatar, bio, **follower and following counts**), but ranking content remains locked until follow is accepted.
- users control public/private visibility for other profile components where appropriate
- users control who can message them
- users control story audience if supported
- optional later: per-list public/private or selective visibility

## 36.2 Safety
- report content
- report users
- block or mute users
- moderation of harassment, spam, impersonation
- policy around rankings and creator abuse
- safeguards for public figure and celebrity content

---

# 37. Performance requirements

The app must feel fast and polished:
- quick open time
- smooth feed scrolling
- strong media loading performance
- fast transitions between tabs
- low-friction story camera launch
- responsive share-to-chat behavior
- smooth ranking list editing

---

# 38. Analytics and success metrics

## 38.1 North star metric
Weekly active users who complete at least one meaningful action in one of Zoe’s core loops:
- post
- share
- rank
- update a list
- search
- watch Shorts
- comment
- send chat
- follow
- story post/view

## 38.2 Core retention metrics
- D1, D7, D30 retention
- DAU / WAU / MAU
- average opens per user
- average sessions per user
- frequency of Rankings tab usage and ranking-related Home engagement
- profile revisit rate
- story creation frequency

## 38.3 Ranking metrics
- ranked lists created
- list updates per user
- objects added to lists
- movement events per week
- ranking update engagement rate
- comments on ranking updates
- shares of ranked lists

## 38.4 Search metrics
- search sessions
- search-to-click
- search-to-save
- search-to-follow
- search-to-rank or search-to-post conversion

## 38.5 Social metrics
- chat shares
- chat opens
- comments per active user
- follows per active user
- story reactions
- list shares

---

# 39. MVP feature set

## 39.1 Must-have MVP
- Instagram-like five-tab glass bottom nav (**Home · Search · Rankings · Shorts · Profile**)
- Home feed (editorial masonry + ranking context on cards)
- Search / Following Activity + Search Results
- Shorts feed
- **Rankings** hub (personal lists, add/compare, captions; music links)
- Profile
- story row and story viewer
- swipe-right camera / story flow
- profile-based post creation
- feed posts
- Shorts posting
- ranked lists
- ranking update publishing
- comments
- in-app chat
- share-to-chat
- notifications
- follow graph
- search across people/items/lists/topics
- object pages
- analytics instrumentation
- moderation basics

## 39.2 Nice-to-have after MVP
- advanced pairwise ranking engine
- collaborative ranking lists
- polls in chat
- deeper recommendation explanations
- advanced taste-match scores
- public figure verified ranking programs
- audio-linked rankings
- seasonal ranking campaigns

---

# 40. Open questions

- Which categories are in day-one launch versus phased rollout?
- How public should ranked lists be by default?
- Should all users be able to rank all object types at launch?
- How much weight should ranking updates have in Home versus their dedicated tab?
- Should comments exist on ranked lists themselves, or only on published ranking updates?
- How much creator/celebrity verification is needed at launch?
- Should all posts be able to attach a ranking object, or only some post types?
- How much of the RedNote-style search utility is editorially curated versus fully algorithmic early on?

---

# 41. Launch strategy

## 41.1 Positioning
Zoe should launch as:
**A social app for discovering what’s worth loving—and ranking it.**

## 41.2 Key product story
Instagram-like social familiarity  
+ RedNote-like recommendation utility  
+ Beli-like ranking obsession  
= Zoe

## 41.3 Acquisition hooks
- creators and tastemakers
- ranking culture communities
- music fandoms
- perfume / beauty communities
- food discovery circles
- college and city culture clusters

## 41.4 Viral surfaces
- share ranked lists
- share ranking updates
- Shorts about ranking changes
- story screenshots
- celebrity ranking follow features
- chat sharing loops

---

# 42. Brand direction

## 42.1 Name
**Zoe**

## 42.2 Meaning
Derived from **ζωή**, the Greek word for **life**.

## 42.3 Brand implication
The product should feel:
- alive
- current
- expressive
- intimate
- culturally aware
- aesthetically premium

## 42.4 Logo direction
The logo system should be designed around **ζωή** conceptually, not necessarily as raw Greek lettering everywhere, but with inspiration from:
- elegance
- fluidity
- life / vitality
- tasteful minimalism
- premium but warm identity

The visual system should avoid:
- overly corporate design
- overly childish color systems
- aggressive gaming aesthetics

---

# 43. Final product definition

Zoe is a mobile social discovery and ranking app that looks and behaves like Instagram, serves the practical recommendation and search purpose of RedNote, and integrates Beli-style ranking as a core identity and engagement system through profiles, ranked lists, a **Rankings** hub, and **ranking activity** surfacing in Home and notifications.

---

# 44. Final success criteria

Zoe succeeds if users say:

- “This feels familiar to use.”
- “I come here to discover things that are actually useful.”
- “I love seeing what people change in their rankings.”
- “My profile actually says something about me.”
- “I can rank and share what I love without leaving the app.”
- “This is where I track taste, not just content.”

---

# 45. Summary for internal teams

To build Zoe correctly, all teams should align on these truths:

1. The layout should feel like Instagram.
2. The purpose should feel like RedNote.
3. Ranking should feel central like Beli.
4. The five bottom tabs are fixed: **Home, Search, Rankings, Shorts, Profile**.
5. There is no Add tab.
6. Posting happens from Profile or swipe-right camera/story flows.
7. **Rankings** is a flagship hub; **ranking curiosity** is reinforced through Home cards and notifications.
8. Chat, comments, and share-to-chat are required.
9. Search must be useful enough to build habit.
10. Profile must be both aesthetic and ranking-centric.

---

# 46. Next-step handoff

The next product document should translate this PRD into:
- screen-by-screen mobile MVP specs
- navigation maps
- major interaction states
- post creation flows
- ranking list flows
- rank update publishing flows
- chat and comment flows
- feed card anatomy
- profile layout details
- story camera and story viewer details
