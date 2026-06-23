import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { api, type ScoreEntry } from "@/services";
import type { Mode } from "@/lib/snake";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/leaderboard")({
  head: () => ({ meta: [{ title: "Leaderboard — Snake" }] }),
  component: LeaderboardPage,
});

function LeaderboardPage() {
  const [mode, setMode] = useState<Mode>("walls");
  const [scores, setScores] = useState<ScoreEntry[]>([]);

  useEffect(() => {
    let cancelled = false;
    api.getLeaderboard(mode, 20).then((s) => {
      if (!cancelled) setScores(s);
    });
    return () => {
      cancelled = true;
    };
  }, [mode]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-2xl font-bold">Leaderboard</h1>
        <div className="flex gap-2">
          <Button variant={mode === "walls" ? "default" : "outline"} onClick={() => setMode("walls")}>
            Walls
          </Button>
          <Button variant={mode === "wrap" ? "default" : "outline"} onClick={() => setMode("wrap")}>
            Pass-through
          </Button>
        </div>
      </div>

      {scores.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-12 text-center text-muted-foreground">
          No scores yet for this mode. Be the first.
        </div>
      ) : (
        <ol className="rounded-lg border border-border divide-y divide-border">
          {scores.map((s, i) => (
            <li key={s.id} className="flex items-center gap-4 p-4">
              <div className="w-8 text-center text-muted-foreground font-mono">{i + 1}</div>
              <div className="flex-1">
                <div className="font-medium">@{s.username}</div>
                <div className="text-xs text-muted-foreground">
                  {new Date(s.createdAt).toLocaleString()}
                </div>
              </div>
              <div className="text-2xl font-bold tabular-nums">{s.score}</div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
