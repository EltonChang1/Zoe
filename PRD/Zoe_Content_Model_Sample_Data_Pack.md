# Zoe — Figma-Ready Content Model + Sample Data Pack
**Version:** 1.1  
**Platform:** Mobile  
**Purpose:** Give design a realistic content model and sample data pack so every Figma frame can be populated with believable posts, rankings, users, objects, comments, chats, notifications, and saved content.

**Visual alignment:** Home uses **masonry** cards with optional **ranking badges** on media; **Shorts** is the product name for vertical video (see `PRD/Zoe_Visual_Direction_Kit.md` §24.1).

---

# 1. How to use this file

This file is meant for:
- populating wireframes and mockups
- creating realistic prototype flows
- keeping naming and content consistent across screens
- giving product and engineering a shared language for core entities

Use it in three ways:
1. **Copy text directly into frames**
2. **Use the data structures as mock backend objects**
3. **Assign specific sample records to specific screens**

This pack is optimized for the Zoe MVP structure:
- Instagram-like shell
- RedNote-style useful content
- Beli-style rankings
- chat and share inside the app

---

# 2. Core content principles

All mock content in Zoe should feel:
- specific
- tasteful
- socially believable
- slightly editorial
- actually useful
- concise enough for mobile

Avoid content that feels:
- like fake marketing copy
- too generic
- too long for cards
- too polished and brand-safe
- random or ungrounded

Zoe content should sound like:
- a stylish but credible friend
- a person with taste
- someone making a recommendation with context
- someone ranking things because they care, not because they are farming engagement

---

# 3. Canonical entity model

These are the main entities design should expect to render.

## 3.1 User
Represents a person using Zoe.

### Core fields
- `id`
- `display_name`
- `username`
- `avatar_label`
- `bio`
- `city`
- `taste_line`
- `posts_count`
- `followers_count`
- `following_count`
- `taste_match_percent` (contextual, not global)
- `top_categories`
- `highlights`
- `is_creator`
- `is_celebrity`
- `is_followed_by_viewer`

## 3.2 Ranked Object
Represents a thing users can discover, post about, and rank.

### MVP object types
- restaurant
- cafe
- bar
- perfume
- album

### Core fields
- `id`
- `type`
- `title`
- `subtitle`
- `city`
- `neighborhood`
- `price_or_band`
- `tags`
- `short_descriptor`
- `hero_media_label`
- `metadata`

## 3.3 Post
Main feed post.

### Core fields
- `id`
- `author_id`
- `object_id`
- `post_type` (photo, carousel, short_video)
- `headline`
- `caption`
- `tags`
- `ranking_context`
- `ranking_badge` (optional; e.g. `#3 ▲`, `#1 STABLE`, `RANKED #2 LAST MONTH` for masonry overlays)
- `likes_count`
- `comments_count`
- `save_count`
- `published_at`
- `location_label`

## 3.4 Short (vertical video)
Short-form video post (product surface name **Shorts**).

### Core fields
- `id`
- `author_id`
- `object_id`
- `hook_line`
- `caption`
- `tags`
- `likes_count`
- `comments_count`
- `save_count`
- `ranking_context`
- `audio_label`
- `consensus_label` (optional; e.g. “Popular consensus” for Shorts overlay)

## 3.5 Story
Temporary story content.

### Core fields
- `id`
- `author_id`
- `story_type`
- `overlay_text`
- `object_id`
- `published_at`
- `has_new_ring`

## 3.6 Ranking List
An ordered list owned by a user.

### Core fields
- `id`
- `owner_id`
- `title`
- `category`
- `description`
- `updated_at`
- `save_count`
- `visibility`
- `entries`

## 3.7 Ranking Entry
One item in a ranking list.

### Core fields
- `rank`
- `object_id`
- `movement` (new, up, down, same)
- `delta`
- `note`

## 3.8 Ranking Update
Activity item for the Rank Updates tab.

### Core fields
- `id`
- `actor_id`
- `action_type` (added, moved_up, moved_down, published_list)
- `list_id`
- `object_id`
- `old_rank`
- `new_rank`
- `update_text`
- `published_at`
- `comment_count`
- `share_count`

## 3.9 Comment
Comment on post or ranking update.

### Core fields
- `id`
- `author_id`
- `body`
- `likes_count`
- `published_at`
- `reply_to_comment_id`

## 3.10 Chat Thread
1:1 or group conversation.

### Core fields
- `id`
- `thread_type`
- `title`
- `participants`
- `last_message_preview`
- `last_message_at`
- `unread_count`

## 3.11 Chat Message
Message inside a thread.

### Core fields
- `id`
- `thread_id`
- `sender_id`
- `message_type` (text, shared_post, shared_object, shared_ranking)
- `body`
- `linked_entity_id`
- `sent_at`

## 3.12 Notification
User-facing alert outside Rank Updates tab.

### Core fields
- `id`
- `type`
- `actor_id`
- `body`
- `destination`
- `published_at`
- `is_unread`

## 3.13 Saved Item
Content the user saved.

### Core fields
- `id`
- `item_type`
- `linked_entity_id`
- `saved_at`
- `collection_name`

---

# 4. Controlled vocabulary and content enums

## 4.1 Common vibe tags
- quiet
- aesthetic
- worth the hype
- hidden gem
- date night
- solo date
- laptop-friendly
- low-light
- cozy
- loud
- special occasion
- under $20
- matcha
- natural wine
- clean scent
- skin scent
- warm vanilla
- all-time favorite
- late night
- brunch
- people-watching

## 4.2 Ranking action language
Use these patterns consistently:
- “added to”
- “moved from #x to #y”
- “just entered”
- “dropped to”
- “updated”
- “published a new”
- “re-ranked”

## 4.3 Caption tone rules
Keep captions:
- under ~220 characters for default card truncation
- specific to a moment, object, vibe, or tradeoff
- written like taste-based advice

Good:
- “Best quiet café in Shadyside if you care more about light and mood than food.”
- “Gorgeous bottle, soft clean drydown, but not worth full retail for me.”

Bad:
- “This place is amazing and everyone should go.”
- “I really like this it was nice and fun.”

---

# 5. Sample users

## U001
- `id`: U001
- `display_name`: Maya Chen
- `username`: mayaeats
- `avatar_label`: Maya portrait
- `bio`: Collecting quiet cafés and low-light dinner spots.
- `city`: Pittsburgh
- `taste_line`: Soft lighting, restrained menus, places that feel composed.
- `posts_count`: 48
- `followers_count`: 1204
- `following_count`: 382
- `top_categories`: cafes, restaurants, bars
- `highlights`: Cafés, Date Night, NYC, Matcha
- `is_creator`: true
- `is_celebrity`: false
- `is_followed_by_viewer`: true

## U002
- `id`: U002
- `display_name`: Elton Chang
- `username`: eltontaste
- `avatar_label`: Elton portrait
- `bio`: Design, coffee, fragrance, ranked with intent.
- `city`: Pittsburgh
- `taste_line`: Minimal, balanced, expensive-looking without trying too hard.
- `posts_count`: 31
- `followers_count`: 844
- `following_count`: 219
- `top_categories`: cafes, perfumes, albums
- `highlights`: Perfume, Coffee, Albums
- `is_creator`: true
- `is_celebrity`: false
- `is_followed_by_viewer`: false

## U003
- `id`: U003
- `display_name`: Cody Lejang
- `username`: codylists
- `avatar_label`: Cody portrait
- `bio`: If it belongs on a list, I probably made one.
- `city`: Pittsburgh
- `taste_line`: High signal, low fluff.
- `posts_count`: 22
- `followers_count`: 512
- `following_count`: 177
- `top_categories`: albums, restaurants
- `highlights`: Albums, Dinner, Hidden Gems
- `is_creator`: true
- `is_celebrity`: false
- `is_followed_by_viewer`: true

## U004
- `id`: U004
- `display_name`: Nina Park
- `username`: nineleven
- `avatar_label`: Nina portrait
- `bio`: Perfume, pastries, and places worth dressing up for.
- `city`: New York
- `taste_line`: Chic, soft, feminine, selective.
- `posts_count`: 67
- `followers_count`: 3920
- `following_count`: 401
- `top_categories`: perfumes, cafes, restaurants
- `highlights`: Perfume, NYC, Desserts
- `is_creator`: true
- `is_celebrity`: false
- `is_followed_by_viewer`: true

## U005
- `id`: U005
- `display_name`: Jules Rivera
- `username`: julesafterdark
- `avatar_label`: Jules portrait
- `bio`: Bars, vinyl, and late dinner reservations.
- `city`: Brooklyn
- `taste_line`: Dim, sharp, a little dramatic.
- `posts_count`: 54
- `followers_count`: 1688
- `following_count`: 298
- `top_categories`: bars, albums, restaurants
- `highlights`: Bars, Records, Night
- `is_creator`: true
- `is_celebrity`: false
- `is_followed_by_viewer`: false

## U006
- `id`: U006
- `display_name`: Sofia Lim
- `username`: sofiascent
- `avatar_label`: Sofia portrait
- `bio`: I rank perfumes like they are people.
- `city`: Los Angeles
- `taste_line`: Clean florals, soft woods, no sugar bombs.
- `posts_count`: 83
- `followers_count`: 12400
- `following_count`: 612
- `top_categories`: perfumes
- `highlights`: Skin Scents, Night, Layering
- `is_creator`: true
- `is_celebrity`: false
- `is_followed_by_viewer`: true

## U007
- `id`: U007
- `display_name`: Adrian Vale
- `username`: adrianlistens
- `avatar_label`: Adrian portrait
- `bio`: Album rankings are a form of autobiography.
- `city`: Chicago
- `taste_line`: Intimate records, clean sequencing, no filler.
- `posts_count`: 19
- `followers_count`: 2560
- `following_count`: 186
- `top_categories`: albums
- `highlights`: Top 50, 2010s, Vinyl
- `is_creator`: true
- `is_celebrity`: false
- `is_followed_by_viewer`: true

## U008
- `id`: U008
- `display_name`: Lila Hart
- `username`: lila.hart
- `avatar_label`: Lila portrait
- `bio`: Singer. Traveler. Selectively obsessed.
- `city`: Los Angeles
- `taste_line`: Expensive softness.
- `posts_count`: 102
- `followers_count`: 875000
- `following_count`: 141
- `top_categories`: perfumes, restaurants, albums
- `highlights`: Tour, Perfume, Paris
- `is_creator`: true
- `is_celebrity`: true
- `is_followed_by_viewer`: true

## U009
- `id`: U009
- `display_name`: Sarah Kim
- `username`: saraharchives
- `avatar_label`: Sarah portrait
- `bio`: Soft spots for bookstores, noodles, and records.
- `city`: Pittsburgh
- `taste_line`: Warm, thoughtful, slightly nostalgic.
- `posts_count`: 14
- `followers_count`: 302
- `following_count`: 211
- `top_categories`: cafes, albums
- `highlights`: Sunday, Jazz, Oakland
- `is_creator`: false
- `is_celebrity`: false
- `is_followed_by_viewer`: true

## U010
- `id`: U010
- `display_name`: Marcus Bell
- `username`: marcusbell
- `avatar_label`: Marcus portrait
- `bio`: I only rank places I’d actually go back to.
- `city`: Pittsburgh
- `taste_line`: Comfort first, hype second.
- `posts_count`: 11
- `followers_count`: 190
- `following_count`: 122
- `top_categories`: restaurants, bars
- `highlights`: Pizza, Weeknights
- `is_creator`: false
- `is_celebrity`: false
- `is_followed_by_viewer`: true

---

# 6. Sample ranked objects

## O001
- `id`: O001
- `type`: cafe
- `title`: Sumi Café
- `subtitle`: Specialty café
- `city`: Pittsburgh
- `neighborhood`: Shadyside
- `price_or_band`: $$
- `tags`: quiet, aesthetic, laptop-friendly, matcha
- `short_descriptor`: Soft light, restrained menu, ideal for solo work.
- `hero_media_label`: warm wood counter and large front windows
- `metadata`: open until 6pm

## O002
- `id`: O002
- `type`: cafe
- `title`: Arriviste Coffee Bar
- `subtitle`: Café
- `city`: Pittsburgh
- `neighborhood`: Shadyside
- `price_or_band`: $$
- `tags`: high design, pastry, espresso, crowded
- `short_descriptor`: Beautiful room, stronger on atmosphere than seating.
- `hero_media_label`: marble bar with pastry case
- `metadata`: known for morning rush

## O003
- `id`: O003
- `type`: restaurant
- `title`: Kyo Omakase
- `subtitle`: Sushi omakase
- `city`: Pittsburgh
- `neighborhood`: Downtown
- `price_or_band`: $$$$
- `tags`: date night, low-light, special occasion, intimate
- `short_descriptor`: Sharp service and a room that feels quieter than most.
- `hero_media_label`: omakase counter with dim pendant lighting
- `metadata`: reservation recommended

## O004
- `id`: O004
- `type`: restaurant
- `title`: Pabellón
- `subtitle`: Venezuelan restaurant
- `city`: Pittsburgh
- `neighborhood`: Oakland
- `price_or_band`: $$
- `tags`: comforting, casual, worth the hype, group-friendly
- `short_descriptor`: Big flavor, generous portions, easy repeat visit.
- `hero_media_label`: colorful table with arepas and tequeños
- `metadata`: good for lunch and groups

## O005
- `id`: O005
- `type`: bar
- `title`: Afterglow
- `subtitle`: Cocktail bar
- `city`: Pittsburgh
- `neighborhood`: Lawrenceville
- `price_or_band`: $$$
- `tags`: low-light, natural wine, intimate, date night
- `short_descriptor`: Velvet-dark energy with cleaner cocktails than expected.
- `hero_media_label`: candlelit bar shelf with amber glasses
- `metadata`: open late

## O006
- `id`: O006
- `type`: perfume
- `title`: Baccarat Rouge 540
- `subtitle`: Maison Francis Kurkdjian
- `city`: null
- `neighborhood`: null
- `price_or_band`: $$$$
- `tags`: sweet, airy, loud, luxury
- `short_descriptor`: Instantly recognizable and polarizing.
- `hero_media_label`: red bottle on mirrored tray
- `metadata`: projection high

## O007
- `id`: O007
- `type`: perfume
- `title`: Blanche
- `subtitle`: Byredo
- `city`: null
- `neighborhood`: null
- `price_or_band`: $$$
- `tags`: clean scent, skin scent, white floral, minimal
- `short_descriptor`: Fresh linen without turning too soapy.
- `hero_media_label`: clear rectangular bottle on white marble
- `metadata`: daytime favorite

## O008
- `id`: O008
- `type`: perfume
- `title`: Gris Charnel
- `subtitle`: BDK Parfums
- `city`: null
- `neighborhood`: null
- `price_or_band`: $$$
- `tags`: fig, tea, woody, night
- `short_descriptor`: Smooth, elegant, addictive without being too obvious.
- `hero_media_label`: deep gray bottle against dark fabric
- `metadata`: strong evening wear

## O009
- `id`: O009
- `type`: album
- `title`: Blonde
- `subtitle`: Frank Ocean
- `city`: null
- `neighborhood`: null
- `price_or_band`: album
- `tags`: intimate, all-time favorite, late night
- `short_descriptor`: Fragile sequencing, impossible to outgrow.
- `hero_media_label`: album cover close crop
- `metadata`: 2016

## O010
- `id`: O010
- `type`: album
- `title`: Melodrama
- `subtitle`: Lorde
- `city`: null
- `neighborhood`: null
- `price_or_band`: album
- `tags`: dramatic, perfectly sequenced, all-time favorite
- `short_descriptor`: Peak emotional architecture.
- `hero_media_label`: album cover close crop
- `metadata`: 2017

## O011
- `id`: O011
- `type`: album
- `title`: Channel Orange
- `subtitle`: Frank Ocean
- `city`: null
- `neighborhood`: null
- `price_or_band`: album
- `tags`: warm, classic, summer-night
- `short_descriptor`: More generous and open than Blonde.
- `hero_media_label`: orange cover crop
- `metadata`: 2012

## O012
- `id`: O012
- `type`: restaurant
- `title`: Piper’s Matcha Bar
- `subtitle`: Dessert café
- `city`: New York
- `neighborhood`: SoHo
- `price_or_band`: $$$
- `tags`: matcha, aesthetic, dessert, solo date
- `short_descriptor`: Gorgeous room, smaller payoff than the photos suggest.
- `hero_media_label`: green-toned dessert table with matcha drinks
- `metadata`: afternoon peak

---

# 7. Sample posts

## P001
- `id`: P001
- `author_id`: U001
- `object_id`: O001
- `post_type`: photo
- `headline`: Best quiet café in Shadyside if you care more about light and mood than food.
- `caption`: I keep coming back here for solo work blocks. The menu is small, but the room does exactly what I need it to do.
- `tags`: quiet, laptop-friendly, aesthetic
- `ranking_context`: Ranked #3 in my Top Cafés
- `likes_count`: 842
- `comments_count`: 19
- `save_count`: 310
- `published_at`: 2h ago
- `location_label`: Shadyside

## P002
- `id`: P002
- `author_id`: U002
- `object_id`: O007
- `post_type`: carousel
- `headline`: The clean-girl perfume that actually stays interesting on skin.
- `caption`: Blanche still feels expensive to me because it stays crisp without becoming sterile. Best in close range, not for drama.
- `tags`: clean scent, skin scent, minimal
- `ranking_context`: Moved to #2 in My Everyday Perfumes
- `likes_count`: 501
- `comments_count`: 14
- `save_count`: 228
- `published_at`: 5h ago
- `location_label`: null

## P003
- `id`: P003
- `author_id`: U003
- `object_id`: O009
- `post_type`: photo
- `headline`: Still the album I measure every late-night walk against.
- `caption`: I tried moving it down and immediately changed my mind. Some records are too welded to your life to rank casually.
- `tags`: all-time favorite, late night, headphones
- `ranking_context`: Ranked #1 in All-Time Albums
- `likes_count`: 390
- `comments_count`: 22
- `save_count`: 120
- `published_at`: 1d ago
- `location_label`: null

## P004
- `id`: P004
- `author_id`: U004
- `object_id`: O012
- `post_type`: short_video
- `headline`: Beautiful, overpriced, and somehow I’d still bring a friend here.
- `caption`: The matcha is not the point. The room is. Good for a slow afternoon when you want something a little performative.
- `tags`: matcha, aesthetic, solo date
- `ranking_context`: Just entered my NYC Dessert Spots at #6
- `likes_count`: 1240
- `comments_count`: 37
- `save_count`: 460
- `published_at`: 8h ago
- `location_label`: SoHo

## P005
- `id`: P005
- `author_id`: U005
- `object_id`: O005
- `post_type`: photo
- `headline`: The kind of bar that makes your whole outfit feel more correct.
- `caption`: Go late, sit near the back, order something bitter first.
- `tags`: low-light, date night, natural wine
- `ranking_context`: Ranked #2 in Late Night Bars
- `likes_count`: 678
- `comments_count`: 11
- `save_count`: 284
- `published_at`: 6h ago
- `location_label`: Lawrenceville

## P006
- `id`: P006
- `author_id`: U006
- `object_id`: O008
- `post_type`: short_video
- `headline`: If you want one elegant night fragrance that does not scream for attention.
- `caption`: Gris Charnel is smooth from the first minute and somehow gets better in cold air. One of the few evening scents I never get tired of.
- `tags`: woody, tea, night
- `ranking_context`: Ranked #1 in Night Perfumes
- `likes_count`: 2210
- `comments_count`: 48
- `save_count`: 907
- `published_at`: 3h ago
- `location_label`: null

## P007
- `id`: P007
- `author_id`: U009
- `object_id`: O004
- `post_type`: photo
- `headline`: This is my safest answer when someone asks where to eat near campus.
- `caption`: It’s comforting, generous, and never feels like a compromise.
- `tags`: comforting, casual, group-friendly
- `ranking_context`: Ranked #4 in Best Repeat Lunches
- `likes_count`: 112
- `comments_count`: 6
- `save_count`: 41
- `published_at`: 4h ago
- `location_label`: Oakland

## P008
- `id`: P008
- `author_id`: U008
- `object_id`: O006
- `post_type`: photo
- `headline`: I know it’s obvious. I still love it at night.
- `caption`: Not subtle, not niche, still one of the quickest ways to feel dressed.
- `tags`: luxury, loud, night
- `ranking_context`: Added to Tour Favorites at #5
- `likes_count`: 18700
- `comments_count`: 210
- `save_count`: 4200
- `published_at`: 1h ago
- `location_label`: Paris

---

# 8. Sample Shorts (vertical videos)

## R001
- `id`: R001
- `author_id`: U004
- `object_id`: O012
- `hook_line`: Pretty? yes. worth the line? depends.
- `caption`: If you come here, come for the room and split dessert.
- `tags`: matcha, aesthetic, dessert
- `likes_count`: 3400
- `comments_count`: 82
- `save_count`: 911
- `ranking_context`: #6 in NYC Dessert Spots
- `audio_label`: soft house instrumental

## R002
- `id`: R002
- `author_id`: U006
- `object_id`: O008
- `hook_line`: My most complimented cold-weather perfume.
- `caption`: Elegant, addictive, not too sweet.
- `tags`: night, woody, tea
- `likes_count`: 5200
- `comments_count`: 105
- `save_count`: 1804
- `ranking_context`: #1 in Night Perfumes
- `audio_label`: moody synth loop

## R003
- `id`: R003
- `author_id`: U001
- `object_id`: O001
- `hook_line`: Quiet cafés I’d gatekeep if I were weaker.
- `caption`: This one is still top tier for solo afternoons.
- `tags`: quiet, laptop-friendly, matcha
- `likes_count`: 910
- `comments_count`: 21
- `save_count`: 355
- `ranking_context`: #3 in Top Cafés
- `audio_label`: lo-fi piano

## R004
- `id`: R004
- `author_id`: U007
- `object_id`: O010
- `hook_line`: Albums that feel sequenced with surgical precision.
- `caption`: Melodrama still has one of the cleanest emotional arcs in pop.
- `tags`: all-time favorite, dramatic, headphones
- `likes_count`: 1880
- `comments_count`: 63
- `save_count`: 502
- `ranking_context`: #2 in All-Time Albums
- `audio_label`: cinematic pop loop

---

# 9. Sample stories

## S001
- `id`: S001
- `author_id`: U001
- `story_type`: photo
- `overlay_text`: afternoon reset
- `object_id`: O001
- `published_at`: 42m ago
- `has_new_ring`: true

## S002
- `id`: S002
- `author_id`: U002
- `story_type`: video
- `overlay_text`: moved this up immediately
- `object_id`: O007
- `published_at`: 1h ago
- `has_new_ring`: true

## S003
- `id`: S003
- `author_id`: U003
- `story_type`: text_on_color
- `overlay_text`: re-ranking my top 20 tonight
- `object_id`: null
- `published_at`: 3h ago
- `has_new_ring`: true

## S004
- `id`: S004
- `author_id`: U008
- `story_type`: photo
- `overlay_text`: hotel scent of the week
- `object_id`: O006
- `published_at`: 5h ago
- `has_new_ring`: true

## S005
- `id`: S005
- `author_id`: U009
- `story_type`: photo
- `overlay_text`: Sunday noodles > everything
- `object_id`: O004
- `published_at`: 2h ago
- `has_new_ring`: true

---

# 10. Sample ranking lists

## L001
- `id`: L001
- `owner_id`: U001
- `title`: Maya’s Top Cafés
- `category`: cafe
- `description`: Quiet, light-filled, and worth staying longer than you planned.
- `updated_at`: 2h ago
- `save_count`: 892
- `visibility`: public
- `entries`:
  - #1 O002 movement same delta 0 note: still the best room for mornings
  - #2 O001 movement up delta 1 note: better for solo afternoons than almost anywhere
  - #3 O012 movement new delta null note: gorgeous but more occasional than daily
  - #4 O004 movement down delta 1 note: comforting, less “special”
  - #5 O005 movement same delta 0 note: more evening-coded than café-coded

## L002
- `id`: L002
- `owner_id`: U002
- `title`: Everyday Perfumes
- `category`: perfume
- `description`: Things I can wear without planning the whole rest of the look around them.
- `updated_at`: 5h ago
- `save_count`: 611
- `visibility`: public
- `entries`:
  - #1 O008 movement same delta 0 note: a little richer than “everyday” but I still reach for it constantly
  - #2 O007 movement up delta 1 note: cleaner and more flexible than I remembered
  - #3 O006 movement down delta 1 note: still beautiful, just less me lately

## L003
- `id`: L003
- `owner_id`: U003
- `title`: All-Time Albums
- `category`: album
- `description`: This list changes slowly and ruins my week every time.
- `updated_at`: 1d ago
- `save_count`: 730
- `visibility`: public
- `entries`:
  - #1 O009 movement same delta 0 note: impossible to dislodge
  - #2 O010 movement same delta 0 note: near-perfect structure
  - #3 O011 movement same delta 0 note: warmer and more open than most favorites
  - #4 O009 movement same delta 0 note: placeholder duplicate remove in UI mock if needed

## L004
- `id`: L004
- `owner_id`: U006
- `title`: Night Perfumes
- `category`: perfume
- `description`: Smooth, adult, memorable without trying too hard.
- `updated_at`: 3h ago
- `save_count`: 1502
- `visibility`: public
- `entries`:
  - #1 O008 movement same delta 0 note: the easiest elegant night wear
  - #2 O006 movement down delta 1 note: louder and less nuanced, still strong
  - #3 O007 movement new delta null note: cleaner than the others but beautiful close to skin

## L005
- `id`: L005
- `owner_id`: U007
- `title`: All-Time Albums
- `category`: album
- `description`: Records that reorganized my listening habits.
- `updated_at`: 6h ago
- `save_count`: 488
- `visibility`: public
- `entries`:
  - #1 O009 movement same delta 0 note: no notes left to write
  - #2 O010 movement up delta 1 note: somehow more precise every year
  - #3 O011 movement down delta 1 note: still essential, just less personal than the top two

## L006
- `id`: L006
- `owner_id`: U010
- `title`: Best Repeat Dinner Spots
- `category`: restaurant
- `description`: Places I would actually return to on a random weeknight.
- `updated_at`: 4h ago
- `save_count`: 149
- `visibility`: public
- `entries`:
  - #1 O004 movement same delta 0 note: easiest yes in Oakland
  - #2 O003 movement same delta 0 note: expensive, so not exactly weekly
  - #3 O005 movement new delta null note: more bar than dinner, but I keep ending up here

---

# 11. Sample ranking updates

## RU001
- `id`: RU001
- `actor_id`: U001
- `action_type`: moved_up
- `list_id`: L001
- `object_id`: O001
- `old_rank`: 3
- `new_rank`: 2
- `update_text`: Maya moved Sumi Café from #3 to #2 in Top Cafés.
- `published_at`: 2h ago
- `comment_count`: 8
- `share_count`: 19

## RU002
- `id`: RU002
- `actor_id`: U002
- `action_type`: moved_up
- `list_id`: L002
- `object_id`: O007
- `old_rank`: 3
- `new_rank`: 2
- `update_text`: Elton moved Blanche up to #2 in Everyday Perfumes.
- `published_at`: 5h ago
- `comment_count`: 4
- `share_count`: 9

## RU003
- `id`: RU003
- `actor_id`: U003
- `action_type`: published_list
- `list_id`: L003
- `object_id`: null
- `old_rank`: null
- `new_rank`: null
- `update_text`: Cody updated his All-Time Albums list.
- `published_at`: 1d ago
- `comment_count`: 17
- `share_count`: 26

## RU004
- `id`: RU004
- `actor_id`: U006
- `action_type`: moved_down
- `list_id`: L004
- `object_id`: O006
- `old_rank`: 1
- `new_rank`: 2
- `update_text`: Sofia dropped Baccarat Rouge 540 from #1 to #2 in Night Perfumes.
- `published_at`: 3h ago
- `comment_count`: 23
- `share_count`: 55

## RU005
- `id`: RU005
- `actor_id`: U007
- `action_type`: moved_up
- `list_id`: L005
- `object_id`: O010
- `old_rank`: 3
- `new_rank`: 2
- `update_text`: Adrian moved Melodrama to #2 in All-Time Albums.
- `published_at`: 6h ago
- `comment_count`: 12
- `share_count`: 21

## RU006
- `id`: RU006
- `actor_id`: U008
- `action_type`: added
- `list_id`: null
- `object_id`: O006
- `old_rank`: null
- `new_rank`: 5
- `update_text`: Lila Hart added Baccarat Rouge 540 at #5 in Tour Favorites.
- `published_at`: 1h ago
- `comment_count`: 41
- `share_count`: 112

## RU007
- `id`: RU007
- `actor_id`: U010
- `action_type`: added
- `list_id`: L006
- `object_id`: O005
- `old_rank`: null
- `new_rank`: 3
- `update_text`: Marcus added Afterglow at #3 in Best Repeat Dinner Spots.
- `published_at`: 4h ago
- `comment_count`: 3
- `share_count`: 5

---

# 12. Sample comments

## Comments for P001
- C001 — U009 — “Is it actually quiet after 2pm or just in the morning?” — 7 likes — 1h ago
- C002 — U001 — “Usually best before 3. After that it depends on weather honestly.” — 5 likes — 58m ago
- C003 — U010 — “Better than Arriviste for sitting, worse for pastries.” — 4 likes — 44m ago

## Comments for P002
- C004 — U004 — “This is such a good office scent if your office isn’t unbearable.” — 12 likes — 3h ago
- C005 — U002 — “Exactly. It feels expensive without announcing itself.” — 6 likes — 2h ago

## Comments for RU004
- C006 — U008 — “finally someone said it” — 41 likes — 2h ago
- C007 — U006 — “I still love it, it just stopped feeling as surprising to me.” — 18 likes — 1h ago
- C008 — U005 — “where did Gris Charnel land after this?” — 9 likes — 59m ago

## Comments for P003
- C009 — U007 — “This and Melodrama fighting for #1 is my least productive thought loop.” — 23 likes — 18h ago
- C010 — U003 — “mine too, unfortunately.” — 10 likes — 17h ago

---

# 13. Sample chat threads

## T001
- `id`: T001
- `thread_type`: direct
- `title`: Maya Chen
- `participants`: U001, viewer
- `last_message_preview`: sent Sumi Café
- `last_message_at`: 12m ago
- `unread_count`: 2

## T002
- `id`: T002
- `thread_type`: group
- `title`: Friday Plans
- `participants`: U001, U003, U009, viewer
- `last_message_preview`: Which one actually feels worth dressing for?
- `last_message_at`: 34m ago
- `unread_count`: 5

## T003
- `id`: T003
- `thread_type`: direct
- `title`: Elton Chang
- `participants`: U002, viewer
- `last_message_preview`: Blanche is way more you than BR540
- `last_message_at`: 2h ago
- `unread_count`: 0

## T004
- `id`: T004
- `thread_type`: direct
- `title`: Adrian Vale
- `participants`: U007, viewer
- `last_message_preview`: sent All-Time Albums
- `last_message_at`: 1d ago
- `unread_count`: 1

---

# 14. Sample chat messages

## Thread T001
- M001 — viewer — text — “Want to go Saturday afternoon?” — null — 14m ago
- M002 — viewer — shared_object — “This feels very you.” — O001 — 14m ago
- M003 — U001 — text — “yes but only if we get there before the laptop crowd” — null — 12m ago
- M004 — U001 — shared_post — “also this is the post I meant” — P001 — 12m ago

## Thread T002
- M005 — U009 — text — “Which one actually feels worth dressing for?” — null — 40m ago
- M006 — U001 — shared_object — “Afterglow” — O005 — 39m ago
- M007 — U003 — shared_ranking — “Cody’s Late Night Bars” — L006 — 37m ago
- M008 — viewer — text — “Afterglow if we want cocktails, Kyo if we want to commit” — null — 34m ago

## Thread T003
- M009 — U002 — shared_object — “Blanche” — O007 — 2h ago
- M010 — U002 — text — “Blanche is way more you than BR540” — null — 2h ago
- M011 — viewer — text — “that’s exactly what I needed to hear” — null — 1h ago

## Thread T004
- M012 — U007 — shared_ranking — “All-Time Albums” — L005 — 1d ago
- M013 — U007 — text — “you’re going to disagree with #2” — null — 1d ago
- M014 — viewer — text — “I already do” — null — 23h ago

---

# 15. Sample notifications

## N001
- `id`: N001
- `type`: comment
- `actor_id`: U009
- `body`: Sarah Kim commented on your post: “Better than Arriviste for sitting, worse for pastries.”
- `destination`: P001 comments
- `published_at`: 44m ago
- `is_unread`: true

## N002
- `id`: N002
- `type`: follow
- `actor_id`: U005
- `body`: Jules Rivera started following you.
- `destination`: U005 profile
- `published_at`: 1h ago
- `is_unread`: true

## N003
- `id`: N003
- `type`: message
- `actor_id`: U001
- `body`: Maya sent you Sumi Café.
- `destination`: T001
- `published_at`: 12m ago
- `is_unread`: true

## N004
- `id`: N004
- `type`: ranking
- `actor_id`: U006
- `body`: Sofia dropped Baccarat Rouge 540 to #2 in Night Perfumes.
- `destination`: RU004
- `published_at`: 3h ago
- `is_unread`: true

## N005
- `id`: N005
- `type`: like
- `actor_id`: U008
- `body`: Lila Hart liked your ranking update.
- `destination`: your ranking update
- `published_at`: 27m ago
- `is_unread`: false

---

# 16. Sample saved collections

## Default Saved
- P001 saved 1h ago
- P005 saved 3h ago
- O008 saved 1d ago
- L003 saved 1d ago

## Collection: Date Night
- O003
- O005
- P005

## Collection: Clean Perfumes
- O007
- O008
- P002
- RU002

## Collection: Albums to Re-rank
- O009
- O010
- O011
- L005

---

# 17. Screen-to-content mapping

This section tells the design team exactly which sample data to use on major screens.

## 17.1 Home feed default
Use this order:
1. Story tray: S001, S002, S003, S004, S005
2. Feed card: P001
3. Feed card: P002
4. Feed card: P005
5. Ranking activity snippet: RU001
6. Feed card: P003
7. Feed card: P007

## 17.2 Home feed scrolled
Use:
- P005
- P006
- RU002
- P008
- P004

## 17.3 Explore landing grid
Tiles:
- P004
- P006
- P003
- P005
- P001
- P008
- R002
- R004
- O003
- L003

## 17.4 Search results for “matcha”
Top:
- O001
- O012
- P004
- R001
- U004

## 17.5 Search results for “Blonde”
Top:
- O009
- P003
- L003
- L005
- U007

## 17.6 Rank Updates default
Use in order:
- RU001
- RU002
- RU006
- RU004
- RU005
- RU003

## 17.7 Shorts feed
Use:
- R003
- R002
- R001
- R004

## 17.8 Self profile
Use self as U002.
Posts grid:
- P002 plus 5 placeholder tiles from future content
Ranking previews:
- L002
- a future albums list
- a future cafés list
Highlights:
- Perfume, Coffee, Albums

## 17.9 Other user profile
Use U001.
Posts:
- P001
- a future café post
- a future dinner post
Ranking list:
- L001
Taste match badge:
- 91%

## 17.10 Ranking detail view
Use L003 or L001 depending category.
If albums:
- L003 or L005
If cafés:
- L001

## 17.11 Object detail page
Restaurant example:
- O003
- show related post P005 if needed
- show ranking update RU006 style module if celebrity relevant

Perfume example:
- O007
- related post P002
- related ranking update RU002

Album example:
- O009
- related post P003
- related list L003 and L005

## 17.12 Comments sheet
For P001 use:
- C001
- C002
- C003

For RU004 use:
- C006
- C007
- C008

## 17.13 Inbox list
Use:
- T001
- T002
- T003
- T004

## 17.14 Chat thread examples
1:1:
- T001 messages M001 to M004
Group:
- T002 messages M005 to M008
Perfume direct:
- T003 messages M009 to M011

## 17.15 Notifications
Use:
- N003
- N004
- N001
- N002
- N005

## 17.16 Saved page
Tabs:
- Posts: P001, P005
- Objects: O008, O003
- Rankings: L003, RU002

---

# 18. Sample UI copy by component

## 18.1 Feed post CTA copy
- View 19 comments
- Save
- Share
- Add to ranking
- Open list

## 18.2 Ranking update CTA copy
- Open ranking
- Compare to yours
- Share
- Comment

## 18.3 Object detail CTA copy
- Add to ranking
- Save
- Share to chat
- See who ranked this

## 18.4 Empty state copy
### Home empty
Follow a few people or rank a few things to make Zoe sharper.

### Rank Updates empty
No ranking changes yet. Follow people with taste or publish your first list.

### Saved empty
Nothing saved yet. Start collecting places, perfumes, albums, and rankings.

### Inbox empty
Share a post or ranking to start a conversation.

---

# 19. Placeholder media direction for Figma

Since actual photography may not be available yet, use believable placeholders:

## Cafés / restaurants
- warm natural light
- tables, cups, pastry cases, plated food
- dim interiors for bars
- sushi counters for omakase
- high contrast but soft editing

## Perfumes
- bottle close-ups
- mirror trays
- fabric shadows
- marble or wood surfaces
- soft luxury lighting

## Albums
- album cover art crop
- record player texture
- vinyl stack
- headphones on linen or desk

## Stories
- more casual and immediate than feed posts
- phone-camera energy
- handwritten text feel allowed

---

# 20. Realism notes for design

To make frames feel real:
- mix high-engagement creators with ordinary users
- do not give every post thousands of likes
- vary comment counts and save counts
- make celebrity activity rare but noticeable
- show some disagreement in ranking comments
- let some captions be warm, some sharp, some playful

Examples of realistic contrast:
- U008 celebrity post can have 18.7k likes
- U009 friend post can have 112 likes
- Marcus ranking update can have only 3 comments
- Cody’s album list can have disproportionate saves relative to post count because lists are useful

---

# 21. Optional JSON-style starter bundle

Below is a compact bundle design can hand to engineering or use in plugins later.

```json
{
  "featured_users": ["U001", "U002", "U003", "U004", "U006", "U008"],
  "home_feed": ["P001", "P002", "P005", "RU001", "P003", "P007"],
  "shorts_feed": ["R003", "R002", "R001", "R004"],
  "rank_updates": ["RU001", "RU002", "RU006", "RU004", "RU005", "RU003"],
  "story_tray": ["S001", "S002", "S003", "S004", "S005"],
  "inbox_threads": ["T001", "T002", "T003", "T004"],
  "notifications": ["N003", "N004", "N001", "N002", "N005"],
  "saved_default": ["P001", "P005", "O008", "L003"]
}
```

---

# 22. Final instruction for the Figma team

Populate screens with this data consistently before polishing visuals.

The goal is not just to make the app look full.
The goal is to make Zoe feel like a believable living product:
- with people who have distinct taste
- with rankings that feel emotionally real
- with posts that are useful, not filler
- with social activity that makes the product feel alive

If this content pack is used consistently, the prototype will feel much closer to a real launch candidate than a blank social app mock.
