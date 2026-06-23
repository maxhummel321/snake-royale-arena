import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { api, type ActiveGame } from "@/services";

export const Route = createFileRoute("/watch/")({
  head: () => ({ meta: [{ title: "Watch — Snake" }] }),
  component: WatchListPage,
});

function WatchListPage() {
  const [games, setGames] = useState<ActiveGame[]>([]);

  useEffect(() => {
    const off = api.watchActiveGames(setGames);
    return off;
  }, []);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold">Live games</h1>
      <p className="text-sm text-muted-foreground mt-1">
        Players streaming right now. Click one to spectate.
      </p>

      {games.length === 0 ? (
        <div className="mt-8 rounded-lg border border-dashed border-border p-12 text-center text-muted-foreground">
          No one is playing right now. Open <Link to="/play" className="underline">/play</Link> in another tab to test.
        </div>
      ) : (
        <ul className="mt-6 divide-y divide-border rounded-lg border border-border">
          {games.map((g) => (
            <li key={g.id}>
              <Link
                to="/watch/$id"
                params={{ id: g.id }}
                className="flex items-center justify-between p-4 hover:bg-accent"
              >
                <div>
                  <div className="font-medium">@{g.username}</div>
                  <div className="text-xs text-muted-foreground">
                    {g.mode === "walls" ? "Walls" : "Pass-through"} · updated{" "}
                    {Math.round((Date.now() - g.updatedAt) / 1000)}s ago
                  </div>
                </div>
                <div className="text-2xl font-bold tabular-nums">{g.score}</div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
