import { describe, it, expect } from "vitest";
import {
  BOARD_SIZE,
  changeDirection,
  createInitialState,
  step,
  type GameState,
} from "@/lib/snake";

function withFood(s: GameState, x: number, y: number): GameState {
  return { ...s, food: { x, y } };
}

describe("snake game logic", () => {
  it("creates a 3-cell snake heading right", () => {
    const s = createInitialState("walls");
    expect(s.snake).toHaveLength(3);
    expect(s.direction).toBe("right");
    expect(s.alive).toBe(true);
    expect(s.score).toBe(0);
  });

  it("moves forward without growing when no food", () => {
    let s = createInitialState("walls");
    s = withFood(s, 0, 0); // food far away
    const head = s.snake[0];
    s = step(s);
    expect(s.snake).toHaveLength(3);
    expect(s.snake[0]).toEqual({ x: head.x + 1, y: head.y });
  });

  it("grows and increments score when eating food", () => {
    let s = createInitialState("walls");
    const head = s.snake[0];
    s = withFood(s, head.x + 1, head.y);
    s = step(s);
    expect(s.snake).toHaveLength(4);
    expect(s.score).toBe(10);
  });

  it("ignores reversing direction", () => {
    const s = createInitialState("walls"); // facing right
    const s2 = changeDirection(s, "left");
    expect(s2.direction).toBe("right");
  });

  it("walls mode: dies on wall hit", () => {
    let s = createInitialState("walls");
    s = withFood(s, 0, 0);
    // walk to the right wall
    while (s.alive && s.snake[0].x < BOARD_SIZE - 1) s = step(s);
    expect(s.alive).toBe(true);
    s = step(s); // would go off-board
    expect(s.alive).toBe(false);
  });

  it("wrap mode: wraps around the edge", () => {
    let s = createInitialState("wrap");
    s = withFood(s, 0, 0);
    while (s.snake[0].x < BOARD_SIZE - 1) s = step(s);
    s = step(s);
    expect(s.alive).toBe(true);
    expect(s.snake[0].x).toBe(0);
  });

  it("dies when running into itself", () => {
    // Construct a long-enough snake by hand and U-turn into its own body.
    const s: GameState = {
      snake: [
        { x: 5, y: 5 },
        { x: 4, y: 5 },
        { x: 4, y: 6 },
        { x: 5, y: 6 },
        { x: 6, y: 6 },
        { x: 6, y: 5 },
      ],
      direction: "up",
      food: { x: 0, y: 0 },
      score: 0,
      mode: "wrap",
      alive: true,
      tick: 0,
    };
    // Step up → head {5,4}. Turn right then down → head {6,5} which is body. Collide.
    let s2 = step(s);
    s2 = changeDirection(s2, "right");
    s2 = step(s2);
    s2 = changeDirection(s2, "down");
    s2 = step(s2);
    expect(s2.alive).toBe(false);
  });
});
