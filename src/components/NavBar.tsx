import { Link } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

export function NavBar() {
  const { user, logout } = useAuth();
  return (
    <header className="border-b border-border bg-card">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-6">
        <Link to="/" className="font-bold text-lg tracking-tight">
          🐍 Snake
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link to="/play" className="hover:text-primary [&.active]:text-primary">
            Play
          </Link>
          <Link to="/watch" className="hover:text-primary [&.active]:text-primary">
            Watch
          </Link>
          <Link to="/leaderboard" className="hover:text-primary [&.active]:text-primary">
            Leaderboard
          </Link>
        </nav>
        <div className="ml-auto flex items-center gap-3 text-sm">
          {user ? (
            <>
              <span className="text-muted-foreground">@{user.username}</span>
              <Button size="sm" variant="outline" onClick={() => logout()}>
                Log out
              </Button>
            </>
          ) : (
            <>
              <Link to="/login">
                <Button size="sm" variant="outline">
                  Log in
                </Button>
              </Link>
              <Link to="/signup">
                <Button size="sm">Sign up</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
