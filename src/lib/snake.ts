export type Mode = "walls" | "wrap";
export type Direction = "up" | "down" | "left" | "right";
export type Cell = { x: number; y: number };

export const BOARD_SIZE = 20;

export interface GameState {
  snake: Cell[]; // head at index 0
  direction: Direction;
  food: Cell;
  score: number;
  mode: Mode;
  alive: boolean;
  tick: number;
}

const DIRS: Record<Direction, Cell> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

const OPPOSITE: Record<Direction, Direction> = {
  up: "down",
  down: "up",
  left: "right",
  right: "left",
};

export function randomFood(snake: Cell[], size = BOARD_SIZE): Cell {
  const taken = new Set(snake.map((c) => `${c.x},${c.y}`));
  const free: Cell[] = [];
  for (let x = 0; x < size; x++) {
    for (let y = 0; y < size; y++) {
      if (!taken.has(`${x},${y}`)) free.push({ x, y });
    }
  }
  if (free.length === 0) return { x: 0, y: 0 };
  return free[Math.floor(Math.random() * free.length)];
}

export function createInitialState(mode: Mode, size = BOARD_SIZE): GameState {
  const mid = Math.floor(size / 2);
  const snake: Cell[] = [
    { x: mid, y: mid },
    { x: mid - 1, y: mid },
    { x: mid - 2, y: mid },
  ];
  return {
    snake,
    direction: "right",
    food: randomFood(snake, size),
    score: 0,
    mode,
    alive: true,
    tick: 0,
  };
}

export function changeDirection(state: GameState, next: Direction): GameState {
  if (OPPOSITE[state.direction] === next || state.direction === next) return state;
  return { ...state, direction: next };
}

export function step(state: GameState, size = BOARD_SIZE): GameState {
  if (!state.alive) return state;
  const d = DIRS[state.direction];
  const head = state.snake[0];
  let nx = head.x + d.x;
  let ny = head.y + d.y;

  if (state.mode === "wrap") {
    nx = (nx + size) % size;
    ny = (ny + size) % size;
  } else if (nx < 0 || ny < 0 || nx >= size || ny >= size) {
    return { ...state, alive: false, tick: state.tick + 1 };
  }

  const newHead = { x: nx, y: ny };
  const ate = newHead.x === state.food.x && newHead.y === state.food.y;
  const newSnake = [newHead, ...state.snake];
  if (!ate) newSnake.pop();

  // self collision (head against any body segment)
  for (let i = 1; i < newSnake.length; i++) {
    if (newSnake[i].x === newHead.x && newSnake[i].y === newHead.y) {
      return { ...state, alive: false, tick: state.tick + 1 };
    }
  }

  return {
    ...state,
    snake: newSnake,
    score: state.score + (ate ? 10 : 0),
    food: ate ? randomFood(newSnake, size) : state.food,
    tick: state.tick + 1,
  };
}
