import { useEffect, useRef, useState } from "react";
import { CarSimple, Play, Warning, FastForward } from "@phosphor-icons/react";
import {
  advanceRemoteWorld,
  boardReadsGreen,
  createRemoteWorld,
  runRemoteWorldToEnd,
} from "@/arena/remoteWorld";
import type { RemoteWorldState } from "@/arena/remoteWorld";

/**
 * The ISP chapter's living incident: watch the device wall lie in real time
 * before the workbench names why. Bespoke to The One Remote, the same way
 * the LSP chapter's entry lane is bespoke to The Impostor Spot.
 */
export function OneRemoteWorld({ onWitnessed }: { onWitnessed: () => void }) {
  const [world, setWorld] = useState<RemoteWorldState>(createRemoteWorld);
  const [running, setRunning] = useState(false);
  const announcedEnd = useRef(false);

  useEffect(() => {
    if (!running || world.ended) return;
    const timer = globalThis.setInterval(() => {
      setWorld((current) => advanceRemoteWorld(current));
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
    <div className="impostor-world" aria-label="Live device wall simulation">
      <header className="impostor-world-head">
        <div>
          <small>Tonight's shift, live</small>
          <strong>Nightly diagnostics are about to run. Watch the wall.</strong>
        </div>
        <span className="impostor-counter" role="status">
          {boardReadsGreen(world) ? "board: all green" : "board: fault"}
        </span>
      </header>

      <div className="impostor-lane">
        <div className="impostor-queue" aria-label={`${world.strandedDrivers.length} drivers stuck at the charging pad`}>
          <small>Pad</small>
          <div>
            {world.strandedDrivers.length === 0 ? (
              <span className="impostor-queue-empty">pad clear</span>
            ) : (
              world.strandedDrivers.map((plate) => (
                <span className="impostor-car" key={plate}>
                  <CarSimple size={14} weight="fill" /> {plate}
                </span>
              ))
            )}
          </div>
        </div>
        <div className="impostor-spots">
          {world.devices.map((device) => (
            <div key={device.id} className={device.alive ? "impostor-spot" : "impostor-spot is-impostor"}>
              <strong>{device.id}</strong>
              <span>{device.alive ? "self-test: OK" : "dead, self-test: OK (stub)"}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="impostor-log" role="log" aria-live="polite">
        {recentLog.length === 0 ? (
          <p className="impostor-log-empty">
            One universal device contract drives the whole wall, and the sweep calls the same runSelfTest() on every device.
          </p>
        ) : (
          recentLog.map((entry) => (
            <p
              key={`${entry.tick}-${entry.kind}-${entry.text}`}
              className={entry.kind === "fault" || entry.kind === "exposed" ? "is-bad" : ""}
            >
              {entry.text}
            </p>
          ))
        )}
      </div>

      {world.ended ? (
        <div className="impostor-jam" role="alert">
          <Warning size={18} weight="fill" />
          <p>
            The board never saw the hardware. The fat contract forced runSelfTest() onto devices that could not honor
            it, so the only signal the wall had was a fake.
          </p>
        </div>
      ) : (
        <div className="impostor-controls">
          {!running ? (
            <button className="shift-primary" type="button" onClick={() => setRunning(true)}>
              <Play size={16} weight="fill" /> Run the night shift
            </button>
          ) : (
            <button
              className="impostor-skip"
              type="button"
              onClick={() => {
                setRunning(false);
                setWorld((current) => runRemoteWorldToEnd(current));
              }}
            >
              <FastForward size={14} weight="fill" /> Skip to the stranded drivers
            </button>
          )}
        </div>
      )}
    </div>
  );
}
