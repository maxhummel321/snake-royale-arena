import { describe, it, expect, beforeEach } from "vitest";
import { MockSnakeService } from "@/services/mockApi";
import { createInitialState } from "@/lib/snake";

describe("MockSnakeService", () => {
  let svc: MockSnakeService;

  beforeEach(() => {
    localStorage.clear();
    svc = new MockSnakeService();
  });

  it("signs up a new user and persists session", async () => {
    const { user } = await svc.signup("alice", "pass123");
    expect(user.username).toBe("alice");
    expect(svc.currentUser()?.id).toBe(user.id);
  });

  it("rejects duplicate usernames", async () => {
    await svc.signup("alice", "pass123");
    await expect(svc.signup("alice", "pass123")).rejects.toThrow(/taken/i);
  });

  it("logs in with correct password, rejects bad password", async () => {
    await svc.signup("bob", "secret");
    await svc.logout();
    await expect(svc.login("bob", "wrong")).rejects.toThrow(/invalid/i);
    const { user } = await svc.login("bob", "secret");
    expect(user.username).toBe("bob");
  });

  it("submits and ranks leaderboard scores per mode", async () => {
    await svc.signup("alice", "pass1");
    await svc.submitScore("walls", 30);
    await svc.submitScore("walls", 100);
    await svc.submitScore("wrap", 50);

    const walls = await svc.getLeaderboard("walls");
    expect(walls.map((s) => s.score)).toEqual([100, 30]);

    const wrap = await svc.getLeaderboard("wrap");
    expect(wrap.map((s) => s.score)).toEqual([50]);
  });

  it("requires auth to submit a score", async () => {
    await expect(svc.submitScore("walls", 10)).rejects.toThrow(/auth/i);
  });

  it("publishes an active game and lists it", async () => {
    await svc.signup("alice", "pass1");
    const state = createInitialState("walls");
    const game = await svc.publishGame({ mode: "walls", score: 0, state });
    const active = await svc.listActiveGames();
    expect(active).toHaveLength(1);
    expect(active[0].id).toBe(game.id);
    expect(active[0].username).toBe("alice");
  });

  it("reuses the same game id for the same user", async () => {
    await svc.signup("alice", "pass1");
    const state = createInitialState("walls");
    const a = await svc.publishGame({ mode: "walls", score: 0, state });
    const b = await svc.publishGame({ mode: "walls", score: 20, state });
    expect(a.id).toBe(b.id);
    const active = await svc.listActiveGames();
    expect(active).toHaveLength(1);
    expect(active[0].score).toBe(20);
  });

  it("removes the game on endGame", async () => {
    await svc.signup("alice", "pass1");
    const game = await svc.publishGame({ mode: "wrap", score: 0, state: createInitialState("wrap") });
    await svc.endGame(game.id);
    expect(await svc.listActiveGames()).toHaveLength(0);
  });
});
