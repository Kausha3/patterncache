import type { ColdDrillPrompt } from "@/types";

// Compilable domain model shared by this drill's runnable Java exercises.
// Each string is a complete file; the exercise runner writes them next to
// the learner's class and compiles everything together in the browser.

const MONEY_JAVA = `public class Money {
    private final int cents;

    public Money(int cents) {
        this.cents = cents;
    }

    public int getCents() { return cents; }
    public boolean isGreaterThan(Money other) { return cents > other.cents; }
    public Money subtract(Money other) { return new Money(cents - other.cents); }
}
`;

export const atm: ColdDrillPrompt = {
  id: "atm",
  title: "Design an ATM",
  prompt: "Design an ATM.",
  reference: {
    clarifyingQuestions: [
      {
        question: "Is this a single, standalone ATM, or part of a network reporting to a central bank system?",
        why: "A standalone ATM can keep Account/Card data locally, but a networked ATM means Account and Card really live in a remote bank system the ATM only queries. That changes what those classes even represent versus a thin client reference.",
      },
      {
        question: "Withdrawal only, or also deposits and balance transfers?",
        why: "Deposit-in-scope means CashDispenser needs an accept-and-count-inserted-cash responsibility too, not just dispense. That roughly doubles what the hardware-facing classes need to do.",
      },
      {
        question: "A single currency and a fixed set of bill denominations, or configurable per machine?",
        why: "Determines whether CashDispenser's denomination set is a fixed constant or a configurable field the machine is provisioned with. Changes whether denomination values are hardcoded or data.",
      },
      {
        question: "Is PIN retry lockout in scope, or can we assume a valid PIN is always eventually entered?",
        why: "Decides whether Card even needs a failedAttempts field and an isLocked() method. Without this scope, the whole lockout edge case and its class-level support disappear.",
      },
    ],
    entities: [
      {
        id: "atm",
        name: "ATM",
        isEntity: true,
        why: "The persistent, always-on machine. Owns the CashDispenser hardware and serves one customer session after another without itself holding per-use state.",
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
        why: "The short-lived per-customer state machine (idle, card inserted, PIN verified, dispensing), created fresh for each visit and discarded after, so ATM itself never has to reset between customers.",
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
        why: "Identifies which Account this session is acting on, and tracks lockout state that must persist across sessions and across machines. A card blocked here stays blocked everywhere.",
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
        why: "Owns the balance, the one number every withdrawal ultimately checks and mutates, independent of which card, session, or machine is acting on it.",
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
        why: "The auditable record of what was attempted and what happened. It exists even for a transaction that failed, which a balance mutation alone could never represent.",
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
        why: "The physical hardware. Tracks how many bills of each denomination are actually loaded, which a single total-cash number could never answer correctly for a specific withdrawal amount.",
        properties: [
          { name: "id", type: "string" },
          { name: "denominationCounts", type: "Map<Integer, Integer>" },
        ],
      },
      { id: "bank", name: "Bank", isEntity: false, why: "Account and Transaction already model everything this system needs to know about the bank. A full Bank class would just be an out-of-scope integration point, not a class in this system's own domain model." },
      { id: "receiptprinter", name: "ReceiptPrinter", isEntity: false, why: "A hardware output, not a class with state or decisions of its own. Printing a receipt is a side effect of a completed Transaction, not a responsibility that needs its own class." },
      { id: "keypad", name: "Keypad", isEntity: false, why: "An input device Session reads from, not a class with independent behavior in the domain model." },
    ],
    methods: [
      {
        id: "m1",
        signature: "insertCard(card): void",
        ownerId: "session",
        justification: "Session is what tracks whether a card is currently inserted for this particular use. ATM itself stays a passive host across many sessions, so per-use state belongs on Session, not ATM.",
      },
      {
        id: "m2",
        signature: "verifyPin(pin): boolean",
        ownerId: "session",
        justification: "Verifying a PIN transitions Session's own state machine from CARD_INSERTED toward PIN_VERIFIED (or fails and defers to Card to record the failed attempt). This is squarely Session's job since it's the class tracking where in the flow this specific visit is.",
      },
      {
        id: "m3",
        signature: "incrementFailedAttempts(): void",
        ownerId: "card",
        justification: "failedAttempts lives on Card because it must persist across sessions. A blocked card stays blocked even after this session ends and the ATM resets to idle for the next customer.",
      },
      {
        id: "m4",
        signature: "isLocked(): boolean",
        ownerId: "card",
        justification: "Whether a card is locked is derived purely from Card's own failedAttempts field. No other class holds the data needed to answer this.",
      },
      {
        id: "m5",
        signature: "debit(amount): void",
        ownerId: "account",
        justification: "balance lives on Account, so Account is the only class that can safely check-then-mutate it. Letting Session or ATM subtract from balance directly would let two different callers disagree about what the account can actually afford.",
        codeExercise: {
          language: "java",
          starter: "void debit(Money amount) {\n    // your code here\n}",
          reference:
            "void debit(Money amount) {\n    if (amount.isGreaterThan(balance)) {\n        throw new IllegalStateException(\"Insufficient funds for this withdrawal\");\n    }\n    this.balance = balance.subtract(amount);\n}",
          checklist: [
            "Checks the requested amount against the CURRENT balance before subtracting, not after",
            "Fails loudly (exception) on insufficient funds instead of letting balance go negative",
            "Mutates balance only after the check passes",
            "Bonus (L5+, not required here): this check-then-act needs to be atomic under concurrent withdrawal attempts on the same account, e.g. two ATMs debiting at once",
          ],
          java: {
            editClassName: "Account",
            starterFile: `public class Account {
    private final String id;
    private final String accountNumber;
    private Money balance;

    public Account(String id, String accountNumber, Money balance) {
        this.id = id;
        this.accountNumber = accountNumber;
        this.balance = balance;
    }

    public String getId() { return id; }
    public String getAccountNumber() { return accountNumber; }
    public Money getBalance() { return balance; }

    public void debit(Money amount) {
        // Check the requested amount against the CURRENT balance first.
        // Insufficient funds must fail loudly; subtract only after the check passes.
    }
}
`,
            referenceFile: `public class Account {
    private final String id;
    private final String accountNumber;
    private Money balance;

    public Account(String id, String accountNumber, Money balance) {
        this.id = id;
        this.accountNumber = accountNumber;
        this.balance = balance;
    }

    public String getId() { return id; }
    public String getAccountNumber() { return accountNumber; }
    public Money getBalance() { return balance; }

    public void debit(Money amount) {
        if (amount.isGreaterThan(balance)) {
            throw new IllegalStateException("Insufficient funds for this withdrawal");
        }
        this.balance = balance.subtract(amount);
    }
}
`,
            support: [{ className: "Money", source: MONEY_JAVA }],
            tests: [
              {
                id: "debit-updates-balance",
                label: "a covered debit subtracts exactly the requested amount",
                body: `Account account = new Account("acc-1", "111-222", new Money(10000));
account.debit(new Money(4000));
Money after = account.getBalance();
expectedText = "6000 cents left";
actualText = after == null ? "balance is null" : after.getCents() + " cents left";
passed = after != null && after.getCents() == 6000;`,
              },
              {
                id: "debit-rejects-overdraft",
                label: "a debit bigger than the balance fails loudly",
                body: `Account account = new Account("acc-2", "222-333", new Money(5000));
expectedText = "IllegalStateException on a 6000 cent debit against 5000";
try {
    account.debit(new Money(6000));
    Money after = account.getBalance();
    actualText = "no exception, balance is now " + (after == null ? "null" : after.getCents() + " cents");
    passed = false;
} catch (IllegalStateException expectedFailure) {
    actualText = "IllegalStateException on a 6000 cent debit against 5000";
    passed = true;
}`,
              },
              {
                id: "debit-balance-survives-reject",
                label: "a rejected debit leaves the balance untouched",
                body: `Account account = new Account("acc-3", "333-444", new Money(5000));
try {
    account.debit(new Money(6000));
} catch (IllegalStateException expectedFailure) {
    // The guard fired; the balance must not have been touched.
}
Money after = account.getBalance();
expectedText = "5000 cents left";
actualText = after == null ? "balance is null" : after.getCents() + " cents left";
passed = after != null && after.getCents() == 5000;`,
              },
              {
                id: "debit-allows-exact-balance",
                label: "debiting exactly the balance succeeds and leaves zero",
                body: `Account account = new Account("acc-4", "444-555", new Money(5000));
expectedText = "0 cents left, no exception";
try {
    account.debit(new Money(5000));
    Money after = account.getBalance();
    actualText = after == null ? "balance is null" : after.getCents() + " cents left, no exception";
    passed = after != null && after.getCents() == 0;
} catch (IllegalStateException wrongReject) {
    actualText = "rejected a debit of exactly the balance";
    passed = false;
}`,
              },
              {
                id: "debit-sequential-math",
                label: "two debits in a row accumulate against the live balance",
                body: `Account account = new Account("acc-5", "555-666", new Money(10000));
account.debit(new Money(3000));
account.debit(new Money(2000));
Money after = account.getBalance();
expectedText = "5000 cents left";
actualText = after == null ? "balance is null" : after.getCents() + " cents left";
passed = after != null && after.getCents() == 5000;`,
              },
            ],
          },
        },
      },
      {
        id: "m6",
        signature: "create(account, type, amount): Transaction",
        ownerId: "transaction",
        justification: "Building a Transaction record is Transaction's own constructor-style responsibility. It's the class that knows what fields a valid record needs, same as Parking Lot's Ticket.issue().",
      },
      {
        id: "m7",
        signature: "hasEnoughCash(amount): boolean",
        ownerId: "cashdispenser",
        justification: "Only CashDispenser holds the per-denomination counts needed to answer whether an exact amount can actually be made. A single total-cash check on ATM couldn't tell $140 apart from an unmakeable $140 in only $50 bills.",
      },
      {
        id: "m8",
        signature: "dispense(amount): Map<Integer, Integer>",
        ownerId: "cashdispenser",
        justification: "Deciding which physical bills to hand out is a hardware-inventory problem only CashDispenser has the data to solve. Session just asks for an amount, it doesn't know or care about denominations.",
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
          java: {
            editClassName: "CashDispenser",
            starterFile: `import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public class CashDispenser {
    private final String id;
    private final Map<Integer, Integer> denominationCounts;

    public CashDispenser(String id, Map<Integer, Integer> denominationCounts) {
        this.id = id;
        this.denominationCounts = denominationCounts;
    }

    public String getId() { return id; }
    public int getCount(int denomination) { return denominationCounts.getOrDefault(denomination, 0); }

    public Map<Integer, Integer> dispense(int amount) {
        // Greedy: largest denominations first, never more bills than are loaded.
        // Throw IllegalStateException when the exact amount cannot be made,
        // and only mutate the counts once the full breakdown is confirmed.
        return null;
    }
}
`,
            referenceFile: `import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public class CashDispenser {
    private final String id;
    private final Map<Integer, Integer> denominationCounts;

    public CashDispenser(String id, Map<Integer, Integer> denominationCounts) {
        this.id = id;
        this.denominationCounts = denominationCounts;
    }

    public String getId() { return id; }
    public int getCount(int denomination) { return denominationCounts.getOrDefault(denomination, 0); }

    public Map<Integer, Integer> dispense(int amount) {
        Map<Integer, Integer> result = new LinkedHashMap<>();
        int remaining = amount;
        List<Integer> denominations = new ArrayList<>(denominationCounts.keySet());
        denominations.sort(Collections.reverseOrder());
        for (int denomination : denominations) {
            int available = denominationCounts.get(denomination);
            int needed = Math.min(remaining / denomination, available);
            if (needed > 0) {
                result.put(denomination, needed);
                remaining -= needed * denomination;
            }
        }
        if (remaining > 0) {
            throw new IllegalStateException("Cannot make this amount with available denominations");
        }
        denominations.forEach(d -> denominationCounts.put(d, denominationCounts.get(d) - result.getOrDefault(d, 0)));
        return result;
    }
}
`,
            support: [],
            tests: [
              {
                id: "dispense-greedy-largest-first",
                label: "breaks 170 into one 100, one 50, one 20 (largest first)",
                body: `java.util.Map<Integer, Integer> counts = new java.util.LinkedHashMap<Integer, Integer>();
counts.put(20, 5);
counts.put(50, 5);
counts.put(100, 5);
CashDispenser dispenser = new CashDispenser("atm-1", counts);
java.util.Map<Integer, Integer> result = dispenser.dispense(170);
expectedText = "100s: 1, 50s: 1, 20s: 1";
if (result == null) {
    actualText = "null instead of a breakdown";
    passed = false;
} else {
    actualText = "100s: " + result.get(100) + ", 50s: " + result.get(50) + ", 20s: " + result.get(20);
    passed = Integer.valueOf(1).equals(result.get(100)) && Integer.valueOf(1).equals(result.get(50)) && Integer.valueOf(1).equals(result.get(20));
}`,
              },
              {
                id: "dispense-respects-loaded-counts",
                label: "never plans more bills of a denomination than are loaded",
                body: `java.util.Map<Integer, Integer> counts = new java.util.LinkedHashMap<Integer, Integer>();
counts.put(20, 5);
counts.put(50, 1);
CashDispenser dispenser = new CashDispenser("atm-2", counts);
java.util.Map<Integer, Integer> result = dispenser.dispense(110);
expectedText = "50s: 1, 20s: 3";
if (result == null) {
    actualText = "null instead of a breakdown";
    passed = false;
} else {
    actualText = "50s: " + result.get(50) + ", 20s: " + result.get(20);
    passed = Integer.valueOf(1).equals(result.get(50)) && Integer.valueOf(3).equals(result.get(20));
}`,
              },
              {
                id: "dispense-unmakeable-throws",
                label: "an amount the loaded bills cannot make fails loudly",
                body: `java.util.Map<Integer, Integer> counts = new java.util.LinkedHashMap<Integer, Integer>();
counts.put(50, 10);
CashDispenser dispenser = new CashDispenser("atm-3", counts);
expectedText = "IllegalStateException, 140 cannot be made from 50s only";
try {
    java.util.Map<Integer, Integer> result = dispenser.dispense(140);
    actualText = result == null ? "no exception, returned null" : "no exception, dispensed " + result;
    passed = false;
} catch (IllegalStateException expectedFailure) {
    actualText = "IllegalStateException, 140 cannot be made from 50s only";
    passed = true;
}`,
              },
              {
                id: "dispense-no-partial-mutation",
                label: "a failed dispense leaves every count untouched",
                body: `java.util.Map<Integer, Integer> counts = new java.util.LinkedHashMap<Integer, Integer>();
counts.put(50, 1);
counts.put(100, 1);
CashDispenser dispenser = new CashDispenser("atm-4", counts);
try {
    dispenser.dispense(170);
} catch (IllegalStateException expectedFailure) {
    // 170 cannot be made from 100 + 50; inventory must be untouched.
}
expectedText = "100s loaded: 1, 50s loaded: 1";
actualText = "100s loaded: " + dispenser.getCount(100) + ", 50s loaded: " + dispenser.getCount(50);
passed = dispenser.getCount(100) == 1 && dispenser.getCount(50) == 1;`,
              },
              {
                id: "dispense-deducts-inventory",
                label: "a successful dispense deducts the handed-out bills",
                body: `java.util.Map<Integer, Integer> counts = new java.util.LinkedHashMap<Integer, Integer>();
counts.put(20, 5);
CashDispenser dispenser = new CashDispenser("atm-5", counts);
java.util.Map<Integer, Integer> result = dispenser.dispense(60);
expectedText = "3 twenties dispensed, 2 still loaded";
if (result == null) {
    actualText = "null instead of a breakdown";
    passed = false;
} else {
    actualText = result.get(20) + " twenties dispensed, " + dispenser.getCount(20) + " still loaded";
    passed = Integer.valueOf(3).equals(result.get(20)) && dispenser.getCount(20) == 2;
}`,
              },
              {
                id: "dispense-never-over-requested",
                label: "refuses to round 50 up or down when only 20s are loaded",
                body: `java.util.Map<Integer, Integer> counts = new java.util.LinkedHashMap<Integer, Integer>();
counts.put(20, 5);
CashDispenser dispenser = new CashDispenser("atm-6", counts);
expectedText = "IllegalStateException, 50 cannot be made exactly from 20s";
try {
    java.util.Map<Integer, Integer> result = dispenser.dispense(50);
    int twenties = result == null || result.get(20) == null ? 0 : result.get(20).intValue();
    actualText = result == null ? "no exception, returned null" : "no exception, handed out " + (twenties * 20) + " instead";
    passed = false;
} catch (IllegalStateException expectedFailure) {
    actualText = "IllegalStateException, 50 cannot be made exactly from 20s";
    passed = true;
}`,
              },
            ],
          },
        },
      },
      {
        id: "m9",
        signature: "completeTransaction(): void",
        ownerId: "session",
        justification: "Transitioning to COMPLETE and ejecting the card is the last step of THIS session's own lifecycle, the same reasoning as Session owning every other state transition in the flow.",
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
        handling: "dispense() must check hasEnoughCash() as a single gate before mutating any denomination counts. If the exact amount can't be made from what's currently available, the whole withdrawal fails before a single bill is dispensed, not partway through.",
      },
      {
        scenario: "The bank's network call to confirm the debit times out after cash has already been physically dispensed.",
        handling: "The debit must be durably recorded BEFORE the physical dispense happens, not after. Transaction should only reach a DISPENSING status once the debit is confirmed, so a network failure after that point is a reconciliation problem, not cash handed out against no debit at all.",
      },
      {
        scenario: "A customer enters the wrong PIN three times in a row.",
        handling: "Card.isLocked() derives from failedAttempts, which lives on Card (not Session) specifically so the lockout persists across ATMs and across sessions. A blocked card stays blocked at every machine, not just the one it was entered wrong on.",
      },
      {
        scenario: "The customer walks away mid-transaction after cash has been dispensed but before taking it.",
        handling: "This is a Session-lifecycle concern, not a data-integrity one. Session should time out and eject the card automatically, but the Transaction itself is already complete since debit and dispense both already succeeded.",
      },
    ],
    tradeoffs: [
      {
        decision: "Session is a separate class from ATM instead of the state machine (idle → card inserted → PIN verified → dispensing) living directly on ATM.",
        reasoning: "ATM is the persistent, always-on hardware serving one customer after another; Session is the short-lived per-use state. Splitting it out means ATM barely changes between customers while Session is created and discarded per visit.",
      },
      {
        decision: "CashDispenser tracks per-denomination counts instead of ATM just holding a single totalCash number.",
        reasoning: "A single total can't answer 'can I actually make exactly $140.' The dispenser might have $500 loaded entirely in $50 bills and still be unable to dispense $140. Tracking counts per denomination is what makes dispense() and hasEnoughCash() correct.",
      },
      {
        decision: "Transaction is a separate class from the debit itself, instead of Account.debit() alone constituting the record of a withdrawal.",
        reasoning: "Same split as Parking Lot's Ticket/Payment. The balance mutation and the auditable record of what happened are different concerns with different lifecycles, so a Transaction can exist in a FAILED or PENDING state even when no debit ever actually happened.",
      },
    ],
    principles: [
      { name: "Single Responsibility Principle", explanation: "Card only knows card-level state (PIN, failed attempts). Account only knows balance. CashDispenser only knows physical bill inventory, and none of them reach into another's job to authorize or dispense." },
      { name: "Encapsulation", explanation: "Account.debit() is the only way balance changes. No other class reaches in and subtracts from balance directly, so it can never be corrupted by a caller that forgot to check funds first." },
      { name: "Separation of Concerns", explanation: "Authentication (Session/Card) is kept separate from money movement (Account/Transaction), which is kept separate from physical cash handling (CashDispenser). Three different failure modes that shouldn't tangle into one God-class ATM." },
      { name: "State pattern", explanation: "Session.state gates which actions are even valid. You can't verifyPin() before insertCard(), and you can't dispense before PIN verification succeeds. Encoding the flow as an explicit state field makes invalid sequences impossible by construction." },
    ],
  },
};
