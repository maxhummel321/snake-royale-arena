import type { ActiveGame, AuthResult, ScoreEntry, SnakeService, User } from "./types";
import type { Mode } from "@/lib/snake";

const LS_USERS = "snake:users";
const LS_SESSION = "snake:session";
const LS_SCORES = "snake:scores";
const LS_GAMES = "snake:games";
const CHANNEL = "snake:events";

type StoredUser = { id: string; username: string; passwordHash: string };

function hash(s: string): string {
  // tiny non-crypto hash; mock only
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return String(h);
}

function read<T>(key: string, fallback: T): T {
  if (typeof localStorage === "undefined") return fallback;
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
}
function write<T>(key: string, value: T) {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

function delay<T>(v: T, ms = 80): Promise<T> {
  return new Promise((r) => setTimeout(() => r(v), ms));
}

type ChannelEvent =
  | { type: "games" }
  | { type: "scores" };

class Channel {
  private bc: BroadcastChannel | null = null;
  private listeners = new Set<(e: ChannelEvent) => void>();
  constructor() {
    if (typeof BroadcastChannel !== "undefined") {
      this.bc = new BroadcastChannel(CHANNEL);
      this.bc.onmessage = (e) => {
        for (const l of this.listeners) l(e.data as ChannelEvent);
      };
    }
  }
  emit(e: ChannelEvent) {
    if (this.bc) this.bc.postMessage(e);
    for (const l of this.listeners) l(e);
  }
  on(cb: (e: ChannelEvent) => void) {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }
}

export class MockSnakeService implements SnakeService {
  private channel = new Channel();

  async signup(username: string, password: string): Promise<AuthResult> {
    username = username.trim();
    if (username.length < 2) throw new Error("Username too short");
    if (password.length < 4) throw new Error("Password too short");
    const users = read<StoredUser[]>(LS_USERS, []);
    if (users.some((u) => u.username.toLowerCase() === username.toLowerCase()))
      throw new Error("Username taken");
    const u: StoredUser = { id: uid(), username, passwordHash: hash(password) };
    users.push(u);
    write(LS_USERS, users);
    const user: User = { id: u.id, username: u.username };
    const token = uid();
    write(LS_SESSION, { user, token });
    return delay({ user, token });
  }

  async login(username: string, password: string): Promise<AuthResult> {
    const users = read<StoredUser[]>(LS_USERS, []);
    const u = users.find((x) => x.username.toLowerCase() === username.trim().toLowerCase());
    if (!u || u.passwordHash !== hash(password)) throw new Error("Invalid credentials");
    const user: User = { id: u.id, username: u.username };
    const token = uid();
    write(LS_SESSION, { user, token });
    return delay({ user, token });
  }

  async logout(): Promise<void> {
    if (typeof localStorage !== "undefined") localStorage.removeItem(LS_SESSION);
  }

  currentUser(): User | null {
    const s = read<{ user: User; token: string } | null>(LS_SESSION, null);
    return s?.user ?? null;
  }

  async submitScore(mode: Mode, score: number): Promise<ScoreEntry> {
    const user = this.currentUser();
    if (!user) throw new Error("Not authenticated");
    const entry: ScoreEntry = {
      id: uid(),
      userId: user.id,
      username: user.username,
      mode,
      score,
      createdAt: Date.now(),
    };
    const scores = read<ScoreEntry[]>(LS_SCORES, []);
    scores.push(entry);
    write(LS_SCORES, scores);
    this.channel.emit({ type: "scores" });
    return delay(entry);
  }

  async getLeaderboard(mode: Mode, limit = 10): Promise<ScoreEntry[]> {
    const scores = read<ScoreEntry[]>(LS_SCORES, []);
    return delay(
      scores
        .filter((s) => s.mode === mode)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit),
    );
  }

  async publishGame(g: { mode: Mode; score: number; state: any }): Promise<ActiveGame> {
    const user = this.currentUser();
    if (!user) throw new Error("Not authenticated");
    const games = read<ActiveGame[]>(LS_GAMES, []);
    // one active game per user
    const existing = games.find((x) => x.userId === user.id);
    const game: ActiveGame = {
      id: existing?.id ?? uid(),
      userId: user.id,
      username: user.username,
      mode: g.mode,
      score: g.score,
      state: g.state,
      updatedAt: Date.now(),
    };
    const next = games.filter((x) => x.id !== game.id);
    next.push(game);
    // prune stale (>30s)
    const fresh = next.filter((x) => Date.now() - x.updatedAt < 30_000);
    write(LS_GAMES, fresh);
    this.channel.emit({ type: "games" });
    return game;
  }

  async endGame(gameId: string): Promise<void> {
    const games = read<ActiveGame[]>(LS_GAMES, []);
    write(
      LS_GAMES,
      games.filter((x) => x.id !== gameId),
    );
    this.channel.emit({ type: "games" });
  }

  async listActiveGames(): Promise<ActiveGame[]> {
    const games = read<ActiveGame[]>(LS_GAMES, []);
    return games.filter((g) => Date.now() - g.updatedAt < 30_000);
  }

  watchGame(gameId: string, cb: (g: ActiveGame | null) => void): () => void {
    const fire = () => {
      const games = read<ActiveGame[]>(LS_GAMES, []);
      cb(games.find((g) => g.id === gameId) ?? null);
    };
    fire();
    const off = this.channel.on((e) => {
      if (e.type === "games") fire();
    });
    const iv = setInterval(fire, 500);
    return () => {
      off();
      clearInterval(iv);
    };
  }

  watchActiveGames(cb: (games: ActiveGame[]) => void): () => void {
    const fire = () => {
      this.listActiveGames().then(cb);
    };
    fire();
    const off = this.channel.on((e) => {
      if (e.type === "games") fire();
    });
    const iv = setInterval(fire, 1000);
    return () => {
      off();
      clearInterval(iv);
    };
  }
}
