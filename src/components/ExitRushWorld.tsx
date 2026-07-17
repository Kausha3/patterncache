import { useEffect, useRef, useState } from "react";
import { CarSimple, Play, Warning, FastForward } from "@phosphor-icons/react";
import {
  advanceOutageWorld,
  createOutageWorld,
  movingLaneCount,
  runOutageWorldToEnd,
} from "@/arena/outageWorld";
import type { OutageWorldState } from "@/arena/outageWorld";

const BAD_KINDS = new Set(["outage", "stuck", "no-seam", "meltdown"]);

/**
 * The DIP chapter's living incident: watch the Friday exit rush freeze in
 * real time before the workbench names why. Bespoke to the AcmePay outage,
 * the same way the LSP chapter's entry lane is bespoke to ReservedSpot.
 */
export function ExitRushWorld({ onWitnessed }: { onWitnessed: () => void }) {
  const [world, setWorld] = useState<OutageWorldState>(createOutageWorld);
  const [running, setRunning] = useState(false);
  const announcedEnd = useRef(false);

  useEffect(() => {
    if (!running || world.ended) return;
    const timer = globalThis.setInterval(() => {
      setWorld((current) => advanceOutageWorld(current));
    }, 1100);
    return () => globalThis.clearInterval(timer);
  }, [running, world.ended]);

  useEffect(() => {
    if (world.ended && !announcedEnd.current) {
      announcedEnd.current = true;
      onWitnessed();
    }
  }, [world.ended, onWitnessed]);

  const recentLog = world.log.slice(-4);

  return (
    <div className="impostor-world" aria-label="Live exit rush simulation">
      <header className="impostor-world-head">
        <div>
          <small>Friday, 5 pm. Live.</small>
          <strong>Three exit lanes, one payment vendor. Watch the rush.</strong>
        </div>
        <span className="impostor-counter" role="status">
          lanes moving: {movingLaneCount(world)}/3
        </span>
      </header>

      <div className="impostor-lane">
        <div className="impostor-queue" aria-label={`${world.stuckCars.length} cars stuck at dead terminals`}>
          <small>Exits</small>
          <div>
            {world.stuckCars.length === 0 ? (
              <span className="impostor-queue-empty">traffic flowing</span>
            ) : (
              world.stuckCars.map((plate) => (
                <span className="impostor-car" key={plate}>
                  <CarSimple size={14} weight="fill" /> {plate}
                </span>
              ))
            )}
          </div>
        </div>
        <div className="impostor-spots">
          {world.lanes.map((lane) => (
            <div key={lane.id} className={lane.frozen ? "impostor-spot is-impostor" : "impostor-spot is-taken"}>
              <strong>Lane {lane.id}</strong>
              <span>{lane.frozen ? "lane frozen: AcmePayClient timeout" : `moving, ${lane.processed} cars out`}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="impostor-log" role="log" aria-live="polite">
        {recentLog.length === 0 ? (
          <p className="impostor-log-empty">
            Each lane built its own AcmePayClient inline in the exit flow. While the vendor is up, nobody can tell.
          </p>
        ) : (
          recentLog.map((entry) => (
            <p key={`${entry.tick}-${entry.kind}-${entry.text}`} className={BAD_KINDS.has(entry.kind) ? "is-bad" : ""}>
              {entry.text}
            </p>
          ))
        )}
      </div>

      {world.ended ? (
        <div className="impostor-jam" role="alert">
          <Warning size={18} weight="fill" />
          <p>
            No lane changed its code tonight. One vendor died and took all three exits with it, because every exit flow
            constructed its own low-level client.
          </p>
        </div>
      ) : (
        <div className="impostor-controls">
          {!running ? (
            <button className="shift-primary" type="button" onClick={() => setRunning(true)}>
              <Play size={16} weight="fill" /> Start the rush
            </button>
          ) : (
            <button
              className="impostor-skip"
              type="button"
              onClick={() => {
                setRunning(false);
                setWorld((current) => runOutageWorldToEnd(current));
              }}
            >
              <FastForward size={14} weight="fill" /> Skip to the outage
            </button>
          )}
        </div>
      )}
    </div>
  );
}
