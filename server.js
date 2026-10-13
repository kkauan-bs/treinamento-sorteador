const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const { DatabaseSync } = require("node:sqlite");
const bcrypt = require("bcryptjs");
const express = require("express");

const app = express();
const host = process.env.HOST || "127.0.0.1";
const port = Number(process.env.PORT || 3000);
const isProduction = process.env.NODE_ENV === "production";
const sessionIdleTimeoutMs = 30 * 60 * 1000;
const sessionIdleTimeoutSeconds = sessionIdleTimeoutMs / 1000;
const loginWindowMs = 15 * 60 * 1000;
const loginAttemptLimit = 5;
const cookieName = "sorteador.sid";
const staticDirectory = path.join(__dirname, "outputs");
const dataDirectory = path.join(__dirname, "data");
const databasePath = path.join(dataDirectory, "sorteios.db");

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("A variável PORT precisa ser um número entre 1 e 65535.");
}

if (!fs.existsSync(path.join(staticDirectory, "sorteio-times.html"))) {
  throw new Error(`Não encontrei a página do sorteador em ${staticDirectory}.`);
}

fs.mkdirSync(dataDirectory, { recursive: true });

const database = new DatabaseSync(databasePath);
database.exec(`
  PRAGMA foreign_keys = ON;
  CREATE TABLE IF NOT EXISTS draws (
    id INTEGER PRIMARY KEY,
    created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS teams (
    id INTEGER PRIMARY KEY,
    draw_id INTEGER NOT NULL REFERENCES draws(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    position INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS players (
    id INTEGER PRIMARY KEY,
    team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    position INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS admin_sessions (
    token_hash TEXT PRIMARY KEY,
    created_at INTEGER NOT NULL,
    last_activity_at INTEGER NOT NULL,
    expires_at INTEGER NOT NULL
  );
`);

const insertDraw = database.prepare(
  "INSERT INTO draws (created_at) VALUES (?)",
);
const insertTeam = database.prepare(
  "INSERT INTO teams (draw_id, name, position) VALUES (?, ?, ?)",
);
const insertPlayer = database.prepare(
  "INSERT INTO players (team_id, name, position) VALUES (?, ?, ?)",
);
const listDraws = database.prepare(
  "SELECT id, created_at AS createdAt FROM draws ORDER BY id DESC",
);
const listTeams = database.prepare(
  "SELECT id, name FROM teams WHERE draw_id = ? ORDER BY position",
);
const listPlayers = database.prepare(
  "SELECT name FROM players WHERE team_id = ? ORDER BY position",
);
const insertSession = database.prepare(
  "INSERT INTO admin_sessions (token_hash, created_at, last_activity_at, expires_at) VALUES (?, ?, ?, ?)",
);
const findSession = database.prepare(
  "SELECT last_activity_at AS lastActivityAt, expires_at AS expiresAt FROM admin_sessions WHERE token_hash = ?",
);
const refreshSession = database.prepare(
  "UPDATE admin_sessions SET last_activity_at = ?, expires_at = ? WHERE token_hash = ?",
);
const deleteSession = database.prepare(
  "DELETE FROM admin_sessions WHERE token_hash = ?",
);
const deleteExpiredSessions = database.prepare(
  "DELETE FROM admin_sessions WHERE expires_at <= ?",
);
const deleteDraw = database.prepare("DELETE FROM draws WHERE id = ?");
deleteExpiredSessions.run(Date.now());

const loginAttempts = new Map();
const username = (process.env.ADMIN_USER || "admin").trim();
const password = process.env.ADMIN_PASSWORD || "admin123";

if (
  isProduction &&
  (!process.env.ADMIN_USER || !process.env.ADMIN_PASSWORD || password.length < 12)
) {
  throw new Error(
    "Em produção, defina ADMIN_USER e ADMIN_PASSWORD com uma senha de pelo menos 12 caracteres.",
  );
}

const passwordHash = bcrypt.hashSync(password, 10);

app.disable("x-powered-by");
app.use(express.json({ limit: "16kb", strict: true }));

function getCookie(request, name) {
  const cookieHeader = request.headers.cookie;
  if (!cookieHeader) return null;

  for (const entry of cookieHeader.split(";")) {
    const separator = entry.indexOf("=");
    if (separator === -1) continue;
    if (entry.slice(0, separator).trim() !== name) continue;

    try {
      return decodeURIComponent(entry.slice(separator + 1).trim());
    } catch {
      return null;
    }
  }

  return null;
}

function setSessionCookie(response, token) {
  const attributes = [
    `${cookieName}=${encodeURIComponent(token)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${sessionIdleTimeoutSeconds}`,
  ];

  if (isProduction) attributes.push("Secure");
  response.setHeader("Set-Cookie", attributes.join("; "));
}

function clearSessionCookie(response) {
  const attributes = [
    `${cookieName}=`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    "Max-Age=0",
  ];

  if (isProduction) attributes.push("Secure");
  response.setHeader("Set-Cookie", attributes.join("; "));
}

function touchAdminSession(request, response) {
  const token = getCookie(request, cookieName);
  if (!token) return false;

  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const session = findSession.get(tokenHash);
  if (!session) return false;

  const now = Date.now();
  if (
    session.expiresAt <= now ||
    now - session.lastActivityAt >= sessionIdleTimeoutMs
  ) {
    deleteSession.run(tokenHash);
    return false;
  }

  refreshSession.run(now, now + sessionIdleTimeoutMs, tokenHash);
  setSessionCookie(response, token);
  return true;
}

function requireAdminApi(request, response, next) {
  response.set("Cache-Control", "no-store");
  if (touchAdminSession(request, response)) return next();

  clearSessionCookie(response);
  return response.status(401).json({ error: "Faça login para acessar esta área." });
}

function getLoginAttemptState(ipAddress) {
  const now = Date.now();
  const state = loginAttempts.get(ipAddress);

  if (!state || state.resetAt <= now) {
    return { attempts: 0, resetAt: now + loginWindowMs };
  }

  return state;
}

function validateTeams(teams) {
  if (!Array.isArray(teams) || teams.length < 2 || teams.length > 40) {
    return null;
  }

  const validatedTeams = [];
  let totalPlayers = 0;

  for (const team of teams) {
    if (!team || typeof team !== "object" || Array.isArray(team)) return null;
    if (typeof team.name !== "string" || !Array.isArray(team.players)) return null;
    if (team.players.length < 1 || team.players.length > 40) return null;

    const name = team.name.trim();
    const players = team.players.map(player =>
      typeof player === "string" ? player.trim() : "",
    );

    if (name.length > 40 || players.some(player => !player || player.length > 40)) {
      return null;
    }

    totalPlayers += players.length;
    if (totalPlayers > 40) return null;

    validatedTeams.push({ name, players });
  }

  const expectedTeamSize = validatedTeams[0].players.length;
  if (validatedTeams.some(team => team.players.length !== expectedTeamSize)) {
    return null;
  }

  return validatedTeams;
}

app.post("/api/login", async (request, response, next) => {
  response.set("Cache-Control", "no-store");
  try {
    const body = request.body;
    const ipAddress = request.ip;
    const attemptState = getLoginAttemptState(ipAddress);

    if (attemptState.attempts >= loginAttemptLimit) {
      const retryAfter = Math.max(
        1,
        Math.ceil((attemptState.resetAt - Date.now()) / 1000),
      );
      response.set("Retry-After", String(retryAfter));
      return response.status(429).json({ error: "Muitas tentativas. Tente novamente mais tarde." });
    }

    const submittedUsername =
      body && typeof body.username === "string" ? body.username.trim() : "";
    const submittedPassword =
      body && typeof body.password === "string" ? body.password : "";
    const passwordMatches = await bcrypt.compare(submittedPassword, passwordHash);

    if (submittedUsername !== username || !passwordMatches) {
      attemptState.attempts += 1;
      loginAttempts.set(ipAddress, attemptState);
      return response.status(401).json({ error: "Usuário ou senha inválidos." });
    }

    loginAttempts.delete(ipAddress);
    const token = crypto.randomBytes(32).toString("base64url");
    const now = Date.now();
    deleteExpiredSessions.run(now);
    insertSession.run(
      crypto.createHash("sha256").update(token).digest("hex"),
      now,
      now,
      now + sessionIdleTimeoutMs,
    );
    setSessionCookie(response, token);
    response.set("Cache-Control", "no-store");
    return response.json({ authenticated: true });
  } catch (error) {
    return next(error);
  }
});

app.post("/api/draws", (request, response) => {
  const teams = validateTeams(request.body && request.body.teams);

  if (!teams) {
    return response.status(400).json({ error: "Os dados do sorteio são inválidos." });
  }

  try {
    database.exec("BEGIN");
    const drawResult = insertDraw.run(new Date().toISOString());
    const drawId = Number(drawResult.lastInsertRowid);

    teams.forEach((team, teamIndex) => {
      const teamResult = insertTeam.run(drawId, team.name, teamIndex);
      const teamId = Number(teamResult.lastInsertRowid);
      team.players.forEach((player, playerIndex) => {
        insertPlayer.run(teamId, player, playerIndex);
      });
    });

    database.exec("COMMIT");
    return response.status(201).json({ saved: true });
  } catch (error) {
    try {
      database.exec("ROLLBACK");
    } catch (rollbackError) {
      console.error("Falha ao desfazer o registro incompleto do sorteio:", rollbackError);
    }
    console.error("Falha ao salvar sorteio no banco SQLite:", error);
    return response.status(500).json({ error: "Não foi possível salvar o sorteio." });
  }
});

app.get("/api/session", (request, response, next) => {
  try {
    const authenticated = touchAdminSession(request, response);
    if (!authenticated) clearSessionCookie(response);
    response.set("Cache-Control", "no-store");
    return response.json({ authenticated, username: authenticated ? username : null });
  } catch (error) {
    return next(error);
  }
});

app.post("/api/logout", (request, response, next) => {
  try {
    const token = getCookie(request, cookieName);
    if (token) {
      const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
      deleteSession.run(tokenHash);
    }

    clearSessionCookie(response);
    response.set("Cache-Control", "no-store");
    return response.json({ loggedOut: true });
  } catch (error) {
    return next(error);
  }
});

app.get("/api/draws", requireAdminApi, (request, response, next) => {
  try {
    const draws = listDraws.all().map(draw => ({
      id: draw.id,
      createdAt: draw.createdAt,
      teams: listTeams.all(draw.id).map(team => ({
        name: team.name,
        players: listPlayers.all(team.id).map(player => player.name),
      })),
    }));

    return response.json(draws);
  } catch (error) {
    return next(error);
  }
});

app.delete("/api/draws/:drawId", requireAdminApi, (request, response, next) => {
  const { drawId: rawDrawId } = request.params;
  if (!/^\d+$/.test(rawDrawId)) {
    return response.status(400).json({ error: "O identificador do sorteio é inválido." });
  }

  const drawId = Number(rawDrawId);
  if (!Number.isSafeInteger(drawId) || drawId < 1) {
    return response.status(400).json({ error: "O identificador do sorteio é inválido." });
  }

  try {
    const result = deleteDraw.run(drawId);
    if (result.changes === 0) {
      return response.status(404).json({ error: "Esse sorteio não foi encontrado." });
    }

    return response.json({ deleted: true });
  } catch (error) {
    return next(error);
  }
});

app.get("/historico-sorteios.html", (request, response, next) => {
  try {
    if (!touchAdminSession(request, response)) {
      clearSessionCookie(response);
      return response.redirect(303, "/sorteio-times.html?login=1");
    }

    response.set("Cache-Control", "no-store");
    return response.sendFile(path.join(staticDirectory, "historico-sorteios.html"));
  } catch (error) {
    return next(error);
  }
});

app.get("/", (request, response) => {
  response.redirect("/sorteio-times.html");
});

app.use(express.static(staticDirectory, { index: false }));

app.use((error, request, response, next) => {
  if (response.headersSent) return next(error);

  if (error.type === "entity.parse.failed") {
    return response.status(400).json({ error: "O corpo da requisição contém JSON inválido." });
  }

  if (error.type === "entity.too.large") {
    return response.status(413).json({ error: "A requisição excede o tamanho permitido." });
  }

  console.error("Erro não tratado no servidor:", error);
  return response.status(500).json({ error: "Ocorreu um erro interno no servidor." });
});

const server = app.listen(port, host, () => {
  console.log(`Sorteador disponível em http://${host}:${port}`);
  console.log(`Banco de dados: ${databasePath}`);
  if (!isProduction && password === "admin123") {
    console.log("Acesso inicial da área administrativa: admin / admin123");
  }
});

function shutdown(signal) {
  console.log(`\n${signal} recebido. Encerrando o servidor...`);
  server.close(error => {
    if (error) {
      console.error("Falha ao encerrar o servidor HTTP:", error);
      process.exitCode = 1;
    }

    try {
      database.close();
    } catch (databaseError) {
      console.error("Falha ao fechar o banco SQLite:", databaseError);
      process.exitCode = 1;
    }
  });
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
