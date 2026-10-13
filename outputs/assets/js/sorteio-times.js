const themeToggle = document.getElementById("theme-toggle");
const savedTheme = localStorage.getItem("theme");

function setTheme(theme) {
  const isDark = theme === "dark";
  document.documentElement.dataset.theme = isDark ? "dark" : "light";
  themeToggle.textContent = isDark ? "☀️" : "🌙";
  themeToggle.setAttribute("aria-label", isDark ? "Ativar modo claro" : "Ativar modo escuro");
  themeToggle.setAttribute("aria-pressed", String(isDark));
  localStorage.setItem("theme", isDark ? "dark" : "light");
}

setTheme(savedTheme || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"));
themeToggle.addEventListener("click", () => setTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark"));

const initialPeople = Array(6).fill("");
const playersContainer = document.getElementById("players");
const notice = document.getElementById("notice");
const minimumPeople = 2;
const maximumPeople = 40;

function createPlayerField(name = "") {
  const index = playersContainer.children.length + 1;
  const row = document.createElement("div");
  row.className = "player-row";
  const input = document.createElement("input");
  input.type = "text";
  input.className = "player-input";
  input.value = name;
  input.maxLength = 40;
  input.setAttribute("aria-label", "Nome do participante " + index);
  input.placeholder = "Participante " + index;
  const removeButton = document.createElement("button");
  removeButton.type = "button";
  removeButton.className = "player-remove";
  removeButton.textContent = "-";
  removeButton.setAttribute("aria-label", "Excluir participante " + index);
  removeButton.addEventListener("click", () => {
    if (playersContainer.children.length <= minimumPeople) return;
    row.remove();
    updatePlayerFields();
  });
  row.append(removeButton, input);
  playersContainer.append(row);
}

function updatePlayerFields() {
  const rows = [...playersContainer.children];
  rows.forEach((row, index) => {
    const input = row.querySelector("input");
    const removeButton = row.querySelector("button");
    input.setAttribute("aria-label", "Nome do participante " + (index + 1));
    input.placeholder = "Participante " + (index + 1);
    removeButton.setAttribute("aria-label", "Excluir participante " + (index + 1));
    removeButton.disabled = rows.length <= minimumPeople;
  });
  document.querySelectorAll(".add-player").forEach(button => {
    button.disabled = rows.length >= maximumPeople;
  });
}

initialPeople.forEach(createPlayerField);
updatePlayerFields();

document.getElementById("add-player").addEventListener("click", () => {
  if (playersContainer.children.length >= maximumPeople) return;
  createPlayerField();
  updatePlayerFields();
  playersContainer.lastElementChild.querySelector("input").focus();
});

const teamsContainer = document.getElementById("teams");
let nextTeamId = 3;

function updateTeams() {
  const teams = [...teamsContainer.children];
  teams.forEach((team, index) => {
    const nameInput = team.querySelector(".team-name");
    const removeButton = team.querySelector(".team-remove");
    nameInput.id = "team-name-" + (index + 1);
    nameInput.setAttribute("aria-label", "Nome do time " + (index + 1));
    removeButton.setAttribute("aria-label", "Excluir " + (nameInput.value.trim() || "Time " + (index + 1)));
    removeButton.disabled = teams.length <= 2;
  });
}

function removeTeam(team) {
  if (teamsContainer.children.length <= 2) return;
  team.remove();
  updateTeams();
}

function bindTeam(team) {
  team.querySelector(".team-name").addEventListener("input", updateTeams);
  team.querySelector(".team-remove").addEventListener("click", () => removeTeam(team));
}

function addTeam() {
  const teamNumber = nextTeamId++;
  const team = document.createElement("article");
  team.className = "team";
  team.innerHTML = '<div class="team-head"><h2><input class="team-name" value="Time ' + teamNumber + '" maxlength="40"></h2><div class="team-head-actions"><span class="count">0 pessoas</span><button type="button" class="team-remove">Excluir</button></div></div><ol></ol>';
  teamsContainer.append(team);
  bindTeam(team);
  updateTeams();
  team.querySelector(".team-name").focus();
}

[...teamsContainer.children].forEach(bindTeam);
updateTeams();
document.getElementById("add-team").addEventListener("click", addTeam);

function showNotice(message) {
  notice.textContent = message;
  notice.hidden = false;
}

function clearNotice() {
  notice.hidden = true;
  notice.textContent = "";
}

function drawTeams() {
  const people = [...playersContainer.querySelectorAll("input")].map(input => input.value.trim());
  const teamElements = [...teamsContainer.children];
  const filledPeople = people.filter(Boolean);
  if (filledPeople.length === 0) {
    showNotice("Digite pelo menos um participante antes de sortear os times.");
    return;
  }
  if (filledPeople.length < teamElements.length || filledPeople.length % teamElements.length !== 0) {
    showNotice("Adicione ou remova participantes para formar times com a mesma quantidade de pessoas.");
    return;
  }
  clearNotice();
  const shuffled = [...filledPeople];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  const teamSize = shuffled.length / teamElements.length;
  const drawnTeams = teamElements.map((teamElement, index) => {
    const team = shuffled.slice(index * teamSize, (index + 1) * teamSize);
    teamElement.querySelector("ol").replaceChildren(...team.map((name, position) => {
      const item = document.createElement("li");
      const number = document.createElement("span");
      number.className = "number";
      number.textContent = String(position + 1);
      const label = document.createElement("span");
      label.textContent = name;
      item.append(number, label);
      return item;
    }));
    teamElement.querySelector(".count").textContent = team.length + " " + (team.length === 1 ? "pessoa" : "pessoas");
    teamElement.classList.remove("is-drawing");
    void teamElement.offsetWidth;
    teamElement.classList.add("is-drawing");
    return { name: teamElement.querySelector(".team-name").value.trim() || "Time " + (index + 1), players: team };
  });
  fetch("/api/draws", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ teams: drawnTeams }) })
    .then(response => {
      if (!response.ok) {
        throw new Error("Não foi possível salvar o sorteio no histórico.");
      }
    })
    .catch(error => {
      console.error(error);
      showNotice("O sorteio foi feito, mas não foi possível salvá-lo no histórico.");
    });
}

document.getElementById("draw").addEventListener("click", drawTeams);

const adminModal = document.getElementById("admin-modal");
const loginForm = document.getElementById("login-form");
const loginError = document.getElementById("login-error");
const adminAccess = document.getElementById("admin-access");
const adminStatus = document.getElementById("admin-status");
const mainLogout = document.getElementById("main-logout");
let isAdminAuthenticated = false;
let lastSessionActivityRequest = 0;

function setAdminState(authenticated, currentUsername = "") {
  isAdminAuthenticated = authenticated;
  adminStatus.hidden = !authenticated;
  adminStatus.textContent = authenticated ? "Conectado: " + currentUsername : "";
  mainLogout.hidden = !authenticated;
  adminAccess.textContent = authenticated ? "📋" : "👤";
  adminAccess.setAttribute(
    "aria-label",
    authenticated ? "Abrir histórico administrativo em nova aba" : "Abrir login administrativo",
  );
}

async function refreshAdminSession(force = false) {
  if (!force && Date.now() - lastSessionActivityRequest < 60_000) return;
  lastSessionActivityRequest = Date.now();

  try {
    const response = await fetch("/api/session", { cache: "no-store" });
    if (!response.ok) throw new Error("Não foi possível verificar a sessão.");
    const session = await response.json();
    setAdminState(session.authenticated, session.username || "");
  } catch (error) {
    console.error("Falha ao verificar a sessão administrativa:", error);
    setAdminState(false);
  }
}

document.addEventListener("pointerdown", () => refreshAdminSession());
document.addEventListener("keydown", () => refreshAdminSession());
refreshAdminSession(true);

adminAccess.addEventListener("click", () => {
  if (isAdminAuthenticated) {
    window.open("/historico-sorteios.html", "_blank", "noopener,noreferrer");
    return;
  }

  loginForm.reset();
  loginError.hidden = true;
  loginError.textContent = "";
  adminModal.hidden = false;
  document.getElementById("username").focus();
});
document.getElementById("admin-close").addEventListener("click", () => { adminModal.hidden = true; });
adminModal.addEventListener("click", event => { if (event.target === adminModal) adminModal.hidden = true; });
loginForm.addEventListener("submit", async event => {
  event.preventDefault();
  loginError.hidden = true;
  const adminTab = window.open("about:blank", "_blank");
  if (!adminTab) {
    loginError.textContent = "Permita a abertura de novas abas para acessar o histórico.";
    loginError.hidden = false;
    return;
  }
  adminTab.opener = null;

  try {
    const response = await fetch("/api/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username: document.getElementById("username").value.trim(), password: document.getElementById("password").value }) });
    if (!response.ok) {
      loginError.textContent = response.status === 401 ? "Usuário ou senha inválidos." : "Não foi possível fazer login.";
      loginError.hidden = false;
      adminTab.close();
      return;
    }
    setAdminState(true, document.getElementById("username").value.trim());
    adminModal.hidden = true;
    adminTab.location.replace("/historico-sorteios.html");
  } catch {
    adminTab.close();
    loginError.textContent = "Inicie o servidor com npm start e acesse http://localhost:3000/sorteio-times.html.";
    loginError.hidden = false;
  }
});

mainLogout.addEventListener("click", async () => {
  try {
    const response = await fetch("/api/logout", { method: "POST" });
    if (!response.ok) throw new Error("Não foi possível encerrar a sessão.");
    setAdminState(false);
    showNotice("Você saiu da área administrativa.");
  } catch (error) {
    console.error("Falha ao encerrar a sessão administrativa:", error);
    showNotice("Não foi possível encerrar a sessão. Tente novamente.");
  }
});

if (new URLSearchParams(window.location.search).has("login")) {
  adminAccess.click();
}
