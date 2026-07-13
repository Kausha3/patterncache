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

const COLD_DRILLS: ColdDrillPrompt[] = [pizzaOrdering, libraryManagement, atm, restaurantReservation, rideShareDispatch];

export function listColdDrills(): ColdDrillPrompt[] {
  return COLD_DRILLS;
}

export function getColdDrill(id: string): ColdDrillPrompt | undefined {
  return COLD_DRILLS.find((d) => d.id === id);
}
