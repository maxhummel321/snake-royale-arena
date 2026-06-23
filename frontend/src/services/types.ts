import type { GameState, Mode } from "@/lib/snake";

export interface User {
  id: string;
  username: string;
}

export interface ScoreEntry {
  id: string;
  userId: string;
  username: string;
  mode: Mode;
  score: number;
  createdAt: number;
}

export interface ActiveGame {
  id: string;
  userId: string;
  username: string;
  mode: Mode;
  score: number;
  state: GameState;
  updatedAt: number;
}

export interface AuthResult {
  user: User;
  token: string;
}

export interface SnakeService {
  // auth
  signup(username: string, password: string): Promise<AuthResult>;
  login(username: string, password: string): Promise<AuthResult>;
  logout(): Promise<void>;
  currentUser(): User | null;

  // leaderboard
  submitScore(mode: Mode, score: number): Promise<ScoreEntry>;
  getLeaderboard(mode: Mode, limit?: number): Promise<ScoreEntry[]>;

  // active games (spectating)
  publishGame(game: Omit<ActiveGame, "id" | "userId" | "username" | "updatedAt">): Promise<ActiveGame>;
  endGame(gameId: string): Promise<void>;
  listActiveGames(): Promise<ActiveGame[]>;
  watchGame(gameId: string, cb: (g: ActiveGame | null) => void): () => void;
  watchActiveGames(cb: (games: ActiveGame[]) => void): () => void;
}
