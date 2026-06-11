# Cozy Cup Tycoon — Changelog

---

## v1.0 — Initial Release

**Released:** June 2026

### Features
- Serve Customer click button with combo multipliers, tips, and VIP bonuses
- 6 ranks: Small Cart → Corner Café → Busy Coffee Shop → Local Chain → National Franchise → Coffee Empire
- 13 upgrades (unlocked by rank, max level 50, scaling prices)
- 6 staff types (Barista → Head Barista → Manager → Roaster → Marketing Team → CEO Assistant)
- 6 menu items (unlock per rank, upgradeable)
- 15 achievements with dollar rewards
- 4 random café events (Morning Rush, Rainy Evening, Late-Night Study Crowd, Weekend Rush)
- 7 customer types with weighted random selection and flavor descriptions
- Business Journal feed
- Customer card feed (capped at 8)
- Stats tab (10 stats with progress bars)
- localStorage auto-save (every 30 seconds) + manual save
- Offline earnings (capped at 24 hours)
- Reset gate (requires typing RESET)
- Brand Legacy prestige stub (locked, coming v2.0)
- Feedback/Bugs section in Settings

### Known Limitations / v1.1 Candidates
- Game balance not playtested across full progression — numbers may need tuning
- No visual difference between ranks (same background throughout)
- No decimal precision in $ income display for very small passive rates
- Combo display uses hidden/visible — could use animation instead
- No sound (by design for v1.0)
- Prestige system not built yet

---

## v1.1 — Counter View + Store Purchase System

**Released:** June 2026

### New Features

**Counter / Register View**
- Panel above the Serve button shows the location you're standing at (scene emoji, place name, street)
- When you click Serve, the customer walks up with their emoji, type, flavor description, and earnings
- Customer lingers for 3 seconds then view resets to idle location atmosphere
- Location bar updates whenever you open a new store
- Income multiplier badge appears on the counter once you've opened your first store

**Store Purchase System**
- Ranks are no longer automatic — each one is a purchasable location
- Banner appears below the Next Goal card once you've earned enough lifetime revenue
- Buying a store costs the rank threshold from your current balance
- Upgrades, staff, and menu reset at the new location — balance and lifetime revenue carry over
- Each store opened stacks a permanent x1.5 income multiplier on all DPC and DPS
- Old saves with rank > 0 and no multiplier get the multiplier applied retroactively on load

**Location Backgrounds (6 scenes)**
- Small Cart, Corner Cafe, Busy Coffee Shop, Local Chain, National Franchise, Coffee Empire
- Each rank has its own CSS scene class and atmosphere description

### Technical Changes
- LOCATIONS constant added (6 entries, indexed by rank)
- prestigeMultiplier and storesOpened added to state
- checkRankEligibility() replaces auto-advance checkRankUp()
- buyNextStore() handles deduct, reset, prestige stack, popup
- showCounterCustomer(), setCounterIdle(), updateCounterLocation() added
- Customer type picked once in handleClick(), passed to both counter and feed
- Backward save compatibility: old saves retroactively granted multiplier

---

## v1.2 — Visual Café Scene + Idle Economy

**Released:** June 2026

### New Features

**Visual Café Scene**
- Full coffee shop floor replaces the counter-view panel in the Café tab
- Scene includes: door (entrance/exit), chalkboard menu, counter/register area with barista, and 4 round tables with ambient coffee cup icons
- Warm dark atmosphere with counter glow and floor depth strip
- Responsive: scales to mobile layout

**Customer Movement System**
- Customers spawn at the door and move through four stages: entering → ordering (bouncing animation at counter) → sitting at a table → leaving through the door
- Each customer shows their type emoji and a short label
- 70% chance to sit at a table before leaving; 30% leave right after ordering
- Oldest sitting/leaving customers are evicted safely when cap is reached (max 7 visible at once)
- DOM cleanup on every removal — no memory leaks

**Passive Customer Flow**
- When DPS > 0, customers automatically walk through the scene at intervals (2–10 seconds based on income rate)
- Higher DPS = more frequent passive foot traffic
- Passive customers do not fire when DPS = 0

**Recommended Buy Indicator**
- "Recommended" card appears in the Café tab showing the cheapest affordable upgrade, staff hire, or menu item
- If nothing is currently affordable, shows the next cheapest item and how much more you need
- Updates every game tick

**Idle Economy Tuning**
- Clicking still triggers customer animations and earns income early-game
- Passive income (staff + upgrades + menu) is now visually reinforced by the active scene
- Best Buy card guides players toward the next productive purchase at every stage

### Technical Changes
- Counter-view kept in DOM (hidden) so v1.1 JS runs silently without breaking save/rank logic
- `spawnSceneCustomer()`, `scMoveToCounter()`, `scAfterOrder()`, `scLeave()`, `removeSceneCust()` added
- `schedulePassiveSceneCustomer()` — self-rescheduling timer, starts at init, adapts to DPS
- `updateSceneLocation()` — updates barista count and multiplier badge when store opens
- `updateBestBuy()` — called every display tick, no side effects on state
- `updateSceneLocation()` + `updateBestBuy()` called from `updateDisplay()`, `init()`, `buyNextStore()`
- All new scene vars prefixed `sc` / `scene` to avoid collisions

### Known Limitations
- Customer positions are fixed in % coordinates — at very narrow widths (<340px) customers may overlap furniture
- No sound (by design)
- Barista icon only updates on store open, not on every staff hire
- Tables are always visible even when no menu/café exists (v1.0 cart still has tables)

---

## v2.0 — Future

- Brand Legacy prestige system
- Import/export saves
- Deeper flavor events
- More menu items (seasonal specials)
- More customer personalities
- Café décor upgrades per rank

---

## Update Workflow

1. Play and note what feels broken or off.
2. Report feedback in the Settings tab or in chat.
3. Review `script.js` and `style.css` for the relevant section.
4. Propose the fix before editing.
5. Apply fix, version it (v1.1, v1.2, etc.), and log it here.
6. Never wipe localStorage unless the user explicitly approves.
7. Updates should preserve existing save data when possible.
