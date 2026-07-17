import { useEffect, useRef, useState } from "react";
import { CarSimple, Play, Warning, FastForward } from "@phosphor-icons/react";
import {
  advanceImpostorWorld,
  createImpostorWorld,
  reportedFreeCount,
  runImpostorWorldToJam,
} from "@/arena/impostorWorld";
import type { ImpostorWorldState } from "@/arena/impostorWorld";

/**
 * The LSP chapter's living incident: watch the entry lane jam in real time
 * before the workbench names why. Bespoke to The Impostor Spot, the same
 * way Mission 1's garage floor is bespoke to SRP.
 */
export function ImpostorSpotWorld({ onJammed }: { onJammed: () => void }) {
  const [world, setWorld] = useState<ImpostorWorldState>(createImpostorWorld);
  const [running, setRunning] = useState(false);
  const announcedJam = useRef(false);

  useEffect(() => {
    if (!running || world.jammed) return;
    const timer = globalThis.setInterval(() => {
      setWorld((current) => advanceImpostorWorld(current));
    }, 1100);
    return () => globalThis.clearInterval(timer);
  }, [running, world.jammed]);

  useEffect(() => {
    if (world.jammed && !announcedJam.current) {
      announcedJam.current = true;
      onJammed();
    }
  }, [world.jammed, onJammed]);

  const recentLog = world.log.slice(-4);

  return (
    <div className="impostor-world" aria-label="Live garage entry simulation">
      <header className="impostor-world-head">
        <div>
          <small>Tonight's shift · live</small>
          <strong>ReservedSpot just shipped. Open the gate and watch the entry lane.</strong>
        </div>
        <span className="impostor-counter" role="status">
          {reportedFreeCount(world)} free, says the counter
        </span>
      </header>

      <div className="impostor-lane">
        <div className="impostor-queue" aria-label={`${world.queue.length} cars waiting at the gate`}>
          <small>Gate</small>
          <div>
            {world.queue.length === 0 ? (
              <span className="impostor-queue-empty">lane clear</span>
            ) : (
              world.queue.map((plate) => (
                <span className="impostor-car" key={plate}>
                  <CarSimple size={14} weight="fill" /> {plate}
                </span>
              ))
            )}
          </div>
        </div>
        <div className="impostor-spots">
          {world.spots.map((spot) => (
            <div
              key={spot.id}
              className={
                spot.occupiedBy
                  ? "impostor-spot is-taken"
                  : spot.reserved
                    ? "impostor-spot is-impostor"
                    : "impostor-spot"
              }
            >
              <strong>{spot.id}</strong>
              <span>{spot.occupiedBy ?? (spot.reserved ? "reserved · claims ParkingSpot" : "free")}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="impostor-log" role="log" aria-live="polite">
        {recentLog.length === 0 ? (
          <p className="impostor-log-empty">The gate scans spots through one contract: first spot reporting free wins.</p>
        ) : (
          recentLog.map((entry) => (
            <p key={`${entry.tick}-${entry.kind}-${entry.text}`} className={entry.kind === "bounce" || entry.kind === "jam" ? "is-bad" : ""}>
              {entry.text}
            </p>
          ))
        )}
      </div>

      {world.jammed ? (
        <div className="impostor-jam" role="alert">
          <Warning size={18} weight="fill" />
          <p>
            No caller changed tonight. One subtype claimed a contract it does not honor, and the whole lane paid for it.
          </p>
        </div>
      ) : (
        <div className="impostor-controls">
          {!running ? (
            <button className="shift-primary" type="button" onClick={() => setRunning(true)}>
              <Play size={16} weight="fill" /> Open the gate
            </button>
          ) : (
            <button
              className="impostor-skip"
              type="button"
              onClick={() => {
                setRunning(false);
                setWorld((current) => runImpostorWorldToJam(current));
              }}
            >
              <FastForward size={14} weight="fill" /> Skip to the jam
            </button>
          )}
        </div>
      )}
    </div>
  );
}
