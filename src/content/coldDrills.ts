import type { ColdDrillPrompt } from "@/types";

/**
 * Cold Design Drill prompt bank — deliberately prompts with no full guided
 * lesson anywhere else in the app. The point isn't "did you memorize this
 * answer," it's "can you apply the same noun-filtering / responsibility-
 * assignment heuristic to something you've never drilled." New prompts are
 * just data — see docs in ColdDrill.tsx for how a reference gets compared
 * against the learner's own free-form attempt.
 */

const pizzaOrdering: ColdDrillPrompt = {
  id: "pizza-ordering",
  title: "Design a Pizza Ordering System",
  prompt: "Design a pizza ordering system.",
  reference: {
    clarifyingQuestions: [
      {
        question: "Is this just placing an order, or does it include kitchen prep and delivery too?",
        why: "Decides whether Delivery and Driver exist at all — an order-only scope drops both classes entirely.",
      },
      {
        question: "Can a pizza be customized (extra toppings, size), or is the menu fixed?",
        why: "Decides whether OrderItem needs its own toppings list and price, or whether Order can just hold a flat list of Pizza.",
      },
      {
        question: "Is payment in scope, or just the order itself?",
        why: "Decides whether Payment is even a class in the model — same scoping question Parking Lot's payment clarify-Q asks.",
      },
      {
        question: "One restaurant, or a marketplace of many restaurants?",
        why: "A single restaurant needs no Restaurant class at all; a marketplace means Pizza and Order both need to reference which restaurant they belong to — a structural fork, not a detail.",
      },
    ],
    entities: [
      {
        id: "order",
        name: "Order",
        isEntity: true,
        why: "The customer's order — owns the line items, tracks status through the whole lifecycle, and is the one thing every other class hangs off of.",
        properties: [
          { name: "id", type: "string" },
          { name: "items", type: "List<OrderItem>" },
          { name: "status", type: "OrderStatus" },
          { name: "total", type: "Money" },
        ],
      },
      {
        id: "orderitem",
        name: "OrderItem",
        isEntity: true,
        why: "One line in the order — a specific pizza, its customizations, and a quantity. Order itself doesn't need to know about toppings or sizes, just that it owns a list of these.",
        properties: [
          { name: "id", type: "string" },
          { name: "pizza", type: "Pizza" },
          { name: "toppings", type: "List<Topping>" },
          { name: "quantity", type: "int" },
        ],
      },
      {
        id: "pizza",
        name: "Pizza",
        isEntity: true,
        why: "A menu definition — name, size, and base price. It's data the menu publishes, not something with its own behavior.",
        properties: [
          { name: "id", type: "string" },
          { name: "name", type: "string" },
          { name: "size", type: "Size" },
          { name: "basePrice", type: "Money" },
        ],
      },
      {
        id: "topping",
        name: "Topping",
        isEntity: true,
        why: "Has its own identity and price, and gets reused across many pizzas and many orders — that's exactly what makes it a real class instead of just a string.",
        properties: [
          { name: "id", type: "string" },
          { name: "name", type: "string" },
          { name: "price", type: "Money" },
        ],
      },
      {
        id: "payment",
        name: "Payment",
        isEntity: true,
        why: "The money moving is a distinct concern from the order itself, with its own status and its own failure modes — a declined card shouldn't corrupt the order.",
        properties: [
          { name: "id", type: "string" },
          { name: "order", type: "Order" },
          { name: "amount", type: "Money" },
          { name: "status", type: "PaymentStatus" },
        ],
      },
      {
        id: "delivery",
        name: "Delivery",
        isEntity: true,
        why: "Tracks the hand-off from kitchen to customer — a driver, a status, and an ETA. An order picked up in-store never needs one of these, which is exactly why it's not just a field on Order.",
        properties: [
          { name: "id", type: "string" },
          { name: "order", type: "Order" },
          { name: "driver", type: "Driver" },
          { name: "status", type: "DeliveryStatus" },
        ],
      },
      {
        id: "driver",
        name: "Driver",
        isEntity: true,
        why: "A real actor with their own state (available or not) that outlives any single delivery — the same driver delivers order after order.",
        properties: [
          { name: "id", type: "string" },
          { name: "name", type: "string" },
          { name: "isAvailable", type: "boolean" },
        ],
      },
      { id: "menu", name: "Menu", isEntity: false, why: "Just the current list of Pizza and Topping the kitchen already models — giving it its own class with no new behavior is over-engineering." },
      { id: "address", name: "Address", isEntity: false, why: "A value Order holds (or a customer's field), not a class with its own behavior — modeling it separately adds a class for no new responsibility." },
      { id: "coupon", name: "Coupon", isEntity: false, why: "Nobody asked for discounts or promotions — inventing this scope adds complexity the prompt never requested." },
    ],
    methods: [
      { id: "m1", signature: "addItem(item): void", ownerId: "order", justification: "Order owns its own items list; nothing else should be able to reach in and mutate it directly." },
      { id: "m2", signature: "calculateTotal(): Money", ownerId: "order", justification: "Total is derived purely from this order's own items — Order is the only class with the full list to sum, and it does so by summing each item's own calculatePrice()." },
      { id: "m3", signature: "updateStatus(status): void", ownerId: "order", justification: "Status is Order's own lifecycle field; only Order should be the one thing that can transition it, so nothing else can leave it in an invalid state." },
      { id: "m4", signature: "calculatePrice(): Money", ownerId: "orderitem", justification: "Price for one line depends on this item's own pizza, toppings, and quantity — Order shouldn't need to know pizza/topping pricing to total itself." },
      { id: "m5", signature: "charge(amount): boolean", ownerId: "payment", justification: "Processing the charge is Payment's whole reason to exist — same split as every other transactional system." },
      { id: "m6", signature: "refund(): boolean", ownerId: "payment", justification: "A failed delivery or a mistaken order needs to reverse the same transaction Payment already owns — keeping refund on Payment means money-movement logic never leaks into Order or Delivery." },
      { id: "m7", signature: "assignDriver(driver): void", ownerId: "delivery", justification: "Delivery is the only class that connects an order to a driver — Driver itself shouldn't need to know which orders it's carrying to do its own job." },
      { id: "m8", signature: "markDelivered(): void", ownerId: "delivery", justification: "Same reasoning as Order's updateStatus() — the class that owns a status field is the only one that should transition it." },
      { id: "m9", signature: "setAvailable(available): void", ownerId: "driver", justification: "isAvailable lives on Driver — only the class holding the flag should be the one flipping it, same invariant-protection shape as a ParkingSpot's isOccupied." },
    ],
    relationships: [
      "Order has many OrderItems",
      "OrderItem references one Pizza and many Toppings",
      "Payment is computed from an Order's total",
      "Delivery references one Order and one Driver",
    ],
    edgeCases: [
      {
        scenario: "A topping is removed from the menu while it's still sitting inside an already-placed order.",
        handling: "OrderItem holds its own copy of the topping's price and name at order time, not a live reference to the menu — otherwise removing a topping from the menu would silently corrupt the price of every past order that used it.",
      },
      {
        scenario: "The customer's card is declined after the kitchen has already started making the pizza.",
        handling: "Payment failing doesn't roll back Order — the kitchen has already sunk the cost. Order moves to a PAYMENT_FAILED-style status that still requires resolution, rather than silently cancelling food that's already being made.",
      },
      {
        scenario: "No driver is available when an order is ready for delivery.",
        handling: "Delivery shouldn't be created at all until a Driver is actually assigned — Order can sit in a READY status with no Delivery object yet, rather than creating a Delivery with a null driver.",
      },
      {
        scenario: "The same order gets marked delivered twice (a duplicate driver-app tap).",
        handling: "markDelivered() should reject a second transition from an already-DELIVERED status — same invariant-protection shape as a ParkingSpot checking isOccupied before assigning.",
      },
    ],
    tradeoffs: [
      {
        decision: "OrderItem is its own class instead of Order holding a flat List<Pizza> with a separate quantities map.",
        reasoning: "Costs one more class, but keeps quantity, toppings, and per-line pricing attached to the thing they actually describe — a flat list of Pizza can't represent two of the same pizza with different toppings.",
      },
      {
        decision: "Delivery is separate from Order instead of putting driver/ETA fields directly on Order.",
        reasoning: "An order picked up in-store never needs a driver or an ETA — bolting those fields onto Order means every in-store order carries fields that are always null.",
      },
      {
        decision: "Payment is separate from Order, same pattern as the Parking Lot lesson's Ticket/Payment split.",
        reasoning: "The order's contents and the transaction that pays for it fail independently — a declined card shouldn't corrupt what's already in the kitchen queue.",
      },
    ],
    principles: [
      { name: "Single Responsibility Principle", explanation: "OrderItem only knows how to price itself from its own pizza+toppings+quantity; Order only knows how to sum whatever items it holds — neither reaches into the other's math." },
      { name: "Encapsulation", explanation: "Order.updateStatus() and Driver.setAvailable() are the only ways to change those fields — nothing else reaches in and flips a status or availability flag directly." },
      { name: "Value objects don't need identity", explanation: "A topping's price-at-order-time is copied data, not a class with its own behavior — giving every value full class treatment models data as if it were an actor." },
    ],
  },
};

const libraryManagement: ColdDrillPrompt = {
  id: "library-management",
  title: "Design a Library Management System",
  prompt: "Design a library management system.",
  reference: {
    clarifyingQuestions: [
      {
        question: "Is this a single branch, or a network of branches where a book could be at a different location?",
        why: "A single branch means Library sits directly atop Book; a multi-branch system needs a Branch layer between Library and BookCopy — a real structural layer, not a detail.",
      },
      {
        question: "Do members reserve/hold books, or is checkout strictly first-come, first-served?",
        why: "Decides whether Reservation exists as a class at all — without holds, the model drops a whole entity and returning a copy never has to check a queue.",
      },
      {
        question: "Are overdue fines in scope, or just tracking due dates?",
        why: "Decides whether Fine is a class in the model — same scoping shape as Parking Lot's payment clarify question.",
      },
      {
        question: "Physical books only, or also ebooks/digital loans?",
        why: "A digital loan doesn't need a BookCopy with a physical barcode at all — an ebook 'copy' is really a concurrent-license count, a structurally different model from a shelf of physical copies.",
      },
    ],
    entities: [
      {
        id: "library",
        name: "Library",
        isEntity: true,
        why: "The top-level system — owns every Book title and every Member, the same aggregate-root role ParkingLot plays over Levels.",
        properties: [
          { name: "id", type: "string" },
          { name: "books", type: "List<Book>" },
          { name: "members", type: "List<Member>" },
        ],
      },
      {
        id: "book",
        name: "Book",
        isEntity: true,
        why: "The catalog entry — title, author, and ISBN — plus the list of physical copies that exist for it. Title-level metadata, not any one physical item.",
        properties: [
          { name: "id", type: "string" },
          { name: "title", type: "string" },
          { name: "author", type: "string" },
          { name: "isbn", type: "string" },
          { name: "copies", type: "List<BookCopy>" },
        ],
      },
      {
        id: "bookcopy",
        name: "BookCopy",
        isEntity: true,
        why: "One physical item on a shelf — has its own barcode and status. This is what actually gets checked out, not the Book entry itself, which is why it needs its own identity separate from Book.",
        properties: [
          { name: "id", type: "string" },
          { name: "book", type: "Book" },
          { name: "barcode", type: "string" },
          { name: "status", type: "CopyStatus" },
        ],
      },
      {
        id: "member",
        name: "Member",
        isEntity: true,
        why: "A library patron — has an identity and a borrowing history that outlives any single loan.",
        properties: [
          { name: "id", type: "string" },
          { name: "name", type: "string" },
          { name: "activeLoans", type: "List<Loan>" },
        ],
      },
      {
        id: "loan",
        name: "Loan",
        isEntity: true,
        why: "One checkout transaction — links a specific BookCopy to a Member with a due date, the same 'proof of the transaction' role Parking Lot's Ticket plays.",
        properties: [
          { name: "id", type: "string" },
          { name: "copy", type: "BookCopy" },
          { name: "member", type: "Member" },
          { name: "checkoutDate", type: "DateTime" },
          { name: "dueDate", type: "DateTime" },
          { name: "returnDate", type: "DateTime" },
        ],
      },
      {
        id: "reservation",
        name: "Reservation",
        isEntity: true,
        why: "A hold placed on a title, queued until a copy frees up — references Book, not any specific BookCopy, since you're reserving the next available copy of a title, not a particular physical item.",
        properties: [
          { name: "id", type: "string" },
          { name: "book", type: "Book" },
          { name: "member", type: "Member" },
          { name: "status", type: "ReservationStatus" },
        ],
      },
      {
        id: "fine",
        name: "Fine",
        isEntity: true,
        why: "The money owed for an overdue return — its own payment lifecycle, independent of whether the loan itself has closed.",
        properties: [
          { name: "id", type: "string" },
          { name: "loan", type: "Loan" },
          { name: "amount", type: "Money" },
          { name: "status", type: "FineStatus" },
        ],
      },
      { id: "librarian", name: "Librarian", isEntity: false, why: "The staff member operating the checkout desk — an external actor who calls into the system, not a class inside its own domain model." },
      { id: "shelf", name: "Shelf", isEntity: false, why: "A physical location string BookCopy can hold as a field, not a class with behavior of its own." },
      { id: "catalog", name: "Catalog", isEntity: false, why: "The searchable index over all Books — a query surface, not a class with state beyond what Book already models." },
    ],
    methods: [
      {
        id: "m1",
        signature: "findAvailableCopy(): BookCopy",
        ownerId: "book",
        justification: "Book already owns the list of its own copies, so it's the class positioned to search that list for one that's free — no other class should reach into Book's copies list to do this search itself.",
        codeExercise: {
          language: "java",
          starter: "BookCopy findAvailableCopy() {\n    // your code here\n}",
          reference:
            "BookCopy findAvailableCopy() {\n    for (BookCopy copy : copies) {\n        if (copy.getStatus() == CopyStatus.AVAILABLE) {\n            return copy;\n        }\n    }\n    return null;\n}",
          checklist: [
            "Checks every copy of this book, not just the first one found",
            "Only matches copies whose status is exactly AVAILABLE — not LOST or CHECKED_OUT",
            "Returns null (not an exception) when every copy is currently out",
            "Doesn't mutate any copy's status itself — finding and assigning are separate steps",
          ],
        },
      },
      { id: "m2", signature: "getAvailableCount(): int", ownerId: "book", justification: "Derived purely from this Book's own copies list — the same aggregate-count shape as ParkingLot.isFull(), computed from data the class already owns." },
      {
        id: "m3",
        signature: "checkOut(member): void",
        ownerId: "bookcopy",
        justification: "status lives on BookCopy, so BookCopy is the only class that can flip it safely — same invariant-protection shape as ParkingSpot.assignVehicle() guarding isOccupied.",
        codeExercise: {
          language: "java",
          starter: "void checkOut(Member member) {\n    // your code here\n}",
          reference:
            "void checkOut(Member member) {\n    if (status != CopyStatus.AVAILABLE) {\n        throw new IllegalStateException(\"Copy \" + id + \" is not available\");\n    }\n    this.status = CopyStatus.CHECKED_OUT;\n}",
          checklist: [
            "Checks status is AVAILABLE before changing anything — doesn't silently check out an already-out or lost copy",
            "Fails loudly (exception, or a boolean/Result return) instead of quietly doing nothing",
            "Sets status to CHECKED_OUT only after the check passes",
            "Bonus (L5+, not required here): two members checking out the last copy at the same instant — this check-then-act needs to be atomic under concurrency, not just correct in isolation",
          ],
        },
      },
      { id: "m4", signature: "returnCopy(): void", ownerId: "bookcopy", justification: "Same invariant as checkOut() in reverse — the class that owns status is the only one allowed to clear it back to AVAILABLE." },
      { id: "m5", signature: "canBorrow(): boolean", ownerId: "member", justification: "Member owns its own activeLoans list, so it's the class that can answer 'has this person hit their borrowing limit' without Library or Loan needing to track a separate count." },
      { id: "m6", signature: "issue(member, copy): Loan", ownerId: "loan", justification: "Creating a Loan is Loan's own constructor-style responsibility — it's the class that knows what fields a valid loan needs (member, copy, dates), the same shape as Parking Lot's Ticket.issue()." },
      { id: "m7", signature: "close(returnDate): void", ownerId: "loan", justification: "Closing out a loan is a transition on Loan's own lifecycle — Loan is what tracks open vs. closed, so it enforces that transition, not Member or BookCopy reaching in to mutate it." },
      { id: "m8", signature: "calculateFine(): Money", ownerId: "fine", justification: "Fine math (days overdue × rate) is a Fine concern by definition — Loan knows the dates but shouldn't know how to price lateness, since that pricing logic can change independently of what a loan even is." },
      { id: "m9", signature: "pay(amount): boolean", ownerId: "fine", justification: "Processing payment on a fine is the financial transaction itself, the same split Parking Lot's Payment.charge() plays — bundling it into Loan would mix borrowing-proof with money movement." },
      { id: "m10", signature: "fulfill(): void", ownerId: "reservation", justification: "Reservation is the only class that knows its place in a title's hold queue, so it's the one that should decide whether it's next in line when a copy frees up." },
    ],
    relationships: [
      "Library has many Books and many Members",
      "Book has many BookCopies",
      "Loan references one BookCopy and one Member",
      "Fine is computed from a Loan's overdue duration",
      "Reservation references one Book and one Member",
    ],
    edgeCases: [
      {
        scenario: "A member tries to check out a book but has already reached their borrowing limit.",
        handling: "canBorrow() must be checked before checkOut() runs — Member owns its own active-loan count, so it's the one that can answer this without Library or Loan needing to track it separately.",
      },
      {
        scenario: "The last available copy of a title is checked out while someone else has it reserved.",
        handling: "When a copy is returned, Reservation.fulfill() should check the hold queue before the copy silently becomes available to a walk-up member — a naive returnCopy() that just flips status to AVAILABLE would let a reservation get skipped.",
      },
      {
        scenario: "A copy is returned after already being reported lost.",
        handling: "BookCopy needs a LOST status distinct from CHECKED_OUT, and returning a LOST copy should reconcile any Fine already charged for it rather than silently double-processing.",
      },
      {
        scenario: "Two members try to check out the last available copy at the exact same instant.",
        handling: "checkOut() has to be atomic — same concurrency shape as ParkingSpot.assignVehicle() checking isOccupied before assigning; whichever request commits the status flip first wins, the other fails cleanly instead of overwriting.",
      },
    ],
    tradeoffs: [
      {
        decision: "Book and BookCopy are separate classes instead of one Book class with a copiesAvailable count field.",
        reasoning: "A single counter can't tell you which physical copy someone has, when it's due back, or whether a specific copy is lost versus just checked out — those are all per-copy facts, not per-title facts, so they need BookCopy's own identity.",
      },
      {
        decision: "Reservation references a Book, not a BookCopy.",
        reasoning: "You reserve 'the next available copy of this title,' not a specific physical item — modeling Reservation against BookCopy would force guessing in advance which exact copy comes back first, which doesn't reflect how holds actually work.",
      },
      {
        decision: "Fine is its own class instead of a penalty field directly on Loan.",
        reasoning: "A fine has its own payment lifecycle (owed, paid, waived) independent of the loan's own return status — collapsing them would mean Loan has to track two unrelated state machines at once.",
      },
    ],
    principles: [
      { name: "Single Responsibility Principle", explanation: "BookCopy only tracks this one physical item's status; Book only tracks title-level metadata and its own list of copies — neither reaches into the other's job." },
      { name: "Encapsulation", explanation: "BookCopy.checkOut() and returnCopy() are the only ways its status changes — nothing else flips status directly, so two callers can never disagree about whether a copy is out." },
      { name: "Separation of Concerns", explanation: "Loan (proof you borrowed something) and Fine (money owed because of it) are separate, same split as Parking Lot's Ticket/Payment — a loan can close cleanly with no fine, or a fine can exist on a loan that's already closed." },
      { name: "Composition over inheritance", explanation: "Library HAS-A list of Books, Book HAS-A list of BookCopies — the object graph mirrors the physical catalog directly, instead of forcing an inheritance hierarchy that doesn't reflect reality." },
    ],
  },
};

const atm: ColdDrillPrompt = {
  id: "atm",
  title: "Design an ATM",
  prompt: "Design an ATM.",
  reference: {
    clarifyingQuestions: [
      {
        question: "Is this a single, standalone ATM, or part of a network reporting to a central bank system?",
        why: "A standalone ATM can keep Account/Card data locally; a networked ATM means Account and Card really live in a remote bank system the ATM only queries — changes what those classes even represent versus a thin client reference.",
      },
      {
        question: "Withdrawal only, or also deposits and balance transfers?",
        why: "Deposit-in-scope means CashDispenser needs an accept-and-count-inserted-cash responsibility too, not just dispense — roughly doubles what the hardware-facing classes need to do.",
      },
      {
        question: "A single currency and a fixed set of bill denominations, or configurable per machine?",
        why: "Determines whether CashDispenser's denomination set is a fixed constant or a configurable field the machine is provisioned with — changes whether denomination values are hardcoded or data.",
      },
      {
        question: "Is PIN retry lockout in scope, or can we assume a valid PIN is always eventually entered?",
        why: "Decides whether Card even needs a failedAttempts field and an isLocked() method — without this scope, the whole lockout edge case and its class-level support disappear.",
      },
    ],
    entities: [
      {
        id: "atm",
        name: "ATM",
        isEntity: true,
        why: "The persistent, always-on machine — owns the CashDispenser hardware and serves one customer session after another without itself holding per-use state.",
        properties: [
          { name: "id", type: "string" },
          { name: "location", type: "string" },
          { name: "cashDispenser", type: "CashDispenser" },
        ],
      },
      {
        id: "session",
        name: "Session",
        isEntity: true,
        why: "The short-lived per-customer state machine — idle, card inserted, PIN verified, dispensing — created fresh for each visit and discarded after, so ATM itself never has to reset between customers.",
        properties: [
          { name: "id", type: "string" },
          { name: "card", type: "Card" },
          { name: "state", type: "SessionState" },
          { name: "startedAt", type: "DateTime" },
        ],
      },
      {
        id: "card",
        name: "Card",
        isEntity: true,
        why: "Identifies which Account this session is acting on, and tracks lockout state that must persist across sessions and across machines — a card blocked here stays blocked everywhere.",
        properties: [
          { name: "id", type: "string" },
          { name: "cardNumber", type: "string" },
          { name: "accountId", type: "string" },
          { name: "pinHash", type: "string" },
          { name: "failedAttempts", type: "int" },
        ],
      },
      {
        id: "account",
        name: "Account",
        isEntity: true,
        why: "Owns the balance — the one number every withdrawal ultimately checks and mutates, independent of which card, session, or machine is acting on it.",
        properties: [
          { name: "id", type: "string" },
          { name: "accountNumber", type: "string" },
          { name: "balance", type: "Money" },
        ],
      },
      {
        id: "transaction",
        name: "Transaction",
        isEntity: true,
        why: "The auditable record of what was attempted and what happened — exists even for a transaction that failed, which a balance mutation alone could never represent.",
        properties: [
          { name: "id", type: "string" },
          { name: "account", type: "Account" },
          { name: "type", type: "TransactionType" },
          { name: "amount", type: "Money" },
          { name: "status", type: "TransactionStatus" },
          { name: "timestamp", type: "DateTime" },
        ],
      },
      {
        id: "cashdispenser",
        name: "CashDispenser",
        isEntity: true,
        why: "The physical hardware — tracks how many bills of each denomination are actually loaded, which a single total-cash number could never answer correctly for a specific withdrawal amount.",
        properties: [
          { name: "id", type: "string" },
          { name: "denominationCounts", type: "Map<Integer, Integer>" },
        ],
      },
      { id: "bank", name: "Bank", isEntity: false, why: "Account and Transaction already model everything this system needs to know about the bank — a full Bank class would just be an out-of-scope integration point, not a class in this system's own domain model." },
      { id: "receiptprinter", name: "ReceiptPrinter", isEntity: false, why: "A hardware output, not a class with state or decisions of its own — printing a receipt is a side effect of a completed Transaction, not a responsibility that needs its own class." },
      { id: "keypad", name: "Keypad", isEntity: false, why: "An input device Session reads from, not a class with independent behavior in the domain model." },
    ],
    methods: [
      {
        id: "m1",
        signature: "insertCard(card): void",
        ownerId: "session",
        justification: "Session is what tracks whether a card is currently inserted for this particular use — ATM itself stays a passive host across many sessions, so per-use state belongs on Session, not ATM.",
      },
      {
        id: "m2",
        signature: "verifyPin(pin): boolean",
        ownerId: "session",
        justification: "Verifying a PIN transitions Session's own state machine from CARD_INSERTED toward PIN_VERIFIED (or fails and defers to Card to record the failed attempt) — this is squarely Session's job since it's the class tracking where in the flow this specific visit is.",
      },
      {
        id: "m3",
        signature: "incrementFailedAttempts(): void",
        ownerId: "card",
        justification: "failedAttempts lives on Card because it must persist across sessions — a blocked card stays blocked even after this session ends and the ATM resets to idle for the next customer.",
      },
      {
        id: "m4",
        signature: "isLocked(): boolean",
        ownerId: "card",
        justification: "Whether a card is locked is derived purely from Card's own failedAttempts field — no other class holds the data needed to answer this.",
      },
      {
        id: "m5",
        signature: "debit(amount): void",
        ownerId: "account",
        justification: "balance lives on Account, so Account is the only class that can safely check-then-mutate it — letting Session or ATM subtract from balance directly would let two different callers disagree about what the account can actually afford.",
        codeExercise: {
          language: "java",
          starter: "void debit(Money amount) {\n    // your code here\n}",
          reference:
            "void debit(Money amount) {\n    if (amount.isGreaterThan(balance)) {\n        throw new IllegalStateException(\"Insufficient funds for this withdrawal\");\n    }\n    this.balance = balance.subtract(amount);\n}",
          checklist: [
            "Checks the requested amount against the CURRENT balance before subtracting, not after",
            "Fails loudly (exception) on insufficient funds instead of letting balance go negative",
            "Mutates balance only after the check passes",
            "Bonus (L5+, not required here): this check-then-act needs to be atomic under concurrent withdrawal attempts on the same account — e.g. two ATMs debiting at once",
          ],
        },
      },
      {
        id: "m6",
        signature: "create(account, type, amount): Transaction",
        ownerId: "transaction",
        justification: "Building a Transaction record is Transaction's own constructor-style responsibility — it's the class that knows what fields a valid record needs, same as Parking Lot's Ticket.issue().",
      },
      {
        id: "m7",
        signature: "hasEnoughCash(amount): boolean",
        ownerId: "cashdispenser",
        justification: "Only CashDispenser holds the per-denomination counts needed to answer whether an exact amount can actually be made — a single total-cash check on ATM couldn't tell $140 apart from an unmakeable $140 in only $50 bills.",
      },
      {
        id: "m8",
        signature: "dispense(amount): Map<Integer, Integer>",
        ownerId: "cashdispenser",
        justification: "Deciding which physical bills to hand out is a hardware-inventory problem only CashDispenser has the data to solve — Session just asks for an amount, it doesn't know or care about denominations.",
        codeExercise: {
          language: "java",
          starter: "Map<Integer, Integer> dispense(int amount) {\n    // your code here\n}",
          reference:
            "Map<Integer, Integer> dispense(int amount) {\n    Map<Integer, Integer> result = new LinkedHashMap<>();\n    int remaining = amount;\n    List<Integer> denominations = new ArrayList<>(denominationCounts.keySet());\n    denominations.sort(Collections.reverseOrder());\n    for (int denomination : denominations) {\n        int available = denominationCounts.get(denomination);\n        int needed = Math.min(remaining / denomination, available);\n        if (needed > 0) {\n            result.put(denomination, needed);\n            remaining -= needed * denomination;\n        }\n    }\n    if (remaining > 0) {\n        throw new IllegalStateException(\"Cannot make this amount with available denominations\");\n    }\n    denominations.forEach(d -> denominationCounts.put(d, denominationCounts.get(d) - result.getOrDefault(d, 0)));\n    return result;\n}",
          checklist: [
            "Tries largest denominations first (greedy), not a fixed or arbitrary order",
            "Never uses more bills of a denomination than are actually available in the dispenser",
            "Fails loudly if the exact amount can't be made with what's currently loaded, instead of silently dispensing less than requested",
            "Only mutates the dispenser's counts once the full breakdown is confirmed possible, not partway through a failed attempt",
          ],
        },
      },
      {
        id: "m9",
        signature: "completeTransaction(): void",
        ownerId: "session",
        justification: "Transitioning to COMPLETE and ejecting the card is the last step of THIS session's own lifecycle — the same reasoning as Session owning every other state transition in the flow.",
      },
    ],
    relationships: [
      "Session references one Card",
      "Card references one Account by accountId",
      "Transaction references one Account",
      "ATM owns one CashDispenser",
    ],
    edgeCases: [
      {
        scenario: "The dispenser runs out of $20 bills mid-way through fulfilling a $140 withdrawal.",
        handling: "dispense() must check hasEnoughCash() as a single gate before mutating any denomination counts — if the exact amount can't be made from what's currently available, the whole withdrawal fails before a single bill is dispensed, not partway through.",
      },
      {
        scenario: "The bank's network call to confirm the debit times out after cash has already been physically dispensed.",
        handling: "The debit must be durably recorded BEFORE the physical dispense happens, not after — Transaction should only reach a DISPENSING status once the debit is confirmed, so a network failure after that point is a reconciliation problem, not cash handed out against no debit at all.",
      },
      {
        scenario: "A customer enters the wrong PIN three times in a row.",
        handling: "Card.isLocked() derives from failedAttempts, which lives on Card (not Session) specifically so the lockout persists across ATMs and across sessions — a blocked card stays blocked at every machine, not just the one it was entered wrong on.",
      },
      {
        scenario: "The customer walks away mid-transaction after cash has been dispensed but before taking it.",
        handling: "This is a Session-lifecycle concern, not a data-integrity one — Session should time out and eject the card automatically, but the Transaction itself is already complete since debit and dispense both already succeeded.",
      },
    ],
    tradeoffs: [
      {
        decision: "Session is a separate class from ATM instead of the state machine (idle → card inserted → PIN verified → dispensing) living directly on ATM.",
        reasoning: "ATM is the persistent, always-on hardware serving one customer after another; Session is the short-lived per-use state. Splitting it out means ATM barely changes between customers while Session is created and discarded per visit.",
      },
      {
        decision: "CashDispenser tracks per-denomination counts instead of ATM just holding a single totalCash number.",
        reasoning: "A single total can't answer 'can I actually make exactly $140' — the dispenser might have $500 loaded entirely in $50 bills and still be unable to dispense $140. Tracking counts per denomination is what makes dispense() and hasEnoughCash() correct.",
      },
      {
        decision: "Transaction is a separate class from the debit itself, instead of Account.debit() alone constituting the record of a withdrawal.",
        reasoning: "Same split as Parking Lot's Ticket/Payment — the balance mutation and the auditable record of what happened are different concerns with different lifecycles; a Transaction can exist in a FAILED or PENDING state even when no debit ever actually happened.",
      },
    ],
    principles: [
      { name: "Single Responsibility Principle", explanation: "Card only knows card-level state (PIN, failed attempts); Account only knows balance; CashDispenser only knows physical bill inventory — none of them reach into another's job to authorize or dispense." },
      { name: "Encapsulation", explanation: "Account.debit() is the only way balance changes — no other class reaches in and subtracts from balance directly, so it can never be corrupted by a caller that forgot to check funds first." },
      { name: "Separation of Concerns", explanation: "Authentication (Session/Card) is kept separate from money movement (Account/Transaction), which is kept separate from physical cash handling (CashDispenser) — three different failure modes that shouldn't tangle into one God-class ATM." },
      { name: "State pattern", explanation: "Session.state gates which actions are even valid — you can't verifyPin() before insertCard(), and you can't dispense before PIN verification succeeds — encoding the flow as an explicit state field makes invalid sequences impossible by construction." },
    ],
  },
};

const restaurantReservation: ColdDrillPrompt = {
  id: "restaurant-reservation",
  title: "Design a Restaurant Reservation System",
  prompt: "Design a restaurant reservation system.",
  reference: {
    clarifyingQuestions: [
      {
        question: "Are reservations tied to a specific time slot, or is this walk-in/waitlist only?",
        why: "Decides whether Reservation exists as a class at all — waitlist-only drops the whole timed-booking flow and its no-show handling.",
      },
      {
        question: "Do we need to match party size to table capacity, or can any party sit at any table?",
        why: "Decides whether findAvailableTable() needs a capacity filter at all — without size matching, seating is just 'any free table,' the same simplification Parking Lot's clarify Q makes for a single spot type.",
      },
      {
        question: "Single restaurant, or a reservation platform spanning many restaurants?",
        why: "A platform-wide system needs Restaurant to be a real entity every Table/Reservation references; a single-location system can drop Restaurant as a class entirely and just have a flat list of Tables.",
      },
      {
        question: "Do repeat no-shows need to be tracked and penalized, or is that out of scope?",
        why: "Decides whether Customer needs its own identity and a noShowCount field at all — without this, contact info could just be inline strings on each Reservation.",
      },
    ],
    entities: [
      {
        id: "restaurant",
        name: "Restaurant",
        isEntity: true,
        why: "The top-level system — owns every Table and searches across all of them, the same aggregate-root role ParkingLot plays over Levels.",
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
        why: "A physical table — has a seating capacity, a live occupied/free state, and its own list of upcoming timed reservations.",
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
        why: "A scheduled booking for a future time — links a Customer to a Table with a party size and a status, the same 'proof of the transaction' role Parking Lot's Ticket plays.",
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
        why: "A live queue position for a walk-in party right now, not a scheduled promise for later — a genuinely different lifecycle from Reservation, which is exactly why it needs its own class.",
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
        why: "A real participant with an identity that persists across many separate bookings — needed the moment repeat no-shows have to be tracked and penalized.",
        properties: [
          { name: "id", type: "string" },
          { name: "name", type: "string" },
          { name: "phoneNumber", type: "string" },
          { name: "noShowCount", type: "int" },
        ],
      },
      { id: "host", name: "Host", isEntity: false, why: "The staff member seating guests — an external actor who calls into the system, not a class inside its own domain model." },
      { id: "menu", name: "Menu", isEntity: false, why: "The food menu is a separate ordering/POS concern, not part of a reservation system's own domain model." },
      { id: "receipt", name: "Receipt", isEntity: false, why: "A byproduct of a completed visit — a message, not a class with its own responsibilities." },
    ],
    methods: [
      {
        id: "m1",
        signature: "findAvailableTable(partySize, time): Table",
        ownerId: "restaurant",
        justification: "Restaurant is the only class that can see across every Table it owns, so it's the one that searches for a size-matched, time-free candidate — no single Table can compare itself against its siblings.",
        codeExercise: {
          language: "java",
          starter: "Table findAvailableTable(int partySize, LocalDateTime time) {\n    // your code here\n}",
          reference:
            "Table findAvailableTable(int partySize, LocalDateTime time) {\n    for (Table table : tables) {\n        if (table.getCapacity() >= partySize && table.isAvailableAt(time)) {\n            return table;\n        }\n    }\n    return null;\n}",
          checklist: [
            "Checks every table, not just the first one with any capacity",
            "Accepts any table capacity ≥ party size, not just an exact match — same 'size ≥ need' rule as Parking Lot's spot matching",
            "Delegates the time-conflict check to Table.isAvailableAt() rather than re-implementing overlap logic itself",
            "Returns null (not an exception) when nothing fits, so the caller can offer the waitlist instead",
          ],
        },
      },
      { id: "m2", signature: "isFullyBooked(time): boolean", ownerId: "restaurant", justification: "Derived by asking every Table's own availability at that time — the same aggregate-check shape as ParkingLot.isFull(), computed from data Restaurant already owns via its tables." },
      {
        id: "m3",
        signature: "seatParty(): void",
        ownerId: "table",
        justification: "status lives on Table, so Table is the only class that can flip it safely — same invariant-protection shape as ParkingSpot.assignVehicle() guarding isOccupied.",
        codeExercise: {
          language: "java",
          starter: "void seatParty() {\n    // your code here\n}",
          reference:
            "void seatParty() {\n    if (status != TableStatus.FREE) {\n        throw new IllegalStateException(\"Table \" + id + \" is not free\");\n    }\n    this.status = TableStatus.OCCUPIED;\n}",
          checklist: [
            "Checks status is FREE before seating anyone — doesn't silently double-seat an occupied table",
            "Fails loudly (exception, or a boolean/Result return) instead of quietly doing nothing",
            "Sets status to OCCUPIED only after the check passes",
            "Bonus (L5+, not required here): two hosts seating the last free table at the same instant needs this check-then-act to be atomic, not just correct in isolation",
          ],
        },
      },
      { id: "m4", signature: "clearTable(): void", ownerId: "table", justification: "Same invariant as seatParty() in reverse — the class that owns status is the only one allowed to clear it back to FREE." },
      { id: "m5", signature: "isAvailableAt(time): boolean", ownerId: "table", justification: "Table owns its own list of upcoming reservations, so it's the class positioned to check whether a given time collides with one of them — no other class should reach into that list to do the check itself." },
      { id: "m6", signature: "create(customer, table, partySize, time): Reservation", ownerId: "reservation", justification: "Creating a Reservation is its own constructor-style responsibility — it's the class that knows what fields a valid booking needs, the same shape as Parking Lot's Ticket.issue()." },
      { id: "m7", signature: "cancel(): void", ownerId: "reservation", justification: "Cancelling is a transition on Reservation's own lifecycle status — Reservation is what tracks booked vs. cancelled, so it enforces that transition itself." },
      { id: "m8", signature: "markNoShow(): void", ownerId: "reservation", justification: "Reservation is what knows it passed its reservationTime with nobody seated, so it's the class that triggers the no-show transition — and from there notifies Customer to increment its own count." },
      { id: "m9", signature: "notifyReady(): void", ownerId: "waitlistentry", justification: "WaitlistEntry is what tracks its own queue position (joinedAt), so it's the class that should decide whether it's next in line when a table frees up — not whichever host happens to look at the list first." },
      { id: "m10", signature: "incrementNoShowCount(): void", ownerId: "customer", justification: "noShowCount lives on Customer, so Customer is the only class that should be allowed to flip it — same invariant-protection shape as any other owned-state mutation in this app." },
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
        handling: "Reservation needs a grace-period check — markNoShow() should only fire after some threshold past reservationTime, not the instant the clock passes it, and the table should only free back into the pool once that threshold passes, not immediately at the reservation time.",
      },
      {
        scenario: "A walk-in party of 4 arrives right as a table for 6 becomes free, but a reservation for that same table starts in 20 minutes.",
        handling: "findAvailableTable() must check isAvailableAt() against ALL of a table's upcoming reservations for the estimated dining duration, not just whether it's free this exact second — seating a walk-in into a slot that collides with a booking coming up shortly is the actual bug here.",
      },
      {
        scenario: "A no-show happens for the third time from the same customer.",
        handling: "Customer.noShowCount persists across all of that customer's reservations, independent of which Table or visit was involved — a policy like 'no-show 3 times, can't book online anymore' needs this count to live on Customer, not on any individual Reservation.",
      },
      {
        scenario: "Two walk-in parties are next in line on the waitlist when a table frees up, and both are the same size.",
        handling: "notifyReady() must be driven by waitlist queue order (joinedAt), not by whichever host happens to glance at the list first — same FIFO-queue shape as any other ordered queue in this app.",
      },
    ],
    tradeoffs: [
      {
        decision: "Reservation and WaitlistEntry are two separate classes instead of one Booking class with a nullable reservationTime.",
        reasoning: "A timed reservation and a walk-in waitlist entry have genuinely different lifecycles — one is scheduled and can be no-showed, the other is a live queue position that resolves in minutes — collapsing them into one class with an optional time field would mean half its fields are always null depending on which kind it is.",
      },
      {
        decision: "Table tracks its own live status (FREE/OCCUPIED) separately from its list of future timed Reservations.",
        reasoning: "A table can be physically empty right now while still having a reservation booked for later tonight — conflating 'is anyone sitting here right now' with 'is this slot booked' would make it impossible to seat a walk-in into a table that's free at this moment but reserved for later.",
      },
      {
        decision: "Customer is its own class instead of a name/phone pair duplicated onto every Reservation and WaitlistEntry.",
        reasoning: "noShowCount needs to persist and accumulate across many separate bookings for the same person — copying contact info onto each booking with no shared identity would make it impossible to answer 'has this person no-showed before.'",
      },
    ],
    principles: [
      { name: "Single Responsibility Principle", explanation: "Table only tracks its own live status and its own reservation list; Restaurant only searches across tables it owns — neither reaches into the other's bookkeeping." },
      { name: "Encapsulation", explanation: "Table.seatParty() and clearTable() are the only way its status changes — nothing else flips FREE/OCCUPIED directly, so two hosts can't accidentally double-seat the same table." },
      { name: "Separation of Concerns", explanation: "Reservation (a scheduled promise) and WaitlistEntry (a live queue position) stay separate even though both eventually seat someone — they fail and resolve in completely different ways." },
      { name: "Single source of truth", explanation: "noShowCount lives on Customer because it's read and written across many different Reservations — putting it anywhere else would mean copying and reconciling a count across records instead of owning it in one place." },
    ],
  },
};

const rideShareDispatch: ColdDrillPrompt = {
  id: "ride-share-dispatch",
  title: "Design a Ride-Sharing Dispatch System",
  prompt: "Design a ride-sharing dispatch system — matching riders to nearby drivers.",
  reference: {
    clarifyingQuestions: [
      {
        question: "Do we need to match on vehicle type/capacity, or is any available driver a valid match?",
        why: "Decides whether Driver needs a vehicleType field and findNearestDriver() needs a filter at all — without it, matching is purely distance-based.",
      },
      {
        question: "Is this on-demand only, or do scheduled/advance rides need to be supported too?",
        why: "Scheduled rides would need MatchRequest to carry a future requestedTime and a separate matching pass that runs ahead of time — a real structural fork from immediate on-demand matching.",
      },
      {
        question: "Single fixed-fare model, or dynamic/surge pricing?",
        why: "Decides whether Trip.fare is a simple flat calculation or needs its own pricing-strategy class — same scoping shape as whether Payment needs to be a real class in Parking Lot.",
      },
      {
        question: "Is driver rating/history in scope, or just the matching mechanics?",
        why: "Rating-in-scope would mean Driver needs a rating field and possibly its own Rating class tied to completed Trips — without it, Driver stays a much thinner class.",
      },
    ],
    entities: [
      {
        id: "rider",
        name: "Rider",
        isEntity: true,
        why: "The person requesting a ride — has an identity that outlives any single trip, the same recurring-actor role Driver plays on the other side of the match.",
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
        why: "A rider's pending ask for a driver — exists from the moment it's submitted until it's matched, cancelled, or expires, which a Trip record alone can't represent since most requests never even find a driver.",
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
        why: "The actual ride once a driver is assigned — separate from the request that led to it, since a trip has its own lifecycle (in progress, completed, cancelled) that a still-searching request doesn't.",
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
        why: "The class that actually performs the search — needs visibility across every Driver at once, which no single Rider or Driver has, the same coordinator role ParkingLot plays searching across Levels.",
        properties: [{ name: "id", type: "string" }],
      },
      { id: "vehicle", name: "Vehicle", isEntity: false, why: "Just a category tag (e.g. sedan vs. XL) used for matching, with no independent behavior of its own — modeling it as a full class would treat a value like an actor." },
      { id: "locationindex", name: "LocationIndex", isEntity: false, why: "A geospatial indexing/implementation detail for making nearest-driver lookups fast, not a class in the core domain model itself." },
      { id: "payment", name: "Payment", isEntity: false, why: "Nobody asked for payment processing — inventing fare-charging scope adds complexity the prompt never requested." },
    ],
    methods: [
      {
        id: "m1",
        signature: "findNearestDriver(riderLocation): Driver",
        ownerId: "dispatchservice",
        justification: "DispatchService is the only class that can see across every Driver's current location and availability at once — no single Driver should decide for itself whether it's the best match for a given request.",
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
        },
      },
      { id: "m2", signature: "matchRequest(request): void", ownerId: "dispatchservice", justification: "Orchestrating a search plus creating the resulting Trip is DispatchService's job — it composes findNearestDriver() with Trip.create(), the same coordinator role ParkingLot plays delegating to findAvailableSpot() and Ticket.issue()." },
      { id: "m3", signature: "create(rider, pickup, dropoff): MatchRequest", ownerId: "matchrequest", justification: "Creating a MatchRequest is its own constructor-style responsibility — it's the class that knows what fields a valid request needs, the same shape as Parking Lot's Ticket.issue()." },
      { id: "m4", signature: "expire(): void", ownerId: "matchrequest", justification: "Expiring is a transition on MatchRequest's own lifecycle status — it's what tracks pending vs. expired, so it enforces that transition itself." },
      { id: "m5", signature: "cancel(): void", ownerId: "matchrequest", justification: "Same invariant-owner reasoning as expire() — only MatchRequest should be allowed to move its own status to cancelled." },
      { id: "m6", signature: "setAvailable(available): void", ownerId: "driver", justification: "isAvailable lives on Driver, so Driver is the only class that should flip it — same invariant-protection shape as ParkingSpot's isOccupied." },
      { id: "m7", signature: "updateLocation(location): void", ownerId: "driver", justification: "currentLocation is Driver's own field — only Driver should be the one updating its own position, not DispatchService reaching in to overwrite it." },
      { id: "m8", signature: "create(matchRequest, driver): Trip", ownerId: "trip", justification: "Building a Trip record once a match succeeds is Trip's own constructor-style responsibility, the same shape as Parking Lot's Ticket.issue()." },
      { id: "m9", signature: "completeTrip(): void", ownerId: "trip", justification: "Completing is a transition on Trip's own lifecycle — Trip is what tracks in-progress vs. completed, so it enforces that transition and is what should free the driver back to available." },
      {
        id: "m10",
        signature: "cancelTrip(reason): void",
        ownerId: "trip",
        justification: "Cancelling is Trip's own lifecycle transition — and since Trip is the class that knows which Driver it's holding onto, it's positioned to release that driver back to the pool as part of the same operation.",
        codeExercise: {
          language: "java",
          starter: "void cancelTrip(String reason) {\n    // your code here\n}",
          reference:
            "void cancelTrip(String reason) {\n    if (status == TripStatus.COMPLETED) {\n        throw new IllegalStateException(\"Cannot cancel a completed trip\");\n    }\n    this.status = TripStatus.CANCELLED;\n    driver.setAvailable(true);\n}",
          checklist: [
            "Rejects cancelling a trip that's already COMPLETED — can't undo a finished trip",
            "Frees the driver back to available so they can be matched again, not left stuck 'busy' forever",
            "Sets status to CANCELLED only after the completed-check passes",
            "Bonus (L5+, not required here): if the trip was already in progress, cancellation might need a partial-fare/cancellation-fee policy — out of scope for this exercise but worth naming out loud in an interview",
          ],
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
        handling: "cancelTrip() must free the driver back to available AND leave the original MatchRequest re-matchable — the rider shouldn't have to submit a brand new request from scratch just because the first driver backed out.",
      },
      {
        scenario: "Two riders' requests both get matched to the same driver at nearly the same instant.",
        handling: "findNearestDriver() plus assignment has to be atomic — the same check-then-act race as ParkingSpot.assignVehicle(); whichever match commits first should flip the driver unavailable before the second match attempt even runs.",
      },
      {
        scenario: "No driver is available anywhere near the rider's location.",
        handling: "findNearestDriver() returning null shouldn't leave the rider hanging — MatchRequest needs an explicit way to stay PENDING and retry, or transition to EXPIRED after some timeout, rather than the request just silently failing once.",
      },
      {
        scenario: "A driver's GPS location hasn't updated in several minutes when a match is attempted.",
        handling: "Driver's lastLocationUpdate needs to factor into matching — sending a rider to a driver's last-known position from several minutes ago could send them somewhere the driver isn't anymore, so stale locations should be deprioritized or excluded.",
      },
    ],
    tradeoffs: [
      {
        decision: "MatchRequest and Trip are separate classes instead of one Trip class that starts in a PENDING/unmatched state.",
        reasoning: "A request that never gets matched (no drivers available, rider cancels before match) never has a driver, pickup confirmation, or fare — collapsing it into Trip would mean most of Trip's fields are null until a match actually happens; keeping them separate mirrors Parking Lot's Ticket/Payment split.",
      },
      {
        decision: "DispatchService is a separate stateless-ish coordinator instead of Rider or Driver owning the matching logic themselves.",
        reasoning: "Matching needs visibility across every Driver at once to find the nearest one — no single Rider or Driver has that view, so the search has to live on a class that can see the whole pool, the same shape as ParkingLot searching across every Level.",
      },
      {
        decision: "Driver stores vehicleType as a plain field instead of a separate Vehicle class.",
        reasoning: "A vehicle here is just a category tag used for matching (e.g. requesting an XL), with no independent behavior of its own — giving it full class treatment would be modeling a value as if it were an actor.",
      },
    ],
    principles: [
      { name: "Single Responsibility Principle", explanation: "DispatchService only searches and matches; Trip only tracks the lifecycle of an assigned ride — neither reaches into the other's job." },
      { name: "Encapsulation", explanation: "Driver.setAvailable() is the only way its availability flag changes — nothing else flips it directly, so two matches can't both claim the same driver." },
      { name: "Separation of Concerns", explanation: "MatchRequest (the search for a driver) and Trip (the ride once matched) are kept apart because they fail and resolve in completely different ways — a request can expire with no trip ever created." },
      { name: "Idempotent state transitions", explanation: "Trip.cancelTrip() explicitly rejects cancelling an already-COMPLETED trip — transitions are guarded so calling a method twice, or out of order, can't corrupt the record." },
    ],
  },
};

const pcBuilder: ColdDrillPrompt = {
  id: "pc-builder",
  title: "Design a Custom PC Builder",
  prompt:
    "Design a custom PC / computer builder — a customer picks components (CPU, GPU, RAM, storage, PSU) step by step and the system validates compatibility before final purchase.",
  reference: {
    clarifyingQuestions: [
      {
        question: "Do we need to validate compatibility incrementally as each component is picked, or only at final build() time?",
        why: "Decides whether selectCpu()/selectMotherboard() themselves need validation logic, or whether all checking can be deferred to one place in build() — a real structural choice about where the invariant lives.",
      },
      {
        question: "Is this a single build session per customer, or do we need to support saving a partial build and resuming later?",
        why: "Resuming later means PCBuilder itself needs to be persisted with an id and reloaded — a stateless one-shot session needs no such persistence layer at all.",
      },
      {
        question: "Do we need to support pre-built bundles/presets, or is every build fully custom component-by-component?",
        why: "Presets would need a separate PresetConfiguration entity that pre-fills a PCBuilder — without that scope, PCBuilder only ever starts empty.",
      },
      {
        question: "Is pricing/total cost in scope, or just compatibility validation?",
        why: "Pricing-in-scope means every component needs a price field and PCBuild needs a calculateTotalPrice() — same scoping question as whether Payment is in scope in the Parking Lot lesson.",
      },
    ],
    entities: [
      {
        id: "pcbuilder",
        name: "PCBuilder",
        isEntity: true,
        why: "The in-progress, mutable accumulation of the customer's choices — exists only during the build session, and is nothing but selection methods plus the validation that guards them.",
        properties: [
          { name: "id", type: "string" },
          { name: "selectedCpu", type: "CPU" },
          { name: "selectedMotherboard", type: "Motherboard" },
          { name: "selectedGpu", type: "GPU" },
          { name: "selectedPsu", type: "PSU" },
          { name: "ramGb", type: "int" },
          { name: "storageGb", type: "int" },
        ],
      },
      {
        id: "cpu",
        name: "CPU",
        isEntity: true,
        why: "Has a socket type that must physically match the motherboard, and a power draw that feeds directly into the PSU wattage check — real compatibility-relevant data, not just a label.",
        properties: [
          { name: "id", type: "string" },
          { name: "name", type: "string" },
          { name: "socketType", type: "SocketType" },
          { name: "tdpWatts", type: "int" },
        ],
      },
      {
        id: "motherboard",
        name: "Motherboard",
        isEntity: true,
        why: "Has its own socket type that either matches or rejects whatever CPU is chosen — the other half of the socket-compatibility check.",
        properties: [
          { name: "id", type: "string" },
          { name: "name", type: "string" },
          { name: "socketType", type: "SocketType" },
          { name: "maxRamSlots", type: "int" },
        ],
      },
      {
        id: "gpu",
        name: "GPU",
        isEntity: true,
        why: "Contributes its own power draw to the total wattage budget the PSU has to cover — same reason CPU carries a tdpWatts field.",
        properties: [
          { name: "id", type: "string" },
          { name: "name", type: "string" },
          { name: "tdpWatts", type: "int" },
        ],
      },
      {
        id: "psu",
        name: "PSU",
        isEntity: true,
        why: "Has a wattage rating that must cover the CPU+GPU's combined draw — the class the whole power-budget check is actually about.",
        properties: [
          { name: "id", type: "string" },
          { name: "name", type: "string" },
          { name: "wattageRating", type: "int" },
        ],
      },
      {
        id: "pcbuild",
        name: "PCBuild",
        isEntity: true,
        why: "The finished, immutable spec produced only once build() succeeds — a completely different lifecycle from PCBuilder, which is why it's a separate class instead of PCBuilder just marking itself 'done'.",
        properties: [
          { name: "id", type: "string" },
          { name: "cpu", type: "CPU" },
          { name: "motherboard", type: "Motherboard" },
          { name: "gpu", type: "GPU" },
          { name: "psu", type: "PSU" },
          { name: "ramGb", type: "int" },
          { name: "storageGb", type: "int" },
          { name: "totalPowerDrawWatts", type: "int" },
        ],
      },
      { id: "user", name: "Customer", isEntity: false, why: "Whoever operates the builder is an external actor calling into the system, not a class inside the builder's own domain model." },
      { id: "cart", name: "ShoppingCart", isEntity: false, why: "A separate checkout/payment concern once build() succeeds — nobody asked for purchasing flow, only compatibility validation." },
      {
        id: "checker",
        name: "CompatibilityChecker",
        isEntity: false,
        why: "Tempting to model as its own class, but the compatibility checks only ever need data PCBuilder already holds about its own selections — pulling that logic into a separate class would just move a method sideways with no new state or reuse to justify it.",
      },
    ],
    methods: [
      { id: "m1", signature: "selectCpu(cpu): void", ownerId: "pcbuilder", justification: "Recording the chosen CPU is PCBuilder's own accumulation step — the same incremental-state-gathering role every selectX() method plays." },
      {
        id: "m2",
        signature: "selectMotherboard(motherboard): void",
        ownerId: "pcbuilder",
        justification: "PCBuilder is the only place that knows about every choice made so far, so it's positioned to catch a socket mismatch the instant an incompatible motherboard is introduced, rather than silently accepting it and failing later at build().",
        codeExercise: {
          language: "java",
          starter: "void selectMotherboard(Motherboard motherboard) {\n    // your code here\n}",
          reference:
            "void selectMotherboard(Motherboard motherboard) {\n    if (selectedCpu != null && selectedCpu.getSocketType() != motherboard.getSocketType()) {\n        throw new IllegalStateException(\"Motherboard socket does not match already-selected CPU socket\");\n    }\n    this.selectedMotherboard = motherboard;\n}",
          checklist: [
            "Checks against an already-selected CPU's socket type, not just accepting any motherboard",
            "Fails loudly (exception) on a socket mismatch instead of silently accepting an incompatible pair",
            "Still allows selecting a motherboard first, before any CPU is chosen (selectedCpu can be null)",
            "Bonus (L5+, not required here): if a CPU is selected AFTER an incompatible motherboard, selectCpu() needs the same reverse check — this exercise only covers one direction",
          ],
        },
      },
      { id: "m3", signature: "selectGpu(gpu): void", ownerId: "pcbuilder", justification: "Same accumulation role as selectCpu() — GPU has no socket constraint to check here, only a power draw that matters later at build()." },
      { id: "m4", signature: "selectPsu(psu): void", ownerId: "pcbuilder", justification: "Same accumulation role as the other selectX() methods — the wattage check is deferred to build(), once every draw-contributing component is known." },
      { id: "m5", signature: "selectRam(ramGb): void", ownerId: "pcbuilder", justification: "RAM has no compatibility rule modeled in this scope, so this is a plain field assignment — the same reasoning that kept RAM as an int instead of its own class." },
      { id: "m6", signature: "selectStorage(storageGb): void", ownerId: "pcbuilder", justification: "Same reasoning as selectRam() — no compatibility constraint modeled, so nothing beyond recording the choice belongs here." },
      { id: "m7", signature: "checkCompatibility(): boolean", ownerId: "pcbuilder", justification: "A pure query over PCBuilder's own already-selected components (socket match, wattage budget) — kept separate from build() so the customer's UI can show a live compatibility signal before they even try to finalize." },
      {
        id: "m8",
        signature: "build(): PCBuild",
        ownerId: "pcbuilder",
        justification: "build() is the one moment PCBuilder commits its accumulated, mutable choices into a final, immutable PCBuild — the defining Builder-pattern moment: construct only when explicitly asked, never before.",
        codeExercise: {
          language: "java",
          starter: "PCBuild build() {\n    // your code here\n}",
          reference:
            "PCBuild build() {\n    if (selectedCpu == null || selectedMotherboard == null || selectedGpu == null || selectedPsu == null) {\n        throw new IllegalStateException(\"Cannot build - required components are missing\");\n    }\n    int totalDraw = selectedCpu.getTdpWatts() + selectedGpu.getTdpWatts();\n    if (selectedPsu.getWattageRating() < totalDraw) {\n        throw new IllegalStateException(\"Selected PSU cannot supply enough wattage for this build\");\n    }\n    return new PCBuild(selectedCpu, selectedMotherboard, selectedGpu, selectedPsu, ramGb, storageGb, totalDraw);\n}",
          checklist: [
            "Rejects build() if any required component (CPU, motherboard, GPU, PSU) hasn't been selected yet",
            "Sums CPU + GPU wattage draw and checks it against the selected PSU's rating before allowing the build",
            "Fails loudly (exception) rather than returning a partially-valid PCBuild",
            "Bonus (L5+, not required here): a real build might budget wattage headroom (e.g. require the PSU rated 20% above draw) rather than an exact threshold — this exercise uses an exact comparison",
          ],
        },
      },
      { id: "m9", signature: "reset(): void", ownerId: "pcbuilder", justification: "Clearing every selection back to unset is PCBuilder's own responsibility, the same way every other mutation to its accumulated state goes through PCBuilder itself, not an outside caller reaching in." },
    ],
    relationships: [
      "PCBuilder accumulates one CPU, one Motherboard, one GPU, and one PSU",
      "PCBuilder.build() produces one PCBuild",
      "PCBuild references the same CPU, Motherboard, GPU, and PSU the builder had selected",
    ],
    edgeCases: [
      {
        scenario: "The customer tries to call build() before selecting a CPU.",
        handling: "build() must check every required component is non-null before doing anything else — same 'fail before you commit' shape as ParkingLot rejecting entry before a Ticket is ever issued.",
      },
      {
        scenario: "The customer selects a CPU on one socket type, then picks a motherboard with a different socket.",
        handling: "selectMotherboard() must check socket compatibility against whatever CPU is already selected and reject immediately, rather than letting an invalid pair sit unnoticed until build() finally checks.",
      },
      {
        scenario: "The customer picks a low-wattage PSU after already selecting a power-hungry CPU and GPU.",
        handling: "build() computes total draw from CPU+GPU and compares it against the selected PSU's rating — catching this at build() time rather than producing a PCBuild that would never actually power on.",
      },
      {
        scenario: "The customer changes their CPU choice after already selecting a compatible motherboard.",
        handling: "selectCpu() needs the same reverse compatibility check as selectMotherboard() — swapping in a new CPU with a different socket should reject the change (or invalidate the motherboard choice), not silently leave an incompatible pair in place.",
      },
    ],
    tradeoffs: [
      {
        decision: "PCBuilder is a separate class from PCBuild, the final product it returns.",
        reasoning: "Splits the in-progress, mutable accumulation of choices from the finished, immutable spec — same shape as this app's Session/ATM split. PCBuild never needs setters once built; PCBuilder is nothing but setters and validation.",
      },
      {
        decision: "Compatibility validation lives inside PCBuilder itself instead of a separate CompatibilityChecker class.",
        reasoning: "The checks only ever need data PCBuilder already holds about its own selections — extracting a separate validator class would just move a method sideways with no new state or reuse to justify it.",
      },
      {
        decision: "RAM and storage are plain int fields (ramGb, storageGb) instead of their own RAMModule/StorageDevice classes.",
        reasoning: "Nothing in this system's compatibility rules depends on RAM or storage specifics (no slot-count or speed-matching modeled) — giving them full class treatment would add ceremony with no behavior attached to it.",
      },
    ],
    principles: [
      {
        name: "Builder Pattern",
        explanation: "PCBuilder accumulates optional component choices across separate method calls (selectCpu(), selectGpu(), ...) and only produces the final, immutable PCBuild when build() is explicitly called — construction happens step by step instead of one large constructor demanding every component upfront.",
      },
      { name: "Single Responsibility Principle", explanation: "PCBuilder only accumulates and validates selections; PCBuild only holds the finished spec — neither reaches into the other's job." },
      { name: "Encapsulation", explanation: "selectedCpu, selectedMotherboard, and the rest only change through their own selectX() methods, which are also the only places compatibility gets checked — nothing bypasses them to set a component directly." },
      { name: "Fail fast", explanation: "Catching a socket mismatch the moment an incompatible motherboard is selected, rather than waiting until build(), gives the customer immediate feedback instead of a late, confusing rejection after several more steps." },
    ],
  },
};

const stockAlerts: ColdDrillPrompt = {
  id: "stock-price-alerts",
  title: "Design a Stock Price Alert System",
  prompt: "Design a stock price alert system — users subscribe to a stock and get notified when it crosses a price threshold.",
  reference: {
    clarifyingQuestions: [
      {
        question: "Is this for a single stock, or does one user track many stocks with many alerts each?",
        why: "Decides whether Stock needs its own subscriber list at all, or whether a much simpler single-alert-per-user model would do — pins down that PriceAlert must be its own class, not a field on User.",
      },
      {
        question: "Do alerts fire once and deactivate, or keep firing every time the price crosses the threshold again?",
        why: "Directly decides whether PriceAlert needs a status/lifecycle field at all, or whether onPriceUpdate() can just check-and-notify with no state to track.",
      },
      {
        question: "Is notification delivery (email/SMS/push) in scope, or just detecting that a threshold was crossed?",
        why: "Decides whether NotificationService exists as a class in the model at all, or whether 'notify' is out of scope entirely — same scoping question every other lesson's payment/delivery clarify-Q asks.",
      },
      {
        question: "Does price data arrive as a real-time push feed, or does the system have to poll an external source?",
        why: "Changes who calls updatePrice() and how often, though it doesn't change the class model itself — worth asking but not worth over-modeling around.",
      },
    ],
    entities: [
      {
        id: "stock",
        name: "Stock",
        isEntity: true,
        why: "The subject being observed — owns its own current price and the list of alerts watching it; nothing else should be able to reach in and fire someone else's alert.",
        properties: [
          { name: "id", type: "string" },
          { name: "symbol", type: "string" },
          { name: "currentPrice", type: "Money" },
          { name: "subscribers", type: "List<PriceAlert>" },
        ],
      },
      {
        id: "pricealert",
        name: "PriceAlert",
        isEntity: true,
        why: "The observer — reacts to a price update by checking its own threshold and direction; Stock doesn't need to know what any given alert's condition even is.",
        properties: [
          { name: "id", type: "string" },
          { name: "stock", type: "Stock" },
          { name: "userId", type: "string" },
          { name: "threshold", type: "Money" },
          { name: "direction", type: "AlertDirection" },
          { name: "status", type: "AlertStatus" },
          { name: "triggeredAt", type: "DateTime" },
        ],
      },
      {
        id: "user",
        name: "User",
        isEntity: true,
        why: "The person the notification actually reaches — a real participant even though little of the interesting logic lives on it.",
        properties: [
          { name: "id", type: "string" },
          { name: "name", type: "string" },
          { name: "contactInfo", type: "string" },
        ],
      },
      {
        id: "notificationservice",
        name: "NotificationService",
        isEntity: true,
        why: "Delivering the actual notification (email/SMS/push) is a distinct concern from deciding an alert fired — Stock and PriceAlert shouldn't need to know how a message actually reaches a user.",
        properties: [{ name: "id", type: "string" }],
      },
      { id: "exchange", name: "StockExchange", isEntity: false, why: "An external data feed providing price ticks, not a class this system owns or models itself." },
      { id: "watchlist", name: "Watchlist", isEntity: false, why: "Just a UI-level grouping of a user's own PriceAlerts already modeled — giving it its own class adds no new responsibility." },
      { id: "pricehistory", name: "PriceHistory", isEntity: false, why: "Nobody asked for historical charting — inventing this scope adds complexity beyond what the prompt requested." },
    ],
    methods: [
      {
        id: "m1",
        signature: "updatePrice(newPrice): void",
        ownerId: "stock",
        justification: "Stock is the only class that knows when its own price actually changes, so it's the one responsible for telling every subscribed PriceAlert — the subject notifies, it doesn't wait to be asked. That push, not a poll, is the core of Observer.",
        codeExercise: {
          language: "java",
          starter: "void updatePrice(Money newPrice) {\n    // your code here\n}",
          reference:
            "void updatePrice(Money newPrice) {\n    Money previousPrice = this.currentPrice;\n    this.currentPrice = newPrice;\n    for (PriceAlert alert : subscribers) {\n        alert.onPriceUpdate(previousPrice, newPrice);\n    }\n}",
          checklist: [
            "Updates currentPrice so the new price is actually recorded, not just passed through",
            "Notifies every subscriber, not just the first one",
            "Passes both the previous and new price to each alert — a single new price alone can't tell an alert whether it just crossed the threshold or was already past it",
            "Bonus (L5+, not required here): notes that a subscriber unsubscribing itself from inside onPriceUpdate() would mutate the list mid-iteration",
          ],
        },
      },
      {
        id: "m2",
        signature: "subscribe(alert): void",
        ownerId: "stock",
        justification: "Stock owns its own subscriber list; only it should be able to add to it, so no alert can silently self-register against a stock it was never granted access to.",
      },
      {
        id: "m3",
        signature: "unsubscribe(alert): void",
        ownerId: "stock",
        justification: "Mirrors subscribe() — the class that owns the list is the only one that should remove from it.",
      },
      {
        id: "m4",
        signature: "onPriceUpdate(previousPrice, newPrice): void",
        ownerId: "pricealert",
        justification: "Each alert's own trigger condition (its threshold and direction) is private to that alert — Stock shouldn't need to know every alert's condition just to notify it, it calls this and lets the alert decide for itself.",
        codeExercise: {
          language: "java",
          starter: "void onPriceUpdate(Money previousPrice, Money newPrice) {\n    // your code here\n}",
          reference:
            "void onPriceUpdate(Money previousPrice, Money newPrice) {\n    if (status != AlertStatus.ACTIVE) {\n        return;\n    }\n    boolean crossedAbove = direction == AlertDirection.ABOVE\n        && previousPrice.isLessThan(threshold)\n        && newPrice.isGreaterThanOrEqual(threshold);\n    boolean crossedBelow = direction == AlertDirection.BELOW\n        && previousPrice.isGreaterThan(threshold)\n        && newPrice.isLessThanOrEqual(threshold);\n    if (crossedAbove || crossedBelow) {\n        this.status = AlertStatus.TRIGGERED;\n        this.triggeredAt = DateTime.now();\n    }\n}",
          checklist: [
            "Ignores the update entirely if the alert isn't ACTIVE — an already-triggered or cancelled alert doesn't re-fire",
            "Checks direction (ABOVE vs BELOW) against its own threshold, not just whether the price changed",
            "Detects an actual crossing (was on one side, now on the other) rather than just 'is the new price past the threshold' — otherwise a price that starts already past the threshold would wrongly fire immediately",
            "Bonus (L5+, not required here): doesn't yet call NotificationService — that hand-off happens outside this method",
          ],
        },
      },
      {
        id: "m5",
        signature: "resetAlert(): void",
        ownerId: "pricealert",
        justification: "Re-arming a triggered alert is a transition on this alert's own status field — only PriceAlert should be the one to move itself back to ACTIVE.",
      },
      {
        id: "m6",
        signature: "send(user, message): boolean",
        ownerId: "notificationservice",
        justification: "Delivering a message is a distinct concern with its own failure modes (a bounced email, a down SMS provider) — bundling it into PriceAlert would mean delivery failures corrupt trigger-detection logic.",
      },
      {
        id: "m7",
        signature: "getContactInfo(): string",
        ownerId: "user",
        justification: "Contact info is data User itself holds — a plain accessor belongs on the object whose field it's reading.",
      },
    ],
    relationships: ["Stock has many PriceAlerts (subscribers)", "PriceAlert references one Stock and one User (by userId)", "PriceAlert notifies via NotificationService when triggered"],
    edgeCases: [
      {
        scenario: "The same stock crosses its threshold twice in one day (price dips below then rises above again).",
        handling: "PriceAlert.status distinguishes ACTIVE from TRIGGERED — once triggered it won't fire again until explicitly reset, so a single alert doesn't spam the user every time the price oscillates around the threshold.",
      },
      {
        scenario: "A user has multiple alerts on the same stock at different thresholds.",
        handling: "Stock.subscribers is a list, not a single reference — updatePrice() notifies every subscriber independently, since one alert triggering has no bearing on whether another alert's own threshold was crossed.",
      },
      {
        scenario: "Notification delivery fails (the user's email bounces or the SMS provider is down).",
        handling: "PriceAlert shouldn't flip to TRIGGERED only after a successful send without a plan for the failure case — delivery failure needs to be tracked separately from the trigger condition, or a genuinely crossed threshold can silently be lost forever.",
      },
      {
        scenario: "The stock price update itself arrives out of order or duplicated (the same tick delivered twice).",
        handling: "updatePrice() compares against the last known price rather than treating every incoming tick as a fresh crossing — otherwise a duplicated tick could double-fire an alert that already triggered once.",
      },
    ],
    tradeoffs: [
      {
        decision: "PriceAlert is a real class per (stock, user, threshold) triple instead of Stock holding a flat list of raw threshold numbers.",
        reasoning: "A raw list of numbers can't track direction, per-alert status, or which user owns which threshold — PriceAlert needs its own identity so the same stock can have many independent alerts with independent lifecycles.",
      },
      {
        decision: "NotificationService is separate from PriceAlert instead of PriceAlert calling an email/SMS API directly.",
        reasoning: "Delivery mechanics (which channel, retry policy, provider APIs) change independently of trigger-detection logic — collapsing them means every new notification channel requires touching PriceAlert itself.",
      },
      {
        decision: "Stock pushes updates to subscribers (Observer) instead of PriceAlert polling Stock's price on some interval.",
        reasoning: "Polling means every alert checks price on its own schedule, which either wastes work checking when nothing changed or misses fast moves checking too infrequently — pushing means an alert reacts the instant the price actually changes.",
      },
    ],
    principles: [
      {
        name: "Observer Pattern",
        explanation: "Stock (the subject) holds a list of PriceAlert (observers) and calls onPriceUpdate() on each one whenever its own price changes — Stock never asks 'has any alert triggered', it just tells every subscriber and lets each one decide for itself. That inversion — push, not pull — is what makes this Observer rather than a plain method call.",
      },
      {
        name: "Single Responsibility Principle",
        explanation: "Stock only tracks price and its subscriber list; PriceAlert only tracks one condition and its own status; NotificationService only knows how to deliver a message — none of them do each other's job.",
      },
      {
        name: "Encapsulation",
        explanation: "PriceAlert.status only changes inside onPriceUpdate()/resetAlert() — no external caller reaches in and flips ACTIVE/TRIGGERED directly.",
      },
      {
        name: "Separation of Concerns",
        explanation: "Detecting that a threshold was crossed (PriceAlert) is kept apart from actually delivering a message (NotificationService) — a delivery failure is a completely different failure mode than a wrong trigger condition.",
      },
    ],
  },
};

const fileSystem: ColdDrillPrompt = {
  id: "file-system",
  title: "Design a File System (folders containing files or other folders)",
  prompt: "Design a file system — folders can contain files or other folders.",
  reference: {
    clarifyingQuestions: [
      {
        question: "Can a folder contain other folders, or just files (a flat directory vs. a real nested tree)?",
        why: "Decides whether Folder needs a heterogeneous children list at all (of FileSystemNode) or just a flat List<File> — pins down whether Composite is even the right shape here.",
      },
      {
        question: "Do we need to support operations like copy/move, or just size and listing?",
        why: "Move is specifically where the circular-reference guard matters — scoping this out means addChild()'s cycle check becomes optional rather than core.",
      },
      {
        question: "Is this in-memory only, or does it need to persist to real disk storage?",
        why: "A premature-leaning question, but worth asking — real persistence would introduce I/O failure edge cases this model doesn't need to handle if it stays in-memory.",
      },
      {
        question: "Do duplicate names need to be rejected within the same folder, or can two entries share a name?",
        why: "Directly decides whether addChild() needs a uniqueness check, and whether findChild(name) can ever be ambiguous.",
      },
    ],
    entities: [
      {
        id: "filesystemnode",
        name: "FileSystemNode",
        isEntity: true,
        why: "The shared abstraction both File and Folder implement — letting any operation (getSize(), getPath()) work on either one without the caller needing to check which it's holding is the entire point of modeling this as one shared type instead of two unrelated classes.",
        properties: [
          { name: "id", type: "string" },
          { name: "name", type: "string" },
          { name: "parent", type: "Folder" },
        ],
      },
      {
        id: "file",
        name: "File",
        isEntity: true,
        why: "A leaf node — has an actual byte size and no children of its own.",
        properties: [
          { name: "id", type: "string" },
          { name: "name", type: "string" },
          { name: "sizeBytes", type: "long" },
        ],
      },
      {
        id: "folder",
        name: "Folder",
        isEntity: true,
        why: "A composite node — holds a list of FileSystemNode, which could themselves be Files or more Folders, which is exactly what makes the tree arbitrarily nestable.",
        properties: [
          { name: "id", type: "string" },
          { name: "name", type: "string" },
          { name: "children", type: "List<FileSystemNode>" },
        ],
      },
      {
        id: "filesystem",
        name: "FileSystem",
        isEntity: true,
        why: "The overall system — owns the root Folder and is the entry point for path-based lookups.",
        properties: [
          { name: "id", type: "string" },
          { name: "root", type: "Folder" },
        ],
      },
      { id: "path", name: "Path", isEntity: false, why: "A string representation used to locate a node, not a class with its own behavior beyond parsing — Folder can resolve one without Path needing independent identity." },
      { id: "disk", name: "StorageDevice", isEntity: false, why: "The physical or virtual storage medium underneath, out of scope for the logical file-system model being asked about." },
      { id: "permission", name: "Permission", isEntity: false, why: "Nobody asked about access control — inventing permission scope adds complexity beyond what the prompt requested." },
    ],
    methods: [
      {
        id: "m1",
        signature: "getSize(): long",
        ownerId: "file",
        justification: "File is the leaf case — its size is just the byte count it already stores, no children to sum. This is the base case of the shared getSize() contract every FileSystemNode must honor.",
      },
      {
        id: "m2",
        signature: "getSize(): long",
        ownerId: "folder",
        justification: "Folder is the composite case — summing every child's own getSize() without checking whether each child is a File or another Folder is exactly what makes the tree arbitrarily deep without Folder needing special-case code per level.",
        codeExercise: {
          language: "java",
          starter: "long getSize() {\n    // your code here\n}",
          reference: "long getSize() {\n    long total = 0;\n    for (FileSystemNode child : children) {\n        total += child.getSize();\n    }\n    return total;\n}",
          checklist: [
            "Sums every child's own getSize(), not just direct files",
            "Calls child.getSize() polymorphically — never checks 'if child is a File' vs 'if child is a Folder' first",
            "Handles an empty folder by returning 0, not null or an exception",
            "Bonus (L5+, not required here): notes that a very deep tree risks stack depth on pure recursion — an iterative traversal with an explicit stack is the production alternative",
          ],
        },
      },
      {
        id: "m3",
        signature: "addChild(node): void",
        ownerId: "folder",
        justification: "Folder owns its own children list; only Folder should be able to add to it, and it's the one place a circular-reference check (a folder can't contain an ancestor of itself) can actually be enforced.",
        codeExercise: {
          language: "java",
          starter: "void addChild(FileSystemNode node) {\n    // your code here\n}",
          reference:
            "void addChild(FileSystemNode node) {\n    if (isAncestorOf(node, this)) {\n        throw new IllegalArgumentException(\"Cannot add an ancestor as a child — would create a cycle\");\n    }\n    node.setParent(this);\n    children.add(node);\n}\n\n// Walks up from 'folder' through parent references, checking whether it ever reaches 'candidateAncestor'\nprivate boolean isAncestorOf(FileSystemNode candidateAncestor, FileSystemNode folder) {\n    FileSystemNode current = folder;\n    while (current != null) {\n        if (current == candidateAncestor) {\n            return true;\n        }\n        current = current.getParent();\n    }\n    return false;\n}",
          checklist: [
            "Checks whether the node being added is an ancestor of this folder before adding it — not just whether it equals this folder directly",
            "Sets the child's parent reference, not just adding it to the list — otherwise getPath() would break for that node",
            "Throws or otherwise signals failure instead of silently creating a cycle",
            "Bonus (L5+, not required here): notes this check alone doesn't cover a folder being moved to a new location concurrently from elsewhere",
          ],
        },
      },
      {
        id: "m4",
        signature: "removeChild(node): void",
        ownerId: "folder",
        justification: "Mirrors addChild() — Folder is the only class that should mutate its own children list.",
      },
      {
        id: "m5",
        signature: "rename(newName): void",
        ownerId: "filesystemnode",
        justification: "Renaming just changes the shared 'name' field every node has — File and Folder don't need their own version of this, so it lives once on FileSystemNode instead of being duplicated on both.",
      },
      {
        id: "m6",
        signature: "getPath(): String",
        ownerId: "filesystemnode",
        justification: "Building a full path means walking up through 'parent' references — every node (File or Folder) has a parent, so this is shared logic too, not something each subtype reimplements separately.",
      },
      {
        id: "m7",
        signature: "findChild(name): FileSystemNode",
        ownerId: "folder",
        justification: "Looking up a child by name only makes sense on something that HAS children — File doesn't have any, so this lives only on Folder, not on the shared FileSystemNode base.",
      },
      {
        id: "m8",
        signature: "getRoot(): Folder",
        ownerId: "filesystem",
        justification: "FileSystem is the one class that owns the top-level root reference — everything else navigates down from there, not up to some global.",
      },
    ],
    relationships: [
      "FileSystem owns one root Folder",
      "Folder has many FileSystemNodes (children) — each child may itself be a File or another Folder",
      "FileSystemNode references one parent Folder (nullable for the root)",
    ],
    edgeCases: [
      {
        scenario: "Computing the total size of a folder that's nested 10 levels deep.",
        handling: "getSize() being defined recursively on both File (base case) and Folder (sum of children) means depth is handled automatically by the recursion itself — no special-casing for how deep the tree goes.",
      },
      {
        scenario: "Two files or folders with the same name are added to the same parent folder.",
        handling: "addChild() should reject a duplicate name within the same Folder, or the model needs to explicitly decide same-name siblings are allowed — silently permitting it makes getPath()/findChild() ambiguous about which node a name actually refers to.",
      },
      {
        scenario: "Someone tries to add a folder inside one of its own descendants (making it contain itself).",
        handling: "addChild() walks up the candidate parent's own ancestor chain checking against the node being added — if the node being added is found among its own future ancestors, the operation is rejected, otherwise getSize()/getPath() would recurse forever.",
      },
      {
        scenario: "Deleting a folder that still has files inside it.",
        handling: "removeChild() operating on the parent's list doesn't by itself decide whether non-empty folders can be deleted — that's a real product decision (recursive delete vs. reject-if-not-empty) worth naming out loud rather than assuming either way.",
      },
    ],
    tradeoffs: [
      {
        decision: "File and Folder both implement a shared FileSystemNode abstraction instead of Folder having two separate lists (List<File> and List<Folder>).",
        reasoning: "Two separate lists means every operation that walks the tree (getSize, getPath, listing contents) needs to handle files and folders as two different cases everywhere it's touched — one shared type means the same code path handles both, which is the entire reason Composite exists as a pattern.",
      },
      {
        decision: "getSize() is declared once on FileSystemNode but implemented separately on File and Folder, instead of one shared implementation that type-checks internally.",
        reasoning: "A single shared implementation with an 'if this is a File do X else do Y' check just relocates the type-branching problem instead of removing it — letting each subtype own its own version means adding a new node type later doesn't require touching existing code.",
      },
      {
        decision: "addChild() enforces the circular-reference guard, rather than trusting callers to never construct a cycle.",
        reasoning: "A tree that's supposed to always be acyclic needs the invariant enforced at the one point the structure actually changes — Folder is that point, so it's the only place this check can live reliably.",
      },
    ],
    principles: [
      {
        name: "Composite Pattern",
        explanation: "FileSystemNode is the shared abstraction that both File (a leaf) and Folder (a composite holding more FileSystemNodes) conform to — any code calling getSize() or getPath() never needs to know or check which one it's actually holding. That uniform treatment of leaves and composites through one interface is what Composite means.",
      },
      {
        name: "Single Responsibility Principle",
        explanation: "File only knows its own byte size; Folder only knows how to aggregate its own children — neither one reaches into the other's job.",
      },
      {
        name: "Encapsulation",
        explanation: "Folder.addChild()/removeChild() are the only ways its children list changes — nothing else reaches in and mutates the list directly, which is exactly where the circular-reference guard gets enforced.",
      },
      {
        name: "Recursion mirrors structure",
        explanation: "getSize() and getPath() are both written recursively because the data itself (a tree) is recursive — computing either with a flat loop over 'all nodes' would require flattening the tree first, which is strictly more work than trusting the recursive structure.",
      },
    ],
  },
};

const lruCache: ColdDrillPrompt = {
  id: "lru-cache",
  title: "Design an LRU Cache",
  prompt: "Design a Least Recently Used (LRU) cache — get and put must both run in O(1) time.",
  reference: {
    clarifyingQuestions: [
      {
        question: "Is capacity fixed at construction, or can it change later?",
        why: "A fixed capacity means LRUCache just needs a constant int field; a resizable cache means put() (or a resize() method) has to be able to evict multiple entries in one call, not just one.",
      },
      {
        question: "What happens to the evicted key/value — silently dropped, or does something need to observe it (e.g. a write-back to a slower store)?",
        why: "Silently dropping means eviction is just an internal removal; needing to observe it means the eviction site has to invoke a callback or return the evicted pair, which changes evict()'s signature.",
      },
      {
        question: "Does this need to be thread-safe for concurrent get/put calls?",
        why: "Single-threaded means the map + doubly linked list mutations can be plain, unsynchronized operations; thread-safe means every mutation needs a lock (or a concurrent structure), which is an L5+ branch, not assumed here.",
      },
      {
        question: "Is there a TTL/expiry on top of capacity-based eviction, or is capacity the only eviction trigger?",
        why: "Pure capacity-based eviction needs only the recency-ordered list; adding TTL means each Node also needs an expiry timestamp and get()/put() both need an extra expiry check before touching recency order.",
      },
    ],
    entities: [
      {
        id: "lrucache",
        name: "LRUCache",
        isEntity: true,
        why: "The public class — owns the capacity, the lookup map, and the recency-ordered list, and is the only thing that exposes get()/put() to callers.",
        properties: [
          { name: "capacity", type: "int" },
          { name: "map", type: "Map<Key, Node>" },
          { name: "head", type: "Node" },
          { name: "tail", type: "Node" },
        ],
      },
      {
        id: "node",
        name: "Node",
        isEntity: true,
        why: "One entry in the doubly linked list — holds the key (needed so eviction can remove the matching map entry, not just unlink a node), the value, and prev/next pointers for O(1) reordering.",
        properties: [
          { name: "key", type: "Key" },
          { name: "value", type: "Value" },
          { name: "prev", type: "Node" },
          { name: "next", type: "Node" },
        ],
      },
      {
        id: "evictionpolicy",
        name: "EvictionPolicy",
        isEntity: false,
        why: "Nobody asked for pluggable eviction strategies (LFU, FIFO, etc.) — inventing a strategy interface for a single fixed policy (LRU) adds indirection with no caller that needs it.",
      },
      {
        id: "cacheentry",
        name: "CacheEntry",
        isEntity: false,
        why: "Node already is the cache entry — wrapping it in a second class that just holds a Node adds a layer with no new field or behavior.",
      },
    ],
    methods: [
      {
        id: "m1",
        signature: "get(key): Value",
        ownerId: "lrucache",
        justification: "LRUCache is the only class that holds both the map (for O(1) lookup) and the list (for O(1) move-to-front) — it's the one that can do both the read and the recency update in one call.",
        codeExercise: {
          language: "java",
          starter: "Value get(Key key) {\n    // your code here\n}",
          reference:
            "Value get(Key key) {\n    Node node = map.get(key);\n    if (node == null) {\n        return null;\n    }\n    removeFromList(node);\n    insertAtHead(node);\n    return node.value;\n}",
          checklist: [
            "Looks the key up in the map, not by scanning the list — this is where the O(1) actually comes from",
            "Returns null (or an Optional/sentinel) on a missing key instead of throwing",
            "Moves the found node to the most-recently-used end of the list, not just reads its value and leaves the order untouched",
            "Uses O(1) pointer surgery to move the node (unlink via prev/next, relink at head) — no scanning the list to find its position",
          ],
        },
      },
      {
        id: "m2",
        signature: "put(key, value): void",
        ownerId: "lrucache",
        justification: "Same reasoning as get() — inserting or updating needs both the map (to know if the key already exists) and the list (to place the node at the most-recently-used end, and to evict from the least-recently-used end if now over capacity).",
        codeExercise: {
          language: "java",
          starter: "void put(Key key, Value value) {\n    // your code here\n}",
          reference:
            "void put(Key key, Value value) {\n    if (map.containsKey(key)) {\n        Node existing = map.get(key);\n        existing.value = value;\n        removeFromList(existing);\n        insertAtHead(existing);\n        return;\n    }\n    if (map.size() >= capacity) {\n        Node lru = tail.prev;\n        removeFromList(lru);\n        map.remove(lru.key);\n    }\n    Node fresh = new Node(key, value);\n    map.put(key, fresh);\n    insertAtHead(fresh);\n}",
          checklist: [
            "If the key already exists, updates its value AND moves it to most-recently-used — doesn't just overwrite in place and leave it wherever it was",
            "If at capacity on a new key, evicts the node at the least-recently-used end (next to the tail sentinel) before inserting — not an arbitrary node",
            "Evicts from BOTH the list and the map — removing only from the list would leave a stale map entry pointing at an unlinked node",
            "Inserts the new or updated node at the most-recently-used end (next to the head sentinel), consistently with get()'s move-to-front",
          ],
        },
      },
    ],
    relationships: ["LRUCache has many Nodes, indexed by key in its map and ordered by recency in its list", "Node.prev and Node.next link Nodes into a doubly linked list"],
    edgeCases: [
      {
        scenario: "put() is called on a key that already exists in the cache.",
        handling: "The value must be updated AND the node moved to the most-recently-used end — updating the value in place without touching recency order is the single most common bug in this problem, since it silently makes 'recently used' mean 'recently inserted' instead.",
      },
      {
        scenario: "The cache is at capacity and put() is called with a brand-new key.",
        handling: "The node at the least-recently-used end (adjacent to the tail sentinel) must be evicted from both the list and the map before the new node is inserted — evicting from only one of the two leaves the structures inconsistent.",
      },
      {
        scenario: "get() is called on a key that was never inserted, or was already evicted.",
        handling: "Returns null (or an agreed sentinel/Optional) without mutating the list — a miss shouldn't touch recency order for a node that was never in the cache to begin with.",
      },
      {
        scenario: "Capacity is 0, or get()/put() is called before any entry has ever been inserted.",
        handling: "put() with capacity 0 should evict-then-insert down to zero net entries (or reject the insert outright, if that's the agreed contract) rather than crash on an empty list with only sentinel head/tail nodes.",
      },
    ],
    tradeoffs: [
      {
        decision: "A doubly linked list, not a singly linked list or a plain array, backs the recency order.",
        reasoning: "Moving a node to the most-recently-used end requires unlinking it from its current position first — with a singly linked list you can't reach a node's predecessor in O(1) to relink around it, forcing an O(n) scan; a doubly linked list's prev pointer makes that unlink O(1). An array would need to shift elements on every move, which is O(n).",
      },
      {
        decision: "Head and tail are sentinel (dummy) nodes rather than nullable pointers checked on every operation.",
        reasoning: "Costs two permanently-allocated nodes that never hold real data, but removes every null-check branch for 'is this the first/last real node' from insertAtHead()/removeFromList() — every real node always has a real prev and next to relink against.",
      },
      {
        decision: "The map stores key → Node (not key → Value directly).",
        reasoning: "Storing key → Value would give O(1) lookup but no way to reach that entry's position in the recency list to move it — the map has to point at the actual Node object so get()/put() can splice it within the list, not just read its value.",
      },
    ],
    principles: [
      {
        name: "Single Responsibility Principle",
        explanation: "LRUCache owns the get/put contract and orchestrates the map+list together; Node only holds its own key/value/prev/next — Node has no logic of its own, it's a plain data holder the list operations manipulate.",
      },
      {
        name: "Encapsulation",
        explanation: "Callers only ever see get(key) and put(key, value) — the map, the sentinel nodes, and the pointer-relinking helpers are all internal to LRUCache, so nothing outside can corrupt the list/map consistency directly.",
      },
      {
        name: "Composition over duplication",
        explanation: "insertAtHead()/removeFromList() are small internal helpers reused by both get() and put() — without them, the pointer-relinking logic would be duplicated (and could drift out of sync) in both methods.",
      },
    ],
  },
};

const ticTacToe: ColdDrillPrompt = {
  id: "tic-tac-toe",
  title: "Design Tic-Tac-Toe",
  prompt: "Design Tic-Tac-Toe — two players take turns marking a grid; first to get a line wins.",
  reference: {
    clarifyingQuestions: [
      {
        question: "Is the board a fixed 3x3, or does it need to support a configurable NxN size?",
        why: "Decides whether size is a hardcoded constant or a real field on Board, and whether win-detection can special-case 'three in a row' or must generalize — the running-counter approach only pays off once size is a variable, not a literal 3.",
      },
      {
        question: "Is this strictly two players (X and O), or does it need to support more symbols on a larger board?",
        why: "Two players keeps Player as a simple X/O pair and lets win-detection use a signed +1/-1 counter; more players turns that into a per-symbol count array — a real algorithmic fork, not just more data.",
      },
      {
        question: "Does a full board with no winner need to be reported as an explicit draw, or is 'no winner yet' enough?",
        why: "Decides whether GameStatus needs a DRAW value and Game needs to track a move count to detect a full board, versus leaving status at IN_PROGRESS forever with no terminal signal.",
      },
      {
        question: "Is this a single game, or does it need to track a match/series across multiple games?",
        why: "A single game needs no memory beyond the current board; a series means Player (or a new Match class) needs to accumulate wins across games — scope the current model deliberately doesn't cover unless asked.",
      },
    ],
    entities: [
      {
        id: "board",
        name: "Board",
        isEntity: true,
        why: "Owns the grid itself and the running win-detection counters — the only class with enough state to know instantly whether the mark just placed completed a line.",
        properties: [
          { name: "size", type: "int" },
          { name: "cells", type: "Player[][]" },
          { name: "rowCounts", type: "int[]" },
          { name: "colCounts", type: "int[]" },
          { name: "diagonalCount", type: "int" },
          { name: "antiDiagonalCount", type: "int" },
        ],
      },
      {
        id: "game",
        name: "Game",
        isEntity: true,
        why: "The top-level controller — enforces turn order and tracks whether the game has already ended.",
        properties: [
          { name: "id", type: "string" },
          { name: "board", type: "Board" },
          { name: "players", type: "List<Player>" },
          { name: "currentPlayer", type: "Player" },
          { name: "status", type: "GameStatus" },
          { name: "movesPlayed", type: "int" },
        ],
      },
      {
        id: "player",
        name: "Player",
        isEntity: true,
        why: "Represents one of the two participants and the symbol they mark the board with.",
        properties: [
          { name: "id", type: "string" },
          { name: "symbol", type: "String" },
        ],
      },
      { id: "cell", name: "Cell", isEntity: false, why: "Just a mark stored in Board's own grid — giving it independent identity and behavior is unnecessary; Board can already answer 'what's at row, col' without Cell needing its own class." },
      { id: "referee", name: "Referee", isEntity: false, why: "Nobody asked for officiating or spectators — Game already owns turn enforcement and win detection, so a separate referee class would just duplicate a responsibility Game already has." },
      { id: "matchhistory", name: "MatchHistory", isEntity: false, why: "Tracking results across multiple games wasn't asked for — a single game's outcome lives on Game.status; a running series record is out of scope until the clarifying question about a match/series comes back yes." },
    ],
    methods: [
      {
        id: "m1",
        signature: "recordMark(row, col, player): void",
        ownerId: "board",
        justification: "Only Board holds the grid and the running counters together, so placing a mark and updating rowCounts/colCounts/diagonal counts in the same step is Board's own state mutation — nothing else should reach in and flip a cell or a counter directly.",
      },
      {
        id: "m2",
        signature: "checkWin(row, col): boolean",
        ownerId: "board",
        justification: "Win-detection reads the same counters recordMark() just updated — Board is the only class holding that state, so it's the only class that can answer 'did that move win' in O(1).",
        codeExercise: {
          language: "java",
          starter: "boolean checkWin(int row, int col) {\n    // your code here\n}",
          reference:
            "boolean checkWin(int row, int col) {\n    if (Math.abs(rowCounts[row]) == size) {\n        return true;\n    }\n    if (Math.abs(colCounts[col]) == size) {\n        return true;\n    }\n    if (row == col && Math.abs(diagonalCount) == size) {\n        return true;\n    }\n    if (row + col == size - 1 && Math.abs(antiDiagonalCount) == size) {\n        return true;\n    }\n    return false;\n}",
          checklist: [
            "Checks only the row and column counters for the cell just played, not every row/column on the board",
            "Only checks the main diagonal when row == col, and the anti-diagonal when row + col == size - 1 — a mark elsewhere can't win on a diagonal it isn't actually on",
            "Runs in O(1) using the running counters — never rescans the grid to look for a line",
            "Reads size as a field rather than a hardcoded 3, so the same check works on any NxN board",
          ],
        },
      },
      {
        id: "m3",
        signature: "getCellAt(row, col): Player",
        ownerId: "board",
        justification: "A plain accessor into Board's own grid — reading what's at a square is Board's data, not a decision, so it belongs on the class that actually holds the grid.",
      },
      {
        id: "m4",
        signature: "isFull(): boolean",
        ownerId: "board",
        justification: "Whether every cell is occupied is derived entirely from Board's own grid — no other class has enough visibility to answer this without reaching into Board's internals.",
      },
      {
        id: "m5",
        signature: "makeMove(row, col, player): boolean",
        ownerId: "game",
        justification: "Making a move touches turn order, game-over status, and the board all at once — Game is the only class positioned to enforce 'is it this player's turn and is the game still on' before ever touching Board.",
        codeExercise: {
          language: "java",
          starter: "boolean makeMove(int row, int col, Player player) {\n    // your code here\n}",
          reference:
            "boolean makeMove(int row, int col, Player player) {\n    if (status != GameStatus.IN_PROGRESS) {\n        throw new IllegalStateException(\"Game is already over\");\n    }\n    if (board.getCellAt(row, col) != null) {\n        throw new IllegalStateException(\"Cell is already occupied\");\n    }\n    board.recordMark(row, col, player);\n    movesPlayed++;\n    if (board.checkWin(row, col)) {\n        status = player.getSymbol().equals(\"X\") ? GameStatus.X_WON : GameStatus.O_WON;\n        return true;\n    }\n    if (movesPlayed == board.getSize() * board.getSize()) {\n        status = GameStatus.DRAW;\n    } else {\n        switchTurn();\n    }\n    return false;\n}",
          checklist: [
            "Rejects a move on an already-occupied cell before mutating anything",
            "Rejects a move once the game already has a winner or already ended in a draw",
            "Checks for a win immediately after recording the mark, using Board's O(1) checkWin() — not a full rescan",
            "Only switches turns when the game is still in progress — a winning or board-filling move shouldn't hand the turn to the other player",
          ],
        },
      },
      {
        id: "m6",
        signature: "switchTurn(): void",
        ownerId: "game",
        justification: "currentPlayer is Game's own turn-tracking field; only Game should be the one thing that flips whose turn it is, so two callers can't disagree about who moves next.",
      },
      {
        id: "m7",
        signature: "getCurrentPlayer(): Player",
        ownerId: "game",
        justification: "A plain accessor onto Game's own currentPlayer field — reading whose turn it is doesn't require any other class's state.",
      },
      {
        id: "m8",
        signature: "getSymbol(): String",
        ownerId: "player",
        justification: "Symbol is data Player itself holds — it's a plain accessor, not a decision, so it belongs on the object whose field it's reading.",
      },
    ],
    relationships: ["Game owns one Board", "Game owns two Players", "Board tracks per-row, per-column, and per-diagonal counters alongside its grid"],
    edgeCases: [
      {
        scenario: "A player tries to mark a cell that's already occupied.",
        handling: "makeMove() checks board.getCellAt(row, col) for null before recording anything — an occupied cell rejects the move immediately, never silently overwriting the existing mark.",
      },
      {
        scenario: "A player tries to move after the game already has a winner.",
        handling: "makeMove() checks status != IN_PROGRESS first and rejects the move outright — once status flips to X_WON, O_WON, or DRAW, no further mutation is allowed.",
      },
      {
        scenario: "The board fills completely with no line ever completed.",
        handling: "Game tracks movesPlayed and compares it to size*size right after a mark that didn't win — reaching the max with no win sets status to DRAW instead of leaving the game silently stuck at IN_PROGRESS forever.",
      },
      {
        scenario: "The board size changes from 3x3 to a much larger NxN — does win-detection still work?",
        handling: "Because checkWin() reads size from Board's own field and compares counters against it rather than hardcoding the number 3, the exact same O(1) logic scales to any NxN board with no code changes.",
      },
    ],
    tradeoffs: [
      {
        decision: "Win-detection uses running per-row/column/diagonal counters updated on every move, instead of rescanning the whole board after each move.",
        reasoning: "The rescan approach is the 'naive' first pass interviewers expect you to name and move past — O(size) per move, re-deriving information the game already has. The counter approach is what actually impresses: O(1) per move by maintaining just 2*size + 2 integers instead of touching every cell again.",
      },
      {
        decision: "Player is a real class with a symbol field instead of encoding X/O as a raw boolean or char scattered through Game and Board.",
        reasoning: "A raw 'isPlayerOneTurn' boolean works for exactly two players but breaks the moment a third symbol or a series/rematch feature comes up — Player as a class is the one-line-cheaper-now decision that costs more later.",
      },
      {
        decision: "Board owns and updates the win-detection counters itself (via recordMark), instead of Game maintaining them externally.",
        reasoning: "Counters are derived entirely from marks on the grid, which is data only Board holds — keeping them on Board means Game never has to keep two representations of the same fact in sync.",
      },
    ],
    principles: [
      {
        name: "Single Responsibility Principle",
        explanation: "Board only knows about the grid and win-detection counters; Game only knows about turn order and overall game status — neither reaches into the other's job.",
      },
      {
        name: "Encapsulation",
        explanation: "Board.recordMark() is the only way a cell or a counter changes — nothing else reaches in and flips cells[row][col] or rowCounts[row] directly, so the counters can never drift out of sync with the actual grid.",
      },
      {
        name: "Algorithmic efficiency as a design decision",
        explanation: "Choosing running counters over a full rescan isn't an optimization bolted on afterward — it's why Board needs rowCounts/colCounts/diagonalCount/antiDiagonalCount as real fields in the first place, not just a to-do.",
      },
      {
        name: "Generalization over hardcoding",
        explanation: "size is a field on Board, not a literal 3, and checkWin()'s diagonal checks use row == col / row + col == size - 1 instead of hardcoded coordinates — the exact same class handles a 3x3 or a 15x15 board with no code changes.",
      },
    ],
  },
};

const undoRedo: ColdDrillPrompt = {
  id: "undo-redo",
  title: "Design Undo/Redo for a Text Editor",
  prompt: "Design an undo/redo system for a text editor — a sequence of edit actions that can be undone and redone.",
  reference: {
    clarifyingQuestions: [
      {
        question: "Is the undo history bounded (a fixed number of steps) or unlimited?",
        why: "Decides whether CommandHistory needs an eviction policy on its undo stack (e.g. dropping the oldest entry) or can just grow unbounded — changes whether the stack needs a max-size field at all.",
      },
      {
        question: "Do actions need to be grouped into one undoable unit (e.g. pasting 10 characters undoes as one step), or is every keystroke its own undo step?",
        why: "Decides whether commands are created per-keystroke or batched — changes how many command objects exist and what one undo() actually reverses.",
      },
      {
        question: "Does undo/redo need to survive the app closing and reopening, or is it fine if history resets each session?",
        why: "Decides whether CommandHistory's stacks need to be serializable, or can just live in memory for the process lifetime.",
      },
      {
        question: "Is this single-user, or does it need to handle two people editing the same document at once?",
        why: "Multi-user collaborative undo (whose action gets undone if edits interleave) is a materially harder L5+ problem needing operational transforms or CRDTs — single-user keeps the undo/redo stacks a clean LIFO pair.",
      },
    ],
    entities: [
      {
        id: "document",
        name: "Document",
        isEntity: true,
        why: "The receiver whose actual text content changes — every command's execute()/undo() ultimately calls back into this class to mutate or restore content.",
        properties: [
          { name: "id", type: "string" },
          { name: "content", type: "string" },
        ],
      },
      {
        id: "inserttextcommand",
        name: "InsertTextCommand",
        isEntity: true,
        why: "One concrete Command — knows how to insert text into the Document (execute()) and how to reverse that exact insertion (undo()). Implements the same execute()/undo() contract as every other command, which is what lets CommandHistory treat any command interchangeably.",
        properties: [
          { name: "id", type: "string" },
          { name: "document", type: "Document" },
          { name: "position", type: "int" },
          { name: "insertedText", type: "string" },
        ],
      },
      {
        id: "deletetextcommand",
        name: "DeleteTextCommand",
        isEntity: true,
        why: "The other concrete Command — must capture what it actually deleted at execute() time, since by the time undo() runs later, the document has already changed shape and can't tell you what used to be there.",
        properties: [
          { name: "id", type: "string" },
          { name: "document", type: "Document" },
          { name: "position", type: "int" },
          { name: "length", type: "int" },
          { name: "deletedText", type: "string" },
        ],
      },
      {
        id: "history",
        name: "CommandHistory",
        isEntity: true,
        why: "Owns the undo and redo stacks and sequences commands forward and backward — a cross-cutting concern kept separate from Document so Document only has to know how to hold text, not how to remember what happened to it.",
        properties: [
          { name: "id", type: "string" },
          { name: "undoStack", type: "List<Command>" },
          { name: "redoStack", type: "List<Command>" },
        ],
      },
      { id: "keystroke", name: "Keystroke", isEntity: false, why: "A raw input event, not itself a Command — it's the trigger that causes an InsertTextCommand to be created, not a command with its own execute()/undo()." },
      { id: "cursor", name: "Cursor", isEntity: false, why: "Tracks where typing happens, a separate concern from what changed — nobody asked for cursor-position undo, so modeling it here is scope nobody requested." },
      { id: "clipboard", name: "Clipboard", isEntity: false, why: "Copy/paste is its own separate feature — out of scope unless the interviewer specifically asks for it." },
    ],
    methods: [
      {
        id: "m1",
        signature: "insertText(position, text): void",
        ownerId: "document",
        justification: "Document owns content, so it's the only class that should mutate its own text — a Command should never reach in and manipulate the string directly.",
      },
      {
        id: "m2",
        signature: "deleteText(position, length): string",
        ownerId: "document",
        justification: "Same reasoning as insertText — Document is the only class allowed to change content, and returning the removed substring is what lets the calling command remember what it deleted.",
      },
      {
        id: "m3",
        signature: "execute(): void",
        ownerId: "inserttextcommand",
        justification: "This command already knows what to insert and where — calling document.insertText(position, insertedText) is the forward action it exists to encapsulate.",
      },
      {
        id: "m4",
        signature: "undo(): void",
        ownerId: "inserttextcommand",
        justification: "Undoing an insert means deleting exactly what was inserted — only this command knows insertedText's length, which is what makes it the right class to reverse itself.",
      },
      {
        id: "m5",
        signature: "execute(): void",
        ownerId: "deletetextcommand",
        justification: "Capturing the real deleted substring the moment it's removed (via document.deleteText()'s return value) is what makes this command's own undo() possible later.",
      },
      {
        id: "m6",
        signature: "undo(): void",
        ownerId: "deletetextcommand",
        justification: "Restoring exactly what was deleted means re-inserting its own stored deletedText at its own stored position — mirroring execute() in reverse using state only this command has.",
      },
      {
        id: "m7",
        signature: "executeCommand(command): void",
        ownerId: "history",
        justification: "CommandHistory is the only class that sequences commands — it's the one place that both runs a command and records it, so nothing else can push to the undo stack without actually having executed something first.",
        codeExercise: {
          language: "java",
          starter: "void executeCommand(Command command) {\n    // your code here\n}",
          reference:
            "void executeCommand(Command command) {\n    command.execute();\n    undoStack.push(command);\n    redoStack.clear();\n}",
          checklist: [
            "Executes the command before pushing it — pushing first and executing after would record history for an action that hasn't actually happened yet",
            "Pushes the command onto the undo stack after it executes",
            "Clears the redo stack — a new action invalidates whatever 'future' could have been redone, and silently keeping it would let redo() replay against a document state it was never designed for",
            "Bonus (L5+, not required here): if execute() can throw, the command should NOT end up on the undo stack at all",
          ],
        },
      },
      {
        id: "m8",
        signature: "undo(): void",
        ownerId: "history",
        justification: "Reversing the most recent action means popping the top of the undo stack and asking that specific command to undo itself — CommandHistory doesn't need to know HOW any command reverses, just that it can.",
        codeExercise: {
          language: "java",
          starter: "void undo() {\n    // your code here\n}",
          reference:
            "void undo() {\n    if (undoStack.isEmpty()) {\n        return;\n    }\n    Command command = undoStack.pop();\n    command.undo();\n    redoStack.push(command);\n}",
          checklist: [
            "Returns (no-op) when the undo stack is empty instead of throwing",
            "Pops the most recently executed command, not the oldest",
            "Calls command.undo() rather than re-implementing the reversal itself",
            "Pushes the undone command onto the redo stack so redo() can bring it back",
          ],
        },
      },
      {
        id: "m9",
        signature: "redo(): void",
        ownerId: "history",
        justification: "Redo is the mirror of undo — pop from the redo side, re-run the command's own execute(), and move it back onto the undo stack, so undo/redo can alternate indefinitely on the same command objects.",
      },
    ],
    relationships: [
      "InsertTextCommand references one Document",
      "DeleteTextCommand references one Document",
      "CommandHistory owns an undo stack and a redo stack of Commands",
    ],
    edgeCases: [
      {
        scenario: "undo() is called when the undo stack is empty.",
        handling: "undo() must be a no-op rather than throwing — same defensive empty-check shape as popping any empty stack.",
      },
      {
        scenario: "A new command is executed after the user has already undone a few steps.",
        handling: "executeCommand() must clear the redo stack before pushing the new command — the old 'future' is no longer valid once a new action branches off from an earlier point, and keeping it would let redo() replay a command against a document state it no longer matches.",
      },
      {
        scenario: "redo() is called when the redo stack is empty.",
        handling: "Same defensive no-op as undo() on an empty stack — there's nothing left to reapply.",
      },
      {
        scenario: "The document is modified directly, bypassing CommandHistory, while commands are still on the undo stack.",
        handling: "Every mutation must go through a Command's execute()/undo() — a direct edit means a stored command's undo() (e.g. 'delete 5 characters at position 10') no longer matches what's actually there, silently corrupting undo.",
      },
    ],
    tradeoffs: [
      {
        decision: "Undo/redo stacks live on a separate CommandHistory class instead of Document tracking its own history.",
        reasoning: "Keeping Document purely about what the text currently is (not what happened to it) stops one class from doing two unrelated jobs — undo/redo is a cross-cutting concern that could apply to any receiver, not something specific to what a document is.",
      },
      {
        decision: "Each edit type is its own concrete Command class instead of one generic EditCommand with an operation-type field and a branch in execute().",
        reasoning: "A type-tagged generic command just moves the type-switching problem into execute()/undo() themselves — separate classes mean a new edit type (e.g. ReplaceTextCommand) is a new class, not a new branch in code that already works.",
      },
      {
        decision: "DeleteTextCommand stores the actual deleted text at execute() time instead of just storing position + length and re-reading from the document later.",
        reasoning: "By the time undo() runs, the document has already changed shape — position and length alone can't say what text used to be there. Capturing the real substring the instant it's removed is the only way undo() can restore the exact original content.",
      },
    ],
    principles: [
      {
        name: "Command Pattern",
        explanation: "InsertTextCommand and DeleteTextCommand both implement the same execute()/undo() contract — CommandHistory never needs to know which concrete command it's holding, just that it can execute() and undo() it, which is what lets the undo/redo stacks treat every command interchangeably.",
      },
      {
        name: "Single Responsibility Principle",
        explanation: "Document only knows how to mutate its own text; CommandHistory only knows how to sequence commands forward and backward — neither reaches into the other's job.",
      },
      {
        name: "Encapsulation",
        explanation: "Document's content only ever changes through insertText()/deleteText() — no command reaches in and manipulates the string directly, which is what keeps every command's stored undo-state trustworthy.",
      },
      {
        name: "Open/Closed Principle",
        explanation: "Adding a new kind of edit (e.g. ReplaceTextCommand) means writing one new class that implements execute()/undo() — CommandHistory, Document, and every existing command stay completely untouched.",
      },
    ],
  },
};

const splitwise: ColdDrillPrompt = {
  id: "splitwise",
  title: "Design an Expense-Sharing App (Splitwise)",
  prompt: "Design an expense-sharing app like Splitwise — friends split shared expenses and settle up later.",
  reference: {
    clarifyingQuestions: [
      {
        question: "Is this single-currency, or do different expenses need different currencies?",
        why: "Multi-currency means Money needs a currency field plus conversion logic before any net-balance math is even possible — single-currency keeps Money a plain amount.",
      },
      {
        question: "Is settling up (actually recording a payment) in scope, or just tracking who owes whom?",
        why: "Decides whether Settlement exists as a class at all — balance-tracking-only drops the whole settle-up flow and its own history.",
      },
      {
        question: "Can more than one person pay for a single expense (e.g. splitting the bill upfront), or is there always exactly one payer per expense?",
        why: "Multiple payers would mean Expense needs a list of (payer, amountPaid) pairs instead of one paidBy field — a real structural fork, not a detail.",
      },
      {
        question: "Is this scoped to one group at a time, or does a user's balance span every group and every friend they've ever split an expense with?",
        why: "A single-group scope keeps computeNetBalances() bounded to one Group's own expenses; a cross-group 'net balance with this friend everywhere' feature needs a User-centric aggregation across every Group they're in.",
      },
    ],
    entities: [
      {
        id: "user",
        name: "User",
        isEntity: true,
        why: "A real participant with an identity that persists across many groups and many expenses — everything else in this model hangs off of who owes whom.",
        properties: [
          { name: "id", type: "string" },
          { name: "name", type: "string" },
        ],
      },
      {
        id: "group",
        name: "Group",
        isEntity: true,
        why: "The aggregate root for one shared context — owns its members, its expenses, and its settlement history, the same coordinator role ParkingLot plays over Levels.",
        properties: [
          { name: "id", type: "string" },
          { name: "name", type: "string" },
          { name: "members", type: "List<User>" },
          { name: "expenses", type: "List<Expense>" },
          { name: "settlements", type: "List<Settlement>" },
        ],
      },
      {
        id: "expense",
        name: "Expense",
        isEntity: true,
        why: "One shared cost — who paid, how much, and how it's split among participants. The split logic depends entirely on data this class already holds.",
        properties: [
          { name: "id", type: "string" },
          { name: "description", type: "string" },
          { name: "amount", type: "Money" },
          { name: "paidBy", type: "User" },
          { name: "participants", type: "List<User>" },
          { name: "splitType", type: "SplitType" },
          { name: "splitValues", type: "Map<String, Double>" },
        ],
      },
      {
        id: "split",
        name: "Split",
        isEntity: true,
        why: "One person's share of one expense — has its own identity separate from a raw number, the same reasoning as OrderItem being its own class instead of a bare quantity field.",
        properties: [
          { name: "id", type: "string" },
          { name: "user", type: "User" },
          { name: "amountOwed", type: "Money" },
        ],
      },
      {
        id: "settlement",
        name: "Settlement",
        isEntity: true,
        why: "The auditable record of an actual payment between two users — exists independently of whatever the current computed balance says, the same 'proof of the transaction' role Parking Lot's Ticket plays.",
        properties: [
          { name: "id", type: "string" },
          { name: "fromUser", type: "User" },
          { name: "toUser", type: "User" },
          { name: "amount", type: "Money" },
          { name: "timestamp", type: "DateTime" },
        ],
      },
      { id: "currency", name: "Currency", isEntity: false, why: "A value Money already carries as a field, not a class with its own behavior — modeling it separately adds a class for no new responsibility." },
      { id: "notification", name: "Notification", isEntity: false, why: "A byproduct of a new expense or settlement — a message sent elsewhere, not a class with its own responsibilities in this domain model." },
      { id: "receipt", name: "Receipt", isEntity: false, why: "An attachment/photo on an Expense, not a class with independent behavior — storage is an infrastructure concern, not a modeling one." },
    ],
    methods: [
      { id: "m1", signature: "addMember(user): void", ownerId: "group", justification: "Group owns its own members list; nothing else should be able to reach in and mutate it directly." },
      { id: "m2", signature: "addExpense(expense): void", ownerId: "group", justification: "Group owns its own expenses list, the same reasoning as Order owning its own OrderItems." },
      {
        id: "m3",
        signature: "calculateSplits(): List<Split>",
        ownerId: "expense",
        justification: "Expense holds its own amount, splitType, and participants — it's the class with the data to compute each person's share, without Group needing to know anything about split math.",
        codeExercise: {
          language: "java",
          starter: "List<Split> calculateSplits() {\n    // your code here\n}",
          reference:
            "List<Split> calculateSplits() {\n    List<Split> result = new ArrayList<>();\n    if (splitType == SplitType.EQUAL) {\n        Money share = amount.divide(participants.size());\n        for (User user : participants) {\n            result.add(new Split(user, share));\n        }\n    } else if (splitType == SplitType.EXACT) {\n        Money total = Money.zero();\n        for (User user : participants) {\n            Money owed = splitValues.get(user.getId());\n            result.add(new Split(user, owed));\n            total = total.add(owed);\n        }\n        if (!total.equals(amount)) {\n            throw new IllegalArgumentException(\"Exact splits do not sum to the expense amount\");\n        }\n    } else if (splitType == SplitType.PERCENTAGE) {\n        double totalPercent = 0;\n        for (User user : participants) {\n            double percent = splitValues.get(user.getId());\n            totalPercent += percent;\n            result.add(new Split(user, amount.multiply(percent / 100.0)));\n        }\n        if (Math.abs(totalPercent - 100.0) > 0.01) {\n            throw new IllegalArgumentException(\"Percentages do not sum to 100\");\n        }\n    }\n    return result;\n}",
          checklist: [
            "Handles all three split types (EQUAL, EXACT, PERCENTAGE), not just one",
            "Validates that EXACT splits sum to the expense's total amount, and PERCENTAGE splits sum to 100 — rejects a malformed split before creating any Split objects",
            "For EQUAL splits, divides evenly among every participant, not just everyone except the payer",
            "Bonus (L5+, not required here): equal splits that don't divide evenly (e.g. $10 / 3 people) need a remainder-distribution rule rather than silently losing or gaining a cent",
          ],
        },
      },
      { id: "m4", signature: "computeNetBalances(): Map<String, Money>", ownerId: "group", justification: "Only Group can see every Expense and Settlement at once — deriving each member's net balance requires that whole-group view, which no single Expense or User has." },
      {
        id: "m5",
        signature: "simplifyDebts(): List<Settlement>",
        ownerId: "group",
        justification: "Minimizing settlement transactions requires the same whole-group view computeNetBalances() already needs — Group is the only class positioned to run the matching algorithm across every member's net balance.",
        codeExercise: {
          language: "java",
          starter: "List<Settlement> simplifyDebts() {\n    // your code here\n}",
          reference:
            "List<Settlement> simplifyDebts() {\n    Map<String, Money> balances = computeNetBalances();\n    List<Settlement> settlements = new ArrayList<>();\n\n    PriorityQueue<Map.Entry<String, Money>> creditors =\n        new PriorityQueue<>((a, b) -> b.getValue().compareTo(a.getValue()));\n    PriorityQueue<Map.Entry<String, Money>> debtors =\n        new PriorityQueue<>((a, b) -> a.getValue().compareTo(b.getValue()));\n\n    for (Map.Entry<String, Money> entry : balances.entrySet()) {\n        if (entry.getValue().isGreaterThan(Money.zero())) {\n            creditors.add(entry);\n        } else if (entry.getValue().isLessThan(Money.zero())) {\n            debtors.add(entry);\n        }\n    }\n\n    while (!creditors.isEmpty() && !debtors.isEmpty()) {\n        Map.Entry<String, Money> creditor = creditors.poll();\n        Map.Entry<String, Money> debtor = debtors.poll();\n\n        Money owed = creditor.getValue();\n        Money owedBack = debtor.getValue().abs();\n        Money settleAmount = owed.isLessThan(owedBack) ? owed : owedBack;\n\n        settlements.add(Settlement.create(getUserById(debtor.getKey()), getUserById(creditor.getKey()), settleAmount));\n\n        Money creditorRemaining = owed.subtract(settleAmount);\n        Money debtorRemaining = owedBack.subtract(settleAmount);\n\n        if (creditorRemaining.isGreaterThan(Money.zero())) {\n            creditors.add(Map.entry(creditor.getKey(), creditorRemaining));\n        }\n        if (debtorRemaining.isGreaterThan(Money.zero())) {\n            debtors.add(Map.entry(debtor.getKey(), debtorRemaining.negate()));\n        }\n    }\n\n    return settlements;\n}",
          checklist: [
            "Computes NET balances first (per person, across all expenses) rather than settling each pairwise debt individually — a 3-person debt cycle should net to zero settlements, not three",
            "Repeatedly matches the CURRENT largest creditor with the CURRENT largest debtor, not the first pair found or a fixed order",
            "Settles the smaller of the two amounts each round, so at least one side reaches exactly zero and drops out of contention",
            "Bonus (L5+, not required here): this greedy approach bounds the transaction count at n-1 for n people with nonzero balance and works well in practice, but it is NOT formally proven to find the mathematically fewest possible transactions in every case — naming that nuance out loud is itself a strong interview signal",
          ],
        },
      },
      { id: "m6", signature: "create(fromUser, toUser, amount): Settlement", ownerId: "settlement", justification: "Creating a Settlement is its own constructor-style responsibility — it's the class that knows what fields a valid settlement record needs, the same shape as Parking Lot's Ticket.issue()." },
      { id: "m7", signature: "recordSettlement(settlement): void", ownerId: "group", justification: "Group owns its own settlements list — recording one changes what the next computeNetBalances() call will return, so only Group should be the one appending to it." },
    ],
    relationships: [
      "Group has many Users as members",
      "Group has many Expenses and many Settlements",
      "Expense references one paying User and has many Splits",
      "Split references one User",
      "Settlement references two Users (fromUser and toUser)",
    ],
    edgeCases: [
      {
        scenario: "An expense is split with EXACT amounts that don't sum to the total (a $50 dinner split into $20 + $20 = $40, missing $10).",
        handling: "calculateSplits() must validate the sum before creating any Split records, and reject the expense outright rather than silently leaving a $10 shortfall nobody is responsible for.",
      },
      {
        scenario: "A user leaves the group with an outstanding balance.",
        handling: "Group can't just remove them from members — computeNetBalances() and simplifyDebts() still need their historical Expenses and any unresolved balance, so leaving a group should be a status/flag, not a deletion.",
      },
      {
        scenario: "A three-person cycle of debts: A owes B $10 on one expense, B owes C $10 on another, C owes A $10 on a third.",
        handling: "Net balance for A, B, and C each come out to exactly zero once every expense is summed — simplifyDebts() should produce zero settlements here, not three pairwise ones. This is the entire point of computing net balances before matching.",
      },
      {
        scenario: "Two group members settle up in cash outside the app, but only one of them records the Settlement.",
        handling: "Settlement recorded unilaterally by one side risks erasing a debt the other party never agreed was paid — worth raising in an interview as an extension (a pending/confirmed status) even if out of scope for the base design.",
      },
    ],
    tradeoffs: [
      {
        decision: "computeNetBalances() derives balances fresh from Expenses and Settlements every time, instead of storing a persistent balance that's incrementally updated.",
        reasoning: "A stored balance that must be kept in sync with every new Expense or Settlement is a classic source of drift bugs — deriving it fresh from the source-of-truth history means it can never silently disagree with what actually happened, at the cost of recomputing it on demand.",
      },
      {
        decision: "Split is its own class instead of Expense holding a flat Map<User, Money>.",
        reasoning: "Costs one more class, but gives each person's share its own identity — useful the moment a Split needs anything beyond a raw number, without Expense itself needing to change shape.",
      },
      {
        decision: "Settlement is a separate auditable record instead of simplifyDebts() directly mutating some stored balance field.",
        reasoning: "Same split as every other transactional system in this app — Settlement is the record of an actual transfer; recomputing computeNetBalances() afterward (now including the new Settlement) is what reflects it, rather than two pieces of state that could drift apart.",
      },
    ],
    principles: [
      { name: "Single Responsibility Principle", explanation: "Expense only knows how to split its own amount by its own splitType; Group only knows how to aggregate balances and match settlements across the Expenses and Settlements it owns — neither reaches into the other's math." },
      { name: "Encapsulation", explanation: "Group.addExpense() and addMember() are the only ways those lists grow — nothing else reaches in and appends to them directly, which matters here specifically because computeNetBalances() has to trust that list is complete." },
      { name: "Strategy Pattern", explanation: "Expense.calculateSplits() branches on splitType (EQUAL/EXACT/PERCENTAGE) — the same shape as Discount/Coupon System's DiscountRule.apply(), though here it's a branch inside one method rather than a polymorphic class per type; a fuller version would extract each split type into its own SplitStrategy if an interviewer pushes on extensibility." },
      { name: "Derived state over stored state", explanation: "computeNetBalances() is always computed from the Expense/Settlement history, never stored and incrementally updated — so it can never disagree with what actually happened, unlike a cached balance field that has to be kept in sync by every mutation." },
    ],
  },
};

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
