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
