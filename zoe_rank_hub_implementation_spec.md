---
title: "Zoe Rank Hub Implementation Spec"
version: "1.0"
product: "Zoe"
feature: "Rank Hub"
audience: "Coding agent, product engineer, product designer"
status: "Build-ready"
core_rule: "Only official city-connected personal lists count toward official city rankings; custom personal lists do not."
---

# Zoe Rank Hub — Build-Ready Implementation Spec

## 0. Coding Agent Instruction

Build **Rank Hub** as a two-tab ranking destination:

```text
[ City ] [ Personal ]
```

The **City** tab is the answer-first place for official city rankings.
The **Personal** tab is where users create and manage their own rankings.

The most important implementation rule:

```text
Only official city-connected personal lists count toward official city rankings.
```

The most important product rule:

```text
Rank Hub should be the easiest place to find what a city actually likes.
```

The most important trust rule:

```text
One user can contribute, but one user cannot dominate.
```

---

# 1. Product Summary

Rank Hub replaces scattered RedNote-style city search with one trusted city-ranking destination.

Instead of users searching many posts like:

```text
Pittsburgh food
Pittsburgh restaurants
Pittsburgh cafés
```

Zoe should let them open:

```text
Rank Hub → City → Pittsburgh → Best Restaurants / Best Cafés / Best Spots
```

and immediately see community-ranked answers.

Strategic difference:

```text
RedNote is search-first.
Zoe Rank Hub is answer-first.
```

---

# 2. Required Navigation Change

Replace the current Rank Hub community subtabs:

- Trending Lists
- New Tastemakers
- Category Gems

with:

```text
[ City ] [ Personal ]
```

These old ideas can later become secondary modules, but they should not be top-level navigation.

---

# 3. Required Screens

## 3.1 RankHubPage

Top-level screen:

```text
Rank Hub

[ City ] [ Personal ]

Pittsburgh ▼        + Add City
```

Required states:

- no city selected
- city selected
- City tab active
- Personal tab active
- loading
- error
- empty city data
- empty personal lists

## 3.2 City Setup Screen

If no city is selected:

```text
Rank Hub

Find the best places where you live.

Where do you live?

[ Use current location ]
[ Search city ]

Popular:
Pittsburgh
New York
Los Angeles
San Francisco
Chicago
```

## 3.3 City Tab

City tab must show:

1. city selector
2. ranked-by count
3. updated timestamp
4. Featured Rankings
5. Help Rank / Quick Vote module
6. Community Pulse module

MVP Featured Rankings:

- Best Spots
- Best Restaurants
- Best Cafés

Example card:

```text
Pittsburgh's Best Cafés

Ranked by 842 locals
Updated today

#1 Arriviste Coffee Bar
#2 Sumi Café
#3 Redhawk Coffee
#4 Commonplace Coffee
#5 De Fer Coffee

[ Open List ]
```

## 3.4 City Ranking Detail Page

Example:

```text
Pittsburgh's Best Cafés

Ranked by 842 local users
Updated today

[ All ] [ Friends ] [ Locals ] [ People Like You ]

#1 Arriviste Coffee Bar
CityTaste Score 94
Ranked by 421 locals
Strong in: coffee, design, pastries
[ Save ] [ Add to My Ranking ]
```

Each row requires:

- rank number
- object name
- object image if available
- neighborhood
- type/category
- tags
- CityTaste Score
- local ranker count
- movement indicator if available
- Save CTA
- Add to My Ranking CTA

## 3.5 Personal Tab

Personal tab must show:

```text
Your Rankings

Rank something ▼

Suggested from Pittsburgh:
[ Best Spots ]
[ Best Restaurants ]
[ Best Cafés ]

Your Lists:
- My Best Pittsburgh Cafés
- My Best Pittsburgh Restaurants
- Everyday Perfumes
- All-Time Albums

[ Create Custom List ]
```

## 3.6 Rank Something Slide-Down Selector

When user taps `Rank something ▼`, show:

```text
What do you want to rank?

Official Pittsburgh Rankings
These help shape the city rankings.

[ Best Spots ]
Not started

[ Best Restaurants ]
3 places ranked

[ Best Cafés ]
Not started

Personal Lists
These are for your profile only.

[ Everyday Perfumes ]
[ All-Time Albums ]

[ + Create Custom Ranking List ]
```

This selector must clearly separate:

1. official city-connected lists
2. custom personal lists

---

# 4. Official vs Custom List Rules

## 4.1 Official city-connected personal list

Example:

```text
My Best Pittsburgh Cafés
```

Rules:

- created by a user
- linked to an official city ranking list
- counts toward the city ranking
- appears on user profile
- must be labeled `Counts toward city ranking`

YAML:

```yaml
list_type: official_city_connected
city: Pittsburgh
category: cafe
counts_toward_city_ranking: true
source_city_list: Pittsburgh Best Cafés
```

## 4.2 Custom personal list

Example:

```text
Best Places for a First Date
```

Rules:

- created by a user
- appears on user profile
- can be public, friends-only, or private
- does not affect city rankings
- must be labeled `Personal only`

YAML:

```yaml
list_type: custom_personal
city: Pittsburgh
category: mixed
counts_toward_city_ranking: false
source_city_list: null
```

---

# 5. Ranking Algorithm Requirements

Official city rankings are generated from:

```text
all official user personal rankings
+ quick pairwise votes
+ local trust weighting
+ confidence adjustment
+ anti-spam protection
= community city ranking
```

Signal priority:

| Signal | Impact |
|---|---|
| Official personal ranking | High |
| Pairwise quick vote | Medium |
| I've been here | Medium-low |
| Save | Low |
| Share | Low |
| Comment | Low |
| Like | Very low or none |

## 5.1 One User Influence Budget

Each user gets one normalized influence budget per official city list.

Default:

```text
100 influence points per user per official list
```

Example distribution:

```text
#1 = 35
#2 = 25
#3 = 18
#4 = 13
#5 = 9
Total = 100
```

If user edits their ranking, replace the old contribution. Do not duplicate it.

## 5.2 Diminishing Individual Impact

Formula concept:

```text
one_user_impact = user_influence_weight / total_city_influence_weight
```

As more users participate, one user has less ability to move the official ranking.

## 5.3 CityTaste Score

MVP formula:

```text
citytaste_score = normalized_rank_points * confidence_multiplier * recency_multiplier
```

Confidence multiplier:

```text
confidence_multiplier = min(1.0, sqrt(local_rankers_count / confidence_threshold))
```

Recommended:

```text
confidence_threshold = 25
```

Normalize score to 0–100 within each list.

---

# 6. Data Models

## City

```yaml
city:
  id: string
  name: string
  state: string
  country: string
  active_rankers_count: integer
  featured_lists: list[official_city_ranking_list_id]
  created_at: datetime
  updated_at: datetime
```

## Official City Ranking List

```yaml
official_city_ranking_list:
  id: string
  city_id: string
  title: string
  slug: string
  category: enum[best_spots, restaurant, cafe, bar, date_night, study_spot, hidden_gem, new_rising, cheap_eats]
  is_official: boolean
  accepts_user_contribution: boolean
  contribution_source: enum[official_personal_lists, pairwise_votes, hybrid]
  active_rankers_count: integer
  last_recalculated_at: datetime
  created_at: datetime
  updated_at: datetime
```

## Ranked Object

```yaml
ranked_object:
  id: string
  type: enum[restaurant, cafe, bar, place, perfume, album, product, mixed]
  title: string
  subtitle: string
  city_id: string|null
  neighborhood: string|null
  address: string|null
  tags: list[string]
  hero_media_url: string|null
  short_descriptor: string
  created_at: datetime
  updated_at: datetime
```

## User Ranking List

```yaml
user_ranking_list:
  id: string
  owner_id: string
  title: string
  city_id: string|null
  category: string
  list_type: enum[official_city_connected, custom_personal]
  counts_toward_city_ranking: boolean
  linked_city_ranking_list_id: string|null
  visibility: enum[public, friends, private]
  created_at: datetime
  updated_at: datetime
```

## User Ranking Entry

```yaml
user_ranking_entry:
  id: string
  list_id: string
  object_id: string
  rank: integer
  note: string|null
  created_at: datetime
  updated_at: datetime
```

## City Ranking Entry

```yaml
city_ranking_entry:
  id: string
  city_ranking_list_id: string
  object_id: string
  rank: integer
  previous_rank: integer|null
  citytaste_score: float
  raw_rank_points: float
  confidence_multiplier: float
  recency_multiplier: float
  local_rankers_count: integer
  movement: enum[up, down, same, new]
  movement_delta: integer|null
  tags_summary: list[string]
  updated_at: datetime
```

## User City Membership

```yaml
user_city_membership:
  id: string
  user_id: string
  city_id: string
  role: enum[viewer, participant, qualified_local, verified_local]
  is_home_city: boolean
  trust_weight: float
  created_at: datetime
  updated_at: datetime
```

## Pairwise Vote

```yaml
pairwise_vote:
  id: string
  user_id: string
  city_id: string
  official_city_ranking_list_id: string
  object_a_id: string
  object_b_id: string
  selected_object_id: string|null
  skipped: boolean
  context_prompt: string
  trust_weight_at_vote_time: float
  created_at: datetime
```

---

# 7. API Contracts

## Get City Rank Hub

```http
GET /api/rank-hub/city?city_id=city_pittsburgh
```

Returns:

- city metadata
- featured official lists
- top entries for each list
- community pulse

## Get City Ranking Detail

```http
GET /api/rank-hub/city-lists/:list_id
```

Returns:

- official city list metadata
- ranked entries
- CityTaste scores
- movement
- object details

## Get Personal Rank Hub

```http
GET /api/rank-hub/personal?city_id=city_pittsburgh
```

Returns:

- official ranking suggestions
- user official city-connected lists
- user custom personal lists

## Create Ranking List

```http
POST /api/user-ranking-lists
```

Must support both:

```text
official_city_connected
custom_personal
```

## Update Ranking Entries

```http
PUT /api/user-ranking-lists/:list_id/entries
```

When an official city-connected list is updated, trigger city ranking recalculation.

## Quick Vote

```http
GET /api/rank-hub/quick-vote?city_id=:city_id&list_id=:list_id&count=5
POST /api/rank-hub/quick-vote
```

---

# 8. Frontend Components

Build or update:

```text
RankHubPage
RankHubSegmentedControl
CitySelector
AddCityButton
CitySetupEmptyState
CityRankingCard
CityRankingListDetailPage
CityRankingEntryRow
QuickVoteModule
QuickVoteModal
CommunityPulseModule
PersonalRankHub
RankSomethingDropdown
RankSelectorSheet
OfficialRankingSuggestionCard
PersonalRankingListCard
CreateOfficialRankingFlow
CreateCustomRankingFlow
RankingObjectSearch
RankingReorderList
RankingSaveConfirmation
```

---

# 9. Acceptance Criteria

## City Tab

- [ ] User can open Rank Hub.
- [ ] User can switch between City and Personal.
- [ ] User can select or add a city.
- [ ] City tab shows official city ranking cards.
- [ ] MVP official cards include Best Spots, Best Restaurants, Best Cafés.
- [ ] Each card shows top entries and ranked-by count.
- [ ] User can open full official city list detail page.
- [ ] City list detail shows CityTaste Score.

## Personal Tab

- [ ] Personal tab shows Rank something dropdown.
- [ ] Dropdown opens slide-down selector.
- [ ] Selector separates official city rankings from custom personal lists.
- [ ] User can create official city-connected ranking.
- [ ] User can create custom personal ranking.
- [ ] Official list is labeled Counts toward city ranking.
- [ ] Custom list is labeled Personal only.

## Ranking Logic

- [ ] Official personal rankings contribute to city rankings.
- [ ] Custom personal rankings do not contribute.
- [ ] Updating an official list replaces previous contribution.
- [ ] One user cannot duplicate votes by editing repeatedly.
- [ ] City ranking recalculates after official contribution changes.
- [ ] Individual impact shrinks as contributor count grows.

## Quick Vote

- [ ] City tab has Help Rank module.
- [ ] User receives pairwise matchups.
- [ ] User can choose A, B, or skip.
- [ ] Quick votes are stored.
- [ ] Quick votes are lower weight than official personal rankings.

---

# 10. Implementation Order

1. Build data models.
2. Seed cities and official ranking lists.
3. Build RankHubPage with City/Personal tabs.
4. Build city selector and city setup state.
5. Build City tab featured ranking cards.
6. Build city ranking detail page.
7. Build Personal tab and Rank Something selector.
8. Build official city-connected ranking creation flow.
9. Build custom personal list creation flow.
10. Implement contribution aggregation and CityTaste Score.
11. Implement recalculation on official list update.
12. Build Quick Vote module.
13. Add empty/loading/error states.
14. Add analytics events.

---

# 11. Analytics Events

Track:

```yaml
events:
  - rank_hub_opened
  - rank_hub_city_selected
  - rank_hub_tab_switched
  - city_ranking_card_opened
  - city_ranking_detail_opened
  - official_ranking_started
  - official_ranking_saved
  - official_ranking_edited
  - custom_ranking_created
  - custom_ranking_saved
  - rank_selector_opened
  - quick_vote_started
  - quick_vote_matchup_answered
  - quick_vote_completed
  - city_ranking_recalculated
```

---

# 12. Original Product Notes

The section below preserves the original product design discussion and should be treated as additional implementation context.

---

Yes — your understanding is exactly right:

> **Community rankings should be generated by combining users’ personal rankings together.**

Not by letting people randomly upvote/downvote. The community list should be the result of many real users ranking their own favorite places, and Zoe turns those personal rankings into one official city ranking.

That solves the RedNote problem: instead of users searching “Pittsburgh food” and reading scattered posts, they can open Zoe and immediately see:

> **Pittsburgh’s Best Restaurants**
> Ranked by people who actually live, eat, and go out here.

This fits Zoe’s core idea well because Zoe is already defined as a product for discovering, saving, discussing, and ranking taste/lifestyle objects, combining RedNote-like utility with Beli-like ranking psychology. 

# Complete Ranking Page Design

## 1. Rename the tab: from “Rank Updates” to “Rank Hub”

The bottom tab can still use a short label like:

```text
Rank
```

But the page title should be:

```text
Rank Hub
```

This page should no longer be only a feed of ranking updates. It should become the central place for:

1. city-wide community rankings
2. user’s personal rankings
3. ranking participation
4. ranking updates
5. discovering what is best in a city

The original Rank Updates idea can still exist, but now it becomes a section inside the Rank Hub instead of the entire page. Zoe’s existing product spec already says rankings should be dynamic, visible, social, and emotionally rewarding, and that ranking updates should feel meaningful rather than background metadata. 

---

# 2. Top-level Ranking Page Structure

```text
Rank Hub

[ City ] [ Personal ]

City: Pittsburgh ▼        + Add City
```

There are only two main modes:

## **City**

The universal public ranking lists for a selected city.

## **Personal**

The user’s own ranking lists.

This is clean, easy, and much stronger than:

* Trending Lists
* New Tastemakers
* Category Gems

Those three are too abstract. The user does not wake up thinking, “I want category gems.” They think:

> “What is the best restaurant here?”
> “What café should I go to?”
> “What spots do locals actually like?”

---

# 3. City Tab Design

## 3.1 First-time City Setup

When the user opens Rank Hub for the first time:

```text
Rank Hub

Find the best places where you live.

Where do you live?

[ Use current location ]
[ Search city ]

Popular:
Pittsburgh
New York
Los Angeles
San Francisco
Chicago
```

After they pick a city:

```text
Your city is set to Pittsburgh.

You can always add more cities later.
[ Continue ]
```

The city should be used for:

* default city rankings
* local recommendations
* ranking contribution eligibility
* local tastemaker discovery
* city-specific notifications

---

## 3.2 Returning User City Header

```text
Rank Hub

[ City ] [ Personal ]

Pittsburgh ▼        + Add City

Ranked by 1,284 local Zoe users
Updated today
```

The city dropdown should let users switch between:

```text
My Cities
✓ Pittsburgh
  New York
  Los Angeles

+ Add another city
```

This is important because users may live in Pittsburgh but care about New York, LA, Taipei, or a city they plan to visit.

---

# 4. City Tab Main Sections

The City tab should show official city ranking lists first.

## 4.1 Featured City Ranking Lists

```text
Featured Rankings

[ Best Spots ]
[ Restaurants ]
[ Cafés ]

[ Bars ]
[ Date Night ]
[ Study Spots ]

[ Hidden Gems ]
[ New & Rising ]
[ Cheap Eats ]
```

For MVP, I would start with only the strongest three:

1. **Best Spots**
2. **Best Restaurants**
3. **Best Cafés**

Then add:

4. Best Bars
5. Best Date Night
6. Best Study Spots
7. Hidden Gems
8. New & Rising

The key is that these are **official city lists**, not user-created lists.

---

# 5. City Ranking List Card Design

Each city list should have a card like this:

```text
Pittsburgh’s Best Cafés

Ranked by 842 locals
Updated today

#1 Arriviste Coffee Bar
#2 Sumi Café
#3 Redhawk Coffee
#4 Commonplace Coffee
#5 De Fer Coffee

[ Open List ]
```

Another example:

```text
Pittsburgh’s Best Restaurants

Ranked by 1,106 locals
Updated today

#1 Pusadee’s Garden
#2 Apteka
#3 Fig & Ash
#4 Morcilla
#5 Kyo Omakase

[ Open List ]
```

The phrase “ranked by locals” is extremely important. It makes the list feel trustworthy and different from RedNote search results.

---

# 6. Opened City List Detail Page

When a user taps **Pittsburgh’s Best Cafés**, they see:

```text
Pittsburgh’s Best Cafés

Ranked by 842 local users
Updated today

[ All ] [ Friends ] [ Locals ] [ People Like You ]

#1 Arriviste Coffee Bar
CityTaste Score 94
Ranked by 421 locals
Strong in: coffee, design, pastries
[ Save ] [ Add to My Ranking ]

#2 Sumi Café
CityTaste Score 91
Ranked by 388 locals
Strong in: quiet, matcha, laptop-friendly
[ Save ] [ Add to My Ranking ]

#3 Redhawk Coffee
CityTaste Score 87
Ranked by 302 locals
Strong in: espresso, casual, reliable
[ Save ] [ Add to My Ranking ]
```

This list should not feel like Yelp. It should feel like a **living taste ranking**.

Good signals to show:

* rank number
* image
* name
* neighborhood
* tags
* CityTaste Score
* number of local rankers
* movement: up/down/new
* friend activity
* “add to my ranking” CTA

Example:

```text
#2 Sumi Café        ↑ moved up 3
Shadyside · Café

Ranked by 388 locals
12 people you follow saved this
Strong in: quiet, matcha, study
```

---

# 7. How Users Participate in City Rankings

Users should participate through their **Personal rankings**.

This is the core idea:

> **A user’s personal ranking contributes to the city ranking only when it matches an official city ranking category.**

For example:

| User Personal List                      | Counts Toward City Ranking? | Reason                         |
| --------------------------------------- | --------------------------: | ------------------------------ |
| My Best Pittsburgh Restaurants          |                         Yes | Matches official city category |
| My Best Pittsburgh Cafés                |                         Yes | Matches official city category |
| My Best Spots in Pittsburgh             |                         Yes | Matches official city category |
| My Favorite Places to Cry in Pittsburgh |                          No | Custom personal list           |
| Places I Took My Ex                     |                          No | Custom personal list           |
| Best Asian Food Near Campus             |                 Maybe later | Not an official MVP category   |
| My Coffee Rotation                      |  No, unless mapped to cafés | Personal/custom                |

This lets people be creative without polluting the official city list.

---

# 8. Personal Tab Design

The Personal tab should be where users manage their own rankings.

```text
Rank Hub

[ City ] [ Personal ]

Your Rankings

Rank something ▼

Suggested from Pittsburgh:
[ Best Spots ]
[ Best Restaurants ]
[ Best Cafés ]

Your Lists:
- My Best Pittsburgh Cafés
- My Best Pittsburgh Restaurants
- Everyday Perfumes
- All-Time Albums

[ Create Custom List ]
```

The key interaction you described is the dropdown/slide-down window.

---

# 9. Personal Tab Slide-Down Ranking Selector

When the user taps:

```text
Rank something ▼
```

A slide-down sheet opens:

```text
What do you want to rank?

Official Pittsburgh Rankings
These help shape the city rankings.

[ Best Spots ]
Not started

[ Best Restaurants ]
3 places ranked

[ Best Cafés ]
Not started

[ Best Bars ]
Coming soon

Personal Lists
These are for your profile only.

[ Everyday Perfumes ]
[ All-Time Albums ]

[ + Create Custom Ranking List ]
```

This is very important because the app should clearly separate:

## Official city-connected lists

These count toward city rankings.

## Custom personal lists

These do **not** count toward city rankings.

---

# 10. List Creation Rules

## 10.1 Official City List Creation

If a user taps **Best Cafés** and has not created it yet:

```text
Create Your Best Cafés List

This list helps shape Pittsburgh’s community ranking.

Your rankings will count toward:
Pittsburgh’s Best Cafés

[ Start Ranking ]
```

After they start:

```text
Add cafés you know

Search cafés:
[ Search Pittsburgh cafés ]

Suggested:
[ Arriviste Coffee Bar ] [ Add ]
[ Sumi Café ] [ Add ]
[ Redhawk Coffee ] [ Add ]
[ Commonplace Coffee ] [ Add ]
```

Then they drag/order:

```text
Your Best Pittsburgh Cafés

#1 Arriviste Coffee Bar
#2 Sumi Café
#3 Redhawk Coffee
#4 Commonplace Coffee

[ Save Ranking ]
```

After saving:

```text
Your ranking helped update Pittsburgh’s Best Cafés.

Your impact will become stronger as you rank more places you know.
[ View City Ranking ]
```

---

## 10.2 Custom Personal List Creation

If user taps:

```text
+ Create Custom Ranking List
```

They see:

```text
Create Custom Ranking

List name:
[ Best Places for a First Date ]

Category:
[ Restaurants / Cafés / Bars / Mixed ]

City:
[ Pittsburgh ]

Visibility:
[ Public ] [ Friends ] [ Private ]

Note:
Custom lists appear on your profile but do not directly affect official city rankings.

[ Create List ]
```

This gives users freedom but protects the city rankings.

---

# 11. Personal List Card Design

For official city-connected list:

```text
My Best Pittsburgh Cafés

Counts toward:
Pittsburgh’s Best Cafés

#1 Arriviste
#2 Sumi Café
#3 Redhawk

City impact:
You contributed to 3 ranking positions.

[ Edit Ranking ]
```

For custom personal list:

```text
Best Places for a First Date

Custom personal list
Does not affect city rankings

#1 Afterglow
#2 Kyo Omakase
#3 Pusadee’s Garden

[ Edit List ]
```

The label should be very clear:

```text
Counts toward city ranking
```

or

```text
Personal only
```

---

# 12. The Ranking Contribution Model

The community ranking should come from official personal lists.

## Basic idea

Each user creates:

```text
My Best Pittsburgh Cafés
```

Zoe combines thousands of those into:

```text
Pittsburgh’s Best Cafés
```

So yes, the city list is basically:

```text
All official personal rankings
+ trust weighting
+ confidence adjustment
+ anti-spam protection
= community city ranking
```

---

# 13. Simple Example

Suppose five users rank cafés:

```text
User A:
#1 Arriviste
#2 Sumi
#3 Redhawk

User B:
#1 Sumi
#2 Arriviste
#3 Commonplace

User C:
#1 Arriviste
#2 Commonplace
#3 Sumi

User D:
#1 Redhawk
#2 Sumi
#3 Arriviste

User E:
#1 Sumi
#2 Arriviste
#3 Redhawk
```

Zoe converts each user’s ranking into points:

```text
#1 = 10 points
#2 = 7 points
#3 = 5 points
#4 = 3 points
#5 = 1 point
```

Then combines all users’ points.

The city list might become:

```text
Pittsburgh’s Best Cafés

#1 Sumi Café
#2 Arriviste Coffee Bar
#3 Redhawk Coffee
#4 Commonplace Coffee
```

But as more users join, each single user has less effect.

That means:

* early lists move faster
* mature city lists become stable
* one person cannot dominate
* the ranking still feels alive

---

# 14. The “One User Influence Budget” Rule

This is the rule I recommend most strongly.

Each user gets one normalized influence budget per official list.

Example:

```text
Elton has 100 influence points for Pittsburgh’s Best Cafés.
```

If he ranks five cafés:

```text
#1 gets 35 points
#2 gets 25 points
#3 gets 18 points
#4 gets 13 points
#5 gets 9 points
Total = 100
```

If he changes his ranking later, Zoe updates his contribution. It does not duplicate his old vote.

This prevents spam and makes ranking feel fair.

---

# 15. How One Person’s Impact Gets Smaller Over Time

The formula should work like this:

```text
One user’s impact = user influence weight / total city influence weight
```

So if only 20 users ranked cafés, one person matters.

If 2,000 users ranked cafés, one person only nudges the list.

Example:

| Number of city rankers | One normal user impact |
| ---------------------: | ---------------------: |
|               10 users |                   High |
|              100 users |                 Medium |
|            1,000 users |                  Small |
|           10,000 users |             Very small |

This matches your idea perfectly:

> The more people participate, the less a person can impact the list.

---

# 16. Recommended CityTaste Score

Each place should have a score powering the community list.

```text
CityTaste Score =
personal ranking points
+ pairwise comparison signal
+ local trust weight
+ confidence adjustment
+ recency/momentum adjustment
```

But users do not need to see the math.

They should see:

```text
CityTaste Score 94
Ranked by 842 locals
Moved up 3 spots this week
```

---

# 17. Voting Without Letting People Vote Randomly

You still want people to “vote,” but not in a cheap way.

So the voting system should have three levels.

## Level 1: Ranking vote

This is strongest.

```text
User adds Sumi Café as #2 in My Best Pittsburgh Cafés.
```

Impact: high.

## Level 2: Pairwise quick vote

This is medium.

```text
Which café would you recommend more?

[ Sumi Café ] vs [ Arriviste ]
```

Impact: medium.

## Level 3: Engagement vote

This is weak.

```text
Save
Share
Comment
I've been here
```

Impact: weak to medium.

The city ranking should not be based mostly on likes. Likes are too cheap. Ranking is more meaningful because it requires the user to compare.

---

# 18. Quick Vote Module in City Tab

Inside the City tab, add a participation module:

```text
Help Rank Pittsburgh

Answer 5 quick matchups.
Your picks help improve the city rankings.

[ Start Quick Vote ]
```

Then:

```text
Which is better for a quiet work session?

[ Sumi Café ]
Shadyside · quiet · matcha

vs

[ Arriviste Coffee Bar ]
Shadyside · pastry · espresso

[ Sumi ] [ Arriviste ] [ Skip ]
```

After 5 votes:

```text
Thanks — you helped improve Pittsburgh’s café rankings.

Your impact:
Best Cafés +5
Study Spots +2

[ View Updated List ]
```

This gives casual users a way to participate even if they do not want to build a full list.

---

# 19. Full Ranking Page Wireframe

## 19.1 City Tab

```text
+----------------------------------+
| Rank Hub                         |
| [ City ] [ Personal ]            |
|----------------------------------|
| Pittsburgh ▼              + City |
| Ranked by 1,284 local users      |
| Updated today                    |
|----------------------------------|
| Featured Rankings                |
|                                  |
| [ Best Spots ]                   |
| #1 Pusadee’s Garden              |
| #2 Arriviste Coffee Bar          |
| #3 Afterglow                     |
| Ranked by 1,284 locals           |
| [ Open ]                         |
|                                  |
| [ Best Restaurants ]             |
| #1 Pusadee’s Garden              |
| #2 Apteka                        |
| #3 Fig & Ash                     |
| Ranked by 1,106 locals           |
| [ Open ]                         |
|                                  |
| [ Best Cafés ]                   |
| #1 Arriviste Coffee Bar          |
| #2 Sumi Café                     |
| #3 Redhawk Coffee                |
| Ranked by 842 locals             |
| [ Open ]                         |
|----------------------------------|
| Help Rank Pittsburgh             |
| Answer 5 quick matchups          |
| [ Start Quick Vote ]             |
|----------------------------------|
| Community Pulse                  |
| Sumi Café moved up 3 spots       |
| 42 locals ranked cafés this week |
+----------------------------------+
```

---

## 19.2 Personal Tab

```text
+----------------------------------+
| Rank Hub                         |
| [ City ] [ Personal ]            |
|----------------------------------|
| Your Rankings                    |
| Rank something ▼                 |
|----------------------------------|
| Official Pittsburgh Rankings     |
| These help shape city rankings   |
|                                  |
| Best Spots                       |
| Not started                      |
| [ Start ]                        |
|                                  |
| Best Restaurants                 |
| 4 places ranked                  |
| [ Continue ]                     |
|                                  |
| Best Cafés                       |
| Not started                      |
| [ Start ]                        |
|----------------------------------|
| Your Personal Lists              |
|                                  |
| Everyday Perfumes                |
| Personal only                    |
|                                  |
| All-Time Albums                  |
| Personal only                    |
|                                  |
| [ + Create Custom List ]         |
+----------------------------------+
```

---

## 19.3 Slide-Down Selector

```text
+----------------------------------+
| What do you want to rank?        |
|----------------------------------|
| Official Pittsburgh Rankings     |
| These count toward city rankings |
|                                  |
| [ Best Spots ]                   |
| [ Best Restaurants ]             |
| [ Best Cafés ]                   |
|                                  |
| More official rankings           |
| [ Bars ] [ Date Night ]          |
| [ Study Spots ] [ Hidden Gems ]  |
|----------------------------------|
| Personal Lists                   |
| These appear on your profile     |
| but do not affect city rankings  |
|                                  |
| [ Everyday Perfumes ]            |
| [ All-Time Albums ]              |
|                                  |
| [ + Create Custom List ]         |
+----------------------------------+
```

---

# 20. Official vs Custom List Logic

## Official List

```yaml
list_type: official_city_connected
city: Pittsburgh
category: cafe
counts_toward_city_ranking: true
source_city_list: Pittsburgh Best Cafés
```

## Custom List

```yaml
list_type: custom_personal
city: Pittsburgh
category: mixed
counts_toward_city_ranking: false
source_city_list: null
```

This should be very clear in engineering and design.

---

# 21. Data Model

## City

```yaml
city:
  id: city_pittsburgh
  name: Pittsburgh
  state: Pennsylvania
  country: United States
  active_rankers_count: 1284
  featured_lists:
    - best_spots
    - best_restaurants
    - best_cafes
```

## Official City Ranking List

```yaml
official_city_ranking_list:
  id: pittsburgh_best_cafes
  city_id: city_pittsburgh
  title: Pittsburgh’s Best Cafés
  category: cafe
  is_official: true
  accepts_user_contribution: true
  contribution_source: official_personal_lists
  ranked_objects:
    - object_id: arriviste
      rank: 1
      citytaste_score: 94
    - object_id: sumi_cafe
      rank: 2
      citytaste_score: 91
```

## User Personal Official List

```yaml
user_ranking_list:
  id: user123_best_pittsburgh_cafes
  owner_id: user123
  title: My Best Pittsburgh Cafés
  city_id: city_pittsburgh
  category: cafe
  list_type: official_city_connected
  counts_toward_city_ranking: true
  linked_city_ranking_list_id: pittsburgh_best_cafes
  entries:
    - rank: 1
      object_id: arriviste
    - rank: 2
      object_id: sumi_cafe
    - rank: 3
      object_id: redhawk
```

## User Custom Personal List

```yaml
user_ranking_list:
  id: user123_first_date_spots
  owner_id: user123
  title: Best Places for a First Date
  city_id: city_pittsburgh
  category: mixed
  list_type: custom_personal
  counts_toward_city_ranking: false
  linked_city_ranking_list_id: null
```

---

# 22. User Flow: New User Ranks from City Tab

```text
1. User opens Rank Hub
2. User selects City
3. User chooses Pittsburgh
4. User sees Featured Rankings
5. User taps Pittsburgh’s Best Cafés
6. User sees community list
7. User taps “Add to My Ranking”
8. Zoe asks user to create My Best Pittsburgh Cafés
9. User adds cafés they know
10. User orders them
11. User saves ranking
12. Zoe adds their contribution to the community ranking
13. User sees “You helped shape Pittsburgh’s Best Cafés”
```

---

# 23. User Flow: New User Ranks from Personal Tab

```text
1. User opens Rank Hub
2. User taps Personal
3. User taps Rank something
4. Slide-down selector opens
5. User chooses Best Restaurants
6. Zoe explains that this list counts toward Pittsburgh’s Best Restaurants
7. User starts ranking
8. User adds restaurants
9. User saves list
10. List appears under Personal
11. Contribution appears in City ranking system
```

---

# 24. User Flow: Custom Personal List

```text
1. User opens Personal tab
2. User taps Create Custom List
3. User names it “Places I’d Take My Friends”
4. User adds places
5. User ranks them
6. Zoe labels it Personal Only
7. List appears on user profile
8. It does not affect city rankings
```

This is the cleanest way to let users express themselves without damaging the trust of the official city rankings.

---

# 25. Ranking Page Empty States

## No city selected

```text
Find the best places where you live.

Set your city to see official community rankings.

[ Set My City ]
```

## City has low data

```text
Pittsburgh rankings are just getting started.

Be one of the first people to shape:
- Best Spots
- Best Restaurants
- Best Cafés

[ Start Ranking ]
```

## Personal tab empty

```text
Your taste starts here.

Create your first ranking and help shape your city.

[ Rank Best Cafés ]
[ Rank Best Restaurants ]
[ Create Custom List ]
```

---

# 26. Why This Beats RedNote

RedNote behavior:

```text
User searches: Pittsburgh food
User reads many scattered posts
User compares manually
User saves a few notes
User still has to decide
```

Zoe behavior:

```text
User opens Rank Hub
User selects Pittsburgh
User taps Best Restaurants
User sees the community-ranked answer immediately
User saves, shares, or adds places to personal ranking
```

That is much cleaner.

The strategic difference is:

> **RedNote is search-first. Zoe Rank Hub should be answer-first.**

Search still matters, but the ranking list becomes the default answer.

---

# 27. Final Recommended Ranking Page Concept

```text
Rank Hub = City Rankings + Personal Rankings
```

## City

The place users go to answer:

```text
What is actually best in this city?
```

## Personal

The place users go to answer:

```text
What do I personally rank highest?
```

## Community Ranking

Generated from:

```text
official user personal rankings
+ quick pairwise votes
+ local trust
+ confidence adjustment
+ anti-spam rules
```

## Custom Lists

Allowed, fun, expressive, and profile-worthy — but not counted toward official city rankings.

---

# 28. Final Product Statement

**Rank Hub turns scattered local discovery into one trusted city ranking.**

Instead of forcing users to search through endless RedNote posts, Zoe gives them the answer directly:

```text
Best Spots.
Best Restaurants.
Best Cafés.
Ranked by the people who actually live the city.
```

Then every user can participate by building their own personal rankings. Their personal taste contributes to the city, but only through structured official lists, so the rankings stay trustworthy, stable, and meaningful.
