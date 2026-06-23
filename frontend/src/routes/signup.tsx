import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/signup")({
  head: () => ({ meta: [{ title: "Sign up — Snake" }] }),
  component: SignupPage,
});

function SignupPage() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      await signup(username, password);
      navigate({ to: "/play" });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="max-w-sm mx-auto px-4 py-16">
      <h1 className="text-2xl font-bold">Create an account</h1>
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div>
          <Label htmlFor="username">Username</Label>
          <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} autoFocus />
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <p className="text-xs text-muted-foreground mt-1">At least 4 characters.</p>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" disabled={pending} className="w-full">
          {pending ? "Creating…" : "Sign up"}
        </Button>
      </form>
      <p className="mt-4 text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link to="/login" className="underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
