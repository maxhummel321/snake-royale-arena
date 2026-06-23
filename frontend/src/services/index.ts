import { ApiSnakeService } from "./api";
import type { SnakeService } from "./types";

// Single centralized service layer. The app talks to the real FastAPI backend
// through this `api` instance. To run the frontend with no backend, swap this
// for `new MockSnakeService()` from "./mockApi".
export const api: SnakeService = new ApiSnakeService();

export type { SnakeService } from "./types";
export * from "./types";
