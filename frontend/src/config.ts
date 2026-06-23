// Where the backend lives. Prefers the VITE_API_BASE_URL environment variable
// (set in .env.development for local work), and falls back to localhost:8000.
export const API_BASE_URL: string =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";
