import { MockSnakeService } from "./mockApi";
import type { SnakeService } from "./types";

// Single centralized service layer. Swap this constant to point at a real
// backend implementation when one exists — the rest of the app is unchanged.
export const api: SnakeService = new MockSnakeService();

export type { SnakeService } from "./types";
export * from "./types";
