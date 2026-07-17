import { useEffect, useRef, useState } from "react";
import { CarSimple, Play, Warning, FastForward } from "@phosphor-icons/react";
import {
  advanceTariffWorld,
  createTariffWorld,
  matchingReceiptCount,
  runTariffWorldToEnd,
  tariffCards,
} from "@/arena/tariffWorld";
import type { TariffWorldState } from "@/arena/tariffWorld";

/**
 * The OCP chapter's living incident: watch the pay station double-charge
 * every old price the night one new tariff edits the shared calculateFee()
 * method. Bespoke to Tariff Wars, the same way the entry-lane jam is bespoke
 * to The Impostor Spot.
 */
export function TariffWarsWorld({ onWitnessed }: { onWitnessed: () => void }) {
  const [world, setWorld] = useState<TariffWorldState>(createTariffWorld);
  const [running, setRunning] = useState(false);
  const announcedMeltdown = useRef(false);

  useEffect(() => {
    if (!running || world.ended) return;
    const timer = globalThis.setInterval(() => {
      setWorld((current) => advanceTariffWorld(current));
    }, 1100);
    return () => globalThis.clearInterval(timer);
  }, [running, world.ended]);

  useEffect(() => {
    if (world.ended && !announcedMeltdown.current) {
      announcedMeltdown.current = true;
      onWitnessed();
    }
  }, [world.ended, onWitnessed]);

  const recentLog = world.log.slice(-4);

  return (
    <div className="impostor-world" aria-label="Live garage pay station simulation">
      <header className="impostor-world-head">
        <div>
          <small>Tonight's shift, live</small>
          <strong>Event weekend starts tonight. The new tariff just shipped. Watch the pay station.</strong>
        </div>
        <span className="impostor-counter" role="status">
          {world.refunds > 0
            ? `${world.refunds} refunds owed`
            : `receipts matching ledger: ${matchingReceiptCount(world)}/${world.receipts.length}`}
        </span>
      </header>

      <div className="impostor-lane">
        <div className="impostor-queue" aria-label={`${world.refundQueue.length} cars waiting for refunds`}>
          <small>Refund line</small>
          <div>
            {world.refundQueue.length === 0 ? (
              <span className="impostor-queue-empty">nobody owed</span>
            ) : (
              world.refundQueue.map((plate) => (
                <span className="impostor-car" key={plate}>
                  <CarSimple size={14} weight="fill" /> {plate}
                </span>
              ))
            )}
          </div>
        </div>
        <div className="impostor-spots">
          {tariffCards(world).map((card) => (
            <div
              key={card.id}
              className={card.isNew && card.live ? "impostor-spot is-impostor" : "impostor-spot"}
            >
              <strong>{card.name}</strong>
              <span>{card.detail}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="impostor-log" role="log" aria-live="polite">
        {recentLog.length === 0 ? (
          <p className="impostor-log-empty">
            Every fee in the garage comes out of one shared calculateFee() method.
          </p>
        ) : (
          recentLog.map((entry) => (
            <p
              key={`${entry.tick}-${entry.kind}-${entry.text}`}
              className={entry.kind === "overcharge" || entry.kind === "meltdown" ? "is-bad" : ""}
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
            Nobody touched the flat or EV pricing tonight. One new rule edited the method every fee
            lives in, and every old price paid for it.
          </p>
        </div>
      ) : (
        <div className="impostor-controls">
          {!running ? (
            <button className="shift-primary" type="button" onClick={() => setRunning(true)}>
              <Play size={16} weight="fill" /> Open the exit lane
            </button>
          ) : (
            <button
              className="impostor-skip"
              type="button"
              onClick={() => {
                setRunning(false);
                setWorld((current) => runTariffWorldToEnd(current));
              }}
            >
              <FastForward size={14} weight="fill" /> Skip to the meltdown
            </button>
          )}
        </div>
      )}
    </div>
  );
}
