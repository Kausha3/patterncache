import type { ColdDrillPrompt } from "@/types";

// Compilable domain model shared by this drill's runnable Java exercises.
// Each string is a complete file; the exercise runner writes them next to
// the learner's class and compiles everything together in the browser.

const COPY_STATUS_JAVA = `public enum CopyStatus {
    AVAILABLE, CHECKED_OUT, LOST;
}
`;

const MEMBER_JAVA = `public class Member {
    private final String id;
    private final String name;

    public Member(String id, String name) {
        this.id = id;
        this.name = name;
    }

    public String getId() { return id; }
    public String getName() { return name; }
}
`;

// Full BookCopy with checkOut() implemented. It doubles as the support file
// for the findAvailableCopy exercise and as the reference file for the
// checkOut exercise, where BookCopy itself is the class under edit.
const BOOK_COPY_JAVA = `public class BookCopy {
    private final String id;
    private final String barcode;
    private CopyStatus status;

    public BookCopy(String id, String barcode, CopyStatus status) {
        this.id = id;
        this.barcode = barcode;
        this.status = status;
    }

    public String getId() { return id; }
    public String getBarcode() { return barcode; }
    public CopyStatus getStatus() { return status; }

    public void checkOut(Member member) {
        if (status != CopyStatus.AVAILABLE) {
            throw new IllegalStateException("Copy " + id + " is not available");
        }
        this.status = CopyStatus.CHECKED_OUT;
    }
}
`;

export const libraryManagement: ColdDrillPrompt = {
  id: "library-management",
  title: "Design a Library Management System",
  prompt: "Design a library management system.",
  reference: {
    clarifyingQuestions: [
      {
        question: "Is this a single branch, or a network of branches where a book could be at a different location?",
        why: "A single branch means Library sits directly atop Book, but a multi-branch system needs a Branch layer between Library and BookCopy. That's a real structural layer, not a detail.",
      },
      {
        question: "Do members reserve/hold books, or is checkout strictly first-come, first-served?",
        why: "Decides whether Reservation exists as a class at all. Without holds, the model drops a whole entity and returning a copy never has to check a queue.",
      },
      {
        question: "Are overdue fines in scope, or just tracking due dates?",
        why: "Decides whether Fine is a class in the model, same scoping shape as Parking Lot's payment clarify question.",
      },
      {
        question: "Physical books only, or also ebooks/digital loans?",
        why: "A digital loan doesn't need a BookCopy with a physical barcode at all. An ebook 'copy' is really a concurrent-license count, a structurally different model from a shelf of physical copies.",
      },
    ],
    entities: [
      {
        id: "library",
        name: "Library",
        isEntity: true,
        why: "The top-level system. It owns every Book title and every Member, the same aggregate-root role ParkingLot plays over Levels.",
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
        why: "The catalog entry (title, author, and ISBN) plus the list of physical copies that exist for it. Title-level metadata, not any one physical item.",
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
        why: "One physical item on a shelf, with its own barcode and status. This is what actually gets checked out, not the Book entry itself, which is why it needs its own identity separate from Book.",
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
        why: "A library patron. Has an identity and a borrowing history that outlives any single loan.",
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
        why: "One checkout transaction. Links a specific BookCopy to a Member with a due date, the same 'proof of the transaction' role Parking Lot's Ticket plays.",
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
        why: "A hold placed on a title, queued until a copy frees up. References Book, not any specific BookCopy, since you're reserving the next available copy of a title, not a particular physical item.",
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
        why: "The money owed for an overdue return. It has its own payment lifecycle, independent of whether the loan itself has closed.",
        properties: [
          { name: "id", type: "string" },
          { name: "loan", type: "Loan" },
          { name: "amount", type: "Money" },
          { name: "status", type: "FineStatus" },
        ],
      },
      { id: "librarian", name: "Librarian", isEntity: false, why: "The staff member operating the checkout desk. An external actor who calls into the system, not a class inside its own domain model." },
      { id: "shelf", name: "Shelf", isEntity: false, why: "A physical location string BookCopy can hold as a field, not a class with behavior of its own." },
      { id: "catalog", name: "Catalog", isEntity: false, why: "The searchable index over all Books. A query surface, not a class with state beyond what Book already models." },
    ],
    methods: [
      {
        id: "m1",
        signature: "findAvailableCopy(): BookCopy",
        ownerId: "book",
        justification: "Book already owns the list of its own copies, so it's the class positioned to search that list for one that's free. No other class should reach into Book's copies list to do this search itself.",
        codeExercise: {
          language: "java",
          starter: "BookCopy findAvailableCopy() {\n    // your code here\n}",
          reference:
            "BookCopy findAvailableCopy() {\n    for (BookCopy copy : copies) {\n        if (copy.getStatus() == CopyStatus.AVAILABLE) {\n            return copy;\n        }\n    }\n    return null;\n}",
          checklist: [
            "Checks every copy of this book, not just the first one found",
            "Only matches copies whose status is exactly AVAILABLE, not LOST or CHECKED_OUT",
            "Returns null (not an exception) when every copy is currently out",
            "Doesn't mutate any copy's status itself, since finding and assigning are separate steps",
          ],
          java: {
            editClassName: "Book",
            starterFile: `import java.util.List;

public class Book {
    private final String id;
    private final String title;
    private final String author;
    private final String isbn;
    private final List<BookCopy> copies;

    public Book(String id, String title, String author, String isbn, List<BookCopy> copies) {
        this.id = id;
        this.title = title;
        this.author = author;
        this.isbn = isbn;
        this.copies = copies;
    }

    public String getId() { return id; }
    public String getTitle() { return title; }
    public String getAuthor() { return author; }
    public String getIsbn() { return isbn; }
    public List<BookCopy> getCopies() { return copies; }

    public BookCopy findAvailableCopy() {
        // Walk this book's own copies and return the first one whose status is AVAILABLE.
        // Return null when every copy is out, do not throw.
        return null;
    }
}
`,
            referenceFile: `import java.util.List;

public class Book {
    private final String id;
    private final String title;
    private final String author;
    private final String isbn;
    private final List<BookCopy> copies;

    public Book(String id, String title, String author, String isbn, List<BookCopy> copies) {
        this.id = id;
        this.title = title;
        this.author = author;
        this.isbn = isbn;
        this.copies = copies;
    }

    public String getId() { return id; }
    public String getTitle() { return title; }
    public String getAuthor() { return author; }
    public String getIsbn() { return isbn; }
    public List<BookCopy> getCopies() { return copies; }

    public BookCopy findAvailableCopy() {
        for (BookCopy copy : copies) {
            if (copy.getStatus() == CopyStatus.AVAILABLE) {
                return copy;
            }
        }
        return null;
    }
}
`,
            support: [
              { className: "CopyStatus", source: COPY_STATUS_JAVA },
              { className: "Member", source: MEMBER_JAVA },
              { className: "BookCopy", source: BOOK_COPY_JAVA },
            ],
            tests: [
              {
                id: "skips-checked-out",
                label: "skips a checked-out copy and returns the one still on the shelf",
                body: `BookCopy borrowed = new BookCopy("c1", "BC-001", CopyStatus.CHECKED_OUT);
BookCopy onShelf = new BookCopy("c2", "BC-002", CopyStatus.AVAILABLE);
Book book = new Book("b1", "Clean Code", "Robert Martin", "9780132350884", java.util.Arrays.asList(borrowed, onShelf));
BookCopy found = book.findAvailableCopy();
expectedText = "copy c2, the one still on the shelf";
actualText = found == null ? "null" : "copy " + found.getId();
passed = found != null && "c2".equals(found.getId());`,
              },
              {
                id: "lost-is-not-available",
                label: "a LOST copy never counts as available",
                body: `BookCopy missing = new BookCopy("c1", "BC-001", CopyStatus.LOST);
BookCopy onShelf = new BookCopy("c2", "BC-002", CopyStatus.AVAILABLE);
Book book = new Book("b1", "Refactoring", "Martin Fowler", "9780134757599", java.util.Arrays.asList(missing, onShelf));
BookCopy found = book.findAvailableCopy();
expectedText = "copy c2, since a LOST copy cannot be lent";
actualText = found == null ? "null" : "copy " + found.getId();
passed = found != null && "c2".equals(found.getId());`,
              },
              {
                id: "all-copies-out-returns-null",
                label: "the title exists in the catalog, but with every copy out it returns null",
                body: `BookCopy borrowed = new BookCopy("c1", "BC-001", CopyStatus.CHECKED_OUT);
BookCopy missing = new BookCopy("c2", "BC-002", CopyStatus.LOST);
Book book = new Book("b1", "Effective Java", "Joshua Bloch", "9780134685991", java.util.Arrays.asList(borrowed, missing));
BookCopy found = book.findAvailableCopy();
expectedText = "null, availability lives on copies and every copy is out";
actualText = found == null ? "null, availability lives on copies and every copy is out" : "copy " + found.getId();
passed = found == null;`,
              },
              {
                id: "find-does-not-checkout",
                label: "finding a copy must not change its status",
                body: `BookCopy onShelf = new BookCopy("c1", "BC-001", CopyStatus.AVAILABLE);
Book book = new Book("b1", "Clean Code", "Robert Martin", "9780132350884", java.util.Arrays.asList(onShelf));
book.findAvailableCopy();
expectedText = "copy c1 still AVAILABLE after the search";
actualText = onShelf.getStatus() == CopyStatus.AVAILABLE ? "copy c1 still AVAILABLE after the search" : "copy c1 became " + onShelf.getStatus();
passed = onShelf.getStatus() == CopyStatus.AVAILABLE;`,
              },
              {
                id: "title-with-no-copies",
                label: "a title with zero physical copies returns null instead of crashing",
                body: `Book book = new Book("b1", "Out of Print", "Unknown", "9780000000000", java.util.Collections.<BookCopy>emptyList());
BookCopy found = book.findAvailableCopy();
expectedText = "null, the Book row alone lends nothing";
actualText = found == null ? "null, the Book row alone lends nothing" : "copy " + found.getId();
passed = found == null;`,
              },
            ],
          },
        },
      },
      { id: "m2", signature: "getAvailableCount(): int", ownerId: "book", justification: "Derived purely from this Book's own copies list, the same aggregate-count shape as ParkingLot.isFull(), computed from data the class already owns." },
      {
        id: "m3",
        signature: "checkOut(member): void",
        ownerId: "bookcopy",
        justification: "status lives on BookCopy, so BookCopy is the only class that can flip it safely. Same invariant-protection shape as ParkingSpot.assignVehicle() guarding isOccupied.",
        codeExercise: {
          language: "java",
          starter: "void checkOut(Member member) {\n    // your code here\n}",
          reference:
            "void checkOut(Member member) {\n    if (status != CopyStatus.AVAILABLE) {\n        throw new IllegalStateException(\"Copy \" + id + \" is not available\");\n    }\n    this.status = CopyStatus.CHECKED_OUT;\n}",
          checklist: [
            "Checks status is AVAILABLE before changing anything, doesn't silently check out an already-out or lost copy",
            "Fails loudly (exception, or a boolean/Result return) instead of quietly doing nothing",
            "Sets status to CHECKED_OUT only after the check passes",
            "Bonus (L5+, not required here): two members checking out the last copy at the same instant. This check-then-act needs to be atomic under concurrency, not just correct in isolation",
          ],
          java: {
            editClassName: "BookCopy",
            starterFile: `public class BookCopy {
    private final String id;
    private final String barcode;
    private CopyStatus status;

    public BookCopy(String id, String barcode, CopyStatus status) {
        this.id = id;
        this.barcode = barcode;
        this.status = status;
    }

    public String getId() { return id; }
    public String getBarcode() { return barcode; }
    public CopyStatus getStatus() { return status; }

    public void checkOut(Member member) {
        // Guard the status this class owns, then flip it to CHECKED_OUT.
        // A copy that is not AVAILABLE must fail loudly, not silently.
    }
}
`,
            referenceFile: BOOK_COPY_JAVA,
            support: [
              { className: "CopyStatus", source: COPY_STATUS_JAVA },
              { className: "Member", source: MEMBER_JAVA },
            ],
            tests: [
              {
                id: "marks-checked-out",
                label: "checking out an available copy marks it CHECKED_OUT",
                body: `BookCopy copy = new BookCopy("c1", "BC-001", CopyStatus.AVAILABLE);
copy.checkOut(new Member("m1", "Aisha"));
expectedText = "copy c1 is CHECKED_OUT";
actualText = "copy c1 is " + copy.getStatus();
passed = copy.getStatus() == CopyStatus.CHECKED_OUT;`,
              },
              {
                id: "double-checkout-fails-loudly",
                label: "a second checkout fails loudly instead of overwriting",
                body: `BookCopy copy = new BookCopy("c1", "BC-001", CopyStatus.AVAILABLE);
copy.checkOut(new Member("m1", "Aisha"));
expectedText = "IllegalStateException on the second checkout";
try {
    copy.checkOut(new Member("m2", "Ben"));
    actualText = "no exception, the second member silently took the copy";
    passed = false;
} catch (IllegalStateException expectedFailure) {
    actualText = "IllegalStateException on the second checkout";
    passed = true;
}`,
              },
              {
                id: "lost-copy-rejected",
                label: "a LOST copy cannot be checked out and stays LOST",
                body: `BookCopy copy = new BookCopy("c1", "BC-001", CopyStatus.LOST);
expectedText = "IllegalStateException, and the copy stays LOST";
try {
    copy.checkOut(new Member("m1", "Aisha"));
    actualText = "no exception, a lost copy was silently checked out";
    passed = false;
} catch (IllegalStateException expectedFailure) {
    if (copy.getStatus() == CopyStatus.LOST) {
        actualText = "IllegalStateException, and the copy stays LOST";
        passed = true;
    } else {
        actualText = "exception thrown, but status became " + copy.getStatus();
        passed = false;
    }
}`,
              },
              {
                id: "reject-keeps-first-borrower",
                label: "a rejected checkout leaves the copy with its first borrower",
                body: `BookCopy copy = new BookCopy("c1", "BC-001", CopyStatus.AVAILABLE);
copy.checkOut(new Member("m1", "Aisha"));
try {
    copy.checkOut(new Member("m2", "Ben"));
} catch (IllegalStateException expectedFailure) {
    // The guard fired; the copy must still belong to the first member.
}
expectedText = "copy c1 still CHECKED_OUT";
actualText = "copy c1 is " + copy.getStatus();
passed = copy.getStatus() == CopyStatus.CHECKED_OUT;`,
              },
              {
                id: "other-copies-untouched",
                label: "checking out one copy never touches the title's other copies",
                body: `BookCopy taken = new BookCopy("c1", "BC-001", CopyStatus.AVAILABLE);
BookCopy sibling = new BookCopy("c2", "BC-002", CopyStatus.AVAILABLE);
taken.checkOut(new Member("m1", "Aisha"));
expectedText = "copy c2 still AVAILABLE, availability lives on each copy";
actualText = sibling.getStatus() == CopyStatus.AVAILABLE ? "copy c2 still AVAILABLE, availability lives on each copy" : "copy c2 became " + sibling.getStatus();
passed = sibling.getStatus() == CopyStatus.AVAILABLE;`,
              },
            ],
          },
        },
      },
      { id: "m4", signature: "returnCopy(): void", ownerId: "bookcopy", justification: "Same invariant as checkOut() in reverse. The class that owns status is the only one allowed to clear it back to AVAILABLE." },
      { id: "m5", signature: "canBorrow(): boolean", ownerId: "member", justification: "Member owns its own activeLoans list, so it's the class that can answer 'has this person hit their borrowing limit' without Library or Loan needing to track a separate count." },
      { id: "m6", signature: "issue(member, copy): Loan", ownerId: "loan", justification: "Creating a Loan is Loan's own constructor-style responsibility. It's the class that knows what fields a valid loan needs (member, copy, dates), the same shape as Parking Lot's Ticket.issue()." },
      { id: "m7", signature: "close(returnDate): void", ownerId: "loan", justification: "Closing out a loan is a transition on Loan's own lifecycle. Loan is what tracks open vs. closed, so it enforces that transition, not Member or BookCopy reaching in to mutate it." },
      { id: "m8", signature: "calculateFine(): Money", ownerId: "fine", justification: "Fine math (days overdue × rate) is a Fine concern by definition. Loan knows the dates but shouldn't know how to price lateness, since that pricing logic can change independently of what a loan even is." },
      { id: "m9", signature: "pay(amount): boolean", ownerId: "fine", justification: "Processing payment on a fine is the financial transaction itself, the same split Parking Lot's Payment.charge() plays. Bundling it into Loan would mix borrowing-proof with money movement." },
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
        handling: "canBorrow() must be checked before checkOut() runs. Member owns its own active-loan count, so it's the one that can answer this without Library or Loan needing to track it separately.",
      },
      {
        scenario: "The last available copy of a title is checked out while someone else has it reserved.",
        handling: "When a copy is returned, Reservation.fulfill() should check the hold queue before the copy silently becomes available to a walk-up member. A naive returnCopy() that just flips status to AVAILABLE would let a reservation get skipped.",
      },
      {
        scenario: "A copy is returned after already being reported lost.",
        handling: "BookCopy needs a LOST status distinct from CHECKED_OUT, and returning a LOST copy should reconcile any Fine already charged for it rather than silently double-processing.",
      },
      {
        scenario: "Two members try to check out the last available copy at the exact same instant.",
        handling: "checkOut() has to be atomic, same concurrency shape as ParkingSpot.assignVehicle() checking isOccupied before assigning. Whichever request commits the status flip first wins, the other fails cleanly instead of overwriting.",
      },
    ],
    tradeoffs: [
      {
        decision: "Book and BookCopy are separate classes instead of one Book class with a copiesAvailable count field.",
        reasoning: "A single counter can't tell you which physical copy someone has, when it's due back, or whether a specific copy is lost versus just checked out. Those are all per-copy facts, not per-title facts, so they need BookCopy's own identity.",
      },
      {
        decision: "Reservation references a Book, not a BookCopy.",
        reasoning: "You reserve 'the next available copy of this title,' not a specific physical item. Modeling Reservation against BookCopy would force guessing in advance which exact copy comes back first, which doesn't reflect how holds actually work.",
      },
      {
        decision: "Fine is its own class instead of a penalty field directly on Loan.",
        reasoning: "A fine has its own payment lifecycle (owed, paid, waived) independent of the loan's own return status. Collapsing them would mean Loan has to track two unrelated state machines at once.",
      },
    ],
    principles: [
      { name: "Single Responsibility Principle", explanation: "BookCopy only tracks this one physical item's status. Book only tracks title-level metadata and its own list of copies, and neither reaches into the other's job." },
      { name: "Encapsulation", explanation: "BookCopy.checkOut() and returnCopy() are the only ways its status changes. Nothing else flips status directly, so two callers can never disagree about whether a copy is out." },
      { name: "Separation of Concerns", explanation: "Loan (proof you borrowed something) and Fine (money owed because of it) are separate, same split as Parking Lot's Ticket/Payment. A loan can close cleanly with no fine, or a fine can exist on a loan that's already closed." },
      { name: "Composition over inheritance", explanation: "Library HAS-A list of Books, Book HAS-A list of BookCopies. The object graph mirrors the physical catalog directly, instead of forcing an inheritance hierarchy that doesn't reflect reality." },
    ],
  },
};
