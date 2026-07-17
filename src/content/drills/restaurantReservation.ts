import type { ColdDrillPrompt } from "@/types";

// Compilable domain model shared by this drill's runnable Java exercises.
// Each string is a complete file; the exercise runner writes them next to
// the learner's class and compiles everything together in the browser.

const TABLE_STATUS_JAVA = `public enum TableStatus {
    FREE, OCCUPIED;
}
`;

// Support version of Table for the findAvailableTable exercise, where the
// table itself is not the class under edit. It owns the time-conflict check
// (isAvailableAt) with a fixed 2-hour dining window, and addReservation()
// exists so tests can set up an upcoming booking.
const TABLE_AVAILABILITY_SUPPORT_JAVA = `import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

public class Table {
    private static final int DINING_MINUTES = 120;

    private final String id;
    private final int capacity;
    private final List<LocalDateTime> reservationTimes = new ArrayList<LocalDateTime>();

    public Table(String id, int capacity) {
        this.id = id;
        this.capacity = capacity;
    }

    public String getId() { return id; }
    public int getCapacity() { return capacity; }

    public void addReservation(LocalDateTime time) { reservationTimes.add(time); }

    public boolean isAvailableAt(LocalDateTime time) {
        for (LocalDateTime booked : reservationTimes) {
            long minutesApart = Math.abs(Duration.between(booked, time).toMinutes());
            if (minutesApart < DINING_MINUTES) {
                return false;
            }
        }
        return true;
    }
}
`;

export const restaurantReservation: ColdDrillPrompt = {
  id: "restaurant-reservation",
  title: "Design a Restaurant Reservation System",
  prompt: "Design a restaurant reservation system.",
  reference: {
    clarifyingQuestions: [
      {
        question: "Are reservations tied to a specific time slot, or is this walk-in/waitlist only?",
        why: "Decides whether Reservation exists as a class at all. Waitlist-only drops the whole timed-booking flow and its no-show handling.",
      },
      {
        question: "Do we need to match party size to table capacity, or can any party sit at any table?",
        why: "Decides whether findAvailableTable() needs a capacity filter at all. Without size matching, seating is just 'any free table,' the same simplification Parking Lot's clarify Q makes for a single spot type.",
      },
      {
        question: "Single restaurant, or a reservation platform spanning many restaurants?",
        why: "A platform-wide system needs Restaurant to be a real entity every Table/Reservation references; a single-location system can drop Restaurant as a class entirely and just have a flat list of Tables.",
      },
      {
        question: "Do repeat no-shows need to be tracked and penalized, or is that out of scope?",
        why: "Decides whether Customer needs its own identity and a noShowCount field at all. Without this, contact info could just be inline strings on each Reservation.",
      },
    ],
    entities: [
      {
        id: "restaurant",
        name: "Restaurant",
        isEntity: true,
        why: "The top-level system. It owns every Table and searches across all of them, the same aggregate-root role ParkingLot plays over Levels.",
        properties: [
          { name: "id", type: "string" },
          { name: "tables", type: "List<Table>" },
          { name: "waitlist", type: "List<WaitlistEntry>" },
        ],
      },
      {
        id: "table",
        name: "Table",
        isEntity: true,
        why: "A physical table. It has a seating capacity, a live occupied/free state, and its own list of upcoming timed reservations.",
        properties: [
          { name: "id", type: "string" },
          { name: "capacity", type: "int" },
          { name: "status", type: "TableStatus" },
          { name: "reservations", type: "List<Reservation>" },
        ],
      },
      {
        id: "reservation",
        name: "Reservation",
        isEntity: true,
        why: "A scheduled booking for a future time, linking a Customer to a Table with a party size and a status. Same 'proof of the transaction' role Parking Lot's Ticket plays.",
        properties: [
          { name: "id", type: "string" },
          { name: "customer", type: "Customer" },
          { name: "table", type: "Table" },
          { name: "partySize", type: "int" },
          { name: "reservationTime", type: "DateTime" },
          { name: "status", type: "ReservationStatus" },
        ],
      },
      {
        id: "waitlistentry",
        name: "WaitlistEntry",
        isEntity: true,
        why: "A live queue position for a walk-in party right now, not a scheduled promise for later. It's a different lifecycle from Reservation, which is why it needs its own class.",
        properties: [
          { name: "id", type: "string" },
          { name: "customer", type: "Customer" },
          { name: "partySize", type: "int" },
          { name: "joinedAt", type: "DateTime" },
          { name: "status", type: "WaitlistStatus" },
        ],
      },
      {
        id: "customer",
        name: "Customer",
        isEntity: true,
        why: "A real participant with an identity that persists across many separate bookings. Needed the moment repeat no-shows have to be tracked and penalized.",
        properties: [
          { name: "id", type: "string" },
          { name: "name", type: "string" },
          { name: "phoneNumber", type: "string" },
          { name: "noShowCount", type: "int" },
        ],
      },
      { id: "host", name: "Host", isEntity: false, why: "The staff member seating guests. An external actor who calls into the system, not a class inside its own domain model." },
      { id: "menu", name: "Menu", isEntity: false, why: "The food menu is a separate ordering/POS concern, not part of a reservation system's own domain model." },
      { id: "receipt", name: "Receipt", isEntity: false, why: "A byproduct of a completed visit, more like a message than a class with its own responsibilities." },
    ],
    methods: [
      {
        id: "m1",
        signature: "findAvailableTable(partySize, time): Table",
        ownerId: "restaurant",
        justification: "Restaurant is the only class that can see across every Table it owns, so it's the one that searches for a size-matched, time-free candidate. No single Table can compare itself against its siblings.",
        codeExercise: {
          language: "java",
          starter: "Table findAvailableTable(int partySize, LocalDateTime time) {\n    // your code here\n}",
          reference:
            "Table findAvailableTable(int partySize, LocalDateTime time) {\n    for (Table table : tables) {\n        if (table.getCapacity() >= partySize && table.isAvailableAt(time)) {\n            return table;\n        }\n    }\n    return null;\n}",
          checklist: [
            "Checks every table, not just the first one with any capacity",
            "Accepts any table capacity ≥ party size, not just an exact match, same 'size ≥ need' rule as Parking Lot's spot matching",
            "Delegates the time-conflict check to Table.isAvailableAt() rather than re-implementing overlap logic itself",
            "Returns null (not an exception) when nothing fits, so the caller can offer the waitlist instead",
          ],
          java: {
            editClassName: "Restaurant",
            starterFile: `import java.time.LocalDateTime;
import java.util.List;

public class Restaurant {
    private final String id;
    private final List<Table> tables;

    public Restaurant(String id, List<Table> tables) {
        this.id = id;
        this.tables = tables;
    }

    public String getId() { return id; }

    public Table findAvailableTable(int partySize, LocalDateTime time) {
        // Walk the tables and return the first one big enough for the party
        // that is also free of time conflicts (ask Table.isAvailableAt).
        // Return null when nothing fits, so the caller can offer the waitlist.
        return null;
    }
}
`,
            referenceFile: `import java.time.LocalDateTime;
import java.util.List;

public class Restaurant {
    private final String id;
    private final List<Table> tables;

    public Restaurant(String id, List<Table> tables) {
        this.id = id;
        this.tables = tables;
    }

    public String getId() { return id; }

    public Table findAvailableTable(int partySize, LocalDateTime time) {
        for (Table table : tables) {
            if (table.getCapacity() >= partySize && table.isAvailableAt(time)) {
                return table;
            }
        }
        return null;
    }
}
`,
            support: [{ className: "Table", source: TABLE_AVAILABILITY_SUPPORT_JAVA }],
            tests: [
              {
                id: "find-returns-fitting-table",
                label: "returns a free table that seats the party",
                body: `Table four = new Table("t1", 4);
Restaurant restaurant = new Restaurant("r1", java.util.Arrays.asList(four));
Table found = restaurant.findAvailableTable(4, java.time.LocalDateTime.of(2026, 7, 17, 19, 0));
expectedText = "table t1";
actualText = found == null ? "no table" : "table " + found.getId();
passed = found != null && "t1".equals(found.getId());`,
              },
              {
                id: "find-skips-too-small",
                label: "a party of 4 never lands on a table for 2",
                body: `Table two = new Table("t1", 2);
Table six = new Table("t2", 6);
Restaurant restaurant = new Restaurant("r1", java.util.Arrays.asList(two, six));
Table found = restaurant.findAvailableTable(4, java.time.LocalDateTime.of(2026, 7, 17, 19, 0));
expectedText = "table t2, the table for 2 cannot seat 4";
actualText = found == null ? "no table" : "table " + found.getId();
passed = found != null && "t2".equals(found.getId());`,
              },
              {
                id: "find-accepts-bigger-table",
                label: "a party of 2 may take a table for 6 (size >= need, not exact match)",
                body: `Table six = new Table("t1", 6);
Restaurant restaurant = new Restaurant("r1", java.util.Arrays.asList(six));
Table found = restaurant.findAvailableTable(2, java.time.LocalDateTime.of(2026, 7, 17, 19, 0));
expectedText = "table t1";
actualText = found == null ? "no table, only exact-capacity matches accepted" : "table " + found.getId();
passed = found != null && "t1".equals(found.getId());`,
              },
              {
                id: "find-skips-time-conflict",
                label: "a table with a booking 30 minutes away is not available",
                body: `Table booked = new Table("t1", 4);
booked.addReservation(java.time.LocalDateTime.of(2026, 7, 17, 19, 0));
Table open = new Table("t2", 4);
Restaurant restaurant = new Restaurant("r1", java.util.Arrays.asList(booked, open));
Table found = restaurant.findAvailableTable(2, java.time.LocalDateTime.of(2026, 7, 17, 19, 30));
expectedText = "table t2, t1 collides with its 7pm booking";
actualText = found == null ? "no table" : "table " + found.getId();
passed = found != null && "t2".equals(found.getId());`,
              },
              {
                id: "find-frees-up-later",
                label: "the same booked table is fine well after its reservation window",
                body: `Table booked = new Table("t1", 4);
booked.addReservation(java.time.LocalDateTime.of(2026, 7, 17, 19, 0));
Restaurant restaurant = new Restaurant("r1", java.util.Arrays.asList(booked));
Table found = restaurant.findAvailableTable(2, java.time.LocalDateTime.of(2026, 7, 17, 22, 0));
expectedText = "table t1, the 7pm booking is long over by 10pm";
actualText = found == null ? "no table, any booking blocked the whole night" : "table " + found.getId();
passed = found != null && "t1".equals(found.getId());`,
              },
              {
                id: "find-null-when-nothing-fits",
                label: "returns null (not an exception) when nothing fits",
                body: `Table two = new Table("t1", 2);
Restaurant restaurant = new Restaurant("r1", java.util.Arrays.asList(two));
Table found = restaurant.findAvailableTable(6, java.time.LocalDateTime.of(2026, 7, 17, 19, 0));
expectedText = "null, so the caller can offer the waitlist";
actualText = found == null ? "null, so the caller can offer the waitlist" : "table " + found.getId();
passed = found == null;`,
              },
            ],
          },
        },
      },
      { id: "m2", signature: "isFullyBooked(time): boolean", ownerId: "restaurant", justification: "Derived by asking every Table's own availability at that time. Same aggregate-check shape as ParkingLot.isFull(), computed from data Restaurant already owns via its tables." },
      {
        id: "m3",
        signature: "seatParty(): void",
        ownerId: "table",
        justification: "status lives on Table, so Table is the only class that can flip it safely. Same invariant-protection shape as ParkingSpot.assignVehicle() guarding isOccupied.",
        codeExercise: {
          language: "java",
          starter: "void seatParty() {\n    // your code here\n}",
          reference:
            "void seatParty() {\n    if (status != TableStatus.FREE) {\n        throw new IllegalStateException(\"Table \" + id + \" is not free\");\n    }\n    this.status = TableStatus.OCCUPIED;\n}",
          checklist: [
            "Checks status is FREE before seating anyone, doesn't silently double-seat an occupied table",
            "Fails loudly (exception, or a boolean/Result return) instead of quietly doing nothing",
            "Sets status to OCCUPIED only after the check passes",
            "Bonus (L5+, not required here): two hosts seating the last free table at the same instant needs this check-then-act to be atomic, not just correct in isolation",
          ],
          java: {
            editClassName: "Table",
            starterFile: `public class Table {
    private final String id;
    private final int capacity;
    private TableStatus status = TableStatus.FREE;

    public Table(String id, int capacity) {
        this.id = id;
        this.capacity = capacity;
    }

    public String getId() { return id; }
    public int getCapacity() { return capacity; }
    public TableStatus getStatus() { return status; }

    public void seatParty() {
        // Guard the status this class owns, then flip it to OCCUPIED.
        // Seating a table that is not FREE must fail loudly, not silently.
    }
}
`,
            referenceFile: `public class Table {
    private final String id;
    private final int capacity;
    private TableStatus status = TableStatus.FREE;

    public Table(String id, int capacity) {
        this.id = id;
        this.capacity = capacity;
    }

    public String getId() { return id; }
    public int getCapacity() { return capacity; }
    public TableStatus getStatus() { return status; }

    public void seatParty() {
        if (status != TableStatus.FREE) {
            throw new IllegalStateException("Table " + id + " is not free");
        }
        this.status = TableStatus.OCCUPIED;
    }
}
`,
            support: [{ className: "TableStatus", source: TABLE_STATUS_JAVA }],
            tests: [
              {
                id: "seat-marks-occupied",
                label: "seating a free table marks it OCCUPIED",
                body: `Table table = new Table("t7", 4);
table.seatParty();
expectedText = "table t7 OCCUPIED";
actualText = "table t7 " + table.getStatus();
passed = table.getStatus() == TableStatus.OCCUPIED;`,
              },
              {
                id: "seat-rejects-double-seating",
                label: "a second seating fails loudly instead of overwriting",
                body: `Table table = new Table("t7", 4);
table.seatParty();
expectedText = "IllegalStateException on the second seating";
try {
    table.seatParty();
    actualText = "no exception, the second party silently took the table";
    passed = false;
} catch (IllegalStateException expectedFailure) {
    actualText = "IllegalStateException on the second seating";
    passed = true;
}`,
              },
              {
                id: "seat-stays-occupied-after-reject",
                label: "a rejected seating leaves the table occupied",
                body: `Table table = new Table("t7", 4);
table.seatParty();
try {
    table.seatParty();
} catch (IllegalStateException expectedFailure) {
    // The guard fired; the table must still belong to the first party.
}
expectedText = "table t7 still OCCUPIED";
actualText = table.getStatus() == TableStatus.OCCUPIED ? "table t7 still OCCUPIED" : "table t7 lost its OCCUPIED status";
passed = table.getStatus() == TableStatus.OCCUPIED;`,
              },
              {
                id: "seat-leaves-other-tables-alone",
                label: "seating one table never touches another",
                body: `Table first = new Table("t1", 4);
Table second = new Table("t2", 2);
first.seatParty();
expectedText = "table t2 still FREE";
actualText = second.getStatus() == TableStatus.FREE ? "table t2 still FREE" : "table t2 became " + second.getStatus();
passed = second.getStatus() == TableStatus.FREE;`,
              },
            ],
          },
        },
      },
      { id: "m4", signature: "clearTable(): void", ownerId: "table", justification: "Same invariant as seatParty() in reverse. The class that owns status is the only one allowed to clear it back to FREE." },
      { id: "m5", signature: "isAvailableAt(time): boolean", ownerId: "table", justification: "Table owns its own list of upcoming reservations, so it's the class positioned to check whether a given time collides with one of them. No other class should reach into that list to do the check itself." },
      { id: "m6", signature: "create(customer, table, partySize, time): Reservation", ownerId: "reservation", justification: "Creating a Reservation is its own constructor-style responsibility. It's the class that knows what fields a valid booking needs, the same shape as Parking Lot's Ticket.issue()." },
      { id: "m7", signature: "cancel(): void", ownerId: "reservation", justification: "Cancelling is a transition on Reservation's own lifecycle status. Reservation is what tracks booked vs. cancelled, so it enforces that transition itself." },
      { id: "m8", signature: "markNoShow(): void", ownerId: "reservation", justification: "Reservation is what knows it passed its reservationTime with nobody seated, so it's the class that triggers the no-show transition, and from there notifies Customer to increment its own count." },
      { id: "m9", signature: "notifyReady(): void", ownerId: "waitlistentry", justification: "WaitlistEntry is what tracks its own queue position (joinedAt), so it's the class that should decide whether it's next in line when a table frees up. Not whichever host happens to look at the list first." },
      { id: "m10", signature: "incrementNoShowCount(): void", ownerId: "customer", justification: "noShowCount lives on Customer, so Customer is the only class that should be allowed to flip it. Same invariant-protection shape as any other owned-state mutation in this app." },
    ],
    relationships: [
      "Restaurant has many Tables and a Waitlist of WaitlistEntries",
      "Table has many Reservations",
      "Reservation references one Customer and one Table",
      "WaitlistEntry references one Customer",
    ],
    edgeCases: [
      {
        scenario: "A party with a reservation arrives 45 minutes late.",
        handling: "Reservation needs a grace-period check. markNoShow() should only fire after some threshold past reservationTime, not the instant the clock passes it, and the table should only free back into the pool once that threshold passes, not immediately at the reservation time.",
      },
      {
        scenario: "A walk-in party of 4 arrives right as a table for 6 becomes free, but a reservation for that same table starts in 20 minutes.",
        handling: "findAvailableTable() must check isAvailableAt() against ALL of a table's upcoming reservations for the estimated dining duration, not just whether it's free this exact second. Seating a walk-in into a slot that collides with a booking coming up shortly is the actual bug here.",
      },
      {
        scenario: "A no-show happens for the third time from the same customer.",
        handling: "Customer.noShowCount persists across all of that customer's reservations, independent of which Table or visit was involved. A policy like 'no-show 3 times, can't book online anymore' needs this count to live on Customer, not on any individual Reservation.",
      },
      {
        scenario: "Two walk-in parties are next in line on the waitlist when a table frees up, and both are the same size.",
        handling: "notifyReady() must be driven by waitlist queue order (joinedAt), not by whichever host happens to glance at the list first. Same FIFO-queue shape as any other ordered queue in this app.",
      },
    ],
    tradeoffs: [
      {
        decision: "Reservation and WaitlistEntry are two separate classes instead of one Booking class with a nullable reservationTime.",
        reasoning: "A timed reservation and a walk-in waitlist entry have different lifecycles: one is scheduled and can be no-showed, the other is a live queue position that resolves in minutes. Collapsing them into one class with an optional time field would mean half its fields are always null depending on which kind it is.",
      },
      {
        decision: "Table tracks its own live status (FREE/OCCUPIED) separately from its list of future timed Reservations.",
        reasoning: "A table can be physically empty right now while still having a reservation booked for later tonight. Conflating 'is anyone sitting here right now' with 'is this slot booked' would make it impossible to seat a walk-in into a table that's free at this moment but reserved for later.",
      },
      {
        decision: "Customer is its own class instead of a name/phone pair duplicated onto every Reservation and WaitlistEntry.",
        reasoning: "noShowCount needs to persist and accumulate across many separate bookings for the same person. Copying contact info onto each booking with no shared identity would make it impossible to answer 'has this person no-showed before.'",
      },
    ],
    principles: [
      { name: "Single Responsibility Principle", explanation: "Table only tracks its own live status and its own reservation list. Restaurant only searches across tables it owns, and neither reaches into the other's bookkeeping." },
      { name: "Encapsulation", explanation: "Table.seatParty() and clearTable() are the only way its status changes. Nothing else flips FREE/OCCUPIED directly, so two hosts can't accidentally double-seat the same table." },
      { name: "Separation of Concerns", explanation: "Reservation (a scheduled promise) and WaitlistEntry (a live queue position) stay separate even though both eventually seat someone. They fail and resolve in completely different ways." },
      { name: "Single source of truth", explanation: "noShowCount lives on Customer because it's read and written across many different Reservations. Putting it anywhere else would mean copying and reconciling a count across records instead of owning it in one place." },
    ],
  },
};
