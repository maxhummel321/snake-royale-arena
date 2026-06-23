import { BOARD_SIZE, type GameState } from "@/lib/snake";

interface Props {
  state: GameState;
  size?: number; // px
}

export function SnakeBoard({ state, size = 400 }: Props) {
  const cell = size / BOARD_SIZE;
  const headKey = `${state.snake[0]?.x},${state.snake[0]?.y}`;
  const body = new Set(state.snake.slice(1).map((c) => `${c.x},${c.y}`));
  const foodKey = `${state.food.x},${state.food.y}`;

  const cells = [];
  for (let y = 0; y < BOARD_SIZE; y++) {
    for (let x = 0; x < BOARD_SIZE; x++) {
      const k = `${x},${y}`;
      let cls = "";
      if (k === headKey) cls = "bg-primary";
      else if (body.has(k)) cls = "bg-primary/60";
      else if (k === foodKey) cls = "bg-destructive rounded-full";
      cells.push(
        <div
          key={k}
          className={cls}
          style={{
            gridColumn: x + 1,
            gridRow: y + 1,
          }}
        />,
      );
    }
  }

  return (
    <div
      className="grid border border-border rounded-md bg-muted/30 p-1"
      style={{
        gridTemplateColumns: `repeat(${BOARD_SIZE}, ${cell}px)`,
        gridTemplateRows: `repeat(${BOARD_SIZE}, ${cell}px)`,
        width: size + 8,
        height: size + 8,
      }}
    >
      {cells}
    </div>
  );
}
