import type { ColdDrillPrompt } from "@/types";

// Compilable domain model shared by this drill's runnable Java exercises.
// Each string is a complete file; the exercise runner writes them next to
// the learner's class and compiles everything together in the browser.
// Money is integer cents throughout, so split math never touches floating
// point except where the reference itself does (percentages).

const USER_JAVA = `public class User {
    private final String id;
    private final String name;

    public User(String id, String name) {
        this.id = id;
        this.name = name;
    }

    public String getId() { return id; }
    public String getName() { return name; }
}
`;

const MONEY_JAVA = `public class Money {
    private final long cents;

    private Money(long cents) {
        this.cents = cents;
    }

    public static Money zero() { return new Money(0); }
    public static Money ofCents(long cents) { return new Money(cents); }

    public long getCents() { return cents; }
    public Money add(Money other) { return new Money(cents + other.cents); }
    public Money subtract(Money other) { return new Money(cents - other.cents); }
    public Money divide(int by) { return new Money(cents / by); }
    public Money multiply(double factor) { return new Money(Math.round(cents * factor)); }
    public Money abs() { return new Money(Math.abs(cents)); }
    public Money negate() { return new Money(-cents); }
    public boolean isGreaterThan(Money other) { return cents > other.cents; }
    public boolean isLessThan(Money other) { return cents < other.cents; }
    public int compareTo(Money other) { return Long.compare(cents, other.cents); }

    @Override
    public boolean equals(Object other) {
        if (!(other instanceof Money)) {
            return false;
        }
        return cents == ((Money) other).cents;
    }

    @Override
    public int hashCode() {
        return Long.valueOf(cents).hashCode();
    }
}
`;

const SPLIT_TYPE_JAVA = `public enum SplitType {
    EQUAL, EXACT, PERCENTAGE;
}
`;

const SPLIT_JAVA = `public class Split {
    private final User user;
    private final Money amountOwed;

    public Split(User user, Money amountOwed) {
        this.user = user;
        this.amountOwed = amountOwed;
    }

    public User getUser() { return user; }
    public Money getAmountOwed() { return amountOwed; }
}
`;

const SETTLEMENT_JAVA = `public class Settlement {
    private final User fromUser;
    private final User toUser;
    private final Money amount;
    private final long timestamp;

    private Settlement(User fromUser, User toUser, Money amount, long timestamp) {
        this.fromUser = fromUser;
        this.toUser = toUser;
        this.amount = amount;
        this.timestamp = timestamp;
    }

    public static Settlement create(User fromUser, User toUser, Money amount) {
        return new Settlement(fromUser, toUser, amount, System.currentTimeMillis());
    }

    public User getFromUser() { return fromUser; }
    public User getToUser() { return toUser; }
    public Money getAmount() { return amount; }
    public long getTimestamp() { return timestamp; }
}
`;

// The full Expense with split math implemented. It is both the reference file
// for the calculateSplits exercise and the support Expense for simplifyDebts.
// EXACT splitValues are amounts in cents; PERCENTAGE splitValues are percents.
const EXPENSE_REFERENCE_JAVA = `import java.util.ArrayList;
import java.util.List;
import java.util.Map;

public class Expense {
    private final String id;
    private final String description;
    private final Money amount;
    private final User paidBy;
    private final List<User> participants;
    private final SplitType splitType;
    private final Map<String, Double> splitValues;

    public Expense(String id, String description, Money amount, User paidBy,
                   List<User> participants, SplitType splitType, Map<String, Double> splitValues) {
        this.id = id;
        this.description = description;
        this.amount = amount;
        this.paidBy = paidBy;
        this.participants = participants;
        this.splitType = splitType;
        this.splitValues = splitValues;
    }

    public String getId() { return id; }
    public String getDescription() { return description; }
    public Money getAmount() { return amount; }
    public User getPaidBy() { return paidBy; }
    public List<User> getParticipants() { return participants; }

    public List<Split> calculateSplits() {
        List<Split> result = new ArrayList<Split>();
        if (splitType == SplitType.EQUAL) {
            Money share = amount.divide(participants.size());
            for (User user : participants) {
                result.add(new Split(user, share));
            }
        } else if (splitType == SplitType.EXACT) {
            Money total = Money.zero();
            for (User user : participants) {
                Money owed = Money.ofCents(Math.round(splitValues.get(user.getId())));
                result.add(new Split(user, owed));
                total = total.add(owed);
            }
            if (!total.equals(amount)) {
                throw new IllegalArgumentException("Exact splits do not sum to the expense amount");
            }
        } else if (splitType == SplitType.PERCENTAGE) {
            double totalPercent = 0;
            for (User user : participants) {
                double percent = splitValues.get(user.getId());
                totalPercent += percent;
                result.add(new Split(user, amount.multiply(percent / 100.0)));
            }
            if (Math.abs(totalPercent - 100.0) > 0.01) {
                throw new IllegalArgumentException("Percentages do not sum to 100");
            }
        }
        return result;
    }
}
`;

export const splitwise: ColdDrillPrompt = {
  id: "splitwise",
  title: "Design an Expense-Sharing App (Splitwise)",
  prompt: "Design an expense-sharing app like Splitwise, where friends split shared expenses and settle up later.",
  reference: {
    clarifyingQuestions: [
      {
        question: "Is this single-currency, or do different expenses need different currencies?",
        why: "Multi-currency means Money needs a currency field plus conversion logic before any net-balance math is even possible. Single-currency keeps Money a plain amount.",
      },
      {
        question: "Is settling up (actually recording a payment) in scope, or just tracking who owes whom?",
        why: "Decides whether Settlement exists as a class at all. Balance-tracking-only drops the whole settle-up flow and its own history.",
      },
      {
        question: "Can more than one person pay for a single expense (e.g. splitting the bill upfront), or is there always exactly one payer per expense?",
        why: "Multiple payers would mean Expense needs a list of (payer, amountPaid) pairs instead of one paidBy field. That's a real structural fork, not a detail.",
      },
      {
        question: "Is this scoped to one group at a time, or does a user's balance span every group and every friend they've ever split an expense with?",
        why: "A single-group scope keeps computeNetBalances() bounded to one Group's own expenses. A cross-group 'net balance with this friend everywhere' feature needs a User-centric aggregation across every Group they're in.",
      },
    ],
    entities: [
      {
        id: "user",
        name: "User",
        isEntity: true,
        why: "A real participant with an identity that persists across many groups and many expenses. Everything else in this model hangs off of who owes whom.",
        properties: [
          { name: "id", type: "string" },
          { name: "name", type: "string" },
        ],
      },
      {
        id: "group",
        name: "Group",
        isEntity: true,
        why: "The aggregate root for one shared context. It owns its members, its expenses, and its settlement history, the same coordinator role ParkingLot plays over Levels.",
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
        why: "One shared cost: who paid, how much, and how it's split among participants. The split logic depends entirely on data this class already holds.",
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
        why: "One person's share of one expense. It has its own identity separate from a raw number, the same reasoning as OrderItem being its own class instead of a bare quantity field.",
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
        why: "The auditable record of an actual payment between two users. It exists independently of whatever the current computed balance says, the same 'proof of the transaction' role Parking Lot's Ticket plays.",
        properties: [
          { name: "id", type: "string" },
          { name: "fromUser", type: "User" },
          { name: "toUser", type: "User" },
          { name: "amount", type: "Money" },
          { name: "timestamp", type: "DateTime" },
        ],
      },
      { id: "currency", name: "Currency", isEntity: false, why: "A value Money already carries as a field, not a class with its own behavior. Modeling it separately adds a class for no new responsibility." },
      { id: "notification", name: "Notification", isEntity: false, why: "A byproduct of a new expense or settlement, a message sent elsewhere, not a class with its own responsibilities in this domain model." },
      { id: "receipt", name: "Receipt", isEntity: false, why: "An attachment/photo on an Expense, not a class with independent behavior. Storage is an infrastructure concern, not a modeling one." },
    ],
    methods: [
      { id: "m1", signature: "addMember(user): void", ownerId: "group", justification: "Group owns its own members list; nothing else should be able to reach in and mutate it directly." },
      { id: "m2", signature: "addExpense(expense): void", ownerId: "group", justification: "Group owns its own expenses list, the same reasoning as Order owning its own OrderItems." },
      {
        id: "m3",
        signature: "calculateSplits(): List<Split>",
        ownerId: "expense",
        justification: "Expense holds its own amount, splitType, and participants. It's the class with the data to compute each person's share, without Group needing to know anything about split math.",
        codeExercise: {
          language: "java",
          starter: "List<Split> calculateSplits() {\n    // your code here\n}",
          reference:
            "List<Split> calculateSplits() {\n    List<Split> result = new ArrayList<>();\n    if (splitType == SplitType.EQUAL) {\n        Money share = amount.divide(participants.size());\n        for (User user : participants) {\n            result.add(new Split(user, share));\n        }\n    } else if (splitType == SplitType.EXACT) {\n        Money total = Money.zero();\n        for (User user : participants) {\n            Money owed = splitValues.get(user.getId());\n            result.add(new Split(user, owed));\n            total = total.add(owed);\n        }\n        if (!total.equals(amount)) {\n            throw new IllegalArgumentException(\"Exact splits do not sum to the expense amount\");\n        }\n    } else if (splitType == SplitType.PERCENTAGE) {\n        double totalPercent = 0;\n        for (User user : participants) {\n            double percent = splitValues.get(user.getId());\n            totalPercent += percent;\n            result.add(new Split(user, amount.multiply(percent / 100.0)));\n        }\n        if (Math.abs(totalPercent - 100.0) > 0.01) {\n            throw new IllegalArgumentException(\"Percentages do not sum to 100\");\n        }\n    }\n    return result;\n}",
          checklist: [
            "Handles all three split types (EQUAL, EXACT, PERCENTAGE), not just one",
            "Validates that EXACT splits sum to the expense's total amount, and PERCENTAGE splits sum to 100, rejecting a malformed split before creating any Split objects",
            "For EQUAL splits, divides evenly among every participant, not just everyone except the payer",
            "Bonus (L5+, not required here): equal splits that don't divide evenly (e.g. $10 / 3 people) need a remainder-distribution rule rather than silently losing or gaining a cent",
          ],
          java: {
            editClassName: "Expense",
            starterFile: `import java.util.ArrayList;
import java.util.List;
import java.util.Map;

public class Expense {
    private final String id;
    private final String description;
    private final Money amount;
    private final User paidBy;
    private final List<User> participants;
    private final SplitType splitType;
    private final Map<String, Double> splitValues;

    public Expense(String id, String description, Money amount, User paidBy,
                   List<User> participants, SplitType splitType, Map<String, Double> splitValues) {
        this.id = id;
        this.description = description;
        this.amount = amount;
        this.paidBy = paidBy;
        this.participants = participants;
        this.splitType = splitType;
        this.splitValues = splitValues;
    }

    public String getId() { return id; }
    public String getDescription() { return description; }
    public Money getAmount() { return amount; }
    public User getPaidBy() { return paidBy; }
    public List<User> getParticipants() { return participants; }

    public List<Split> calculateSplits() {
        // Branch on splitType. EQUAL divides amount by participants.size()
        // (the reference's Money.divide truncates). EXACT reads each share in
        // cents from splitValues and the shares must sum to amount.
        // PERCENTAGE reads percents that must total 100. Reject a malformed
        // EXACT or PERCENTAGE split with IllegalArgumentException.
        return new ArrayList<Split>();
    }
}
`,
            referenceFile: EXPENSE_REFERENCE_JAVA,
            support: [
              { className: "User", source: USER_JAVA },
              { className: "Money", source: MONEY_JAVA },
              { className: "SplitType", source: SPLIT_TYPE_JAVA },
              { className: "Split", source: SPLIT_JAVA },
            ],
            tests: [
              {
                id: "equal-split-even",
                label: "an even EQUAL split gives every participant, payer included, the same share",
                body: `User alice = new User("a", "Alice");
User bob = new User("b", "Bob");
User cara = new User("c", "Cara");
Expense dinner = new Expense("e1", "Dinner", Money.ofCents(6000), alice,
    java.util.Arrays.asList(alice, bob, cara), SplitType.EQUAL, new java.util.HashMap<String, Double>());
java.util.List<Split> splits = dinner.calculateSplits();
expectedText = "3 splits of 2000 cents each, payer included, summing to 6000";
if (splits == null) {
    actualText = "calculateSplits returned null";
    passed = false;
} else if (splits.size() != 3) {
    actualText = splits.size() + " splits";
    passed = false;
} else {
    boolean allEqual = true;
    boolean payerIncluded = false;
    long sum = 0;
    for (Split split : splits) {
        if (split == null || split.getAmountOwed() == null || split.getUser() == null) { allEqual = false; continue; }
        if (split.getAmountOwed().getCents() != 2000) { allEqual = false; }
        if (split.getUser().getId().equals("a")) { payerIncluded = true; }
        sum += split.getAmountOwed().getCents();
    }
    actualText = splits.size() + " splits summing to " + sum + " cents" + (payerIncluded ? ", payer included" : ", payer missing");
    passed = allEqual && payerIncluded && sum == 6000;
}`,
              },
              {
                id: "equal-split-remainder",
                label: "1000 cents across 3 people follows the reference's truncating divide",
                body: `User alice = new User("a", "Alice");
User bob = new User("b", "Bob");
User cara = new User("c", "Cara");
Expense taxi = new Expense("e2", "Taxi", Money.ofCents(1000), alice,
    java.util.Arrays.asList(alice, bob, cara), SplitType.EQUAL, new java.util.HashMap<String, Double>());
java.util.List<Split> splits = taxi.calculateSplits();
expectedText = "3 equal shares of 333 cents (the reference's divide truncates; the lost cent is the named L5+ bonus)";
if (splits == null || splits.size() != 3) {
    actualText = splits == null ? "calculateSplits returned null" : splits.size() + " splits";
    passed = false;
} else {
    boolean allTruncated = true;
    for (Split split : splits) {
        if (split == null || split.getAmountOwed() == null || split.getAmountOwed().getCents() != 333) { allTruncated = false; }
    }
    Split sample = splits.get(0);
    long sampleCents = (sample == null || sample.getAmountOwed() == null) ? -1 : sample.getAmountOwed().getCents();
    actualText = "3 shares of " + sampleCents + " cents";
    passed = allTruncated;
}`,
              },
              {
                id: "exact-split-valid",
                label: "EXACT shares that sum to the total come back per person",
                body: `User alice = new User("a", "Alice");
User bob = new User("b", "Bob");
java.util.Map<String, Double> shares = new java.util.HashMap<String, Double>();
shares.put("a", 2000.0);
shares.put("b", 3000.0);
Expense hotel = new Expense("e3", "Hotel", Money.ofCents(5000), alice,
    java.util.Arrays.asList(alice, bob), SplitType.EXACT, shares);
java.util.List<Split> splits = hotel.calculateSplits();
expectedText = "Alice owes 2000 cents and Bob owes 3000 cents";
long aliceOwes = -1;
long bobOwes = -1;
if (splits != null) {
    for (Split split : splits) {
        if (split == null || split.getUser() == null || split.getAmountOwed() == null) { continue; }
        if (split.getUser().getId().equals("a")) { aliceOwes = split.getAmountOwed().getCents(); }
        if (split.getUser().getId().equals("b")) { bobOwes = split.getAmountOwed().getCents(); }
    }
}
if (splits == null) {
    actualText = "calculateSplits returned null";
} else {
    actualText = "Alice owes " + aliceOwes + " cents and Bob owes " + bobOwes + " cents";
}
passed = aliceOwes == 2000 && bobOwes == 3000;`,
              },
              {
                id: "exact-must-sum",
                label: "EXACT shares that miss the total are rejected outright",
                body: `User alice = new User("a", "Alice");
User bob = new User("b", "Bob");
java.util.Map<String, Double> shares = new java.util.HashMap<String, Double>();
shares.put("a", 2000.0);
shares.put("b", 2000.0);
Expense damaged = new Expense("e4", "Dinner", Money.ofCents(5000), alice,
    java.util.Arrays.asList(alice, bob), SplitType.EXACT, shares);
expectedText = "IllegalArgumentException, the missing 1000 cents belong to nobody";
try {
    java.util.List<Split> splits = damaged.calculateSplits();
    actualText = "no exception, the malformed split produced " + (splits == null ? 0 : splits.size()) + " splits";
    passed = false;
} catch (IllegalArgumentException expectedFailure) {
    actualText = "IllegalArgumentException, the missing 1000 cents belong to nobody";
    passed = true;
}`,
              },
              {
                id: "percentage-split",
                label: "a 25/75 PERCENTAGE split of 8000 cents yields 2000 and 6000",
                body: `User alice = new User("a", "Alice");
User bob = new User("b", "Bob");
java.util.Map<String, Double> percents = new java.util.HashMap<String, Double>();
percents.put("a", 25.0);
percents.put("b", 75.0);
Expense tickets = new Expense("e5", "Tickets", Money.ofCents(8000), alice,
    java.util.Arrays.asList(alice, bob), SplitType.PERCENTAGE, percents);
java.util.List<Split> splits = tickets.calculateSplits();
expectedText = "Alice owes 2000 cents and Bob owes 6000 cents, together the full 8000";
long aliceOwes = -1;
long bobOwes = -1;
if (splits != null) {
    for (Split split : splits) {
        if (split == null || split.getUser() == null || split.getAmountOwed() == null) { continue; }
        if (split.getUser().getId().equals("a")) { aliceOwes = split.getAmountOwed().getCents(); }
        if (split.getUser().getId().equals("b")) { bobOwes = split.getAmountOwed().getCents(); }
    }
}
if (splits == null) {
    actualText = "calculateSplits returned null";
} else {
    actualText = "Alice owes " + aliceOwes + " cents and Bob owes " + bobOwes + " cents";
}
passed = aliceOwes == 2000 && bobOwes == 6000;`,
              },
              {
                id: "percentage-must-total-100",
                label: "percentages that do not add up to 100 are rejected outright",
                body: `User alice = new User("a", "Alice");
User bob = new User("b", "Bob");
java.util.Map<String, Double> percents = new java.util.HashMap<String, Double>();
percents.put("a", 40.0);
percents.put("b", 40.0);
Expense damaged = new Expense("e6", "Groceries", Money.ofCents(5000), alice,
    java.util.Arrays.asList(alice, bob), SplitType.PERCENTAGE, percents);
expectedText = "IllegalArgumentException, 40 + 40 leaves a fifth of the bill unowned";
try {
    java.util.List<Split> splits = damaged.calculateSplits();
    actualText = "no exception, the malformed split produced " + (splits == null ? 0 : splits.size()) + " splits";
    passed = false;
} catch (IllegalArgumentException expectedFailure) {
    actualText = "IllegalArgumentException, 40 + 40 leaves a fifth of the bill unowned";
    passed = true;
}`,
              },
            ],
          },
        },
      },
      { id: "m4", signature: "computeNetBalances(): Map<String, Money>", ownerId: "group", justification: "Only Group can see every Expense and Settlement at once. Deriving each member's net balance requires that whole-group view, which no single Expense or User has." },
      {
        id: "m5",
        signature: "simplifyDebts(): List<Settlement>",
        ownerId: "group",
        justification: "Minimizing settlement transactions requires the same whole-group view computeNetBalances() already needs. Group is the only class positioned to run the matching algorithm across every member's net balance.",
        codeExercise: {
          language: "java",
          starter: "List<Settlement> simplifyDebts() {\n    // your code here\n}",
          reference:
            "List<Settlement> simplifyDebts() {\n    Map<String, Money> balances = computeNetBalances();\n    List<Settlement> settlements = new ArrayList<>();\n\n    PriorityQueue<Map.Entry<String, Money>> creditors =\n        new PriorityQueue<>((a, b) -> b.getValue().compareTo(a.getValue()));\n    PriorityQueue<Map.Entry<String, Money>> debtors =\n        new PriorityQueue<>((a, b) -> a.getValue().compareTo(b.getValue()));\n\n    for (Map.Entry<String, Money> entry : balances.entrySet()) {\n        if (entry.getValue().isGreaterThan(Money.zero())) {\n            creditors.add(entry);\n        } else if (entry.getValue().isLessThan(Money.zero())) {\n            debtors.add(entry);\n        }\n    }\n\n    while (!creditors.isEmpty() && !debtors.isEmpty()) {\n        Map.Entry<String, Money> creditor = creditors.poll();\n        Map.Entry<String, Money> debtor = debtors.poll();\n\n        Money owed = creditor.getValue();\n        Money owedBack = debtor.getValue().abs();\n        Money settleAmount = owed.isLessThan(owedBack) ? owed : owedBack;\n\n        settlements.add(Settlement.create(getUserById(debtor.getKey()), getUserById(creditor.getKey()), settleAmount));\n\n        Money creditorRemaining = owed.subtract(settleAmount);\n        Money debtorRemaining = owedBack.subtract(settleAmount);\n\n        if (creditorRemaining.isGreaterThan(Money.zero())) {\n            creditors.add(Map.entry(creditor.getKey(), creditorRemaining));\n        }\n        if (debtorRemaining.isGreaterThan(Money.zero())) {\n            debtors.add(Map.entry(debtor.getKey(), debtorRemaining.negate()));\n        }\n    }\n\n    return settlements;\n}",
          checklist: [
            "Computes NET balances first (per person, across all expenses) rather than settling each pairwise debt individually, so a 3-person debt cycle should net to zero settlements, not three",
            "Repeatedly matches the CURRENT largest creditor with the CURRENT largest debtor, not the first pair found or a fixed order",
            "Settles the smaller of the two amounts each round, so at least one side reaches exactly zero and drops out of contention",
            "Bonus (L5+, not required here): this greedy approach bounds the transaction count at n-1 for n people with nonzero balance and works well in practice, but it is NOT formally proven to find the mathematically fewest possible transactions in every case. Naming that nuance out loud is itself a strong interview signal",
          ],
          java: {
            editClassName: "Group",
            starterFile: `import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class Group {
    private final String id;
    private final String name;
    private final List<User> members = new ArrayList<User>();
    private final List<Expense> expenses = new ArrayList<Expense>();
    private final List<Settlement> settlements = new ArrayList<Settlement>();

    public Group(String id, String name) {
        this.id = id;
        this.name = name;
    }

    public void addMember(User user) { members.add(user); }
    public void addExpense(Expense expense) { expenses.add(expense); }
    public void recordSettlement(Settlement settlement) { settlements.add(settlement); }

    public User getUserById(String userId) {
        for (User user : members) {
            if (user.getId().equals(userId)) {
                return user;
            }
        }
        return null;
    }

    public Map<String, Money> computeNetBalances() {
        Map<String, Money> balances = new HashMap<String, Money>();
        for (User member : members) {
            balances.put(member.getId(), Money.zero());
        }
        for (Expense expense : expenses) {
            String payerId = expense.getPaidBy().getId();
            balances.put(payerId, balances.get(payerId).add(expense.getAmount()));
            for (Split split : expense.calculateSplits()) {
                String userId = split.getUser().getId();
                balances.put(userId, balances.get(userId).subtract(split.getAmountOwed()));
            }
        }
        for (Settlement settlement : settlements) {
            String fromId = settlement.getFromUser().getId();
            String toId = settlement.getToUser().getId();
            balances.put(fromId, balances.get(fromId).add(settlement.getAmount()));
            balances.put(toId, balances.get(toId).subtract(settlement.getAmount()));
        }
        return balances;
    }

    public List<Settlement> simplifyDebts() {
        // Start from computeNetBalances(). Repeatedly match the current
        // largest creditor with the current largest debtor, settle the
        // smaller of the two amounts (Settlement.create(debtor, creditor,
        // amount)), and put whichever side still has a balance back in
        // contention. Return the settlements in the order created.
        return new ArrayList<Settlement>();
    }
}
`,
            referenceFile: `import java.util.AbstractMap;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.PriorityQueue;

public class Group {
    private final String id;
    private final String name;
    private final List<User> members = new ArrayList<User>();
    private final List<Expense> expenses = new ArrayList<Expense>();
    private final List<Settlement> settlements = new ArrayList<Settlement>();

    public Group(String id, String name) {
        this.id = id;
        this.name = name;
    }

    public void addMember(User user) { members.add(user); }
    public void addExpense(Expense expense) { expenses.add(expense); }
    public void recordSettlement(Settlement settlement) { settlements.add(settlement); }

    public User getUserById(String userId) {
        for (User user : members) {
            if (user.getId().equals(userId)) {
                return user;
            }
        }
        return null;
    }

    public Map<String, Money> computeNetBalances() {
        Map<String, Money> balances = new HashMap<String, Money>();
        for (User member : members) {
            balances.put(member.getId(), Money.zero());
        }
        for (Expense expense : expenses) {
            String payerId = expense.getPaidBy().getId();
            balances.put(payerId, balances.get(payerId).add(expense.getAmount()));
            for (Split split : expense.calculateSplits()) {
                String userId = split.getUser().getId();
                balances.put(userId, balances.get(userId).subtract(split.getAmountOwed()));
            }
        }
        for (Settlement settlement : settlements) {
            String fromId = settlement.getFromUser().getId();
            String toId = settlement.getToUser().getId();
            balances.put(fromId, balances.get(fromId).add(settlement.getAmount()));
            balances.put(toId, balances.get(toId).subtract(settlement.getAmount()));
        }
        return balances;
    }

    public List<Settlement> simplifyDebts() {
        Map<String, Money> balances = computeNetBalances();
        List<Settlement> plan = new ArrayList<Settlement>();

        PriorityQueue<Map.Entry<String, Money>> creditors =
            new PriorityQueue<Map.Entry<String, Money>>((a, b) -> b.getValue().compareTo(a.getValue()));
        PriorityQueue<Map.Entry<String, Money>> debtors =
            new PriorityQueue<Map.Entry<String, Money>>((a, b) -> a.getValue().compareTo(b.getValue()));

        for (Map.Entry<String, Money> entry : balances.entrySet()) {
            if (entry.getValue().isGreaterThan(Money.zero())) {
                creditors.add(entry);
            } else if (entry.getValue().isLessThan(Money.zero())) {
                debtors.add(entry);
            }
        }

        while (!creditors.isEmpty() && !debtors.isEmpty()) {
            Map.Entry<String, Money> creditor = creditors.poll();
            Map.Entry<String, Money> debtor = debtors.poll();

            Money owed = creditor.getValue();
            Money owedBack = debtor.getValue().abs();
            Money settleAmount = owed.isLessThan(owedBack) ? owed : owedBack;

            plan.add(Settlement.create(getUserById(debtor.getKey()), getUserById(creditor.getKey()), settleAmount));

            Money creditorRemaining = owed.subtract(settleAmount);
            Money debtorRemaining = owedBack.subtract(settleAmount);

            if (creditorRemaining.isGreaterThan(Money.zero())) {
                creditors.add(new AbstractMap.SimpleEntry<String, Money>(creditor.getKey(), creditorRemaining));
            }
            if (debtorRemaining.isGreaterThan(Money.zero())) {
                debtors.add(new AbstractMap.SimpleEntry<String, Money>(debtor.getKey(), debtorRemaining.negate()));
            }
        }

        return plan;
    }
}
`,
            support: [
              { className: "User", source: USER_JAVA },
              { className: "Money", source: MONEY_JAVA },
              { className: "SplitType", source: SPLIT_TYPE_JAVA },
              { className: "Split", source: SPLIT_JAVA },
              { className: "Settlement", source: SETTLEMENT_JAVA },
              { className: "Expense", source: EXPENSE_REFERENCE_JAVA },
            ],
            tests: [
              {
                id: "single-debt-direction",
                label: "one shared dinner becomes exactly one debtor-to-creditor settlement",
                body: `Group trip = new Group("g1", "Trip");
User alice = new User("a", "Alice");
User bob = new User("b", "Bob");
trip.addMember(alice);
trip.addMember(bob);
trip.addExpense(new Expense("e1", "Dinner", Money.ofCents(3000), alice,
    java.util.Arrays.asList(alice, bob), SplitType.EQUAL, new java.util.HashMap<String, Double>()));
java.util.List<Settlement> plan = trip.simplifyDebts();
expectedText = "1 settlement: Bob pays Alice 1500 cents";
if (plan == null || plan.size() != 1) {
    actualText = plan == null ? "null settlement list" : plan.size() + " settlements";
    passed = false;
} else {
    Settlement only = plan.get(0);
    boolean shaped = only != null && only.getFromUser() != null && only.getToUser() != null && only.getAmount() != null;
    if (!shaped) {
        actualText = "a settlement with missing fields";
        passed = false;
    } else {
        actualText = "1 settlement: " + only.getFromUser().getName() + " pays " + only.getToUser().getName() + " " + only.getAmount().getCents() + " cents";
        passed = only.getFromUser().getId().equals("b") && only.getToUser().getId().equals("a") && only.getAmount().getCents() == 1500;
    }
}`,
              },
              {
                id: "cycle-nets-to-zero",
                label: "a three-person debt cycle produces zero settlements, not three",
                body: `Group trip = new Group("g1", "Trip");
User alice = new User("a", "Alice");
User bob = new User("b", "Bob");
User cara = new User("c", "Cara");
trip.addMember(alice);
trip.addMember(bob);
trip.addMember(cara);
java.util.Map<String, Double> owesB = new java.util.HashMap<String, Double>();
owesB.put("b", 1000.0);
trip.addExpense(new Expense("e1", "Leg one", Money.ofCents(1000), alice,
    java.util.Arrays.asList(bob), SplitType.EXACT, owesB));
java.util.Map<String, Double> owesC = new java.util.HashMap<String, Double>();
owesC.put("c", 1000.0);
trip.addExpense(new Expense("e2", "Leg two", Money.ofCents(1000), bob,
    java.util.Arrays.asList(cara), SplitType.EXACT, owesC));
java.util.Map<String, Double> owesA = new java.util.HashMap<String, Double>();
owesA.put("a", 1000.0);
trip.addExpense(new Expense("e3", "Leg three", Money.ofCents(1000), cara,
    java.util.Arrays.asList(alice), SplitType.EXACT, owesA));
java.util.List<Settlement> plan = trip.simplifyDebts();
expectedText = "0 settlements, every net balance is already zero";
actualText = plan == null ? "null settlement list" : plan.size() + " settlements";
passed = plan != null && plan.size() == 0;`,
              },
              {
                id: "conserves-net-balances",
                label: "the settlements exactly discharge every member's net balance",
                body: `Group trip = new Group("g1", "Trip");
User alice = new User("a", "Alice");
User bob = new User("b", "Bob");
User cara = new User("c", "Cara");
trip.addMember(alice);
trip.addMember(bob);
trip.addMember(cara);
trip.addExpense(new Expense("e1", "Cabin", Money.ofCents(9000), alice,
    java.util.Arrays.asList(alice, bob, cara), SplitType.EQUAL, new java.util.HashMap<String, Double>()));
trip.addExpense(new Expense("e2", "Fuel", Money.ofCents(3000), bob,
    java.util.Arrays.asList(bob, cara), SplitType.EQUAL, new java.util.HashMap<String, Double>()));
java.util.Map<String, Money> before = trip.computeNetBalances();
java.util.List<Settlement> plan = trip.simplifyDebts();
java.util.Map<String, Long> remaining = new java.util.HashMap<String, Long>();
for (java.util.Map.Entry<String, Money> entry : before.entrySet()) {
    remaining.put(entry.getKey(), entry.getValue().getCents());
}
boolean shaped = plan != null;
if (plan != null) {
    for (Settlement step : plan) {
        if (step == null || step.getFromUser() == null || step.getToUser() == null || step.getAmount() == null) { shaped = false; break; }
        Long fromBalance = remaining.get(step.getFromUser().getId());
        Long toBalance = remaining.get(step.getToUser().getId());
        if (fromBalance == null || toBalance == null) { shaped = false; break; }
        remaining.put(step.getFromUser().getId(), fromBalance.longValue() + step.getAmount().getCents());
        remaining.put(step.getToUser().getId(), toBalance.longValue() - step.getAmount().getCents());
    }
}
long leftover = 0;
for (Long value : remaining.values()) {
    leftover += Math.abs(value.longValue());
}
expectedText = "every member nets to zero after at most 2 settlements";
if (plan == null) {
    actualText = "null settlement list";
} else if (!shaped) {
    actualText = "a settlement referenced a missing user or amount";
} else {
    actualText = plan.size() + " settlements leaving " + leftover + " cents unbalanced";
}
passed = shaped && plan != null && plan.size() <= 2 && leftover == 0;`,
              },
              {
                id: "bounded-by-n-minus-1",
                label: "4 people with nonzero balances settle in at most 3 transactions",
                body: `Group trip = new Group("g1", "Trip");
User alice = new User("a", "Alice");
User bob = new User("b", "Bob");
User cara = new User("c", "Cara");
User dev = new User("d", "Dev");
trip.addMember(alice);
trip.addMember(bob);
trip.addMember(cara);
trip.addMember(dev);
trip.addExpense(new Expense("e1", "House", Money.ofCents(8000), alice,
    java.util.Arrays.asList(alice, bob, cara, dev), SplitType.EQUAL, new java.util.HashMap<String, Double>()));
java.util.Map<String, Money> before = trip.computeNetBalances();
java.util.List<Settlement> plan = trip.simplifyDebts();
java.util.Map<String, Long> remaining = new java.util.HashMap<String, Long>();
for (java.util.Map.Entry<String, Money> entry : before.entrySet()) {
    remaining.put(entry.getKey(), entry.getValue().getCents());
}
boolean shaped = plan != null;
if (plan != null) {
    for (Settlement step : plan) {
        if (step == null || step.getFromUser() == null || step.getToUser() == null || step.getAmount() == null) { shaped = false; break; }
        Long fromBalance = remaining.get(step.getFromUser().getId());
        Long toBalance = remaining.get(step.getToUser().getId());
        if (fromBalance == null || toBalance == null) { shaped = false; break; }
        remaining.put(step.getFromUser().getId(), fromBalance.longValue() + step.getAmount().getCents());
        remaining.put(step.getToUser().getId(), toBalance.longValue() - step.getAmount().getCents());
    }
}
long leftover = 0;
for (Long value : remaining.values()) {
    leftover += Math.abs(value.longValue());
}
expectedText = "all four members net to zero in at most 3 settlements";
if (plan == null) {
    actualText = "null settlement list";
} else if (!shaped) {
    actualText = "a settlement referenced a missing user or amount";
} else {
    actualText = plan.size() + " settlements leaving " + leftover + " cents unbalanced";
}
passed = shaped && plan != null && plan.size() >= 1 && plan.size() <= 3 && leftover == 0;`,
              },
              {
                id: "recorded-settlement-counts",
                label: "a debt already settled up produces no further settlements",
                body: `Group trip = new Group("g1", "Trip");
User alice = new User("a", "Alice");
User bob = new User("b", "Bob");
trip.addMember(alice);
trip.addMember(bob);
trip.addExpense(new Expense("e1", "Dinner", Money.ofCents(3000), alice,
    java.util.Arrays.asList(alice, bob), SplitType.EQUAL, new java.util.HashMap<String, Double>()));
trip.recordSettlement(Settlement.create(bob, alice, Money.ofCents(1500)));
java.util.List<Settlement> plan = trip.simplifyDebts();
expectedText = "0 settlements, Bob already paid Alice back";
actualText = plan == null ? "null settlement list" : plan.size() + " settlements";
passed = plan != null && plan.size() == 0;`,
              },
            ],
          },
        },
      },
      { id: "m6", signature: "create(fromUser, toUser, amount): Settlement", ownerId: "settlement", justification: "Creating a Settlement is its own constructor-style responsibility. It's the class that knows what fields a valid settlement record needs, the same shape as Parking Lot's Ticket.issue()." },
      { id: "m7", signature: "recordSettlement(settlement): void", ownerId: "group", justification: "Group owns its own settlements list. Recording one changes what the next computeNetBalances() call will return, so only Group should be the one appending to it." },
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
        handling: "Group can't just remove them from members. computeNetBalances() and simplifyDebts() still need their historical Expenses and any unresolved balance, so leaving a group should be a status/flag, not a deletion.",
      },
      {
        scenario: "A three-person cycle of debts: A owes B $10 on one expense, B owes C $10 on another, C owes A $10 on a third.",
        handling: "Net balance for A, B, and C each come out to exactly zero once every expense is summed, so simplifyDebts() should produce zero settlements here, not three pairwise ones. This is the entire point of computing net balances before matching.",
      },
      {
        scenario: "Two group members settle up in cash outside the app, but only one of them records the Settlement.",
        handling: "Settlement recorded unilaterally by one side risks erasing a debt the other party never agreed was paid. Worth raising in an interview as an extension (a pending/confirmed status) even if out of scope for the base design.",
      },
    ],
    tradeoffs: [
      {
        decision: "computeNetBalances() derives balances fresh from Expenses and Settlements every time, instead of storing a persistent balance that's incrementally updated.",
        reasoning: "A stored balance that must be kept in sync with every new Expense or Settlement is a classic source of drift bugs. Deriving it fresh from the source-of-truth history means it can never silently disagree with what actually happened, at the cost of recomputing it on demand.",
      },
      {
        decision: "Split is its own class instead of Expense holding a flat Map<User, Money>.",
        reasoning: "Costs one more class, but gives each person's share its own identity. That's useful the moment a Split needs anything beyond a raw number, without Expense itself needing to change shape.",
      },
      {
        decision: "Settlement is a separate auditable record instead of simplifyDebts() directly mutating some stored balance field.",
        reasoning: "Same split as every other transactional system in this app. Settlement is the record of an actual transfer, and recomputing computeNetBalances() afterward (now including the new Settlement) is what reflects it, rather than two pieces of state that could drift apart.",
      },
    ],
    principles: [
      { name: "Single Responsibility Principle", explanation: "Expense only knows how to split its own amount by its own splitType, and Group only knows how to aggregate balances and match settlements across the Expenses and Settlements it owns. Neither reaches into the other's math." },
      { name: "Encapsulation", explanation: "Group.addExpense() and addMember() are the only ways those lists grow. Nothing else reaches in and appends to them directly, which matters here specifically because computeNetBalances() has to trust that list is complete." },
      { name: "Strategy Pattern", explanation: "Expense.calculateSplits() branches on splitType (EQUAL/EXACT/PERCENTAGE), the same shape as Discount/Coupon System's DiscountRule.apply(), though here it's a branch inside one method rather than a polymorphic class per type. A fuller version would extract each split type into its own SplitStrategy if an interviewer pushes on extensibility." },
      { name: "Derived state over stored state", explanation: "computeNetBalances() is always computed from the Expense/Settlement history, never stored and incrementally updated, so it can never disagree with what actually happened, unlike a cached balance field that has to be kept in sync by every mutation." },
    ],
  },
};
