import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Snake — multiplayer arena" },
      { name: "description", content: "Play classic snake in walls or wrap mode. Compete on the leaderboard and spectate live games." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16 text-center">
      <h1 className="text-5xl font-bold tracking-tight">Snake, but with friends.</h1>
      <p className="mt-4 text-lg text-muted-foreground">
        Pick a mode, chase the high score, and watch other players in real time.
      </p>
      <div className="mt-8 flex gap-3 justify-center">
        <Link to="/play">
          <Button size="lg">Play now</Button>
        </Link>
        <Link to="/watch">
          <Button size="lg" variant="outline">
            Watch live
          </Button>
        </Link>
        <Link to="/leaderboard">
          <Button size="lg" variant="outline">
            Leaderboard
          </Button>
        </Link>
      </div>
      <div className="mt-16 grid md:grid-cols-2 gap-4 text-left">
        <div className="rounded-lg border border-border p-6">
          <h2 className="font-semibold">Walls mode</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Touch a wall, you're done. Classic and unforgiving.
          </p>
        </div>
        <div className="rounded-lg border border-border p-6">
          <h2 className="font-semibold">Pass-through mode</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Slip off one edge and emerge on the other. Bigger boards of opportunity.
          </p>
        </div>
      </div>
    </div>
  );
}
