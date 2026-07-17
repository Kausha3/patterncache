import type { ColdDrillPrompt } from "@/types";
import { pizzaOrdering } from "./drills/pizzaOrdering";
import { libraryManagement } from "./drills/libraryManagement";
import { atm } from "./drills/atm";
import { restaurantReservation } from "./drills/restaurantReservation";
import { rideShareDispatch } from "./drills/rideShareDispatch";
import { pcBuilder } from "./drills/pcBuilder";
import { stockAlerts } from "./drills/stockAlerts";
import { fileSystem } from "./drills/fileSystem";
import { lruCache } from "./drills/lruCache";
import { ticTacToe } from "./drills/ticTacToe";
import { undoRedo } from "./drills/undoRedo";
import { splitwise } from "./drills/splitwise";
import { circularBuffer } from "./drills/circularBuffer";

/**
 * Cold Design Drill prompt bank — deliberately prompts with no full guided
 * lesson anywhere else in the app. The point isn't "did you memorize this
 * answer," it's "can you apply the same noun-filtering / responsibility-
 * assignment heuristic to something you've never drilled." New prompts are
 * just data — see docs in ColdDrill.tsx for how a reference gets compared
 * against the learner's own free-form attempt.
 */

const COLD_DRILLS: ColdDrillPrompt[] = [
  pizzaOrdering,
  libraryManagement,
  atm,
  restaurantReservation,
  rideShareDispatch,
  pcBuilder,
  stockAlerts,
  fileSystem,
  lruCache,
  circularBuffer,
  ticTacToe,
  undoRedo,
  splitwise,
];

export function listColdDrills(): ColdDrillPrompt[] {
  return COLD_DRILLS;
}

export function getColdDrill(id: string): ColdDrillPrompt | undefined {
  return COLD_DRILLS.find((d) => d.id === id);
}
