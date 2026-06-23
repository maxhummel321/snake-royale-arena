import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { api, type ActiveGame } from "@/services";
import { SnakeBoard } from "@/components/SnakeBoard";

export const Route = createFileRoute("/watch/$id")({
  head: () => ({ meta: [{ title: "Spectating — Snake" }] }),
  component: WatchOnePage,
});

function WatchOnePage() {
  const { id } = Route.useParams();
  const [game, setGame] = useState<ActiveGame | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    setMissing(false);
    const off = api.watchGame(id, (g) => {
      if (!g) setMissing(true);
      else {
        setGame(g);
        setMissing(false);
      }
    });
    return off;
  }, [id]);

  if (missing && !game) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold">Game not found</h1>
        <p className="text-muted-foreground mt-2">The player may have finished.</p>
        <Link to="/watch" className="underline mt-4 inline-block">
          Back to live games
        </Link>
      </div>
    );
  }

  if (!game) {
    return <div className="max-w-3xl mx-auto px-4 py-16 text-center text-muted-foreground">Loading…</div>;
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">@{game.username}</h1>
          <p className="text-sm text-muted-foreground">
            {game.mode === "walls" ? "Walls" : "Pass-through"} mode · spectating live
            {missing && " · player disconnected"}
          </p>
        </div>
        <div className="text-right">
          <div className="text-xs text-muted-foreground">Score</div>
          <div className="text-3xl font-bold tabular-nums">{game.score}</div>
        </div>
      </div>
      <SnakeBoard state={game.state} />
      <Link to="/watch" className="underline text-sm mt-4 inline-block">
        ← All live games
      </Link>
    </div>
  );
}
