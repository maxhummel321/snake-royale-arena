import { API_BASE_URL } from "@/config";
import type { ActiveGame, AuthResult, ScoreEntry, SnakeService, User } from "./types";
import type { Mode } from "@/lib/snake";

const LS_SESSION = "snake:session";

interface Session {
  user: User;
  token: string;
}

function readSession(): Session | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(LS_SESSION);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

function writeSession(session: Session | null): void {
  if (typeof localStorage === "undefined") return;
  if (session) localStorage.setItem(LS_SESSION, JSON.stringify(session));
  else localStorage.removeItem(LS_SESSION);
}

/**
 * Real backend client. Implements the same SnakeService interface as the mock,
 * but talks to the FastAPI backend over HTTP (see openapi.yaml). The auth token
 * and current user are cached in localStorage so currentUser() can stay
 * synchronous and the token can be attached to authenticated requests.
 */
export class ApiSnakeService implements SnakeService {
  private user: User | null;
  private token: string | null;

  constructor() {
    const session = readSession();
    this.user = session?.user ?? null;
    this.token = session?.token ?? null;
  }

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(init.headers as Record<string, string> | undefined),
    };
    if (this.token) headers["Authorization"] = `Bearer ${this.token}`;

    const res = await fetch(`${API_BASE_URL}${path}`, { ...init, headers });

    if (res.status === 204) return undefined as T;

    const text = await res.text();
    const data = text ? JSON.parse(text) : null;

    if (!res.ok) {
      const detail = data && typeof data.detail === "string" ? data.detail : null;
      throw new Error(detail ?? `Request failed (${res.status})`);
    }
    return data as T;
  }

  private setSession(result: AuthResult | null): void {
    if (result) {
      this.user = result.user;
      this.token = result.token;
      writeSession({ user: result.user, token: result.token });
    } else {
      this.user = null;
      this.token = null;
      writeSession(null);
    }
  }

  // ---- auth ----

  async signup(username: string, password: string): Promise<AuthResult> {
    const result = await this.request<AuthResult>("/api/auth/signup", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
    this.setSession(result);
    return result;
  }

  async login(username: string, password: string): Promise<AuthResult> {
    const result = await this.request<AuthResult>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
    this.setSession(result);
    return result;
  }

  async logout(): Promise<void> {
    try {
      if (this.token) await this.request<void>("/api/auth/logout", { method: "POST" });
    } finally {
      this.setSession(null);
    }
  }

  currentUser(): User | null {
    return this.user;
  }

  // ---- leaderboard ----

  async submitScore(mode: Mode, score: number): Promise<ScoreEntry> {
    return this.request<ScoreEntry>("/api/leaderboard", {
      method: "POST",
      body: JSON.stringify({ mode, score }),
    });
  }

  async getLeaderboard(mode: Mode, limit = 10): Promise<ScoreEntry[]> {
    const params = new URLSearchParams({ mode, limit: String(limit) });
    return this.request<ScoreEntry[]>(`/api/leaderboard?${params.toString()}`);
  }

  // ---- active games (spectating) ----

  async publishGame(
    game: Omit<ActiveGame, "id" | "userId" | "username" | "updatedAt">,
  ): Promise<ActiveGame> {
    return this.request<ActiveGame>("/api/games", {
      method: "POST",
      body: JSON.stringify(game),
    });
  }

  async endGame(gameId: string): Promise<void> {
    await this.request<void>(`/api/games/${gameId}`, { method: "DELETE" });
  }

  async listActiveGames(): Promise<ActiveGame[]> {
    return this.request<ActiveGame[]>("/api/games/active");
  }

  watchGame(gameId: string, cb: (g: ActiveGame | null) => void): () => void {
    let stopped = false;
    const tick = async () => {
      try {
        const game = await this.request<ActiveGame>(`/api/games/${gameId}`);
        if (!stopped) cb(game);
      } catch {
        if (!stopped) cb(null); // 404 / gone
      }
    };
    void tick();
    const iv = setInterval(tick, 500);
    return () => {
      stopped = true;
      clearInterval(iv);
    };
  }

  watchActiveGames(cb: (games: ActiveGame[]) => void): () => void {
    let stopped = false;
    const tick = async () => {
      try {
        const games = await this.listActiveGames();
        if (!stopped) cb(games);
      } catch {
        if (!stopped) cb([]);
      }
    };
    void tick();
    const iv = setInterval(tick, 1000);
    return () => {
      stopped = true;
      clearInterval(iv);
    };
  }
}
