// ============================================================
// COZY CUP TYCOON v1.1
// script.js
// ============================================================
// BALANCE NOTES (adjust for tuning):
//   - RANKS[n].cost           = lifetime revenue to unlock store purchase
//   - STORE_PRESTIGE_MULT     = income multiplier applied per store opened (default 1.5)
//   - UPGRADE_DEFS[n].basePrice / .scale / .value
//   - STAFF_DEFS[n].baseCost / .costScale / .dps
//   - MENU_DEFS[n].upgradePrice / .upgradeScale
//   - EVENT_DEFS[n].duration (seconds)
//   - scheduleNextEvent() delay range
// ============================================================

var DEBUG_MODE = false; // set true to log DPS/DPC each tick

var STORE_PRESTIGE_MULT = 1.5; // multiplier stacked per store opened

// ============================================================
// LOCATION DATA (indexed by rank)
// ============================================================

var LOCATIONS = [
  { scene: '🛒', place: 'Small Cart',         spot: 'Oak & Main St',       atm: 'A folding table, a hot plate, and a dream.',           bgClass: 'scene-cart'      },
  { scene: '🏠', place: 'Corner Cafe',         spot: '5th & Brew Ave',      atm: 'Twelve seats. One espresso machine. Full heart.',       bgClass: 'scene-corner'    },
  { scene: '🏪', place: 'Busy Coffee Shop',    spot: 'Downtown',            atm: 'The line goes out the door most mornings.',            bgClass: 'scene-shop'      },
  { scene: '🏬', place: 'Local Chain',          spot: 'Multiple Locations',  atm: 'People know the name before they walk in.',           bgClass: 'scene-chain'     },
  { scene: '🏭', place: 'National Franchise',  spot: 'Nationwide',          atm: 'The same great cup, coast to coast.',                  bgClass: 'scene-franchise' },
  { scene: '🏢', place: 'Coffee Empire',        spot: 'Global HQ',           atm: 'The board meets in ten minutes. You skip it.',         bgClass: 'scene-empire'    },
];

// ============================================================
// DATA DEFINITIONS
// ============================================================

var RANKS = [
  { name: 'Small Cart',         cost: 0,          menuUnlock: 'blackCoffee',  msg: "You've got a cart, a dream, and enough coffee to start." },
  { name: 'Corner Cafe',        cost: 2500,        menuUnlock: 'espresso',     msg: "You found a corner worth calling your own." },
  { name: 'Busy Coffee Shop',   cost: 25000,       menuUnlock: 'latte',        msg: "Word is spreading. The tables are always full." },
  { name: 'Local Chain',        cost: 250000,      menuUnlock: 'coldBrew',     msg: "You're a fixture in this town. People drive for this." },
  { name: 'National Franchise', cost: 2500000,     menuUnlock: 'pastries',     msg: "Coast to coast, cup by cup." },
  { name: 'Coffee Empire',      cost: 25000000,    menuUnlock: 'premiumRoast', msg: "The dream became a dynasty. The dynasty is yours." },
];

var UPGRADE_DEFS = [
  // BALANCE: value = flat bonus per level
  { id: 'tipJar',          name: 'Tip Jar',                 emoji: '🪙', desc: 'Customers tip more generously.',                           basePrice: 25,      scale: 1.5, maxLevel: 50, unlockRank: 0, effect: 'tipChance', value: 0.03 },
  { id: 'betterBeans',     name: 'Better Beans',            emoji: '☕', desc: 'Higher quality beans mean more per click.',                 basePrice: 50,      scale: 1.5, maxLevel: 50, unlockRank: 0, effect: 'dpc',       value: 0.5  },
  { id: 'espressoMachine', name: 'Faster Espresso Machine', emoji: '⚡', desc: 'Serve faster. Earn more per click.',                        basePrice: 200,     scale: 1.6, maxLevel: 50, unlockRank: 1, effect: 'dpc',       value: 1    },
  { id: 'pastryDisplay',   name: 'Pastry Display',          emoji: '🥐', desc: "Pastries earn idle income even when you're not clicking.",  basePrice: 300,     scale: 1.6, maxLevel: 50, unlockRank: 1, effect: 'dps',       value: 0.5  },
  { id: 'cozySeatng',      name: 'Cozy Seating',            emoji: '🪑', desc: 'Customers stay longer and spend more per click.',           basePrice: 600,     scale: 1.7, maxLevel: 50, unlockRank: 1, effect: 'dpc',       value: 1.5  },
  { id: 'loyaltyCards',    name: 'Loyalty Card Program',    emoji: '🎟', desc: 'Regulars return more often. Idle income boost.',            basePrice: 1000,    scale: 1.7, maxLevel: 50, unlockRank: 2, effect: 'dps',       value: 1    },
  { id: 'premiumMilk',     name: 'Premium Milk',            emoji: '🥛', desc: 'Oat, almond, macadamia. Customers pay more per click.',     basePrice: 1500,    scale: 1.7, maxLevel: 50, unlockRank: 2, effect: 'dpc',       value: 2    },
  { id: 'musicSystem',     name: 'Lo-Fi Music System',      emoji: '🎵', desc: 'Ambient vibes keep customers ordering longer.',             basePrice: 3000,    scale: 1.8, maxLevel: 50, unlockRank: 2, effect: 'dps',       value: 2    },
  { id: 'brandedCups',     name: 'Branded Cups',            emoji: '🏷', desc: 'Free marketing with every order. More per click.',          basePrice: 7000,    scale: 1.8, maxLevel: 50, unlockRank: 3, effect: 'dpc',       value: 5    },
  { id: 'drivethru',       name: 'Drive-Thru Window',       emoji: '🚗', desc: 'More customers without more space. Idle income.',           basePrice: 15000,   scale: 2.0, maxLevel: 50, unlockRank: 3, effect: 'dps',       value: 8    },
  { id: 'mobileApp',       name: 'Mobile App',              emoji: '📱', desc: 'Orders roll in while you sleep.',                           basePrice: 60000,   scale: 2.0, maxLevel: 50, unlockRank: 4, effect: 'dps',       value: 20   },
  { id: 'secondLocation',  name: 'Second Location',         emoji: '🏪', desc: 'Double the cafes, double the cups.',                       basePrice: 250000,  scale: 2.2, maxLevel: 50, unlockRank: 4, effect: 'dps',       value: 50   },
  { id: 'franchiseHQ',     name: 'Franchise HQ',            emoji: '🏢', desc: 'A nerve center for the empire.',                           basePrice: 1000000, scale: 2.0, maxLevel: 50, unlockRank: 5, effect: 'dps',       value: 150  },
];

var STAFF_DEFS = [
  // BALANCE: dps = income per second per hire
  { id: 'barista',      name: 'Barista',          emoji: '👩‍🍳', desc: "Your first hire. Makes coffee so you don't have to.",   baseCost: 50,     costScale: 1.15, dps: 0.5,  unlockRank: 0 },
  { id: 'headBarista',  name: 'Head Barista',     emoji: '👨‍🍳', desc: 'Trains the team and handles the rush.',                 baseCost: 600,    costScale: 1.15, dps: 3,    unlockRank: 1 },
  { id: 'manager',      name: 'Manager',          emoji: '💼',  desc: "Keeps things running when you're away.",                baseCost: 6000,   costScale: 1.15, dps: 15,   unlockRank: 2 },
  { id: 'roaster',      name: 'In-House Roaster', emoji: '🔥',  desc: 'Roasts beans fresh every morning. Customers notice.',   baseCost: 30000,  costScale: 1.15, dps: 50,   unlockRank: 3 },
  { id: 'mktTeam',      name: 'Marketing Team',   emoji: '📢',  desc: 'Gets the word out. Revenue climbs.',                    baseCost: 150000, costScale: 1.15, dps: 150,  unlockRank: 4 },
  { id: 'ceoAssistant', name: 'CEO Assistant',    emoji: '⭐',  desc: 'Handles the empire so you can dream bigger.',           baseCost: 750000, costScale: 1.15, dps: 500,  unlockRank: 5 },
];

var MENU_DEFS = [
  // BALANCE: price = one-time unlock cost; dpcBonus/dpsBonus are flat permanent bonuses
  { id: 'blackCoffee',  name: 'Black Coffee',  emoji: '☕', unlockRank: 0, dpcBonus: 0.2, dpsBonus: 0,   desc: 'Simple. Perfect. Essential.',                      price: 0       },
  { id: 'espresso',     name: 'Espresso',      emoji: '☕', unlockRank: 1, dpcBonus: 0.4, dpsBonus: 0,   desc: 'Small cup, big energy.',                           price: 500     },
  { id: 'latte',        name: 'Latte',         emoji: '🥛', unlockRank: 2, dpcBonus: 0.8, dpsBonus: 0.5, desc: 'Milk art and good vibes.',                          price: 3000    },
  { id: 'coldBrew',     name: 'Cold Brew',     emoji: '🧊', unlockRank: 3, dpcBonus: 1.5, dpsBonus: 1,   desc: 'Steeped 12 hours. Worth every second.',            price: 20000   },
  { id: 'pastries',     name: 'Pastries',      emoji: '🥐', unlockRank: 4, dpcBonus: 3,   dpsBonus: 2,   desc: 'Pairs perfectly with everything on the menu.',      price: 150000  },
  { id: 'premiumRoast', name: 'Premium Roast', emoji: '✨', unlockRank: 5, dpcBonus: 6,   dpsBonus: 5,   desc: 'Reserve single-origin. For the seriously serious.',  price: 500000  },
];

var ACHIEVEMENT_DEFS = [
  { id: 'firstCustomer',  name: 'First Customer',           emoji: '☕', desc: 'Serve your very first customer.',           reward: 5,     check: function(s) { return s.totalCustomers >= 1; } },
  { id: 'first100',       name: 'First $100',               emoji: '💰', desc: 'Reach $100 in lifetime revenue.',           reward: 25,    check: function(s) { return s.lifetimeRevenue >= 100; } },
  { id: 'first1000',      name: 'First $1,000',             emoji: '💰', desc: 'Hit $1,000 in lifetime revenue.',           reward: 100,   check: function(s) { return s.lifetimeRevenue >= 1000; } },
  { id: 'firstBarista',   name: 'First Hire',               emoji: '👩‍🍳', desc: 'Hire your first staff member.',          reward: 50,    check: function(s) { return (s.staff['barista'] || 0) >= 1; } },
  { id: 'tipMagnet',      name: 'Tip Magnet',               emoji: '🪙', desc: 'Earn $100 in total tips.',                 reward: 75,    check: function(s) { return s.totalTips >= 100; } },
  { id: 'busyMorning',    name: 'Busy Morning',             emoji: '🌅', desc: 'Serve 100 customers.',                     reward: 50,    check: function(s) { return s.totalCustomers >= 100; } },
  { id: 'cornerCafe',     name: 'Corner Cafe Opened',       emoji: '🏠', desc: 'Open your Corner Cafe.',                   reward: 150,   check: function(s) { return s.rank >= 1; } },
  { id: 'busyCoffeeShop', name: 'Busy Coffee Shop',         emoji: '🏪', desc: 'Open your Busy Coffee Shop.',              reward: 750,   check: function(s) { return s.rank >= 2; } },
  { id: 'localChain',     name: 'Local Chain',              emoji: '🏬', desc: 'Expand to a Local Chain.',                 reward: 5000,  check: function(s) { return s.rank >= 3; } },
  { id: '1kCustomers',    name: '1,000 Customers Served',   emoji: '👥', desc: 'Serve 1,000 total customers.',             reward: 300,   check: function(s) { return s.totalCustomers >= 1000; } },
  { id: '10kCustomers',   name: 'Coffee Regular',           emoji: '🌟', desc: 'Serve 10,000 customers.',                  reward: 1500,  check: function(s) { return s.totalCustomers >= 10000; } },
  { id: 'highCombo',      name: 'Barista Hands',            emoji: '⚡', desc: 'Hit a 20x click combo.',                   reward: 200,   check: function(s) { return s.highestCombo >= 20; } },
  { id: 'coffeeEmpire',   name: 'Coffee Empire Dream',      emoji: '👑', desc: 'Open the Coffee Empire.',                  reward: 15000, check: function(s) { return s.rank >= 5; } },
  { id: 'millionaire',    name: 'Coffee Millionaire',       emoji: '💎', desc: 'Earn $1,000,000 in lifetime revenue.',     reward: 8000,  check: function(s) { return s.lifetimeRevenue >= 1000000; } },
  { id: 'passive100',     name: 'The Machine Never Sleeps', emoji: '⚙', desc: 'Reach $100/sec passive income.',           reward: 800,   check: function(s) { return s.dollarsPerSecond >= 100; } },
];

var CUSTOMER_TYPES = [
  { type: 'Regular Customer',   emoji: '🧑', weight: 40, descs: [
    'Asked for the usual. There is no usual yet.',
    'Smiled, ordered, left a modest tip.',
    'Third time this week. You recognize the order.',
    'Just needed coffee and quiet.',
  ]},
  { type: 'Student',            emoji: '📚', weight: 20, descs: [
    'Paid in quarters but left good vibes.',
    'Camped at the corner table for four hours.',
    'Ordered one drip coffee and refilled it twice.',
    'Typed furiously on a laptop the whole time.',
  ]},
  { type: 'Remote Worker',      emoji: '💻', weight: 15, descs: [
    'Ordered one coffee and stayed six hours.',
    'Asked for the WiFi password three times.',
    'Joined a Zoom call without headphones.',
    'Requested a quiet corner. Immediately joined a call.',
  ]},
  { type: 'Business Executive', emoji: '💼', weight: 10, descs: [
    'Asked if the coffee could be expensed.',
    'Double espresso. No small talk.',
    'Took a call the entire time. Tipped well anyway.',
    'In and out in three minutes. Left a generous tip.',
  ]},
  { type: 'Influencer',         emoji: '📸', weight: 8, descs: [
    'Took 14 photos before sipping.',
    'Reordered after the first cup was not aesthetic enough.',
    'Mentioned the cafe to their 200k followers.',
    'The latte art has been posted. Three times.',
  ]},
  { type: 'VIP',                emoji: '⭐', weight: 4, descs: [
    'Left a tip bigger than the order.',
    "Knows the owner's name. The owner is you.",
    'Ordered the most expensive thing twice.',
    'Complimented everything. Enormous tip. Left smiling.',
  ]},
  { type: 'Coffee Critic',      emoji: '🧐', weight: 3, descs: [
    'Judged the crema with unnecessary intensity.',
    'Asked about the bean origin. In significant detail.',
    'Took notes. Unclear if that is good.',
    'Gave a 4.7 out of 5. Refused to explain the deduction.',
  ]},
];

var EVENT_DEFS = [
  // BALANCE: duration in seconds
  { id: 'morningRush',  name: 'Morning Rush',          emoji: '🌅', desc: 'The early crowd hits. Everyone needs coffee.',        dpcMult: 2.0, dpsMult: 1.5, duration: 30 },
  { id: 'rainyEvening', name: 'Rainy Evening',          emoji: '🌧', desc: 'Rain brings people in for warmth and good cups.',     dpcMult: 1.5, dpsMult: 2.0, duration: 45 },
  { id: 'lateNight',    name: 'Late-Night Study Crowd', emoji: '🌙', desc: 'Students cramming. Espresso shots flying.',           dpcMult: 1.8, dpsMult: 1.3, duration: 40 },
  { id: 'weekendRush',  name: 'Weekend Rush',           emoji: '🎉', desc: "Everyone's off work and ready to brunch.",           dpcMult: 2.5, dpsMult: 2.0, duration: 35 },
];

// ============================================================
// STATE
// ============================================================

function buildDefaultState() {
  var upgrades = {};
  UPGRADE_DEFS.forEach(function(u) { upgrades[u.id] = { level: 0 }; });
  var staff = {};
  STAFF_DEFS.forEach(function(s) { staff[s.id] = 0; });
  var menu = {};
  MENU_DEFS.forEach(function(m) { menu[m.id] = { unlocked: false, level: 0 }; });
  var achievements = {};
  ACHIEVEMENT_DEFS.forEach(function(a) { achievements[a.id] = { earned: false }; });

  return {
    dollars: 0,
    lifetimeRevenue: 0,
    dollarsPerClick: 1,
    dollarsPerSecond: 0,
    totalCustomers: 0,
    totalTips: 0,
    highestCombo: 0,
    rank: 0,
    playTime: 0,
    lastSaveTime: null,
    prestigeMultiplier: 1,
    storesOpened: 0,
    upgrades: upgrades,
    staff: staff,
    menu: menu,
    achievements: achievements,
    journalEntries: [],
  };
}

var state = buildDefaultState();

// Runtime-only (not saved)
var combo = 0;
var lastClickTime = 0;
var comboTimer = null;
var counterIdleTimer = null;
var currentEvent = null;
var eventSecondsLeft = 0;
var nextEventTimeout = null;
var gameLoopInterval = null;
var autoSaveInterval = null;
var popupQueue = [];
var popupActive = false;

// ============================================================
// UTILITIES
// ============================================================

function fmt(n) {
  n = Math.floor(n);
  if (n >= 1000000000) return '$' + (n / 1000000000).toFixed(1) + 'B';
  if (n >= 1000000)    return '$' + (n / 1000000).toFixed(1) + 'M';
  return '$' + n.toLocaleString();
}

function fmtFull(n) {
  return '$' + Math.floor(n).toLocaleString();
}

function fmtRate(n) {
  return '$' + n.toFixed(1);
}

function rndItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function weightedPick(types) {
  var total = types.reduce(function(s, t) { return s + t.weight; }, 0);
  var r = Math.random() * total;
  for (var i = 0; i < types.length; i++) {
    r -= types[i].weight;
    if (r <= 0) return types[i];
  }
  return types[types.length - 1];
}

function clamp(val, min, max) {
  return Math.min(max, Math.max(min, val));
}

function formatTime(secs) {
  var h = Math.floor(secs / 3600);
  var m = Math.floor((secs % 3600) / 60);
  if (h > 0) return h + 'h ' + m + 'm';
  return m + 'm';
}

// ============================================================
// RECALCULATE STATS
// ============================================================

function recalcStats() {
  var dpc = 1;
  var dps = 0;
  var tipChance = 0.1;

  UPGRADE_DEFS.forEach(function(def) {
    var lvl = state.upgrades[def.id] ? state.upgrades[def.id].level : 0;
    if (lvl <= 0) return;
    if (def.effect === 'dpc')       dpc += def.value * lvl;
    if (def.effect === 'dps')       dps += def.value * lvl;
    if (def.effect === 'tipChance') tipChance += def.value * lvl;
  });

  STAFF_DEFS.forEach(function(def) {
    dps += def.dps * (state.staff[def.id] || 0);
  });

  MENU_DEFS.forEach(function(def) {
    var item = state.menu[def.id];
    if (!item || !item.unlocked) return;
    dpc += def.dpcBonus;
    dps += def.dpsBonus;
  });

  var mult = state.prestigeMultiplier || 1;
  state.dollarsPerClick = Math.max(1, dpc) * mult;
  state.dollarsPerSecond = Math.max(0, dps) * mult;
  state._tipChance = clamp(tipChance, 0, 0.8);
}

// ============================================================
// CLICK ENGINE
// ============================================================

function handleClick() {
  var now = Date.now();

  if (now - lastClickTime < 800) {
    combo = Math.min(combo + 1, 20);
  } else {
    combo = 1;
  }
  lastClickTime = now;
  if (combo > state.highestCombo) state.highestCombo = combo;

  if (comboTimer) clearTimeout(comboTimer);
  comboTimer = setTimeout(function() {
    combo = 0;
    updateComboDisplay();
  }, 1200);

  var dpc = state.dollarsPerClick;
  var comboMult = 1 + (combo - 1) * 0.05;
  var eventMult = currentEvent ? currentEvent.dpcMult : 1;
  var earned = dpc * comboMult * eventMult;

  var tip = 0;
  if (Math.random() < (state._tipChance || 0.1)) {
    tip = dpc * (0.2 + Math.random() * 0.8);
    earned += tip;
    state.totalTips += tip;
  }

  var isVIP = false;
  if (Math.random() < 0.01) {
    earned *= 5;
    isVIP = true;
  }

  earned = Math.max(1, earned);
  state.dollars += earned;
  state.lifetimeRevenue += earned;
  state.totalCustomers++;

  // Pick customer type once, shared between counter view and feed
  var ct;
  if (isVIP) {
    ct = CUSTOMER_TYPES.filter(function(c) { return c.type === 'VIP'; })[0];
  } else {
    ct = weightedPick(CUSTOMER_TYPES);
  }
  var desc = rndItem(ct.descs);

  showCounterCustomer(ct, desc, earned, tip, isVIP);
  spawnCustomerCard(ct, desc, earned, tip, isVIP);
  showClickFloat(earned, tip > 0, combo);
  updateComboDisplay();
  checkRankEligibility();
  checkAchievements();
  updateDisplay();
}

// ============================================================
// COUNTER / REGISTER VIEW
// ============================================================

function showCounterCustomer(ct, desc, earned, tip, isVIP) {
  var view = document.getElementById('counter-view');
  if (!view) return;

  document.getElementById('counter-cust-emoji').textContent = ct.emoji;
  document.getElementById('counter-cust-name').textContent = ct.type + (isVIP ? ' ⭐' : '') + (combo >= 5 ? ' x' + combo : '');
  document.getElementById('counter-cust-desc').textContent = desc;
  document.getElementById('counter-cust-earned').textContent =
    fmtFull(earned) + (tip > 0 ? ' + ' + fmtFull(tip) + ' tip' : '');

  // Re-trigger arrive animation
  view.classList.remove('counter-active');
  void view.offsetWidth;
  view.classList.add('counter-active');
  view.classList.remove('counter-idle');

  if (counterIdleTimer) clearTimeout(counterIdleTimer);
  counterIdleTimer = setTimeout(setCounterIdle, 3000);
}

function setCounterIdle() {
  var loc = LOCATIONS[state.rank] || LOCATIONS[0];
  var view = document.getElementById('counter-view');
  if (!view) return;
  document.getElementById('counter-cust-emoji').textContent = loc.scene;
  document.getElementById('counter-cust-name').textContent = loc.place + ' · ' + loc.spot;
  document.getElementById('counter-cust-desc').textContent = loc.atm;
  document.getElementById('counter-cust-earned').textContent = '';
  view.classList.remove('counter-active');
  view.classList.add('counter-idle');
}

function updateCounterLocation() {
  var loc = LOCATIONS[state.rank] || LOCATIONS[0];
  var view = document.getElementById('counter-view');
  if (!view) return;

  LOCATIONS.forEach(function(l) { view.classList.remove(l.bgClass); });
  view.classList.add(loc.bgClass);

  document.getElementById('counter-loc-scene').textContent = loc.scene;
  document.getElementById('counter-loc-name').textContent = loc.place + ' · ' + loc.spot;

  var multEl = document.getElementById('counter-multiplier');
  if (multEl) {
    var mult = state.prestigeMultiplier || 1;
    if (mult > 1) {
      multEl.textContent = 'x' + mult.toFixed(1) + ' income';
      multEl.classList.remove('hidden');
    } else {
      multEl.classList.add('hidden');
    }
  }

  setCounterIdle();
}

// ============================================================
// CUSTOMER FEED
// ============================================================

function spawnCustomerCard(ct, desc, earned, tip, isVIP) {
  var feed = document.getElementById('customer-feed');
  if (!feed) return;

  var card = document.createElement('div');
  card.className = 'customer-card';
  card.innerHTML =
    '<div class="c-emoji">' + ct.emoji + '</div>' +
    '<div class="c-info">' +
      '<div class="c-type">' + ct.type + (combo >= 5 ? ' <span style="color:var(--gold)">x' + combo + '</span>' : '') + '</div>' +
      '<div class="c-desc">' + desc + '</div>' +
    '</div>' +
    '<div class="c-earned">' + fmtFull(earned) + (tip > 0 ? '<span class="c-tip">+' + fmtFull(tip) + ' tip</span>' : '') + '</div>';

  feed.insertBefore(card, feed.firstChild);
  while (feed.children.length > 8) {
    feed.removeChild(feed.lastChild);
  }
}

// ============================================================
// CLICK FLOAT
// ============================================================

function showClickFloat(earned, hasTip, comboCount) {
  var area = document.getElementById('click-feedback');
  if (!area) return;
  var el = document.createElement('div');
  el.className = 'click-float';
  var text = '+' + fmtFull(earned);
  if (hasTip) text += ' tip';
  if (comboCount >= 5) text += ' (' + comboCount + 'x)';
  el.textContent = text;
  area.appendChild(el);
  setTimeout(function() { if (el.parentNode) el.parentNode.removeChild(el); }, 900);
}

// ============================================================
// COMBO DISPLAY
// ============================================================

function updateComboDisplay() {
  var el = document.getElementById('combo-display');
  var countEl = document.getElementById('combo-count');
  if (!el || !countEl) return;
  if (combo >= 3) {
    el.classList.remove('hidden');
    countEl.textContent = combo + 'x';
  } else {
    el.classList.add('hidden');
  }
}

// ============================================================
// RANK ELIGIBILITY + STORE PURCHASE
// ============================================================

function checkRankEligibility() {
  var nextIdx = state.rank + 1;
  var banner = document.getElementById('store-buy-banner');
  if (!banner) return;

  if (nextIdx >= RANKS.length) {
    banner.classList.add('hidden');
    return;
  }

  var nextRank = RANKS[nextIdx];
  var eligible = state.lifetimeRevenue >= nextRank.cost;
  var canAfford = state.dollars >= nextRank.cost;

  if (!eligible) {
    banner.classList.add('hidden');
    return;
  }

  banner.classList.remove('hidden');
  document.getElementById('store-buy-name').textContent = nextRank.name;

  var btn = document.getElementById('store-buy-btn');
  if (btn) {
    if (canAfford) {
      btn.disabled = false;
      btn.textContent = 'Open ' + nextRank.name + ' — ' + fmtFull(nextRank.cost);
    } else {
      btn.disabled = true;
      btn.textContent = 'Save up ' + fmtFull(nextRank.cost - state.dollars) + ' more to open';
    }
  }
}

function buyNextStore() {
  var nextIdx = state.rank + 1;
  if (nextIdx >= RANKS.length) return;
  var nextRank = RANKS[nextIdx];

  if (state.lifetimeRevenue < nextRank.cost) return;
  if (state.dollars < nextRank.cost) return;

  state.dollars -= nextRank.cost;
  state.rank = nextIdx;
  state.storesOpened = (state.storesOpened || 0) + 1;
  state.prestigeMultiplier = Math.pow(STORE_PRESTIGE_MULT, state.storesOpened);

  // Reset upgrades, staff, menu — dollars and lifetime revenue carry over
  UPGRADE_DEFS.forEach(function(u) { state.upgrades[u.id] = { level: 0 }; });
  STAFF_DEFS.forEach(function(s) { state.staff[s.id] = 0; });
  MENU_DEFS.forEach(function(m) { state.menu[m.id] = { unlocked: false, level: 0 }; });

  applyInitialUnlocks();
  recalcStats();

  addJournal('Opened ' + nextRank.name + ' · x' + state.prestigeMultiplier.toFixed(1) + ' income');
  checkAchievements();
  renderUpgrades();
  renderStaff();
  renderMenu();
  updateCounterLocation();
  updateDisplay();
  checkRankEligibility();

  // Build list of what's newly available at this rank
  var newMenuDef = MENU_DEFS.filter(function(m) { return m.id === nextRank.menuUnlock; })[0];
  var newUpgrades = UPGRADE_DEFS.filter(function(u) { return u.unlockRank === nextIdx; });
  var newStaff = STAFF_DEFS.filter(function(s) { return s.unlockRank === nextIdx; });

  var unlockedLines = '';
  if (newMenuDef) unlockedLines += '<li>' + newMenuDef.emoji + ' ' + newMenuDef.name + ' — new menu item</li>';
  newUpgrades.forEach(function(u) { unlockedLines += '<li>' + u.emoji + ' ' + u.name + '</li>'; });
  newStaff.forEach(function(s) { unlockedLines += '<li>' + s.emoji + ' ' + s.name + ' available to hire</li>'; });
  var unlockedSection = unlockedLines
    ? '<br><strong>Newly available:</strong><ul style="margin:6px 0 0 18px;line-height:1.9">' + unlockedLines + '</ul>'
    : '';

  queuePopup('🎉', nextRank.name + ' is Open!',
    nextRank.msg + '<br><br>' +
    'Permanent income multiplier: <strong>x' + state.prestigeMultiplier.toFixed(1) + '</strong>' +
    unlockedSection);
}

function applyInitialUnlocks() {
  // Black Coffee is always free — everything else requires purchase
  if (state.menu['blackCoffee']) state.menu['blackCoffee'].unlocked = true;
}

// ============================================================
// GAME LOOP
// ============================================================

function gameTick() {
  var dpsMult = currentEvent ? currentEvent.dpsMult : 1;
  var passiveEarned = state.dollarsPerSecond * dpsMult;
  if (passiveEarned > 0) {
    state.dollars += passiveEarned;
    state.lifetimeRevenue += passiveEarned;
  }

  state.playTime++;

  if (currentEvent) {
    eventSecondsLeft--;
    if (eventSecondsLeft <= 0) endEvent();
  }

  checkRankEligibility();
  checkAchievements();
  updateDisplay();
  updateEventBanner();

  if (DEBUG_MODE) {
    console.log('[CCT] DPS:', state.dollarsPerSecond.toFixed(2), 'DPC:', state.dollarsPerClick.toFixed(2), 'Rank:', state.rank, 'Mult:', (state.prestigeMultiplier || 1).toFixed(2));
  }
}

// ============================================================
// EVENTS
// ============================================================

function scheduleNextEvent() {
  if (nextEventTimeout) clearTimeout(nextEventTimeout);
  // BALANCE: 3-8 minutes between events
  var delay = (180 + Math.random() * 300) * 1000;
  nextEventTimeout = setTimeout(triggerEvent, delay);
}

function triggerEvent() {
  if (currentEvent) { scheduleNextEvent(); return; }
  currentEvent = EVENT_DEFS[Math.floor(Math.random() * EVENT_DEFS.length)];
  eventSecondsLeft = currentEvent.duration;
  addJournal('Event: ' + currentEvent.name);
  updateEventBanner();
  scheduleNextEvent();
}

function endEvent() {
  currentEvent = null;
  eventSecondsLeft = 0;
  updateEventBanner();
}

function updateEventBanner() {
  var banner = document.getElementById('event-banner');
  if (!banner) return;
  if (currentEvent) {
    banner.classList.remove('hidden');
    document.getElementById('event-emoji').textContent = currentEvent.emoji;
    document.getElementById('event-name').textContent = currentEvent.name;
    document.getElementById('event-desc').textContent = currentEvent.desc;
    document.getElementById('event-timer').textContent = eventSecondsLeft + 's';
  } else {
    banner.classList.add('hidden');
  }
}

// ============================================================
// JOURNAL
// ============================================================

function addJournal(text) {
  var entry = { text: text, time: formatTime(state.playTime) };
  state.journalEntries.unshift(entry);
  if (state.journalEntries.length > 50) state.journalEntries.length = 50;
  renderJournal();
}

function renderJournal() {
  var feed = document.getElementById('journal-feed');
  if (!feed) return;
  feed.innerHTML = state.journalEntries.slice(0, 20).map(function(e) {
    return '<div class="journal-entry"><span class="j-time">' + e.time + '</span>' + e.text + '</div>';
  }).join('');
}

// ============================================================
// ACHIEVEMENTS
// ============================================================

function checkAchievements() {
  var anyNew = false;
  ACHIEVEMENT_DEFS.forEach(function(def) {
    if (state.achievements[def.id] && state.achievements[def.id].earned) return;
    if (def.check(state)) {
      state.achievements[def.id] = { earned: true };
      state.dollars += def.reward;
      state.lifetimeRevenue += def.reward;
      anyNew = true;
      addJournal('Achievement: ' + def.name + ' (+' + fmtFull(def.reward) + ')');
      queuePopup(def.emoji, def.name, def.desc + '<br><br>Reward: <strong>' + fmtFull(def.reward) + '</strong>');
    }
  });
  if (anyNew) renderAchievements();
}

// ============================================================
// POPUP QUEUE
// ============================================================

function queuePopup(emoji, title, body) {
  popupQueue.push({ emoji: emoji, title: title, body: body });
  if (!popupActive) flushPopupQueue();
}

function flushPopupQueue() {
  if (popupQueue.length === 0) { popupActive = false; return; }
  popupActive = true;
  var p = popupQueue.shift();
  document.getElementById('popup-emoji').textContent = p.emoji;
  document.getElementById('popup-title').textContent = p.title;
  document.getElementById('popup-body').innerHTML = p.body;
  document.getElementById('popup-overlay').classList.remove('hidden');
}

function closePopup() {
  document.getElementById('popup-overlay').classList.add('hidden');
  popupActive = false;
  setTimeout(flushPopupQueue, 250);
}

// ============================================================
// UPGRADES
// ============================================================

function getUpgradePrice(def, level) {
  return Math.ceil(def.basePrice * Math.pow(def.scale, level));
}

function buyUpgrade(id) {
  var def = null;
  for (var i = 0; i < UPGRADE_DEFS.length; i++) { if (UPGRADE_DEFS[i].id === id) { def = UPGRADE_DEFS[i]; break; } }
  if (!def) return;
  var lvl = state.upgrades[id] ? state.upgrades[id].level : 0;
  if (lvl >= def.maxLevel) return;
  if (def.unlockRank > state.rank) return;
  var price = getUpgradePrice(def, lvl);
  if (state.dollars < price) return;

  state.dollars -= price;
  state.upgrades[id].level = lvl + 1;
  if (lvl === 0) addJournal('Purchased: ' + def.name);

  recalcStats();
  renderUpgrades();
  updateDisplay();
}

function renderUpgrades() {
  var container = document.getElementById('upgrades-list');
  if (!container) return;
  container.innerHTML = '';

  UPGRADE_DEFS.forEach(function(def) {
    if (def.unlockRank > state.rank) return;
    var lvl = state.upgrades[def.id] ? state.upgrades[def.id].level : 0;
    var price = getUpgradePrice(def, lvl);
    var canAfford = state.dollars >= price;
    var maxed = lvl >= def.maxLevel;

    var effectText = '';
    if (def.effect === 'dpc')       effectText = lvl > 0 ? '+' + fmtRate(def.value * lvl) + '/click (Lv.' + lvl + ')' : 'Per level: +' + fmtRate(def.value) + '/click';
    if (def.effect === 'dps')       effectText = lvl > 0 ? '+' + fmtRate(def.value * lvl) + '/sec (Lv.' + lvl + ')'   : 'Per level: +' + fmtRate(def.value) + '/sec';
    if (def.effect === 'tipChance') effectText = lvl > 0 ? '+' + Math.round(def.value * lvl * 100) + '% tip chance'    : 'Per level: +' + Math.round(def.value * 100) + '% tip chance';

    var card = document.createElement('div');
    card.className = 'upgrade-card';
    card.innerHTML =
      '<div class="item-header"><div class="item-emoji">' + def.emoji + '</div>' +
      '<div><div class="item-name">' + def.name + '</div><div class="item-level">Level ' + lvl + ' / ' + def.maxLevel + '</div></div></div>' +
      '<div class="item-desc">' + def.desc + '</div>' +
      '<div class="item-effect">' + effectText + '</div>' +
      '<button class="buy-btn' + (maxed ? ' maxed' : '') + '" ' +
        (maxed || !canAfford ? 'disabled' : 'onclick="buyUpgrade(\'' + def.id + '\')"') + '>' +
        (maxed ? 'MAX LEVEL' : 'Buy — ' + fmtFull(price)) +
      '</button>';
    container.appendChild(card);
  });
}

// ============================================================
// STAFF
// ============================================================

function getStaffCost(def) {
  return Math.ceil(def.baseCost * Math.pow(def.costScale, state.staff[def.id] || 0));
}

function buyStaff(id) {
  var def = null;
  for (var i = 0; i < STAFF_DEFS.length; i++) { if (STAFF_DEFS[i].id === id) { def = STAFF_DEFS[i]; break; } }
  if (!def || def.unlockRank > state.rank) return;
  var cost = getStaffCost(def);
  if (state.dollars < cost) return;

  state.dollars -= cost;
  state.staff[id] = (state.staff[id] || 0) + 1;
  if (state.staff[id] === 1) addJournal('Hired first ' + def.name);

  recalcStats();
  renderStaff();
  updateDisplay();
  checkAchievements();
}

function renderStaff() {
  var container = document.getElementById('staff-list');
  if (!container) return;
  container.innerHTML = '';

  STAFF_DEFS.forEach(function(def) {
    if (def.unlockRank > state.rank) return;
    var count = state.staff[def.id] || 0;
    var cost = getStaffCost(def);
    var canAfford = state.dollars >= cost;

    var card = document.createElement('div');
    card.className = 'staff-card';
    card.innerHTML =
      '<div class="item-header"><div class="item-emoji">' + def.emoji + '</div>' +
      '<div><div class="item-name">' + def.name + '</div><div class="item-level">Hired: ' + count + '</div></div></div>' +
      '<div class="item-desc">' + def.desc + '</div>' +
      '<div class="item-effect">+' + def.dps + '/sec each · Total: +' + (def.dps * count).toFixed(1) + '/sec</div>' +
      '<button class="buy-btn" ' + (!canAfford ? 'disabled' : 'onclick="buyStaff(\'' + def.id + '\')"') + '>' +
        'Hire — ' + fmtFull(cost) +
      '</button>';
    container.appendChild(card);
  });
}

// ============================================================
// MENU
// ============================================================

function unlockMenuItem(id) {
  var def = null;
  for (var i = 0; i < MENU_DEFS.length; i++) { if (MENU_DEFS[i].id === id) { def = MENU_DEFS[i]; break; } }
  if (!def) return;
  var item = state.menu[id];
  if (!item || item.unlocked) return;
  if (def.unlockRank > state.rank) return;
  if (state.dollars < def.price) return;

  state.dollars -= def.price;
  item.unlocked = true;
  addJournal('Added to menu: ' + def.name);

  recalcStats();
  renderMenu();
  updateDisplay();
}

function renderMenu() {
  var container = document.getElementById('menu-list');
  if (!container) return;
  container.innerHTML = '';

  MENU_DEFS.forEach(function(def) {
    var item = state.menu[def.id] || { unlocked: false };
    var isUnlocked = item.unlocked;
    var rankLocked = def.unlockRank > state.rank;
    var canAfford = !rankLocked && !isUnlocked && state.dollars >= def.price;
    var unlockRankName = RANKS[def.unlockRank] ? RANKS[def.unlockRank].name : '';

    var statusText = isUnlocked ? 'On Menu' : (rankLocked ? 'Locked' : 'Available');
    var bonusLine = '<div class="item-effect">+' + def.dpcBonus.toFixed(1) + '/click · +' + def.dpsBonus.toFixed(1) + '/sec</div>';
    var actionBtn = '';
    if (isUnlocked) {
      actionBtn = '<div class="menu-active-badge">On Menu</div>';
    } else if (rankLocked) {
      actionBtn = '<div class="unlock-hint">Unlocks at ' + unlockRankName + '</div>';
    } else {
      actionBtn = '<button class="buy-btn" ' + (!canAfford ? 'disabled' : 'onclick="unlockMenuItem(\'' + def.id + '\')"') + '>' +
        (def.price === 0 ? 'Add to Menu — Free' : 'Add to Menu — ' + fmtFull(def.price)) + '</button>';
    }

    var card = document.createElement('div');
    card.className = 'menu-card' + (isUnlocked ? ' menu-active' : (rankLocked ? ' locked-card' : ''));
    card.innerHTML =
      '<div class="item-header"><div class="item-emoji">' + def.emoji + '</div>' +
      '<div><div class="item-name">' + def.name + '</div>' +
      '<div class="item-level">' + statusText + '</div></div></div>' +
      '<div class="item-desc">' + def.desc + '</div>' +
      bonusLine +
      actionBtn;
    container.appendChild(card);
  });
}

// ============================================================
// ACHIEVEMENTS RENDER
// ============================================================

function renderAchievements() {
  var container = document.getElementById('achievements-list');
  if (!container) return;
  container.innerHTML = '';
  var earned = 0;

  ACHIEVEMENT_DEFS.forEach(function(def) {
    var isEarned = state.achievements[def.id] && state.achievements[def.id].earned;
    if (isEarned) earned++;
    var card = document.createElement('div');
    card.className = 'achievement-card ' + (isEarned ? 'earned' : 'locked');
    card.innerHTML =
      '<div class="item-header"><div class="item-emoji">' + def.emoji + '</div>' +
      '<div><div class="ach-name">' + def.name + '</div></div></div>' +
      '<div class="ach-desc">' + def.desc + '</div>' +
      '<div class="ach-reward">Reward: ' + fmtFull(def.reward) + '</div>' +
      '<div class="ach-status">' + (isEarned ? 'Unlocked' : 'Locked') + '</div>';
    container.appendChild(card);
  });

  var countEl = document.getElementById('achievement-count');
  if (countEl) countEl.textContent = earned + ' / ' + ACHIEVEMENT_DEFS.length + ' unlocked';
}

// ============================================================
// STATS
// ============================================================

function renderStats() {
  var container = document.getElementById('stats-content');
  if (!container) return;

  var nextRankCost = state.rank < RANKS.length - 1 ? RANKS[state.rank + 1].cost : null;
  var rankPct = nextRankCost ? clamp((state.lifetimeRevenue / nextRankCost) * 100, 0, 100) : 100;

  var rows = [
    { label: 'Current Balance',   value: fmtFull(state.dollars),                           bar: null },
    { label: 'Lifetime Revenue',  value: fmtFull(state.lifetimeRevenue),                   bar: null },
    { label: 'Per Click',         value: fmtRate(state.dollarsPerClick),                   bar: null },
    { label: 'Per Second',        value: fmtRate(state.dollarsPerSecond),                  bar: null },
    { label: 'Customers Served',  value: state.totalCustomers.toLocaleString(),            bar: { val: state.totalCustomers, max: 10000 } },
    { label: 'Total Tips',        value: fmtFull(state.totalTips),                        bar: null },
    { label: 'Highest Combo',     value: state.highestCombo + 'x',                        bar: { val: state.highestCombo, max: 50 } },
    { label: 'Location',          value: RANKS[state.rank].name,                          bar: { val: state.rank, max: RANKS.length - 1 } },
    { label: 'Next Location',     value: Math.floor(rankPct) + '%',                       bar: { val: rankPct, max: 100 } },
    { label: 'Income Multiplier', value: 'x' + (state.prestigeMultiplier || 1).toFixed(1), bar: null },
    { label: 'Stores Opened',     value: (state.storesOpened || 0).toString(),             bar: null },
    { label: 'Play Time',         value: formatTime(state.playTime),                       bar: null },
  ];

  container.innerHTML = rows.map(function(r) {
    var barHtml = r.bar
      ? '<div class="stat-bar-wrap"><div class="stat-bar" style="width:' + clamp((r.bar.val / r.bar.max) * 100, 0, 100) + '%"></div></div>'
      : '';
    return '<div class="stat-card"><div class="stat-label">' + r.label + '</div><div class="stat-value">' + r.value + '</div>' + barHtml + '</div>';
  }).join('');
}

// ============================================================
// DISPLAY UPDATE
// ============================================================

function updateDisplay() {
  document.getElementById('dollars-display').textContent = fmt(state.dollars);
  document.getElementById('income-display').textContent = fmtRate(state.dollarsPerSecond) + '/sec · ' + fmtRate(state.dollarsPerClick) + '/click';
  document.getElementById('rank-badge').textContent = RANKS[state.rank].name;
  document.getElementById('manager-text').textContent = RANKS[state.rank].msg;

  var nextIdx = state.rank + 1;
  if (nextIdx < RANKS.length) {
    var nextCost = RANKS[nextIdx].cost;
    var pct = clamp((state.lifetimeRevenue / nextCost) * 100, 0, 100);
    var eligible = state.lifetimeRevenue >= nextCost;
    document.getElementById('goal-text').textContent = eligible
      ? RANKS[nextIdx].name + ' is ready to open'
      : 'Earn ' + fmtFull(nextCost) + ' to unlock ' + RANKS[nextIdx].name;
    document.getElementById('goal-progress').style.width = pct + '%';
    document.getElementById('goal-pct').textContent = Math.floor(pct) + '%';
  } else {
    document.getElementById('goal-text').textContent = 'You have reached the pinnacle. The Coffee Empire is yours.';
    document.getElementById('goal-progress').style.width = '100%';
    document.getElementById('goal-pct').textContent = '100%';
  }

  checkRankEligibility();

  var activePanel = document.querySelector('.tab-panel.active');
  if (activePanel) {
    if (activePanel.id === 'tab-upgrades') renderUpgrades();
    else if (activePanel.id === 'tab-staff') renderStaff();
    else if (activePanel.id === 'tab-menu') renderMenu();
    else if (activePanel.id === 'tab-stats') renderStats();
  }
}

// ============================================================
// TABS
// ============================================================

function initTabs() {
  document.querySelectorAll('.tab-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.tab-btn').forEach(function(b) { b.classList.remove('active'); });
      document.querySelectorAll('.tab-panel').forEach(function(p) { p.classList.remove('active'); });
      btn.classList.add('active');
      var panel = document.getElementById('tab-' + btn.dataset.tab);
      if (panel) panel.classList.add('active');
      if (btn.dataset.tab === 'upgrades')     renderUpgrades();
      if (btn.dataset.tab === 'staff')        renderStaff();
      if (btn.dataset.tab === 'menu')         renderMenu();
      if (btn.dataset.tab === 'achievements') renderAchievements();
      if (btn.dataset.tab === 'stats')        renderStats();
    });
  });
}

// ============================================================
// SAVE / LOAD
// ============================================================

var SAVE_KEY = 'cozyCupTycoon_v1_0';

function saveGame() {
  state.lastSaveTime = Date.now();
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
    var el = document.getElementById('last-save-text');
    if (el) el.textContent = 'Saved at ' + new Date().toLocaleTimeString();
  } catch(e) {
    console.error('[CCT] Save failed:', e);
  }
}

function loadGame() {
  try {
    var raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return false;
    var saved = JSON.parse(raw);
    if (!saved || typeof saved !== 'object') return false;

    var defaults = buildDefaultState();

    var fields = ['dollars', 'lifetimeRevenue', 'totalCustomers', 'totalTips', 'highestCombo', 'rank', 'playTime', 'lastSaveTime', 'storesOpened'];
    fields.forEach(function(f) {
      var v = saved[f];
      if (v !== undefined && v !== null && !isNaN(v)) defaults[f] = v;
    });

    // Load prestige multiplier; retroactively apply for old saves without it
    if (typeof saved.prestigeMultiplier === 'number' && saved.prestigeMultiplier >= 1) {
      defaults.prestigeMultiplier = saved.prestigeMultiplier;
    } else if (defaults.rank > 0) {
      defaults.storesOpened = defaults.rank;
      defaults.prestigeMultiplier = Math.pow(STORE_PRESTIGE_MULT, defaults.rank);
    }

    if (saved.upgrades && typeof saved.upgrades === 'object') {
      Object.keys(defaults.upgrades).forEach(function(id) {
        if (saved.upgrades[id] && typeof saved.upgrades[id].level === 'number') {
          defaults.upgrades[id] = { level: saved.upgrades[id].level };
        }
      });
    }

    if (saved.staff && typeof saved.staff === 'object') {
      Object.keys(defaults.staff).forEach(function(id) {
        if (typeof saved.staff[id] === 'number') defaults.staff[id] = saved.staff[id];
      });
    }

    if (saved.menu && typeof saved.menu === 'object') {
      Object.keys(defaults.menu).forEach(function(id) {
        if (saved.menu[id] && typeof saved.menu[id] === 'object') {
          defaults.menu[id] = {
            unlocked: !!saved.menu[id].unlocked,
            level: (typeof saved.menu[id].level === 'number') ? saved.menu[id].level : 0,
          };
        }
      });
    }

    if (saved.achievements && typeof saved.achievements === 'object') {
      Object.keys(defaults.achievements).forEach(function(id) {
        if (saved.achievements[id]) {
          defaults.achievements[id] = { earned: !!saved.achievements[id].earned };
        }
      });
    }

    if (Array.isArray(saved.journalEntries)) {
      defaults.journalEntries = saved.journalEntries.slice(0, 50);
    }

    state = defaults;
    return true;
  } catch(e) {
    console.error('[CCT] Load failed:', e);
    return false;
  }
}

// ============================================================
// OFFLINE EARNINGS
// ============================================================

function handleOfflineEarnings() {
  if (!state.lastSaveTime) return;
  if (!state.dollarsPerSecond || state.dollarsPerSecond <= 0) return;

  var elapsed = (Date.now() - state.lastSaveTime) / 1000;
  if (elapsed < 60) return;

  var cappedElapsed = Math.min(elapsed, 86400);
  var earned = Math.floor(state.dollarsPerSecond * cappedElapsed);
  if (earned <= 0 || isNaN(earned)) return;

  state.dollars += earned;
  state.lifetimeRevenue += earned;
  addJournal('Offline earnings: ' + fmtFull(earned));

  var hours = Math.floor(cappedElapsed / 3600);
  var mins = Math.floor((cappedElapsed % 3600) / 60);
  var timeStr = hours > 0 ? hours + 'h ' + mins + 'm' : mins + ' minutes';

  queuePopup('☕', 'Welcome Back!',
    'While you were away for ' + timeStr + ', your cafe earned <strong>' + fmtFull(earned) + '</strong>.');
}

// ============================================================
// RESET
// ============================================================

function initReset() {
  var btn = document.getElementById('reset-btn');
  var input = document.getElementById('reset-input');
  var msg = document.getElementById('reset-msg');
  if (!btn || !input) return;

  btn.addEventListener('click', function() {
    if (input.value.trim() === 'RESET') {
      // IMPORTANT: never auto-clear localStorage without explicit user action
      localStorage.removeItem(SAVE_KEY);
      state = buildDefaultState();
      applyInitialUnlocks();
      recalcStats();
      combo = 0;
      currentEvent = null;
      eventSecondsLeft = 0;
      var feed = document.getElementById('customer-feed');
      if (feed) feed.innerHTML = '';
      renderUpgrades();
      renderStaff();
      renderMenu();
      renderAchievements();
      renderJournal();
      updateCounterLocation();
      updateDisplay();
      input.value = '';
      if (msg) msg.textContent = 'Progress reset. Starting fresh.';
      addJournal('Grand Opening. The dream starts here.');
      queuePopup('☕', 'Fresh Start', "You've got a cart, a dream, and enough coffee to start.");
    } else {
      if (msg) msg.textContent = 'Type RESET exactly (all caps) to confirm.';
    }
  });
}

// ============================================================
// INIT
// ============================================================

function init() {
  var hasSave = loadGame();
  applyInitialUnlocks();
  recalcStats();

  if (hasSave) {
    handleOfflineEarnings();
  } else {
    addJournal('Grand Opening. The dream starts here.');
    queuePopup('☕', 'Welcome to Cozy Cup Tycoon', "You've got a cart, a dream, and enough coffee to start.<br><br>Click <strong>Serve Customer</strong> to begin.");
  }

  renderUpgrades();
  renderStaff();
  renderMenu();
  renderAchievements();
  renderJournal();
  updateCounterLocation();
  updateDisplay();
  checkRankEligibility();

  document.getElementById('serve-btn').addEventListener('click', handleClick);
  document.getElementById('save-btn').addEventListener('click', saveGame);
  var manualSave = document.getElementById('manual-save-btn');
  if (manualSave) manualSave.addEventListener('click', saveGame);
  document.getElementById('popup-close').addEventListener('click', closePopup);

  initTabs();
  initReset();

  if (gameLoopInterval) clearInterval(gameLoopInterval);
  gameLoopInterval = setInterval(gameTick, 1000);

  if (autoSaveInterval) clearInterval(autoSaveInterval);
  autoSaveInterval = setInterval(saveGame, 30000);

  scheduleNextEvent();
}

document.addEventListener('DOMContentLoaded', init);

// ============================================================
// v2.0 IDEAS:
// - Brand Legacy prestige (reset everything for permanent brand multipliers)
// - Import/export saves
// - Deeper flavor events with story choices
// - More menu items (seasonal specials)
// - More customer personalities
// - Cafe decor upgrades per rank
// - Sound toggle (ambient cafe noise)
// ============================================================
