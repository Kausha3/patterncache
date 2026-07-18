import { describe, expect, it } from "vitest";
import {
  GARAGE_ARTIFACTS,
  GARAGE_INCIDENTS,
  GARAGE_NODES,
  assessGarageDefense,
  createGaragePlacements,
  garageArchitectureHealth,
  generateGarageJava,
  getGarageIncidentArtifacts,
  getGarageIncidentNodes,
  moveGarageArtifact,
  simulateGarageIncident,
} from "./garageRefactorEngine";

describe("garage refactor game", () => {
  it("starts as a god object that visibly fails ownership incidents", () => {
    const initial = createGaragePlacements();
    expect(Object.values(initial).every((owner) => owner === "lot")).toBe(true);
    expect(GARAGE_INCIDENTS.filter((incident) => simulateGarageIncident(incident, initial).passed)).toHaveLength(0);
  });

  it("uses architecture placement rather than answer choices", () => {
    let placements = createGaragePlacements();
    placements = moveGarageArtifact(placements, "assign", "spot");
    placements = moveGarageArtifact(placements, "occupant", "spot");
    const race = GARAGE_INCIDENTS.find((incident) => incident.id === "race");
    expect(race && simulateGarageIncident(race, placements).passed).toBe(true);
  });

  it("reports the exact artifacts responsible for a failure", () => {
    const pricing = GARAGE_INCIDENTS.find((incident) => incident.id === "pricing");
    const result = pricing && simulateGarageIncident(pricing, createGaragePlacements());
    expect(result?.passed).toBe(false);
    expect(result?.misplacedArtifactIds).toEqual(["fee"]);
    expect(result?.message).toContain("Price calculation");
  });

  it("reaches full cohesion only after every responsibility has an owner", () => {
    const solved = GARAGE_ARTIFACTS.reduce(
      (placements, artifact) => moveGarageArtifact(placements, artifact.id, artifact.referenceOwnerId),
      createGaragePlacements(),
    );
    expect(garageArchitectureHealth(solved)).toEqual({ cohesion: 100, coupling: 0, correct: 14, total: 14 });
    expect(GARAGE_INCIDENTS.every((incident) => simulateGarageIncident(incident, solved).passed)).toBe(true);
  });

  it("ignores unknown mutations and generates valid Java field syntax", () => {
    const initial = createGaragePlacements();
    expect(moveGarageArtifact(initial, "missing", "spot")).toBe(initial);
    const java = generateGarageJava(initial);
    expect(java).toContain("private Vehicle currentVehicle;");
    expect(java).not.toContain("Vehicle?");
  });

  it("requires evidence and trade-offs in the interview defense", () => {
    expect(assessGarageDefense("I used classes because SOLID is good.").ready).toBe(false);
    expect(assessGarageDefense(
      "ParkingSpot owns and protects occupancy. The race simulation proved the invariant. PricingPolicy contains future EV rate changes and PaymentService contains the gateway provider outage.",
    ).ready).toBe(false);
    const strong = assessGarageDefense(
      "ParkingSpot owns and atomically protects occupancy instead of leaking it into a god object. The last-spot race simulation proved the invariant. PricingPolicy now contains future EV rate changes without coupling them to ParkingLot.",
    );
    expect(strong).toEqual({ score: 100, ready: true, missing: [] });
  });

  it("provides plain-language teaching copy for every visible concept", () => {
    expect(GARAGE_NODES.every((node) => node.beginnerName && node.beginnerDescription)).toBe(true);
    expect(GARAGE_ARTIFACTS.every((artifact) => artifact.beginnerName && artifact.beginnerDescription)).toBe(true);
    expect(GARAGE_INCIDENTS.every((incident) => incident.beginnerGoal && incident.repairLesson)).toBe(true);
    const entry = GARAGE_INCIDENTS[0];
    expect(getGarageIncidentArtifacts(entry).map((artifact) => artifact.id)).toEqual(entry.requiredArtifactIds);
    expect(getGarageIncidentNodes(entry).map((node) => node.id)).toEqual(["lot", "level"]);
  });
});
