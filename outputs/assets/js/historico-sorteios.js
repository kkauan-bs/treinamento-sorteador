const root = document.documentElement;
const themeToggle = document.getElementById("theme-toggle");
const status = document.getElementById("status");
const logList = document.getElementById("log-list");
const logoutButton = document.getElementById("logout");
let lastSessionActivityRequest = 0;

function setTheme(theme) {
  const isDark = theme === "dark";
  root.dataset.theme = isDark ? "dark" : "light";
  themeToggle.textContent = isDark ? "☀️" : "🌙";
  localStorage.setItem("theme", theme);
}

function showStatus(message, isError = false) {
  status.textContent = message;
  status.classList.toggle("error", isError);
}

function createDrawItem(draw) {
  const item = document.createElement("article");
  item.className = "log-item";

  const heading = document.createElement("h2");
  heading.textContent = new Date(draw.createdAt).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });

  const teams = document.createElement("ul");
  draw.teams.forEach(team => {
    const row = document.createElement("li");
    row.textContent = team.name + ": " + team.players.join(", ");
    teams.append(row);
  });

  const deleteButton = document.createElement("button");
  deleteButton.className = "delete-draw";
  deleteButton.type = "button";
  deleteButton.textContent = "Excluir sorteio";
  deleteButton.addEventListener("click", () => deleteDraw(draw.id, deleteButton));

  item.append(heading, teams, deleteButton);
  return item;
}

async function loadDraws(successMessage = "") {
  showStatus("Carregando histórico...");

  try {
    const response = await fetch("/api/draws", { cache: "no-store" });
    if (response.status === 401) {
      showStatus("Sua sessão expirou. Faça login novamente para consultar o histórico.", true);
      return;
    }
    if (!response.ok) {
      const result = await response.json();
      throw new Error(result.error || "Não foi possível carregar o histórico.");
    }

    const draws = await response.json();
    logList.replaceChildren(...draws.map(createDrawItem));
    showStatus(successMessage || (draws.length
      ? "Sorteios realizados: " + draws.length
      : "Nenhum sorteio realizado ainda."));
  } catch (error) {
    console.error("Falha ao carregar o histórico de sorteios:", error);
    showStatus(error.message || "Não foi possível carregar o histórico.", true);
  }
}

async function deleteDraw(drawId, button) {
  if (!window.confirm("Tem certeza de que deseja excluir este sorteio do histórico?")) {
    return;
  }

  button.disabled = true;
  try {
    const response = await fetch("/api/draws/" + encodeURIComponent(drawId), {
      method: "DELETE",
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Não foi possível excluir o sorteio.");
    await loadDraws("Sorteio excluído com sucesso.");
  } catch (error) {
    console.error("Falha ao excluir sorteio:", error);
    showStatus(error.message || "Não foi possível excluir o sorteio.", true);
    button.disabled = false;
  }
}

async function refreshSessionActivity(force = false) {
  if (!force && Date.now() - lastSessionActivityRequest < 60_000) return;
  lastSessionActivityRequest = Date.now();

  try {
    const response = await fetch("/api/session", { cache: "no-store" });
    if (!response.ok) throw new Error("Não foi possível renovar a sessão.");
    const session = await response.json();
    if (!session.authenticated) {
      showStatus("Sua sessão expirou. Faça login novamente para consultar o histórico.", true);
    }
  } catch (error) {
    console.error("Falha ao atualizar a sessão administrativa:", error);
    showStatus("Não foi possível verificar a sessão. Verifique sua conexão e tente novamente.", true);
  }
}

document.addEventListener("pointerdown", () => refreshSessionActivity());
document.addEventListener("keydown", () => refreshSessionActivity());

setTheme(localStorage.getItem("theme") || "light");
themeToggle.addEventListener("click", () => {
  setTheme(root.dataset.theme === "dark" ? "light" : "dark");
});
logoutButton.addEventListener("click", async () => {
  logoutButton.disabled = true;
  try {
    const response = await fetch("/api/logout", { method: "POST" });
    if (!response.ok) throw new Error("Não foi possível encerrar a sessão.");
    window.location.replace("/sorteio-times.html");
  } catch (error) {
    console.error("Falha ao encerrar a sessão:", error);
    showStatus(error.message || "Não foi possível encerrar a sessão.", true);
    logoutButton.disabled = false;
  }
});

refreshSessionActivity(true);
loadDraws();
