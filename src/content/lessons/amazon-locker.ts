import type { LLDLesson } from "@/types";

// Compilable domain model shared by this lesson's runnable Java exercises.
// Each string is a complete file; the exercise runner writes them next to
// the learner's class and compiles everything together in the browser.

const SIZE_JAVA = `public enum Size {
    SMALL, MEDIUM, LARGE;

    // A locker of this size can fit any package at most as big as itself.
    // This is the mirror image of Parking Lot's vehicle-to-spot rule.
    public boolean canFit(Size packageSize) {
        return this.ordinal() >= packageSize.ordinal();
    }
}
`;

const PACKAGE_JAVA = `public class Package {
    private final String id;
    private final Size size;
    private final String trackingId;

    public Package(String id, Size size, String trackingId) {
        this.id = id;
        this.size = size;
        this.trackingId = trackingId;
    }

    public String getId() { return id; }
    public Size getSize() { return size; }
    public String getTrackingId() { return trackingId; }
}
`;

// Support version of Locker: it owns isOccupied and contents, so it is the
// only class that flips them. assignPackage guards double assignment, the
// same invariant ParkingSpot.assignVehicle protects in the Parking Lot lesson.
const LOCKER_JAVA = `public class Locker {
    private final String id;
    private final Size size;
    private boolean isOccupied;
    private Package contents;

    public Locker(String id, Size size) {
        this.id = id;
        this.size = size;
    }

    public String getId() { return id; }
    public Size getSize() { return size; }
    public boolean isOccupied() { return isOccupied; }
    public Package getContents() { return contents; }

    public void assignPackage(Package pkg) {
        if (isOccupied) {
            throw new IllegalStateException("Locker " + id + " is already occupied");
        }
        this.isOccupied = true;
        this.contents = pkg;
    }

    public void release() {
        this.isOccupied = false;
        this.contents = null;
    }
}
`;

// Expiry is modeled as a flag the tests can flip via expire(), standing in
// for a real expiresAt timestamp check. A code is only valid while it is
// unexpired AND its locker still holds a package, which is what makes a
// code single-use: the first successful pickup releases the locker.
const PICKUP_CODE_JAVA = `public class PickupCode {
    private final String code;
    private final Locker locker;
    private boolean expired;

    private PickupCode(String code, Locker locker) {
        this.code = code;
        this.locker = locker;
    }

    public static PickupCode generateFor(Locker locker) {
        return new PickupCode("PC-" + locker.getId(), locker);
    }

    public String getCode() { return code; }
    public Locker getLocker() { return locker; }

    // Test setup helper standing in for the expiry window elapsing.
    public void expire() { this.expired = true; }

    public boolean isValid() {
        return !expired && locker.isOccupied();
    }
}
`;

export const amazonLocker: LLDLesson = {
  id: "amazon-locker",
  track: "lld",
  title: "Design Amazon Locker",
  blurb: "Amazon's own pickup-locker system, where you implement getPackage() and putPackage().",
  estMinutes: 35,
  overview:
    "Amazon Locker is a real, Amazon-flavored LLD prompt. It's been confirmed asked in an actual L5 loop, framed around implementing getPackage() and putPackage(). It looks like Parking Lot's cousin, but the sizing rule inverts: a package just needs a locker at least as big as itself, not an exact match. That's the opposite constraint from fitting a vehicle into a spot, and that inversion is exactly the kind of detail that separates a candidate who understood the domain from one pattern-matching a memorized template.",
  terms: ["client", "server"],
  interview: {
    prompt: "Design Amazon Locker.",
    opening: "Design the core of Amazon Locker: a bank of pickup lockers where a courier drops off a package and a customer retrieves it. Where do you want to start?",
    summary:
      "You've scoped it: multiple locker sizes with a 'big enough' matching rule, one physical locker location, and pickup via a generated code. That's enough to stop asking and start naming the classes.",
    questions: [
      {
        id: "sizes",
        ask: "Do we need multiple locker sizes, or is it one size fits all?",
        category: "scope",
        answer: "Multiple sizes: small, medium, large. A package needs a locker at least as big as itself.",
        why: "Size compatibility is the core matching rule, and unlike a parking spot, a package fits in ANY locker at least its size, not just an exact one.",
        establishes: "Multiple locker sizes, size ≥ package",
        lp: ["customer-obsession"],
        branches: [
          { label: "One size fits all", approach: "Neither Locker nor Package needs a Size field at all, so putPackage() just finds any free Locker. Fewer properties, but it doesn't match how real locker banks are actually laid out." },
          { label: "Multiple sizes, ≥ match (this)", approach: "Both Locker and Package need a Size property, and putPackage() must filter candidates by size before assigning. That's exactly why Size shows up as a field on two different classes, not one." },
        ],
      },
      {
        id: "network",
        ask: "One physical location, or a network of locker sites across a city?",
        category: "scope",
        answer: "Assume one physical location for now, a bank of lockers at a single site.",
        why: "This decides whether LockerLocation is the top of your hierarchy or just one node in a larger network, so scope it before modeling.",
        establishes: "Single locker location",
        lp: ["dive-deep"],
        branches: [
          { label: "Single location (this)", approach: "LockerLocation sits at the top of the hierarchy. It owns Lockers directly, and putPackage()/getPackage() are its own methods." },
          { label: "Network of locations", approach: "A new LockerNetwork class would sit above LockerLocation, routing a delivery to the nearest site with capacity. LockerLocation itself barely changes, but a whole new routing responsibility appears one level up." },
        ],
      },
      {
        id: "pickup",
        ask: "How does a customer actually retrieve their package? Through an app, a code, or both?",
        category: "constraints",
        answer: "A pickup code, generated at delivery, entered on the locker's keypad or scanned from the app.",
        why: "This defines what PickupCode has to support: generation, validation, and an expiry window.",
        establishes: "Pickup via generated code",
        lp: ["customer-obsession"],
      },
      {
        id: "protocol-premature",
        ask: "Should the locker talk to the backend over REST or gRPC?",
        category: "premature",
        redirect: "That's a networking/protocol detail. Get the class responsibilities right first.",
      },
    ],
  },
  design: {
    entities: [
      {
        id: "location",
        name: "LockerLocation",
        isEntity: true,
        why: "The physical site. It owns the bank of lockers and exposes the system's core putPackage / getPackage operations.",
        properties: [
          { name: "id", type: "string" },
          { name: "lockers", type: "List<Locker>" },
        ],
      },
      {
        id: "locker",
        name: "Locker",
        isEntity: true,
        why: "A single compartment that has a size, an occupied state, and can assign, open, or release itself.",
        properties: [
          { name: "id", type: "string" },
          { name: "size", type: "Size" },
          { name: "isOccupied", type: "boolean" },
          { name: "contents", type: "Package" },
        ],
      },
      {
        id: "package",
        name: "Package",
        isEntity: true,
        why: "The item being delivered. It has a size that must fit the locker it's assigned to.",
        properties: [
          { name: "id", type: "string" },
          { name: "size", type: "Size" },
          { name: "trackingId", type: "string" },
        ],
      },
      {
        id: "code",
        name: "PickupCode",
        isEntity: true,
        why: "A one-time code tied to a package's locker, generated on delivery and validated on pickup.",
        properties: [
          { name: "id", type: "string" },
          { name: "code", type: "string" },
          { name: "locker", type: "Locker" },
          { name: "expiresAt", type: "DateTime" },
        ],
      },
      {
        id: "customer",
        name: "Customer",
        isEntity: true,
        why: "The recipient, identified by the package they're expecting. A real participant even with little behavior of its own.",
        properties: [
          { name: "id", type: "string" },
          { name: "name", type: "string" },
        ],
      },
      { id: "color", name: "Color", isEntity: false, why: "An attribute of a locker's housing, not its own class." },
      { id: "agent", name: "DeliveryAgent", isEntity: false, why: "The courier placing the package, an external actor who calls into the system, not a class inside its own domain model." },
      { id: "truck", name: "DeliveryTruck", isEntity: false, why: "Belongs to the delivery-logistics system, not the locker system's own domain." },
      { id: "address", name: "Address", isEntity: false, why: "An attribute of Customer or Package, not a class with independent behavior." },
      { id: "receipt", name: "Receipt", isEntity: false, why: "A byproduct of a successful putPackage() call, a message, not a class with its own responsibilities." },
    ],
    methods: [
      {
        id: "m1",
        signature: "putPackage(package): PickupCode",
        ownerId: "location",
        justification: "LockerLocation is the only class that can see every Locker it owns, so it's the one that searches for an available match and hands back a PickupCode. Same shape as findAvailableSpot() searching across Levels in the Parking Lot lesson.",
        codeExercise: {
          language: "java",
          starter: "PickupCode putPackage(Package pkg) {\n    // your code here\n}",
          reference:
            "PickupCode putPackage(Package pkg) {\n    for (Locker locker : lockers) {\n        if (!locker.isOccupied() && locker.getSize().canFit(pkg.getSize())) {\n            locker.assignPackage(pkg);\n            return PickupCode.generateFor(locker);\n        }\n    }\n    throw new IllegalStateException(\"No locker available for this package size\");\n}",
          checklist: [
            "Searches every locker, not just the first occupied or wrong-size one",
            "Skips lockers where isOccupied is already true",
            "Accepts any locker size ≥ package size, not just an exact match. This is the mirror image of Parking Lot's exact-or-bigger vehicle rule",
            "Fails loudly (exception, or a null/Optional signal) when nothing fits, instead of silently doing nothing",
          ],
          java: {
            editClassName: "LockerLocation",
            starterFile: `import java.util.List;

public class LockerLocation {
    private final String id;
    private final List<Locker> lockers;

    public LockerLocation(String id, List<Locker> lockers) {
        this.id = id;
        this.lockers = lockers;
    }

    public String getId() { return id; }
    public List<Locker> getLockers() { return lockers; }

    public PickupCode putPackage(Package pkg) {
        // Find a free locker at least as big as the package, assign the
        // package, and return a code. Fail loudly when nothing fits.
        return null;
    }
}
`,
            referenceFile: `import java.util.List;

public class LockerLocation {
    private final String id;
    private final List<Locker> lockers;

    public LockerLocation(String id, List<Locker> lockers) {
        this.id = id;
        this.lockers = lockers;
    }

    public String getId() { return id; }
    public List<Locker> getLockers() { return lockers; }

    public PickupCode putPackage(Package pkg) {
        for (Locker locker : lockers) {
            if (!locker.isOccupied() && locker.getSize().canFit(pkg.getSize())) {
                locker.assignPackage(pkg);
                return PickupCode.generateFor(locker);
            }
        }
        throw new IllegalStateException("No locker available for this package size");
    }
}
`,
            support: [
              { className: "Size", source: SIZE_JAVA },
              { className: "Package", source: PACKAGE_JAVA },
              { className: "Locker", source: LOCKER_JAVA },
              { className: "PickupCode", source: PICKUP_CODE_JAVA },
            ],
            tests: [
              {
                id: "assigns-free-locker",
                label: "a fitting delivery lands in the free locker and returns a code",
                body: `Locker locker = new Locker("L1", Size.SMALL);
LockerLocation site = new LockerLocation("SEA-1", java.util.Arrays.asList(locker));
Package pkg = new Package("P1", Size.SMALL, "TRK-1");
PickupCode code = site.putPackage(pkg);
expectedText = "code issued and locker L1 holds package P1";
if (code == null) {
    actualText = "no code returned";
    passed = false;
} else if (!locker.isOccupied() || locker.getContents() != pkg) {
    actualText = "code returned but locker L1 does not hold package P1";
    passed = false;
} else {
    actualText = "code issued and locker L1 holds package P1";
    passed = true;
}`,
              },
              {
                id: "skips-occupied-locker",
                label: "skips an occupied locker and uses the next free one",
                body: `Locker taken = new Locker("L1", Size.MEDIUM);
Package already = new Package("P0", Size.SMALL, "TRK-0");
taken.assignPackage(already);
Locker free = new Locker("L2", Size.MEDIUM);
LockerLocation site = new LockerLocation("SEA-1", java.util.Arrays.asList(taken, free));
PickupCode code = site.putPackage(new Package("P1", Size.SMALL, "TRK-1"));
expectedText = "locker L2 takes the package, locker L1 untouched";
if (taken.getContents() != already) {
    actualText = "locker L1 lost the package it already held";
    passed = false;
} else if (code == null) {
    actualText = "no code returned";
    passed = false;
} else if (!free.isOccupied()) {
    actualText = "locker L2 is still empty";
    passed = false;
} else {
    actualText = "locker L2 takes the package, locker L1 untouched";
    passed = true;
}`,
              },
              {
                id: "accepts-bigger-locker",
                label: "a small package is accepted into a large locker, no exact match needed",
                body: `Locker big = new Locker("L1", Size.LARGE);
LockerLocation site = new LockerLocation("SEA-1", java.util.Arrays.asList(big));
PickupCode code = site.putPackage(new Package("P1", Size.SMALL, "TRK-1"));
expectedText = "small package accepted into the large locker";
if (code == null || !big.isOccupied()) {
    actualText = "delivery rejected even though the large locker fits";
    passed = false;
} else {
    actualText = "small package accepted into the large locker";
    passed = true;
}`,
              },
              {
                id: "rejects-oversize-package",
                label: "a large package never squeezes into a small locker",
                body: `Locker small = new Locker("L1", Size.SMALL);
LockerLocation site = new LockerLocation("SEA-1", java.util.Arrays.asList(small));
expectedText = "IllegalStateException, nothing fits a large package";
try {
    PickupCode code = site.putPackage(new Package("P1", Size.LARGE, "TRK-1"));
    if (small.isOccupied()) {
        actualText = "no exception, the large package was squeezed into the small locker";
    } else {
        actualText = code == null ? "no exception, returned null" : "no exception, a code was issued anyway";
    }
    passed = false;
} catch (IllegalStateException expectedFailure) {
    actualText = "IllegalStateException, nothing fits a large package";
    passed = true;
}`,
              },
              {
                id: "full-site-fails-loudly",
                label: "a full site rejects the delivery instead of overwriting or going quiet",
                body: `Locker only = new Locker("L1", Size.LARGE);
only.assignPackage(new Package("P0", Size.SMALL, "TRK-0"));
LockerLocation site = new LockerLocation("SEA-1", java.util.Arrays.asList(only));
expectedText = "IllegalStateException, every locker is full";
try {
    PickupCode code = site.putPackage(new Package("P1", Size.SMALL, "TRK-1"));
    actualText = code == null ? "no exception, returned null" : "no exception, a code was issued for a full site";
    passed = false;
} catch (IllegalStateException expectedFailure) {
    actualText = "IllegalStateException, every locker is full";
    passed = true;
}`,
              },
              {
                id: "code-tied-to-locker",
                label: "the returned code is valid and points at the locker that got the package",
                body: `Locker locker = new Locker("L1", Size.MEDIUM);
LockerLocation site = new LockerLocation("SEA-1", java.util.Arrays.asList(locker));
Package pkg = new Package("P1", Size.MEDIUM, "TRK-1");
PickupCode code = site.putPackage(pkg);
expectedText = "a valid code tied to locker L1";
if (code == null) {
    actualText = "no code returned";
    passed = false;
} else if (code.getLocker() != locker) {
    actualText = "code points at a different locker";
    passed = false;
} else if (!code.isValid()) {
    actualText = "code tied to locker L1 but already invalid";
    passed = false;
} else {
    actualText = "a valid code tied to locker L1";
    passed = true;
}`,
              },
            ],
          },
        },
      },
      {
        id: "m2",
        signature: "getPackage(code): Package",
        ownerId: "location",
        justification: "Retrieving a package starts from a PickupCode, and LockerLocation is what maps a code back to the physical Locker it lives in. Locker itself shouldn't need to know how codes are generated or validated.",
        codeExercise: {
          language: "java",
          starter: "Package getPackage(PickupCode code) {\n    // your code here\n}",
          reference:
            "Package getPackage(PickupCode code) {\n    if (!code.isValid()) {\n        throw new IllegalArgumentException(\"Code is invalid or expired\");\n    }\n    Locker locker = code.getLocker();\n    Package pkg = locker.getContents();\n    locker.release();\n    return pkg;\n}",
          checklist: [
            "Validates the code before doing anything else, rejecting an expired or already-used code",
            "Retrieves the package via the code's own associated locker, not by scanning every locker in the location",
            "Releases the locker as part of pickup, so it becomes available again for a new delivery",
            "Bonus (L5+, not required here): what happens if getPackage() is called twice with the same code, meaning idempotency after the first successful pickup",
          ],
          java: {
            editClassName: "LockerLocation",
            starterFile: `import java.util.List;

public class LockerLocation {
    private final String id;
    private final List<Locker> lockers;

    public LockerLocation(String id, List<Locker> lockers) {
        this.id = id;
        this.lockers = lockers;
    }

    public String getId() { return id; }
    public List<Locker> getLockers() { return lockers; }

    public Package getPackage(PickupCode code) {
        // Validate the code first, then hand back the package from the
        // code's own locker and free that locker for the next delivery.
        return null;
    }
}
`,
            referenceFile: `import java.util.List;

public class LockerLocation {
    private final String id;
    private final List<Locker> lockers;

    public LockerLocation(String id, List<Locker> lockers) {
        this.id = id;
        this.lockers = lockers;
    }

    public String getId() { return id; }
    public List<Locker> getLockers() { return lockers; }

    public Package getPackage(PickupCode code) {
        if (!code.isValid()) {
            throw new IllegalArgumentException("Code is invalid or expired");
        }
        Locker locker = code.getLocker();
        Package pkg = locker.getContents();
        locker.release();
        return pkg;
    }
}
`,
            support: [
              { className: "Size", source: SIZE_JAVA },
              { className: "Package", source: PACKAGE_JAVA },
              { className: "Locker", source: LOCKER_JAVA },
              { className: "PickupCode", source: PICKUP_CODE_JAVA },
            ],
            tests: [
              {
                id: "hands-over-package",
                label: "a valid code hands back the package that was delivered",
                body: `Locker locker = new Locker("L1", Size.MEDIUM);
Package pkg = new Package("P1", Size.MEDIUM, "TRK-1");
locker.assignPackage(pkg);
PickupCode code = PickupCode.generateFor(locker);
LockerLocation site = new LockerLocation("SEA-1", java.util.Arrays.asList(locker));
Package handed = site.getPackage(code);
expectedText = "package P1 handed over";
actualText = handed == null ? "null instead of the package" : "package " + handed.getId() + " handed over";
passed = handed == pkg;`,
              },
              {
                id: "frees-locker-on-pickup",
                label: "pickup frees the locker for the next delivery",
                body: `Locker locker = new Locker("L1", Size.SMALL);
locker.assignPackage(new Package("P1", Size.SMALL, "TRK-1"));
PickupCode code = PickupCode.generateFor(locker);
LockerLocation site = new LockerLocation("SEA-1", java.util.Arrays.asList(locker));
site.getPackage(code);
expectedText = "locker L1 free again";
actualText = locker.isOccupied() ? "locker L1 still holds the package" : "locker L1 free again";
passed = !locker.isOccupied();`,
              },
              {
                id: "rejects-expired-code",
                label: "an expired code is rejected loudly, not honored",
                body: `Locker locker = new Locker("L1", Size.SMALL);
locker.assignPackage(new Package("P1", Size.SMALL, "TRK-1"));
PickupCode code = PickupCode.generateFor(locker);
code.expire();
LockerLocation site = new LockerLocation("SEA-1", java.util.Arrays.asList(locker));
expectedText = "IllegalArgumentException, code expired";
try {
    Package handed = site.getPackage(code);
    actualText = handed == null ? "no exception, quietly returned null" : "no exception, the package was handed out on an expired code";
    passed = false;
} catch (IllegalArgumentException expectedFailure) {
    actualText = "IllegalArgumentException, code expired";
    passed = true;
}`,
              },
              {
                id: "expired-code-keeps-package",
                label: "a rejected expired code leaves the package in its locker",
                body: `Locker locker = new Locker("L1", Size.SMALL);
Package pkg = new Package("P1", Size.SMALL, "TRK-1");
locker.assignPackage(pkg);
PickupCode code = PickupCode.generateFor(locker);
code.expire();
LockerLocation site = new LockerLocation("SEA-1", java.util.Arrays.asList(locker));
try {
    site.getPackage(code);
} catch (IllegalArgumentException expectedFailure) {
    // Rejected as it should be; the locker must be untouched.
}
expectedText = "locker L1 still holds package P1";
boolean stillHeld = locker.isOccupied() && locker.getContents() == pkg;
actualText = stillHeld ? "locker L1 still holds package P1" : "locker L1 was emptied on an expired code";
passed = stillHeld;`,
              },
              {
                id: "code-is-single-use",
                label: "a code works exactly once, the second attempt is rejected",
                body: `Locker locker = new Locker("L1", Size.MEDIUM);
Package pkg = new Package("P1", Size.MEDIUM, "TRK-1");
locker.assignPackage(pkg);
PickupCode code = PickupCode.generateFor(locker);
LockerLocation site = new LockerLocation("SEA-1", java.util.Arrays.asList(locker));
Package first = site.getPackage(code);
expectedText = "first pickup succeeds, second attempt rejected";
if (first != pkg) {
    actualText = first == null ? "first pickup returned null" : "first pickup returned the wrong package";
    passed = false;
} else {
    try {
        Package second = site.getPackage(code);
        actualText = second == null ? "second attempt quietly returned null" : "second attempt handed the package out again";
        passed = false;
    } catch (IllegalArgumentException expectedFailure) {
        actualText = "first pickup succeeds, second attempt rejected";
        passed = true;
    }
}`,
              },
              {
                id: "uses-codes-own-locker",
                label: "pickup opens the code's own locker, not the first occupied one",
                body: `Locker other = new Locker("L1", Size.MEDIUM);
other.assignPackage(new Package("P9", Size.SMALL, "TRK-9"));
Locker mine = new Locker("L2", Size.MEDIUM);
Package pkg = new Package("P1", Size.SMALL, "TRK-1");
mine.assignPackage(pkg);
PickupCode code = PickupCode.generateFor(mine);
LockerLocation site = new LockerLocation("SEA-1", java.util.Arrays.asList(other, mine));
Package handed = site.getPackage(code);
expectedText = "package P1 from locker L2, locker L1 untouched";
if (handed != pkg) {
    actualText = handed == null ? "null instead of the package" : "package " + handed.getId() + " from the wrong locker";
    passed = false;
} else if (!other.isOccupied()) {
    actualText = "locker L1 was disturbed";
    passed = false;
} else if (mine.isOccupied()) {
    actualText = "package P1 handed over but locker L2 never freed";
    passed = false;
} else {
    actualText = "package P1 from locker L2, locker L1 untouched";
    passed = true;
}`,
              },
            ],
          },
        },
      },
      {
        id: "m3",
        signature: "getOccupancy(): int",
        ownerId: "location",
        justification: "Occupancy is a property of the whole location, derived by asking every Locker's own state. No single Locker knows the aggregate count across the bank.",
      },
      {
        id: "m4",
        signature: "assignPackage(package): void",
        ownerId: "locker",
        justification: "isOccupied and contents live on Locker, so Locker is the only class that can safely flip them. Same invariant-protection reasoning as ParkingSpot.assignVehicle() in the Parking Lot lesson.",
      },
      {
        id: "m5",
        signature: "open(): void",
        ownerId: "locker",
        justification: "Opening the physical door is Locker's own hardware-facing behavior. It's the object that represents the physical compartment, so it's the one that acts on it.",
      },
      {
        id: "m6",
        signature: "release(): void",
        ownerId: "locker",
        justification: "Clearing isOccupied and contents is the reverse of assignPackage(). The same class that owns the invariant is the only one allowed to clear it.",
      },
      {
        id: "m7",
        signature: "getSize(): Size",
        ownerId: "package",
        justification: "Size is data Package itself holds. It's a plain accessor, not a decision, so it belongs on the object whose field it's reading.",
      },
      {
        id: "m8",
        signature: "generate(): string",
        ownerId: "code",
        justification: "Generating the code string is PickupCode's own construction logic. It's the class that knows what a valid code actually looks like, not whichever caller happens to need one.",
      },
      {
        id: "m9",
        signature: "isValid(): boolean",
        ownerId: "code",
        justification: "Whether a code is still usable depends entirely on PickupCode's own expiresAt field. No other class should reach in and check that field directly.",
      },
    ],
    edgeCases: [
      {
        id: "full",
        scenario: "All lockers at this location are full when a package arrives for delivery.",
        options: [
          { id: "a", label: "Force the package into an occupied locker anyway.", correct: false, feedback: "Never silently overwrite an occupied locker. You'd lose the package already inside." },
          { id: "b", label: "putPackage() rejects the delivery, and the carrier routes the package to a nearby location instead.", correct: true, feedback: "Right, capacity has to be checked before a locker is assigned, and the system should fail informatively rather than corrupt state." },
          { id: "c", label: "Queue the package outside the lockers until one frees up.", correct: false, feedback: "A locker system has nowhere to physically hold an un-lockered package. Reject-and-reroute is the real-world answer." },
        ],
      },
      {
        id: "oversize",
        scenario: "Only large lockers are free, but the incoming package is small. What should putPackage()'s locker search do?",
        options: [
          { id: "a", label: "Assign it to the large locker, since a small package fits fine in a big one, so allow it (prefer the smallest fit when there's a choice).", correct: true, feedback: "Right, locker size just needs to be ≥ package size, not an exact match. This is the mirror image of Parking Lot's rule, where a vehicle can never fit a smaller spot." },
          { id: "b", label: "Reject the delivery because there's no exact size match.", correct: false, feedback: "Needlessly strict. 'Big enough' should always be acceptable, and exact match was never the real requirement." },
          { id: "c", label: "Split the package across two lockers.", correct: false, feedback: "Packages aren't divisible. The actual constraint is simple: locker size must be ≥ package size." },
        ],
      },
      {
        id: "expired",
        scenario: "A customer's pickup code expires (say, after 3 days) before they retrieve the package.",
        options: [
          { id: "a", label: "Delete the package's data immediately with no trace.", correct: false, feedback: "You lose the ability to help the customer or carrier recover it. Real systems keep a record after the locker itself is released." },
          { id: "b", label: "Release the locker back to the pool for new deliveries, and flag the package for return-to-carrier pickup.", correct: true, feedback: "Right, the locker is a scarce, reusable resource that should free up, while the package's own record persists separately for a return flow." },
          { id: "c", label: "Keep the package in the locker indefinitely until picked up.", correct: false, feedback: "That locker becomes permanently unusable. A locker system that never reclaims space doesn't scale." },
        ],
      },
      {
        id: "concurrent",
        scenario: "Two delivery agents both call putPackage() targeting the same available locker at the exact same instant.",
        options: [
          { id: "a", label: "Whichever request commits first wins, since locker assignment must be atomic so exactly one package is ever placed.", correct: true, feedback: "Same concurrency signal as Parking Lot's spot race. assignPackage() has to be an atomic check-then-assign, not two separate steps a second request can interleave with." },
          { id: "b", label: "Both packages go in, and the locker holds two items.", correct: false, feedback: "Physically impossible, and exactly what happens in code if assignment isn't atomic." },
          { id: "c", label: "The system arbitrarily drops one package's data.", correct: false, feedback: "A silently lost package is a shipment bug, not a fix." },
        ],
      },
    ],
    relationships: [
      "LockerLocation has many Lockers",
      "Locker holds at most one Package",
      "PickupCode is generated for one Package and tied to one Locker",
      "Customer is identified by the Package they're expecting, not stored as locker state",
    ],
    tradeoffs: [
      {
        decision: "LockerLocation owns the public putPackage()/getPackage() interface instead of Locker exposing them directly.",
        reasoning: "Costs one more layer, but a courier or customer only ever wants 'a locker for this package' or 'my package back,' not to pick a specific Locker themselves. LockerLocation is the natural front door, and Locker stays a pure resource.",
      },
      {
        decision: "PickupCode is its own class instead of a plain string field on Package.",
        reasoning: "A code has its own lifecycle (generated, validated, expired) independent of the package's own state. Modeling it separately means expiry logic lives in one place instead of scattered wherever a raw string gets checked.",
      },
      {
        decision: "Locker size only needs to be ≥ package size, not an exact match, the opposite of Parking Lot's vehicle-to-spot rule.",
        reasoning: "A package genuinely fits in any bigger locker with no downside, unlike a vehicle in an oversized spot. Enforcing exact match here would reject valid deliveries for no real reason. Reading the domain instead of assuming the pattern is the whole point of this lesson.",
      },
    ],
    principles: [
      {
        name: "Single Responsibility Principle",
        explanation: "Locker only manages its own occupied/contents state, and PickupCode only manages generation and validity. Neither reaches into the other's job.",
      },
      {
        name: "Encapsulation",
        explanation: "Locker.assignPackage() and release() are the only ways to change isOccupied and contents. Nothing else flips those fields directly.",
      },
      {
        name: "Separation of Concerns",
        explanation: "Package (what's being delivered) and PickupCode (how it gets retrieved) are separate even though tightly linked. A code can expire and be regenerated without touching the package record itself.",
      },
      {
        name: "Value objects don't need identity",
        explanation: "Color and Address are attributes some other class holds, not classes with their own behavior. Giving every value full class treatment would model data as if it were an actor.",
      },
    ],
  },
  recap: [
    "A package fits any locker at least its size, the inverse of Parking Lot's exact-or-bigger vehicle rule. Read the domain, don't assume the pattern.",
    "The system's public interface, putPackage() / getPackage(), belongs on LockerLocation. Assignment and physical state belong on Locker itself.",
    "The recurring LLD edge cases: full capacity, a size boundary, resource reclamation over time, and a concurrent-assignment race.",
    "External actors that merely call into the system (a courier, an app) are not classes inside the system's own domain model.",
  ],
  relatedLessons: ["parking-lot", "url-shortener"],
};
