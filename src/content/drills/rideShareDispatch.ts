import type { ColdDrillPrompt } from "@/types";

// Compilable domain model shared by this drill's runnable Java exercises.
// Each string is a complete file; the exercise runner writes them next to
// the learner's class and compiles everything together in the browser.

const LOCATION_JAVA = `public class Location {
    private final double x;
    private final double y;

    public Location(double x, double y) {
        this.x = x;
        this.y = y;
    }

    public double getX() { return x; }
    public double getY() { return y; }

    public double distanceTo(Location other) {
        double dx = x - other.x;
        double dy = y - other.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
}
`;

// Support version of Driver: setAvailable() exists so tests can set up a
// busy driver, and so Trip can release its driver back to the pool.
const DRIVER_JAVA = `public class Driver {
    private final String id;
    private final String name;
    private Location currentLocation;
    private boolean isAvailable;

    public Driver(String id, String name, Location currentLocation) {
        this.id = id;
        this.name = name;
        this.currentLocation = currentLocation;
        this.isAvailable = true;
    }

    public String getId() { return id; }
    public String getName() { return name; }
    public Location getCurrentLocation() { return currentLocation; }
    public boolean isAvailable() { return isAvailable; }
    public void setAvailable(boolean available) { this.isAvailable = available; }
    public void updateLocation(Location location) { this.currentLocation = location; }
}
`;

const TRIP_STATUS_JAVA = `public enum TripStatus {
    IN_PROGRESS, COMPLETED, CANCELLED;
}
`;

export const rideShareDispatch: ColdDrillPrompt = {
  id: "ride-share-dispatch",
  title: "Design a Ride-Sharing Dispatch System",
  prompt: "Design a ride-sharing dispatch system that matches riders to nearby drivers.",
  reference: {
    clarifyingQuestions: [
      {
        question: "Do we need to match on vehicle type/capacity, or is any available driver a valid match?",
        why: "Decides whether Driver needs a vehicleType field and findNearestDriver() needs a filter at all. Without it, matching is purely distance-based.",
      },
      {
        question: "Is this on-demand only, or do scheduled/advance rides need to be supported too?",
        why: "Scheduled rides would need MatchRequest to carry a future requestedTime and a separate matching pass that runs ahead of time. That's a real structural fork from immediate on-demand matching.",
      },
      {
        question: "Single fixed-fare model, or dynamic/surge pricing?",
        why: "Decides whether Trip.fare is a simple flat calculation or needs its own pricing-strategy class. Same scoping shape as whether Payment needs to be a real class in Parking Lot.",
      },
      {
        question: "Is driver rating/history in scope, or just the matching mechanics?",
        why: "Rating-in-scope would mean Driver needs a rating field and possibly its own Rating class tied to completed Trips. Without it, Driver stays a much thinner class.",
      },
    ],
    entities: [
      {
        id: "rider",
        name: "Rider",
        isEntity: true,
        why: "The person requesting a ride. Has an identity that outlives any single trip, the same recurring-actor role Driver plays on the other side of the match.",
        properties: [
          { name: "id", type: "string" },
          { name: "name", type: "string" },
        ],
      },
      {
        id: "driver",
        name: "Driver",
        isEntity: true,
        why: "A real actor with live location and availability state that changes constantly and gets searched across by every match attempt.",
        properties: [
          { name: "id", type: "string" },
          { name: "name", type: "string" },
          { name: "currentLocation", type: "Location" },
          { name: "isAvailable", type: "boolean" },
          { name: "vehicleType", type: "VehicleType" },
          { name: "lastLocationUpdate", type: "DateTime" },
        ],
      },
      {
        id: "matchrequest",
        name: "MatchRequest",
        isEntity: true,
        why: "A rider's pending ask for a driver. Exists from the moment it's submitted until it's matched, cancelled, or expires, which a Trip record alone can't represent since most requests never even find a driver.",
        properties: [
          { name: "id", type: "string" },
          { name: "rider", type: "Rider" },
          { name: "pickupLocation", type: "Location" },
          { name: "dropoffLocation", type: "Location" },
          { name: "status", type: "MatchStatus" },
        ],
      },
      {
        id: "trip",
        name: "Trip",
        isEntity: true,
        why: "The actual ride once a driver is assigned. It's separate from the request that led to it, since a trip has its own lifecycle (in progress, completed, cancelled) that a still-searching request doesn't.",
        properties: [
          { name: "id", type: "string" },
          { name: "matchRequest", type: "MatchRequest" },
          { name: "driver", type: "Driver" },
          { name: "status", type: "TripStatus" },
          { name: "fare", type: "Money" },
        ],
      },
      {
        id: "dispatchservice",
        name: "DispatchService",
        isEntity: true,
        why: "The class that actually performs the search. Needs visibility across every Driver at once, which no single Rider or Driver has, the same coordinator role ParkingLot plays searching across Levels.",
        properties: [{ name: "id", type: "string" }],
      },
      { id: "vehicle", name: "Vehicle", isEntity: false, why: "Just a category tag (e.g. sedan vs. XL) used for matching, with no independent behavior of its own. Modeling it as a full class would treat a value like an actor." },
      { id: "locationindex", name: "LocationIndex", isEntity: false, why: "A geospatial indexing/implementation detail for making nearest-driver lookups fast, not a class in the core domain model itself." },
      { id: "payment", name: "Payment", isEntity: false, why: "Nobody asked for payment processing. Inventing fare-charging scope adds complexity the prompt never requested." },
    ],
    methods: [
      {
        id: "m1",
        signature: "findNearestDriver(riderLocation): Driver",
        ownerId: "dispatchservice",
        justification: "DispatchService is the only class that can see across every Driver's current location and availability at once. No single Driver should decide for itself whether it's the best match for a given request.",
        codeExercise: {
          language: "java",
          starter: "Driver findNearestDriver(Location riderLocation) {\n    // your code here\n}",
          reference:
            "Driver findNearestDriver(Location riderLocation) {\n    Driver nearest = null;\n    double bestDistance = Double.MAX_VALUE;\n    for (Driver driver : drivers) {\n        if (!driver.isAvailable()) {\n            continue;\n        }\n        double distance = driver.getCurrentLocation().distanceTo(riderLocation);\n        if (distance < bestDistance) {\n            nearest = driver;\n            bestDistance = distance;\n        }\n    }\n    return nearest;\n}",
          checklist: [
            "Skips drivers where isAvailable() is false, not just the first one checked",
            "Compares every available driver's distance, not just the first candidate found",
            "Tracks the actual minimum distance seen so far, not just whether a driver is 'close enough'",
            "Returns null (not an exception) when no driver is available, so the caller can queue the request instead",
          ],
          java: {
            editClassName: "DispatchService",
            starterFile: `import java.util.List;

public class DispatchService {
    private final List<Driver> drivers;

    public DispatchService(List<Driver> drivers) {
        this.drivers = drivers;
    }

    public Driver findNearestDriver(Location riderLocation) {
        // Scan every driver, skip the unavailable ones, and return the one
        // closest to riderLocation. Return null when nobody is available.
        return null;
    }
}
`,
            referenceFile: `import java.util.List;

public class DispatchService {
    private final List<Driver> drivers;

    public DispatchService(List<Driver> drivers) {
        this.drivers = drivers;
    }

    public Driver findNearestDriver(Location riderLocation) {
        Driver nearest = null;
        double bestDistance = Double.MAX_VALUE;
        for (Driver driver : drivers) {
            if (!driver.isAvailable()) {
                continue;
            }
            double distance = driver.getCurrentLocation().distanceTo(riderLocation);
            if (distance < bestDistance) {
                nearest = driver;
                bestDistance = distance;
            }
        }
        return nearest;
    }
}
`,
            support: [
              { className: "Location", source: LOCATION_JAVA },
              { className: "Driver", source: DRIVER_JAVA },
            ],
            tests: [
              {
                id: "nearest-wins",
                label: "returns the nearest driver, not just the first one in the list",
                body: `Driver far = new Driver("d1", "Asha", new Location(10.0, 0.0));
Driver near = new Driver("d2", "Ben", new Location(1.0, 0.0));
Driver mid = new Driver("d3", "Cho", new Location(4.0, 0.0));
DispatchService dispatch = new DispatchService(java.util.Arrays.asList(far, near, mid));
Driver found = dispatch.findNearestDriver(new Location(0.0, 0.0));
expectedText = "driver d2, the nearest of the three";
actualText = found == null ? "null" : "driver " + found.getId();
passed = found != null && "d2".equals(found.getId());`,
              },
              {
                id: "skips-unavailable",
                label: "skips a busy driver even when they are the closest",
                body: `Driver closest = new Driver("d1", "Asha", new Location(1.0, 0.0));
closest.setAvailable(false);
Driver backup = new Driver("d2", "Ben", new Location(5.0, 0.0));
DispatchService dispatch = new DispatchService(java.util.Arrays.asList(closest, backup));
Driver found = dispatch.findNearestDriver(new Location(0.0, 0.0));
expectedText = "driver d2, since d1 is on a trip";
actualText = found == null ? "null" : "driver " + found.getId();
passed = found != null && "d2".equals(found.getId());`,
              },
              {
                id: "real-distance",
                label: "compares real straight-line distance, not one axis or a coordinate sum",
                body: `Driver diagonal = new Driver("d1", "Asha", new Location(3.0, 4.0));
Driver onAxis = new Driver("d2", "Ben", new Location(6.0, 0.0));
DispatchService dispatch = new DispatchService(java.util.Arrays.asList(onAxis, diagonal));
Driver found = dispatch.findNearestDriver(new Location(0.0, 0.0));
expectedText = "driver d1 at distance 5.0, closer than d2 at 6.0";
actualText = found == null ? "null" : "driver " + found.getId();
passed = found != null && "d1".equals(found.getId());`,
              },
              {
                id: "all-busy-null",
                label: "returns null (not an exception) when every driver is busy",
                body: `Driver a = new Driver("d1", "Asha", new Location(1.0, 0.0));
a.setAvailable(false);
Driver b = new Driver("d2", "Ben", new Location(2.0, 0.0));
b.setAvailable(false);
DispatchService dispatch = new DispatchService(java.util.Arrays.asList(a, b));
Driver found = dispatch.findNearestDriver(new Location(0.0, 0.0));
expectedText = "null, so the caller can queue the request";
actualText = found == null ? "null, so the caller can queue the request" : "driver " + found.getId();
passed = found == null;`,
              },
              {
                id: "empty-pool",
                label: "an empty driver pool returns null instead of crashing",
                body: `DispatchService dispatch = new DispatchService(java.util.Collections.<Driver>emptyList());
Driver found = dispatch.findNearestDriver(new Location(0.0, 0.0));
expectedText = "null";
actualText = found == null ? "null" : "driver " + found.getId();
passed = found == null;`,
              },
              {
                id: "search-does-not-claim",
                label: "finding a driver must not flip them unavailable",
                body: `Driver only = new Driver("d1", "Asha", new Location(2.0, 0.0));
DispatchService dispatch = new DispatchService(java.util.Arrays.asList(only));
dispatch.findNearestDriver(new Location(0.0, 0.0));
expectedText = "driver d1 still available after the search";
actualText = only.isAvailable() ? "driver d1 still available after the search" : "driver d1 was flipped busy by a read-only search";
passed = only.isAvailable();`,
              },
            ],
          },
        },
      },
      { id: "m2", signature: "matchRequest(request): void", ownerId: "dispatchservice", justification: "Orchestrating a search plus creating the resulting Trip is DispatchService's job. It composes findNearestDriver() with Trip.create(), the same coordinator role ParkingLot plays delegating to findAvailableSpot() and Ticket.issue()." },
      { id: "m3", signature: "create(rider, pickup, dropoff): MatchRequest", ownerId: "matchrequest", justification: "Creating a MatchRequest is its own constructor-style responsibility. It's the class that knows what fields a valid request needs, the same shape as Parking Lot's Ticket.issue()." },
      { id: "m4", signature: "expire(): void", ownerId: "matchrequest", justification: "Expiring is a transition on MatchRequest's own lifecycle status. It's what tracks pending vs. expired, so it enforces that transition itself." },
      { id: "m5", signature: "cancel(): void", ownerId: "matchrequest", justification: "Same invariant-owner reasoning as expire(). Only MatchRequest should be allowed to move its own status to cancelled." },
      { id: "m6", signature: "setAvailable(available): void", ownerId: "driver", justification: "isAvailable lives on Driver, so Driver is the only class that should flip it. Same invariant-protection shape as ParkingSpot's isOccupied." },
      { id: "m7", signature: "updateLocation(location): void", ownerId: "driver", justification: "currentLocation is Driver's own field. Only Driver should be the one updating its own position, not DispatchService reaching in to overwrite it." },
      { id: "m8", signature: "create(matchRequest, driver): Trip", ownerId: "trip", justification: "Building a Trip record once a match succeeds is Trip's own constructor-style responsibility, the same shape as Parking Lot's Ticket.issue()." },
      { id: "m9", signature: "completeTrip(): void", ownerId: "trip", justification: "Completing is a transition on Trip's own lifecycle. Trip is what tracks in-progress vs. completed, so it enforces that transition and is what should free the driver back to available." },
      {
        id: "m10",
        signature: "cancelTrip(reason): void",
        ownerId: "trip",
        justification: "Cancelling is Trip's own lifecycle transition, and since Trip is the class that knows which Driver it's holding onto, it's positioned to release that driver back to the pool as part of the same operation.",
        codeExercise: {
          language: "java",
          starter: "void cancelTrip(String reason) {\n    // your code here\n}",
          reference:
            "void cancelTrip(String reason) {\n    if (status == TripStatus.COMPLETED) {\n        throw new IllegalStateException(\"Cannot cancel a completed trip\");\n    }\n    this.status = TripStatus.CANCELLED;\n    driver.setAvailable(true);\n}",
          checklist: [
            "Rejects cancelling a trip that's already COMPLETED, can't undo a finished trip",
            "Frees the driver back to available so they can be matched again, not left stuck 'busy' forever",
            "Sets status to CANCELLED only after the completed-check passes",
            "Bonus (L5+, not required here): if the trip was already in progress, cancellation might need a partial-fare/cancellation-fee policy. Out of scope for this exercise but worth naming out loud in an interview",
          ],
          java: {
            editClassName: "Trip",
            starterFile: `public class Trip {
    private final String id;
    private final Driver driver;
    private TripStatus status;

    public Trip(String id, Driver driver) {
        this.id = id;
        this.driver = driver;
        this.status = TripStatus.IN_PROGRESS;
        driver.setAvailable(false);
    }

    public String getId() { return id; }
    public Driver getDriver() { return driver; }
    public TripStatus getStatus() { return status; }

    public void completeTrip() {
        this.status = TripStatus.COMPLETED;
        driver.setAvailable(true);
    }

    public void cancelTrip(String reason) {
        // Guard the lifecycle first: a COMPLETED trip must fail loudly.
        // Then mark this trip CANCELLED and free the driver back to the pool.
    }
}
`,
            referenceFile: `public class Trip {
    private final String id;
    private final Driver driver;
    private TripStatus status;

    public Trip(String id, Driver driver) {
        this.id = id;
        this.driver = driver;
        this.status = TripStatus.IN_PROGRESS;
        driver.setAvailable(false);
    }

    public String getId() { return id; }
    public Driver getDriver() { return driver; }
    public TripStatus getStatus() { return status; }

    public void completeTrip() {
        this.status = TripStatus.COMPLETED;
        driver.setAvailable(true);
    }

    public void cancelTrip(String reason) {
        if (status == TripStatus.COMPLETED) {
            throw new IllegalStateException("Cannot cancel a completed trip");
        }
        this.status = TripStatus.CANCELLED;
        driver.setAvailable(true);
    }
}
`,
            support: [
              { className: "Location", source: LOCATION_JAVA },
              { className: "Driver", source: DRIVER_JAVA },
              { className: "TripStatus", source: TRIP_STATUS_JAVA },
            ],
            tests: [
              {
                id: "cancel-marks-cancelled",
                label: "cancelling an in-progress trip moves it to CANCELLED",
                body: `Driver driver = new Driver("d1", "Asha", new Location(0.0, 0.0));
Trip trip = new Trip("t1", driver);
trip.cancelTrip("rider no-show");
expectedText = "status CANCELLED";
actualText = "status " + trip.getStatus();
passed = trip.getStatus() == TripStatus.CANCELLED;`,
              },
              {
                id: "cancel-frees-driver",
                label: "cancelling frees the driver back to available",
                body: `Driver driver = new Driver("d1", "Asha", new Location(0.0, 0.0));
Trip trip = new Trip("t1", driver);
trip.cancelTrip("rider no-show");
expectedText = "driver d1 available again";
actualText = driver.isAvailable() ? "driver d1 available again" : "driver d1 still stuck busy";
passed = driver.isAvailable();`,
              },
              {
                id: "rejects-completed-cancel",
                label: "cancelling an already-completed trip fails loudly",
                body: `Driver driver = new Driver("d1", "Asha", new Location(0.0, 0.0));
Trip trip = new Trip("t1", driver);
trip.completeTrip();
expectedText = "IllegalStateException, a completed trip cannot be cancelled";
try {
    trip.cancelTrip("changed my mind");
    actualText = "no exception, the cancel was silently accepted";
    passed = false;
} catch (IllegalStateException expectedFailure) {
    actualText = "IllegalStateException, a completed trip cannot be cancelled";
    passed = true;
}`,
              },
              {
                id: "completed-status-survives",
                label: "a rejected cancel leaves the trip COMPLETED, not half-cancelled",
                body: `Driver driver = new Driver("d1", "Asha", new Location(0.0, 0.0));
Trip trip = new Trip("t1", driver);
trip.completeTrip();
try {
    trip.cancelTrip("changed my mind");
} catch (IllegalStateException expectedFailure) {
    // The guard fired; the record must be untouched.
}
expectedText = "status COMPLETED";
actualText = "status " + trip.getStatus();
passed = trip.getStatus() == TripStatus.COMPLETED;`,
              },
              {
                id: "other-driver-untouched",
                label: "cancelling one trip never frees another trip's driver",
                body: `Driver first = new Driver("d1", "Asha", new Location(0.0, 0.0));
Driver second = new Driver("d2", "Ben", new Location(1.0, 0.0));
Trip cancelled = new Trip("t1", first);
Trip ongoing = new Trip("t2", second);
cancelled.cancelTrip("rider no-show");
expectedText = "driver d2 still busy on trip t2";
actualText = second.isAvailable() ? "driver d2 was freed by someone else's cancel" : "driver d2 still busy on trip t2";
passed = ongoing.getStatus() == TripStatus.IN_PROGRESS && !second.isAvailable();`,
              },
            ],
          },
        },
      },
    ],
    relationships: [
      "Rider has many MatchRequests",
      "MatchRequest references one Rider",
      "Trip references one MatchRequest and one Driver",
      "DispatchService searches across all Drivers",
    ],
    edgeCases: [
      {
        scenario: "A driver accepts a match but cancels before picking up the rider.",
        handling: "cancelTrip() must free the driver back to available AND leave the original MatchRequest re-matchable. The rider shouldn't have to submit a brand new request from scratch just because the first driver backed out.",
      },
      {
        scenario: "Two riders' requests both get matched to the same driver at nearly the same instant.",
        handling: "findNearestDriver() plus assignment has to be atomic, the same check-then-act race as ParkingSpot.assignVehicle(). Whichever match commits first should flip the driver unavailable before the second match attempt even runs.",
      },
      {
        scenario: "No driver is available anywhere near the rider's location.",
        handling: "findNearestDriver() returning null shouldn't leave the rider hanging. MatchRequest needs an explicit way to stay PENDING and retry, or transition to EXPIRED after some timeout, rather than the request just silently failing once.",
      },
      {
        scenario: "A driver's GPS location hasn't updated in several minutes when a match is attempted.",
        handling: "Driver's lastLocationUpdate needs to factor into matching. Sending a rider to a driver's last-known position from several minutes ago could send them somewhere the driver isn't anymore, so stale locations should be deprioritized or excluded.",
      },
    ],
    tradeoffs: [
      {
        decision: "MatchRequest and Trip are separate classes instead of one Trip class that starts in a PENDING/unmatched state.",
        reasoning: "A request that never gets matched (no drivers available, rider cancels before match) never has a driver, pickup confirmation, or fare. Collapsing it into Trip would mean most of Trip's fields are null until a match actually happens, so keeping them separate mirrors Parking Lot's Ticket/Payment split.",
      },
      {
        decision: "DispatchService is a separate stateless-ish coordinator instead of Rider or Driver owning the matching logic themselves.",
        reasoning: "Matching needs visibility across every Driver at once to find the nearest one. No single Rider or Driver has that view, so the search has to live on a class that can see the whole pool, the same shape as ParkingLot searching across every Level.",
      },
      {
        decision: "Driver stores vehicleType as a plain field instead of a separate Vehicle class.",
        reasoning: "A vehicle here is just a category tag used for matching (e.g. requesting an XL), with no independent behavior of its own. Giving it full class treatment would be modeling a value as if it were an actor.",
      },
    ],
    principles: [
      { name: "Single Responsibility Principle", explanation: "DispatchService only searches and matches. Trip only tracks the lifecycle of an assigned ride, and neither reaches into the other's job." },
      { name: "Encapsulation", explanation: "Driver.setAvailable() is the only way its availability flag changes. Nothing else flips it directly, so two matches can't both claim the same driver." },
      { name: "Separation of Concerns", explanation: "MatchRequest (the search for a driver) and Trip (the ride once matched) are kept apart because they fail and resolve in completely different ways. A request can expire with no trip ever created." },
      { name: "Idempotent state transitions", explanation: "Trip.cancelTrip() explicitly rejects cancelling an already-COMPLETED trip. Transitions are guarded so calling a method twice, or out of order, can't corrupt the record." },
    ],
  },
};
