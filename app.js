/* =========================
   Utilitaires & stockage
   ========================= */
const AUTH_EMAIL = "user@home.com"; // email fixe de démo
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

const storage = {
  get(key, fallback) {
    try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
    catch { return fallback; }
  },
  set(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
  },
  del(key) {
    try { localStorage.removeItem(key); } catch {}
  }
};

function toast(msg, type = "info", timeout = 3000) {
  const wrap = $("#toasts");
  const t = document.createElement("div");
  t.className = `toast ${type}`;
  t.innerHTML = `${type === "success" ? "✅" : type === "danger" ? "⚠️" : "ℹ️"} <span>${msg}</span>`;
  wrap.appendChild(t);
  const rm = () => { t.remove(); };
  setTimeout(rm, timeout);
  t.addEventListener("click", rm);
}

/* ========= MOT DE PASSE ========= */
function getPwd() {
  return storage.get("safehouse_pwd", null);
}
function setPwd(v) {
  storage.set("safehouse_pwd", v);
}

/* ========= Thème ========= */
const THEME_KEY = "smartHomeTheme";

function updateThemeButtonLabel() {
  const btn = $("#theme-btn");
  if (!btn) return;
  const cur = document.documentElement.getAttribute("data-theme");
  if (cur === "dark") {
    btn.textContent = "☀️ Mode clair";
  } else {
    btn.textContent = "🌙 Mode sombre";
  }
}

function applyTheme(init = false) {
  let theme = storage.get(THEME_KEY, "auto");
  if (init && theme === "auto") {
    const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    document.documentElement.setAttribute("data-theme", prefersDark ? "dark" : "light");
  } else {
    document.documentElement.setAttribute("data-theme", theme === "auto" ? "light" : theme);
  }
  updateThemeButtonLabel();
}

applyTheme(true);

$("#theme-btn")?.addEventListener("click", () => {
  const cur = document.documentElement.getAttribute("data-theme");
  const next = (cur === "dark") ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", next);
  storage.set(THEME_KEY, next);
  updateThemeButtonLabel();
  toast(`Mode ${next === "dark" ? "sombre" : "clair"} activé`, "success");
});

/* ========= Auth ========= */
const authWrapper = $("#auth-wrapper");
const authForm = $("#auth-form");
const authError = $("#auth-error");
const rememberBox = $("#remember-box");
const rememberInput = $("#remember-input");
const appRoot = $("#app");

function showApp() { authWrapper.style.display = "none"; appRoot.style.display = "block"; }
function showLogin() { authWrapper.style.display = "block"; appRoot.style.display = "none"; }

rememberBox.addEventListener("click", () => {
  rememberInput.checked = !rememberInput.checked;
  rememberBox.textContent = rememberInput.checked ? "✔" : "";
});

$("#toggle-pwd").addEventListener("click", () => {
  const pwd = $("#auth-password");
  const isPwd = pwd.type === "password";
  pwd.type = isPwd ? "text" : "password";
});

$("#forgot-link").addEventListener("click", () => {
  toast("Indice : le mot de passe de démo initial est « secret123 » 😉", "info", 5000);
});

/* ========= Modale mot de passe ========= */
const pwdModal = $("#pwd-modal");
const pwdForm = $("#pwd-form");
const pwdCurrentWrapper = $("#pwd-current-wrapper");
const pwdError = $("#pwd-error");
const pwdSkip = $("#pwd-skip");

function openPwdModal(){
  const firstTime = !getPwd();
  pwdError.textContent = "";
  $("#pwd-new").value = "";
  $("#pwd-confirm").value = "";
  $("#pwd-current").value = "";

  if(firstTime){
    $("#pwd-title").textContent = "Créer votre mot de passe";
    $("#pwd-subtitle").textContent = "Choisissez un mot de passe SafeHouse pour les prochaines connexions.";
    pwdCurrentWrapper.style.display = "none";
  } else {
    $("#pwd-title").textContent = "Changer votre mot de passe";
    $("#pwd-subtitle").textContent = "Saisissez l'ancien et le nouveau mot de passe.";
    pwdCurrentWrapper.style.display = "block";
  }

  pwdModal.style.display = "flex";
}

pwdSkip.addEventListener("click", ()=>{
  pwdModal.style.display = "none";
  showApp();
});

pwdForm.addEventListener("submit", e=>{
  e.preventDefault();
  const firstTime = !getPwd();
  const old = $("#pwd-current").value.trim();
  const nw  = $("#pwd-new").value.trim();
  const cf  = $("#pwd-confirm").value.trim();

  if(!firstTime && old !== getPwd()){
    pwdError.textContent = "Mot de passe actuel incorrect.";
    return;
  }
  if(nw.length < 4){
    pwdError.textContent = "Mot de passe trop court (min. 4 caractères).";
    return;
  }
  if(nw !== cf){
    pwdError.textContent = "La confirmation ne correspond pas.";
    return;
  }

  setPwd(nw);
  toast(firstTime ? "Mot de passe créé." : "Mot de passe mis à jour.", "success");
  pwdModal.style.display = "none";
  showApp();
});

/* ========= Connexion ========= */
const isLogged = storage.get("smartHomeLogged", false) === true;
if (isLogged) showApp(); else showLogin();

authForm.addEventListener("submit", (e) => {
  e.preventDefault();
  authError.style.display = "none";
  const email = $("#auth-email").value.trim();
  const pwdInput = $("#auth-password");
  const pwd = pwdInput.value.trim();
  const savedPwd = getPwd() || "secret123";

  if (email === AUTH_EMAIL && pwd === savedPwd) {
    if (rememberInput.checked) storage.set("smartHomeLogged", true);
    toast("Connexion réussie !", "success");
    pwdInput.value = "";
    openPwdModal();
  } else {
    authError.style.display = "block";
    pwdInput.value = "";
    pwdInput.focus();
  }
});

/* ========= Boutons top-right ========= */
$("#logout-btn").addEventListener("click", () => {
  storage.del("smartHomeLogged");
  toast("Déconnecté.", "info");
  showLogin();
});

$("#reset-btn").addEventListener("click", () => {
  ["smartHomeLogged","smartHomeState","smartHomeTheme","safehouse_pwd"].forEach(k => storage.del(k));
  toast("Données de la démo réinitialisées.", "success");
  location.reload();
});

// /* ========= Animation statut Maison connectée ========= */
// (function(){
//   const chip = $("#online-chip-top");
//   if (!chip) return;
//   let online = true;
//   setInterval(() => {
//     online = !online;
//     chip.innerHTML = `<span class="chip-top-dot" style="background:${online ? '#22c55e' : '#f59e0b'}"></span>${online ? " Maison connectée" : " Maison en veille"}`;
//   }, 12000);
// })();

/* ========= État de l’app / vues ========= */
const state = storage.get("smartHomeState", {});

function getState(id, fallback) {
  return (id in state) ? state[id] : fallback;
}
function setState(id, value) {
  state[id] = value;
  storage.set("smartHomeState", state);
}

const views = {
  lights: [
    { id: "living-light", label: "Lumières salon", sub: "Intensité 80 %", type: "toggle", defaultOn: true },
    { id: "kitchen-light", label: "Lumières cuisine", sub: "Intensité 60 %", type: "toggle", defaultOn: true },
    { id: "garden-light", label: "Éclairage extérieur", sub: "Programmation coucher du soleil", type: "toggle", defaultOn: false },
  ],
  climate: [
    { id: "temp", label: "Thermostat principal", sub: "Réglage actuel : {{value}} °C", type: "slider", min: 16, max: 28, value: 21 },
    { id: "eco-mode", label: "Mode éco", sub: "Réduction automatique la nuit", type: "toggle", defaultOn: true },
  ],
  security: [
    { id: "alarm", label: "Système d’alarme", sub: "Zones : portes &amp; fenêtres", type: "toggle", defaultOn: true },
    { id: "camera", label: "Caméras extérieures", sub: "Enregistrement en continu", type: "toggle", defaultOn: true },
    { id: "notification", label: "Notifications instantanées", sub: "En cas de détection de mouvement", type: "toggle", defaultOn: true },
  ],
  garage: [
    { id: "garage-door", label: "Porte de garage", sub: "Appuie pour ouvrir/fermer", type: "toggle", defaultOn: false },
    { id: "garage-light", label: "Lumière garage", sub: "S’éteint automatiquement", type: "toggle", defaultOn: false },
  ],
  automation: [
    { id: "scene-night", label: "Scénario “Bonne nuit”", sub: "Éteint lumières, active alarme", type: "button", buttonLabel: "Lancer" },
    { id: "scene-away", label: "Scénario “Vacances”", sub: "Simulation de présence + sécurité", type: "button", buttonLabel: "Activer" },
  ],
  energy: [
    { id: "energy-meter", label: "Consommation actuelle", sub: "Charge : {{value}} %", type: "meter", value: 42 },
    { id: "energy-eco", label: "Mode économie d’énergie", sub: "Optimisation intelligente", type: "toggle", defaultOn: true },
    { id: "ev-charge", label: "Recharge véhicule électrique", sub: "Privilégier heures creuses", type: "toggle", defaultOn: false },
  ],
  watering: [
    { id: "watering-main", label: "Arrosage jardin", sub: "Cycle automatique (tôt le matin)", type: "toggle", defaultOn: false },
    { id: "soil-threshold", label: "Seuil d’humidité", sub: "Déclenchement à {{value}} %", type: "slider", min: 10, max: 80, value: 35 },
    { id: "watering-plan", label: "Planification", sub: "Programmer un cycle", type: "button", buttonLabel: "Planifier" },
  ],
};

const phoneList = $("#phone-list");
const phoneSearch = $("#phone-search");
let currentView = "lights";
const scheduledTimers = [];
let energyMeterInterval = null;

/* Créer une carte */
function createCard(item) {
  const card = document.createElement("div");
  card.className = "phone-card";
  card.tabIndex = 0;

  const main = document.createElement("div");
  main.className = "phone-card-main";

  const valueForSub = (item.type === "slider") ? getState(item.id, item.value) : null;
  const subText = item.sub ? item.sub.replace("{{value}}", valueForSub ?? "") : "";

  const label = document.createElement("div");
  label.className = "phone-card-label";
  label.textContent = item.label;

  const sub = document.createElement("div");
  sub.className = "phone-card-sub";
  sub.innerHTML = subText;

  main.appendChild(label);
  main.appendChild(sub);

  const right = document.createElement("div");

  if (item.type === "toggle") {
    const initial = getState(item.id, item.defaultOn === true);
    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "toggle";
    toggle.setAttribute("data-on", String(initial));
    toggle.setAttribute("role", "switch");
    toggle.setAttribute("aria-checked", String(initial));
    toggle.setAttribute("aria-label", item.label);
    toggle.innerHTML = `<span class="toggle-circle"></span>`;
    const setToggle = (on) => {
      toggle.setAttribute("data-on", String(on));
      toggle.setAttribute("aria-checked", String(on));
      setState(item.id, on);
    };
    toggle.addEventListener("click", () => setToggle(!(toggle.getAttribute("data-on") === "true")));
    toggle.addEventListener("keydown", (e) => {
      if (e.key === " " || e.key === "Enter") { e.preventDefault(); toggle.click(); }
    });
    right.appendChild(toggle);
  }

  if (item.type === "slider") {
    const slider = document.createElement("input");
    slider.type = "range";
    slider.className = "slider";
    slider.min = item.min;
    slider.max = item.max;
    slider.value = getState(item.id, item.value);
    slider.setAttribute("aria-label", item.label);
    slider.addEventListener("input", () => {
      sub.innerHTML = item.sub.replace("{{value}}", slider.value);
    });
    slider.addEventListener("change", () => {
      setState(item.id, Number(slider.value));
      toast(`${item.label} : ${slider.value}`, "info", 1500);
    });
    right.style.minWidth = "90px";
    right.appendChild(slider);
    sub.innerHTML = item.sub.replace("{{value}}", slider.value);
  }

  if (item.type === "button") {
    const btn = document.createElement("button");
    btn.type = "button"; btn.className = "inline-btn";
    btn.textContent = item.buttonLabel;
    btn.addEventListener("click", () => triggerScenario(item.label));
    right.appendChild(btn);

    const plan = document.createElement("button");
    plan.type = "button"; plan.className = "link-btn";
    plan.textContent = "⏱ Planifier";
    plan.addEventListener("click", () => scheduleScenario(item.label));
    right.appendChild(plan);
  }

  if (item.type === "meter") {
    const meter = document.createElement("div");
    meter.className = "meter";
    const bar = document.createElement("div");
    bar.className = "meter-bar";
    meter.appendChild(bar);
    right.style.minWidth = "130px";
    right.appendChild(meter);

    const setVal = (v) => {
      const val = Math.max(0, Math.min(100, v));
      bar.style.width = val + "%";
      sub.textContent = `Charge : ${val.toFixed(0)}%`;
      setState(item.id, val);
    };
    setVal(getState(item.id, item.value));

    if (energyMeterInterval) clearInterval(energyMeterInterval);
    let dir = 1;
    energyMeterInterval = setInterval(() => {
      let cur = getState(item.id, item.value);
      cur += dir * (Math.random() * 2);
      if (cur > 85) dir = -1;
      if (cur < 15) dir = 1;
      setVal(cur);
    }, 2500);
  }

  card.appendChild(main);
  card.appendChild(right);

  card.dataset.search = (item.label + " " + (sub.textContent || sub.innerText)).toLowerCase();
  return card;
}

/* Rendu d’une vue */
function renderView(viewKey) {
  currentView = viewKey;
  const items = views[viewKey] || [];
  phoneList.innerHTML = "";
  items.forEach(item => phoneList.appendChild(createCard(item)));
  applySearchFilter();
}

function applySearchFilter() {
  const q = phoneSearch.value.trim().toLowerCase();
  $$(".phone-card", phoneList).forEach(card => {
    card.style.display = q && !card.dataset.search.includes(q) ? "none" : "";
  });
}

phoneSearch.addEventListener("input", applySearchFilter);

/* Scénarios */
function triggerScenario(label) {
  if (label.includes("Nuit")) {
    setState("living-light", false);
    setState("kitchen-light", false);
    setState("alarm", true);
    toast("Scénario « Bonne nuit » exécuté : lumières éteintes, alarme activée.", "success", 4000);
  } else if (label.includes("Vacances")) {
    setState("notification", true);
    setState("camera", true);
    toast("Scénario « Vacances » : simulation de présence et sécurité renforcée.", "success", 4000);
  } else {
    toast(`Scénario « ${label} » déclenché ✅`, "success");
  }
  renderView(currentView);
}

function scheduleScenario(label) {
  const minutes = prompt("Dans combien de minutes exécuter ce scénario ?", "2");
  if (!minutes) return;
  const m = Number(minutes);
  if (Number.isNaN(m) || m <= 0) {
    toast("Valeur invalide.", "danger");
    return;
  }
  const when = new Date(Date.now() + m * 60 * 1000);
  toast(`« ${label} » planifié pour ${when.toLocaleTimeString()}`, "info", 5000);
  const t = setTimeout(() => {
    triggerScenario(label);
    const idx = scheduledTimers.findIndex(x => x.t === t);
    if (idx >= 0) scheduledTimers.splice(idx, 1);
  }, m * 60 * 1000);
  scheduledTimers.push({ label, when, t });
}

/* Navigation par bulles */
renderView("lights");

$$(".bubble-card").forEach(btn => {
  btn.addEventListener("click", () => {
    const target = btn.getAttribute("data-target");
    renderView(target);
    $$(".bubble-card").forEach(b => b.setAttribute("aria-pressed", "false"));
    btn.setAttribute("aria-pressed", "true");
  });
  btn.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      btn.click();
    }
  });
});

/* Raccourci clavier Ctrl/Cmd + K */
window.addEventListener("keydown", (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
    e.preventDefault();
    phoneSearch.focus();
  }
});

/* Click sur la carte => toggle */
document.addEventListener("click", (e) => {
  const card = e.target.closest(".phone-card");
  if (!card) return;
  const toggle = card.querySelector(".toggle");
  if (toggle && (e.target === card || e.target.closest(".phone-card-main"))) {
    toggle.click();
  }
});
