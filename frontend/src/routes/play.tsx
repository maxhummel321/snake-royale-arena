import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/services";
import {
  changeDirection,
  createInitialState,
  step,
  type Direction,
  type GameState,
  type Mode,
} from "@/lib/snake";
import { SnakeBoard } from "@/components/SnakeBoard";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/play")({
  head: () => ({ meta: [{ title: "Play — Snake" }] }),
  component: PlayPage,
});

const TICK_MS = 120;

function PlayPage() {
  const { user } = useAuth();
  const [mode, setMode] = useState<Mode>("walls");
  const [state, setState] = useState<GameState>(() => createInitialState("walls"));
  const [running, setRunning] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const gameIdRef = useRef<string | null>(null);
  const stateRef = useRef(state);
  stateRef.current = state;

  const reset = useCallback(
    (m: Mode = mode) => {
      setMode(m);
      setState(createInitialState(m));
      setSubmitted(false);
      setRunning(false);
    },
    [mode],
  );

  // Keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const map: Record<string, Direction> = {
        ArrowUp: "up",
        ArrowDown: "down",
        ArrowLeft: "left",
        ArrowRight: "right",
        w: "up",
        s: "down",
        a: "left",
        d: "right",
      };
      const d = map[e.key];
      if (d) {
        e.preventDefault();
        setState((s) => changeDirection(s, d));
      } else if (e.key === " ") {
        e.preventDefault();
        setRunning((r) => !r);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Tick
  useEffect(() => {
    if (!running) return;
    const iv = setInterval(() => {
      setState((s) => step(s));
    }, TICK_MS);
    return () => clearInterval(iv);
  }, [running]);

  // Publish live game for spectators (every ~500ms)
  useEffect(() => {
    if (!user || !running) return;
    const iv = setInterval(() => {
      const s = stateRef.current;
      api
        .publishGame({ mode: s.mode, score: s.score, state: s })
        .then((g) => {
          gameIdRef.current = g.id;
        })
        .catch(() => {});
    }, 500);
    return () => clearInterval(iv);
  }, [user, running]);

  // On game over: submit score, end live game
  useEffect(() => {
    if (state.alive || submitted) return;
    setRunning(false);
    if (user && state.score > 0) {
      api.submitScore(state.mode, state.score).catch(() => {});
    }
    if (gameIdRef.current) {
      api.endGame(gameIdRef.current).catch(() => {});
      gameIdRef.current = null;
    }
    setSubmitted(true);
  }, [state.alive, state.score, state.mode, submitted, user]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (gameIdRef.current) api.endGame(gameIdRef.current).catch(() => {});
    };
  }, []);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Play</h1>
          <p className="text-sm text-muted-foreground">
            Arrows / WASD to move. Space to pause.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant={mode === "walls" ? "default" : "outline"} onClick={() => reset("walls")}>
            Walls
          </Button>
          <Button variant={mode === "wrap" ? "default" : "outline"} onClick={() => reset("wrap")}>
            Pass-through
          </Button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row items-start gap-6">
        <SnakeBoard state={state} />
        <div className="flex-1 space-y-4 min-w-[200px]">
          <div className="rounded-lg border border-border p-4">
            <div className="text-sm text-muted-foreground">Score</div>
            <div className="text-3xl font-bold">{state.score}</div>
            <div className="text-xs text-muted-foreground mt-1">
              Mode: {state.mode === "walls" ? "Walls" : "Pass-through"}
            </div>
          </div>

          {!user && (
            <div className="rounded-lg border border-border p-4 text-sm">
              <Link to="/login" className="underline">
                Log in
              </Link>{" "}
              to publish scores and stream your game to spectators.
            </div>
          )}

          {state.alive ? (
            <Button className="w-full" onClick={() => setRunning((r) => !r)}>
              {running ? "Pause" : "Start"}
            </Button>
          ) : (
            <div className="space-y-2">
              <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm">
                Game over. Final score: <span className="font-semibold">{state.score}</span>.
              </div>
              <Button className="w-full" onClick={() => reset()}>
                Play again
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
