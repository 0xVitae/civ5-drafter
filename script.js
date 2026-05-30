// Civ V (Brave New World + DLC) civ roster.
const CIVS = [
  { name: "America",     leader: "Washington" },
  { name: "Arabia",      leader: "Harun al-Rashid" },
  { name: "Assyria",     leader: "Ashurbanipal" },
  { name: "Austria",     leader: "Maria Theresa" },
  { name: "Aztec",       leader: "Montezuma" },
  { name: "Babylon",     leader: "Nebuchadnezzar II" },
  { name: "Brazil",      leader: "Pedro II" },
  { name: "Byzantium",   leader: "Theodora" },
  { name: "Carthage",    leader: "Dido" },
  { name: "Celts",       leader: "Boudicca" },
  { name: "China",       leader: "Wu Zetian" },
  { name: "Denmark",     leader: "Harald Bluetooth" },
  { name: "Egypt",       leader: "Ramesses II" },
  { name: "England",     leader: "Elizabeth" },
  { name: "Ethiopia",    leader: "Haile Selassie" },
  { name: "France",      leader: "Napoleon" },
  { name: "Germany",     leader: "Bismarck" },
  { name: "Greece",      leader: "Alexander" },
  { name: "Huns",        leader: "Attila" },
  { name: "Inca",        leader: "Pachacuti" },
  { name: "India",       leader: "Gandhi" },
  { name: "Indonesia",   leader: "Gajah Mada" },
  { name: "Iroquois",    leader: "Hiawatha" },
  { name: "Japan",       leader: "Oda Nobunaga" },
  { name: "Korea",       leader: "Sejong" },
  { name: "Maya",        leader: "Pacal" },
  { name: "Mongolia",    leader: "Genghis Khan" },
  { name: "Morocco",     leader: "Ahmad al-Mansur" },
  { name: "Netherlands", leader: "William" },
  { name: "Ottomans",    leader: "Suleiman" },
  { name: "Persia",      leader: "Darius I" },
  { name: "Poland",      leader: "Casimir III" },
  { name: "Polynesia",   leader: "Kamehameha" },
  { name: "Portugal",    leader: "Maria I" },
  { name: "Rome",        leader: "Augustus" },
  { name: "Russia",      leader: "Catherine" },
  { name: "Shoshone",    leader: "Pocatello" },
  { name: "Siam",        leader: "Ramkhamhaeng" },
  { name: "Songhai",     leader: "Askia" },
  { name: "Spain",       leader: "Isabella" },
  { name: "Sweden",      leader: "Gustavus Adolphus" },
  { name: "Venice",      leader: "Enrico Dandolo" },
  { name: "Zulu",        leader: "Shaka" },
];

CIVS.forEach(c => c.icon = `icons/${c.name.toLowerCase()}.webp`);

const grid = document.getElementById("civ-grid");
const playerCountEl = document.getElementById("player-count");
const civsPerPlayerEl = document.getElementById("civs-per-player");
const allowDuplicatesEl = document.getElementById("allow-duplicates");
const createBtn = document.getElementById("create-game");
const rerollBtn = document.getElementById("reroll");
const resultsSection = document.getElementById("results");
const resultsList = document.getElementById("results-list");

// Build the civ grid.
CIVS.forEach((civ, i) => {
  const id = `civ-${i}`;
  const label = document.createElement("label");
  label.className = "civ";
  label.htmlFor = id;
  label.innerHTML = `
    <input type="checkbox" id="${id}" data-civ="${civ.name}" />
    <img class="civ-icon" src="${civ.icon}" alt="" loading="lazy" />
    <span class="name" title="${civ.leader}">${civ.name}</span>
  `;
  const input = label.querySelector("input");
  input.addEventListener("change", () => {
    label.classList.toggle("banned", input.checked);
  });
  grid.appendChild(label);
});

function setBan(predicate) {
  grid.querySelectorAll("input[type=checkbox]").forEach(input => {
    const banned = predicate(input.dataset.civ);
    if (input.checked !== banned) {
      input.checked = banned;
      input.dispatchEvent(new Event("change"));
    }
  });
}

document.querySelectorAll(".filters button").forEach(btn => {
  btn.addEventListener("click", () => {
    const filter = btn.dataset.filter;
    if (filter === "none") setBan(() => false);
    else if (filter === "all") setBan(() => true);
    else if (filter === "venice-only") {
      setBan(name => name === "Venice");
    }
  });
});

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function getAllowedCivs() {
  const banned = new Set();
  grid.querySelectorAll("input[type=checkbox]:checked").forEach(input => {
    banned.add(input.dataset.civ);
  });
  return CIVS.filter(c => !banned.has(c.name));
}

function clearError() {
  const existing = document.querySelector(".error");
  if (existing) existing.remove();
}

function showError(msg) {
  clearError();
  const div = document.createElement("div");
  div.className = "error";
  div.textContent = msg;
  createBtn.parentElement.insertAdjacentElement("afterend", div);
}

function draft() {
  clearError();
  const players = parseInt(playerCountEl.value, 10);
  const perPlayer = parseInt(civsPerPlayerEl.value, 10);
  const allowDuplicates = allowDuplicatesEl.checked;
  const allowed = getAllowedCivs();

  if (allowed.length === 0) {
    showError("All civilizations are banned. Unban at least one.");
    return;
  }

  const needed = players * perPlayer;
  if (!allowDuplicates && allowed.length < needed) {
    showError(`Need ${needed} unique civs but only ${allowed.length} are allowed. Unban more or enable duplicates.`);
    return;
  }
  if (!allowDuplicates && allowed.length < perPlayer) {
    showError(`Need ${perPlayer} civs per player but only ${allowed.length} are allowed.`);
    return;
  }

  const assignments = [];
  if (allowDuplicates) {
    for (let p = 0; p < players; p++) {
      const picks = [];
      const pool = shuffle(allowed);
      for (let i = 0; i < perPlayer; i++) {
        picks.push(pool[i % pool.length]);
      }
      assignments.push(picks);
    }
  } else {
    const pool = shuffle(allowed);
    let idx = 0;
    for (let p = 0; p < players; p++) {
      assignments.push(pool.slice(idx, idx + perPlayer));
      idx += perPlayer;
    }
  }

  renderResults(assignments);
}

function renderResults(assignments) {
  resultsList.innerHTML = "";
  assignments.forEach((picks, i) => {
    const li = document.createElement("li");
    const header = document.createElement("div");
    header.className = "player-name";
    header.textContent = `Player ${i + 1}`;
    li.appendChild(header);
    picks.forEach(civ => {
      const row = document.createElement("div");
      row.className = "civ-pick";
      row.innerHTML = `
        <img class="civ-icon" src="${civ.icon}" alt="" loading="lazy" />
        <span><strong>${civ.name}</strong> &mdash; ${civ.leader}</span>
      `;
      li.appendChild(row);
    });
    resultsList.appendChild(li);
  });
  resultsSection.hidden = false;
  resultsSection.scrollIntoView({ behavior: "smooth", block: "start" });
}

createBtn.addEventListener("click", draft);
rerollBtn.addEventListener("click", draft);

// ─────────────────────────────────────────────────────────────────────────────
// Tier Lists
// ─────────────────────────────────────────────────────────────────────────────

const TIER_LISTS = [
  {
    id: "filthy-robot",
    author: "Filthy Robot",
    context: "BNW · v2.0",
    date: "Jan 30, 2015",
    sourceUrl: "https://docs.google.com/spreadsheets/d/0BybM2PD7AqoKWWwzNjYyaHFvQ2M/edit?resourcekey=0-r448D6uuycdpbQ01Aqe5Ng&gid=335002879",
    sourceLabel: "Google Sheets",
    // Filthy's sheet uses tiers 1–6; normalized here to 0-indexed (best = 0).
    tiers: [
      { label: "God Tier", note: "Bonuses consistent and game-changingly strong",
        civs: ["Babylon", "Egypt", "England", "Ethiopia", "Huns", "Inca", "Korea", "Maya", "Persia", "Poland"] },
      { label: "Strong",   note: "Consistent and strong, or situational and game-changing",
        civs: ["Arabia", "Aztec", "China", "Greece", "Russia", "Shoshone", "Spain", "Zulu"] },
      { label: "Decent",   note: "Consistent and mediocre, or situational and strong",
        civs: ["America", "Austria", "Byzantium", "Celts", "Denmark", "Germany", "India", "Indonesia", "Mongolia", "Rome", "Siam", "Songhai"] },
      { label: "Weak",     note: "Consistent but weak, or situational and mediocre",
        civs: ["Assyria", "Brazil", "Morocco", "Portugal", "Sweden"] },
      { label: "Awful",    note: "Consistently inconsequential, or situational and weak",
        civs: ["Carthage", "France", "Japan", "Netherlands", "Ottomans", "Polynesia"] },
      { label: "Joke",     note: "Bonuses detrimental to the civilization",
        civs: ["Iroquois", "Venice"] },
    ],
  },
  {
    id: "bacon-falcon",
    author: "Bacon_Falcon",
    context: "Pangaea · BNW · Multiplayer",
    sourceUrl: "https://www.reddit.com/r/civ5/",
    sourceLabel: "r/civ5, 10y ago",
    // Tier index = numeric rank, 0 best → 6 worst.
    tiers: [
      { label: "God Tier",     note: "Excellent under all circumstances",
        civs: ["Babylon", "Poland"] },
      { label: "Top Tier",     note: "Consistently amazing, or conditionally god tier",
        civs: ["Aztec", "Egypt", "Huns", "Inca", "Korea", "Maya", "Persia", "Shoshone", "Spain"] },
      { label: "Strong Tier",  note: "Traits that make it consistently powerful",
        civs: ["Arabia", "China", "England", "Ethiopia", "Russia", "Zulu"] },
      { label: "Fine Tier",    note: "Decent boost, conditionally great",
        civs: ["Austria", "Brazil", "Celts", "Germany", "Greece", "India", "Mongolia", "Rome", "Siam"] },
      { label: "Meh Tier",     note: "Traits potentially good, usually unhelpful",
        civs: ["America", "Byzantium", "Carthage", "Denmark", "Netherlands", "Indonesia", "Morocco", "Portugal", "Songhai"] },
      { label: "Generic Tier", note: "Traits negligible or rarely helpful",
        civs: ["Assyria", "France", "Japan", "Ottomans", "Polynesia", "Sweden"] },
      { label: "Nerf Tier",    note: "Traits inhibit more than help",
        civs: ["Iroquois", "Venice"] },
    ],
  },
];

const CIVS_BY_NAME = Object.fromEntries(CIVS.map(c => [c.name, c]));

// Wiki article + basic uniques (UA / UU / UB·UI) for each civ.
// Sourced from civilization.fandom.com/wiki/Civilizations_(Civ5) (Brave New World).
const WIKI_BASE = "https://civilization.fandom.com/wiki/";
const CIV_INFO = {
  America:     { slug: "American_(Civ5)",     ua: ["Manifest Destiny", "All land military units have +1 Sight; 50% discount when buying tiles."], uu: "B-17, Minuteman", ub: "—" },
  Arabia:      { slug: "Arabian_(Civ5)",      ua: ["Ships of the Desert", "Caravans gain +50% range; trade routes spread your religion twice as effectively; Oil doubled."], uu: "Camel Archer", ub: "Bazaar" },
  Assyria:     { slug: "Assyrian_(Civ5)",     ua: ["Treasures of Nineveh", "Conquering a city grants a free tech its owner had researched (once per city)."], uu: "Siege Tower", ub: "Royal Library" },
  Austria:     { slug: "Austrian_(Civ5)",     ua: ["Diplomatic Marriage", "Spend Gold to annex or puppet a City-State that's been your ally for 5 turns."], uu: "Hussar", ub: "Coffee House" },
  Aztec:       { slug: "Aztec_(Civ5)",        ua: ["Sacrificial Captives", "Gain Culture for each enemy unit your forces kill."], uu: "Jaguar", ub: "Floating Gardens" },
  Babylon:     { slug: "Babylonian_(Civ5)",   ua: ["Ingenuity", "Free Great Scientist on discovering Writing; earn Great Scientists 50% faster."], uu: "Bowman", ub: "Walls of Babylon" },
  Brazil:      { slug: "Brazilian_(Civ5)",    ua: ["Carnival", "+100% Tourism during Golden Ages; earn Great Artists, Musicians & Writers 50% faster during them."], uu: "Pracinha", ub: "Brazilwood Camp (improvement)" },
  Byzantium:   { slug: "Byzantine_(Civ5)",    ua: ["Patriarchate of Constantinople", "Choose one extra Belief when founding a Religion."], uu: "Cataphract, Dromon", ub: "—" },
  Carthage:    { slug: "Carthaginian_(Civ5)", ua: ["Phoenician Heritage", "All coastal cities get a free Harbor; units may cross mountains after your first Great General."], uu: "African Forest Elephant, Quinquereme", ub: "—" },
  Celts:       { slug: "Celtic_(Civ5)",       ua: ["Druidic Lore", "+1 Faith per city with an adjacent unimproved Forest (+2 with 3 or more)."], uu: "Pictish Warrior", ub: "Ceilidh Hall" },
  China:       { slug: "Chinese_(Civ5)",      ua: ["Art of War", "Great General combat bonus +15% and their spawn rate +50%."], uu: "Chu-Ko-Nu", ub: "Paper Maker" },
  Denmark:     { slug: "Danish_(Civ5)",       ua: ["Viking Fury", "Embarked units +1 Movement and disembark for 1 MP; melee units pillage for free."], uu: "Berserker, Norwegian Ski Infantry", ub: "—" },
  Egypt:       { slug: "Egyptian_(Civ5)",     ua: ["Monument Builders", "+20% Production toward Wonder construction."], uu: "War Chariot", ub: "Burial Tomb" },
  England:     { slug: "English_(Civ5)",      ua: ["Sun Never Sets", "+2 Movement for all naval units; receive 1 extra Spy."], uu: "Longbowman, Ship of the Line", ub: "—" },
  Ethiopia:    { slug: "Ethiopian_(Civ5)",    ua: ["Spirit of Adwa", "+20% combat strength against civs that have more cities than Ethiopia."], uu: "Mehal Sefari", ub: "Stele" },
  France:      { slug: "French_(Civ5)",       ua: ["City of Light", "Museum and World Wonder theming bonuses are doubled in your Capital."], uu: "Musketeer, Foreign Legion", ub: "Chateau (improvement)" },
  Germany:     { slug: "German_(Civ5)",       ua: ["Furor Teutonicus", "67% chance to take 25 Gold and recruit a Barbarian beaten in its encampment; -25% land-unit maintenance."], uu: "Landsknecht, Panzer", ub: "Hanse" },
  Greece:      { slug: "Greek_(Civ5)",        ua: ["Hellenic League", "City-State Influence degrades at half and recovers at twice the normal rate."], uu: "Companion Cavalry, Hoplite", ub: "—" },
  Huns:        { slug: "Hunnic_(Civ5)",       ua: ["Scourge of God", "Raze cities at double speed; start with Animal Husbandry; +1 Production per Pasture."], uu: "Horse Archer, Battering Ram", ub: "—" },
  Inca:        { slug: "Incan_(Civ5)",        ua: ["Great Andean Road", "Units ignore terrain cost into Hills; no maintenance for Hill improvements, half elsewhere."], uu: "Slinger", ub: "Terrace Farm (improvement)" },
  India:       { slug: "Indian_(Civ5)",       ua: ["Population Growth", "Unhappiness from number of cities doubled, from citizens halved."], uu: "War Elephant", ub: "Mughal Fort" },
  Indonesia:   { slug: "Indonesian_(Civ5)",   ua: ["Spice Islanders", "The first 3 cities founded on other continents each yield 2 unique Luxuries."], uu: "Kris Swordsman", ub: "Candi" },
  Iroquois:    { slug: "Iroquois_(Civ5)",     ua: ["The Great Warpath", "Move through friendly Forest/Jungle as if roads; they connect cities and trade routes after The Wheel."], uu: "Mohawk Warrior", ub: "Longhouse" },
  Japan:       { slug: "Japanese_(Civ5)",     ua: ["Bushido", "Units fight at full strength even when damaged; +1 Culture per Fishing Boat, +2 per Atoll."], uu: "Samurai, Zero", ub: "—" },
  Korea:       { slug: "Korean_(Civ5)",       ua: ["Scholars of the Jade Hall", "+2 Science from every Specialist and Great Person improvement; tech boost when a science building/Wonder is built in the Capital."], uu: "Turtle Ship, Hwach'a", ub: "—" },
  Maya:        { slug: "Mayan_(Civ5)",        ua: ["The Long Count", "After Theology, a bonus Great Person at the end of each Maya calendar cycle (each choosable once)."], uu: "Atlatlist", ub: "Pyramid" },
  Mongolia:    { slug: "Mongolian_(Civ5)",    ua: ["Mongol Terror", "+30% Combat Strength vs City-States; all mounted units +1 Movement."], uu: "Keshik, Khan", ub: "—" },
  Morocco:     { slug: "Moroccan_(Civ5)",     ua: ["Gateway to Africa", "+3 Gold and +1 Culture per trade route with another civ/City-State; partners get +2 Gold."], uu: "Berber Cavalry", ub: "Kasbah (improvement)" },
  Netherlands: { slug: "Dutch_(Civ5)",        ua: ["Dutch East India Company", "Keep 50% of a Luxury's Happiness even after trading away your last copy."], uu: "Sea Beggar", ub: "Polder (improvement)" },
  Ottomans:    { slug: "Ottoman_(Civ5)",      ua: ["Barbary Corsairs", "Melee naval units can capture defeated ships; pay only 1/3 naval-unit maintenance."], uu: "Janissary, Sipahi", ub: "—" },
  Persia:      { slug: "Persian_(Civ5)",      ua: ["Achaemenid Legacy", "Golden Ages last 50% longer; during them units get +1 Movement and +10% Combat Strength."], uu: "Immortal", ub: "Satrap's Court" },
  Poland:      { slug: "Polish_(Civ5)",       ua: ["Solidarity", "Receive a free Social Policy whenever you advance to the next era."], uu: "Winged Hussar", ub: "Ducal Stable" },
  Polynesia:   { slug: "Polynesian_(Civ5)",   ua: ["Wayfinding", "Embark and cross Oceans from the start; +1 Sight embarked; +10% Combat Strength near a Moai."], uu: "Maori Warrior", ub: "Moai (improvement)" },
  Portugal:    { slug: "Portuguese_(Civ5)",   ua: ["Mare Clausum", "Resource diversity grants twice as much Gold for Portugal in trade routes."], uu: "Nau", ub: "Feitoria (improvement)" },
  Rome:        { slug: "Roman_(Civ5)",        ua: ["The Glory of Rome", "+25% Production toward any building already present in the Capital."], uu: "Ballista, Legion", ub: "—" },
  Russia:      { slug: "Russian_(Civ5)",      ua: ["Siberian Riches", "Strategic Resources +1 Production; Horses, Iron and Uranium provide double quantity."], uu: "Cossack", ub: "Krepost" },
  Shoshone:    { slug: "Shoshone_(Civ5)",     ua: ["Great Expanse", "New cities start with extra territory; +15% combat strength within your own borders."], uu: "Pathfinder, Comanche Riders", ub: "—" },
  Siam:        { slug: "Siamese_(Civ5)",      ua: ["Father Governs Children", "Food, Culture and Faith from friendly City-States increased by 50%."], uu: "Naresuan's Elephant", ub: "Wat" },
  Songhai:     { slug: "Songhai_(Civ5)",      ua: ["River Warlord", "Triple Gold from Barbarian camps and pillaging cities; land units gain amphibious promotions."], uu: "Mandekalu Cavalry", ub: "Mud Pyramid Mosque" },
  Spain:       { slug: "Spanish_(Civ5)",      ua: ["Seven Cities of Gold", "Gold for finding Natural Wonders (more if first); their Culture, Happiness and yields doubled."], uu: "Tercio, Conquistador", ub: "—" },
  Sweden:      { slug: "Swedish_(Civ5)",      ua: ["Nobel Prize", "Gifting a Great Person to a City-State grants 90 Influence; friendship boosts both civs' Great Person rate +10%."], uu: "Hakkapeliitta, Carolean", ub: "—" },
  Venice:      { slug: "Venetian_(Civ5)",     ua: ["Serenissima", "No Settlers and can't annex; double trade routes; free Merchant of Venice after Optics; may buy buildings in puppets."], uu: "Merchant of Venice, Great Galleass", ub: "—" },
  Zulu:        { slug: "Zulu_(Civ5)",         ua: ["Iklwa", "Melee units cost 50% less maintenance; all units need 25% less XP to promote."], uu: "Impi", ub: "Ikanda" },
};

function getCivCheckbox(name) {
  return grid.querySelector(`input[data-civ="${name}"]`);
}

function toggleBan(name) {
  const cb = getCivCheckbox(name);
  if (!cb) return;
  cb.checked = !cb.checked;
  cb.dispatchEvent(new Event("change"));
}

function isBanned(name) {
  const cb = getCivCheckbox(name);
  return !!(cb && cb.checked);
}

function civChip(name, tierIdx) {
  const civ = CIVS_BY_NAME[name];
  if (!civ) return "";
  const banned = isBanned(name) ? " banned" : "";
  const info = CIV_INFO[name];
  const tip = info ? `
      <span class="civ-tip" role="tooltip">
        <span class="civ-tip-head">
          <img src="${civ.icon}" alt="" />
          <span><strong>${name}</strong> <span class="civ-tip-leader">${civ.leader}</span></span>
        </span>
        <span class="civ-tip-row"><span class="civ-tip-tag">UA</span><span><strong>${info.ua[0]}</strong> — ${info.ua[1]}</span></span>
        <span class="civ-tip-row"><span class="civ-tip-tag">UU</span><span>${info.uu}</span></span>
        <span class="civ-tip-row"><span class="civ-tip-tag">UB</span><span>${info.ub}</span></span>
        <a class="civ-tip-link" href="${WIKI_BASE}${info.slug}" target="_blank" rel="noopener">View on Civ&nbsp;V Wiki ↗</a>
      </span>` : "";
  return `
    <span class="tier-chip-wrap">
      <button type="button" class="tier-chip${banned}" data-civ="${name}" data-tier="${tierIdx}"
              title="Click to ban/unban">
        <img src="${civ.icon}" alt="" loading="lazy" />
        <span>${name}</span>
      </button>${tip}
    </span>
  `;
}

const tierContent = document.getElementById("tier-content");
const tierListSelect = document.getElementById("tier-list-select");
const tierBanButtons = document.getElementById("tier-ban-buttons");

tierListSelect.innerHTML = TIER_LISTS
  .map(tl => `<option value="${tl.id}">${tl.author} — ${tl.context}</option>`)
  .join("");

tierContent.innerHTML = `<div class="tier-panel"></div>`;
const tierPanel = tierContent.querySelector(".tier-panel");

function activeTierList() {
  return TIER_LISTS.find(t => t.id === tierListSelect.value);
}

function renderTierBanButtons() {
  const tl = activeTierList();
  tierBanButtons.innerHTML = tl.tiers.map((t, i) => {
    const allBanned = t.civs.every(isBanned);
    return `
      <button type="button" class="tier-ban-btn${allBanned ? ' active' : ''}"
              data-tier-idx="${i}" title="${t.civs.length} civ${t.civs.length===1?"":"s"}">
        <span class="tier-ban-num" data-tier="${i}">${i}</span>
        <span>${t.label}</span>
      </button>
    `;
  }).join("");
}

function renderTierPanel() {
  const tl = activeTierList();
  tierPanel.innerHTML = `
    <div class="tier-meta">
      ${tl.date ? `<span class="tier-date">${tl.date}</span> · ` : ""}<a href="${tl.sourceUrl}" target="_blank" rel="noopener">Source: ${tl.sourceLabel}</a>
    </div>
    ${tl.tiers.map((t, i) => `
      <div class="tier-row" data-tier="${i}">
        <div class="tier-label">
          <span class="tier-num">${i}</span>
          <span class="tier-name">${t.label}</span>
          <span class="tier-note">${t.note}</span>
        </div>
        <div class="tier-civs">${t.civs.map(n => civChip(n, i)).join("")}</div>
      </div>
    `).join("")}
  `;
}

function renderTierAll() {
  renderTierBanButtons();
  renderTierPanel();
}

tierBanButtons.addEventListener("click", (e) => {
  const btn = e.target.closest(".tier-ban-btn");
  if (!btn) return;
  const idx = parseInt(btn.dataset.tierIdx, 10);
  const tl = activeTierList();
  const civs = tl.tiers[idx].civs;
  const shouldBan = !civs.every(isBanned);
  civs.forEach(name => {
    const cb = getCivCheckbox(name);
    if (!cb || cb.checked === shouldBan) return;
    cb.checked = shouldBan;
    cb.dispatchEvent(new Event("change"));
  });
});

tierContent.addEventListener("click", (e) => {
  const chip = e.target.closest(".tier-chip");
  if (chip) toggleBan(chip.dataset.civ);
});

tierListSelect.addEventListener("change", renderTierAll);
grid.addEventListener("change", renderTierAll);

renderTierAll();
