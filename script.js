// Civ V (Brave New World + DLC) civ roster.
// Color is a rough thematic swatch for visual differentiation only.
const CIVS = [
  { name: "America",     leader: "Washington",       color: "#3b6cb7" },
  { name: "Arabia",      leader: "Harun al-Rashid",  color: "#2ea05a" },
  { name: "Assyria",     leader: "Ashurbanipal",     color: "#d9c25a" },
  { name: "Austria",     leader: "Maria Theresa",    color: "#b72d2d" },
  { name: "Aztec",       leader: "Montezuma",        color: "#c97a2a" },
  { name: "Babylon",     leader: "Nebuchadnezzar II",color: "#5fb3c9" },
  { name: "Brazil",      leader: "Pedro II",         color: "#1f7a3a" },
  { name: "Byzantium",   leader: "Theodora",         color: "#7a3a8c" },
  { name: "Carthage",    leader: "Dido",             color: "#7d2c2c" },
  { name: "Celts",       leader: "Boudicca",         color: "#3a8c52" },
  { name: "China",       leader: "Wu Zetian",        color: "#1f8c44" },
  { name: "Denmark",     leader: "Harald Bluetooth", color: "#7a1f1f" },
  { name: "Egypt",       leader: "Ramesses II",      color: "#d4a93a" },
  { name: "England",     leader: "Elizabeth",        color: "#b22222" },
  { name: "Ethiopia",    leader: "Haile Selassie",   color: "#2a7a3a" },
  { name: "France",      leader: "Napoleon",         color: "#3a5a9c" },
  { name: "Germany",     leader: "Bismarck",         color: "#2a2a2a" },
  { name: "Greece",      leader: "Alexander",        color: "#5a8cbf" },
  { name: "Huns",        leader: "Attila",           color: "#6b2a2a" },
  { name: "Inca",        leader: "Pachacuti",        color: "#d4801f" },
  { name: "India",       leader: "Gandhi",           color: "#3a9c5a" },
  { name: "Indonesia",   leader: "Gajah Mada",       color: "#c92a2a" },
  { name: "Iroquois",    leader: "Hiawatha",         color: "#3a7a5a" },
  { name: "Japan",       leader: "Oda Nobunaga",     color: "#c41f1f" },
  { name: "Korea",       leader: "Sejong",           color: "#3a5a8c" },
  { name: "Maya",        leader: "Pacal",            color: "#2a8c7a" },
  { name: "Mongolia",    leader: "Genghis Khan",     color: "#7a2a2a" },
  { name: "Morocco",     leader: "Ahmad al-Mansur",  color: "#1f6b3a" },
  { name: "Netherlands", leader: "William",          color: "#d4801f" },
  { name: "Ottomans",    leader: "Suleiman",         color: "#1f5a3a" },
  { name: "Persia",      leader: "Darius I",         color: "#7a2a3a" },
  { name: "Poland",      leader: "Casimir III",      color: "#b22222" },
  { name: "Polynesia",   leader: "Kamehameha",       color: "#d4a93a" },
  { name: "Portugal",    leader: "Maria I",          color: "#3a5a8c" },
  { name: "Rome",        leader: "Augustus",         color: "#7a2a8c" },
  { name: "Russia",      leader: "Catherine",        color: "#8c8c8c" },
  { name: "Shoshone",    leader: "Pocatello",        color: "#3a7a5a" },
  { name: "Siam",        leader: "Ramkhamhaeng",     color: "#d4a93a" },
  { name: "Songhai",     leader: "Askia",            color: "#2a6b3a" },
  { name: "Spain",       leader: "Isabella",         color: "#c92a2a" },
  { name: "Sweden",      leader: "Gustavus Adolphus",color: "#3a7abf" },
  { name: "Venice",      leader: "Enrico Dandolo",   color: "#7a3aab" },
  { name: "Zulu",        leader: "Shaka",            color: "#6b3a1f" },
];

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
    <span class="swatch" style="background:${civ.color}"></span>
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
    else if (filter === "inverse") {
      grid.querySelectorAll("input[type=checkbox]").forEach(input => {
        input.checked = !input.checked;
        input.dispatchEvent(new Event("change"));
      });
    } else if (filter === "venice-only") {
      setBan(name => name !== "Venice");
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
        <span class="swatch" style="background:${civ.color}"></span>
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
