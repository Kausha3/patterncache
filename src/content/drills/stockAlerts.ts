import type { ColdDrillPrompt } from "@/types";

// Compilable domain model shared by this drill's runnable Java exercise.
// Each string is a complete file; the exercise runner writes them next to
// the learner's class and compiles everything together in the browser.

const MONEY_JAVA = `public class Money {
    private final double amount;

    public Money(double amount) {
        this.amount = amount;
    }

    public double getAmount() { return amount; }
    public boolean isLessThan(Money other) { return amount < other.amount; }
    public boolean isLessThanOrEqual(Money other) { return amount <= other.amount; }
    public boolean isGreaterThan(Money other) { return amount > other.amount; }
    public boolean isGreaterThanOrEqual(Money other) { return amount >= other.amount; }
}
`;

const DATE_TIME_JAVA = `public class DateTime {
    private final long epochMillis;

    public DateTime(long epochMillis) {
        this.epochMillis = epochMillis;
    }

    public static DateTime now() {
        return new DateTime(System.currentTimeMillis());
    }

    public long getEpochMillis() { return epochMillis; }
}
`;

const ALERT_DIRECTION_JAVA = `public enum AlertDirection {
    ABOVE, BELOW;
}
`;

const ALERT_STATUS_JAVA = `public enum AlertStatus {
    ACTIVE, TRIGGERED, CANCELLED;
}
`;

export const stockAlerts: ColdDrillPrompt = {
  id: "stock-price-alerts",
  title: "Design a Stock Price Alert System",
  prompt: "Design a stock price alert system: users subscribe to a stock and get notified when it crosses a price threshold.",
  reference: {
    clarifyingQuestions: [
      {
        question: "Is this for a single stock, or does one user track many stocks with many alerts each?",
        why: "Decides whether Stock needs its own subscriber list at all, or whether a much simpler single-alert-per-user model would do. That pins down that PriceAlert must be its own class, not a field on User.",
      },
      {
        question: "Do alerts fire once and deactivate, or keep firing every time the price crosses the threshold again?",
        why: "Directly decides whether PriceAlert needs a status/lifecycle field at all, or whether onPriceUpdate() can just check-and-notify with no state to track.",
      },
      {
        question: "Is notification delivery (email/SMS/push) in scope, or just detecting that a threshold was crossed?",
        why: "Decides whether NotificationService exists as a class in the model at all, or whether 'notify' is out of scope entirely. Same scoping question every other lesson's payment/delivery clarify-Q asks.",
      },
      {
        question: "Does price data arrive as a real-time push feed, or does the system have to poll an external source?",
        why: "Changes who calls updatePrice() and how often, though it doesn't change the class model itself. Worth asking but not worth over-modeling around.",
      },
    ],
    entities: [
      {
        id: "stock",
        name: "Stock",
        isEntity: true,
        why: "The subject being observed. It owns its own current price and the list of alerts watching it, and nothing else should be able to reach in and fire someone else's alert.",
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
        why: "The observer. It reacts to a price update by checking its own threshold and direction, and Stock doesn't need to know what any given alert's condition even is.",
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
        why: "The person the notification actually reaches, a real participant even though little of the interesting logic lives on it.",
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
        why: "Delivering the actual notification (email/SMS/push) is a distinct concern from deciding an alert fired. Stock and PriceAlert shouldn't need to know how a message actually reaches a user.",
        properties: [{ name: "id", type: "string" }],
      },
      { id: "exchange", name: "StockExchange", isEntity: false, why: "An external data feed providing price ticks, not a class this system owns or models itself." },
      { id: "watchlist", name: "Watchlist", isEntity: false, why: "Just a UI-level grouping of a user's own PriceAlerts already modeled. Giving it its own class adds no new responsibility." },
      { id: "pricehistory", name: "PriceHistory", isEntity: false, why: "Nobody asked for historical charting, and inventing this scope adds complexity beyond what the prompt requested." },
    ],
    methods: [
      {
        id: "m1",
        signature: "updatePrice(newPrice): void",
        ownerId: "stock",
        justification: "Stock is the only class that knows when its own price actually changes, so it's the one responsible for telling every subscribed PriceAlert. The subject notifies, it doesn't wait to be asked, and that push instead of a poll is the core of Observer.",
        codeExercise: {
          language: "java",
          starter: "void updatePrice(Money newPrice) {\n    // your code here\n}",
          reference:
            "void updatePrice(Money newPrice) {\n    Money previousPrice = this.currentPrice;\n    this.currentPrice = newPrice;\n    for (PriceAlert alert : subscribers) {\n        alert.onPriceUpdate(previousPrice, newPrice);\n    }\n}",
          checklist: [
            "Updates currentPrice so the new price is actually recorded, not just passed through",
            "Notifies every subscriber, not just the first one",
            "Passes both the previous and new price to each alert, since a single new price alone can't tell an alert whether it just crossed the threshold or was already past it",
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
        justification: "Mirrors subscribe(). The class that owns the list is the only one that should remove from it.",
      },
      {
        id: "m4",
        signature: "onPriceUpdate(previousPrice, newPrice): void",
        ownerId: "pricealert",
        justification: "Each alert's own trigger condition (its threshold and direction) is private to that alert. Stock shouldn't need to know every alert's condition just to notify it, it just calls this and lets the alert decide for itself.",
        codeExercise: {
          language: "java",
          starter: "void onPriceUpdate(Money previousPrice, Money newPrice) {\n    // your code here\n}",
          reference:
            "void onPriceUpdate(Money previousPrice, Money newPrice) {\n    if (status != AlertStatus.ACTIVE) {\n        return;\n    }\n    boolean crossedAbove = direction == AlertDirection.ABOVE\n        && previousPrice.isLessThan(threshold)\n        && newPrice.isGreaterThanOrEqual(threshold);\n    boolean crossedBelow = direction == AlertDirection.BELOW\n        && previousPrice.isGreaterThan(threshold)\n        && newPrice.isLessThanOrEqual(threshold);\n    if (crossedAbove || crossedBelow) {\n        this.status = AlertStatus.TRIGGERED;\n        this.triggeredAt = DateTime.now();\n    }\n}",
          checklist: [
            "Ignores the update entirely if the alert isn't ACTIVE, since an already-triggered or cancelled alert doesn't re-fire",
            "Checks direction (ABOVE vs BELOW) against its own threshold, not just whether the price changed",
            "Detects an actual crossing (was on one side, now on the other) rather than just 'is the new price past the threshold'. Otherwise a price that starts already past the threshold would wrongly fire immediately",
            "Bonus (L5+, not required here): doesn't yet call NotificationService, since that hand-off happens outside this method",
          ],
          java: {
            editClassName: "PriceAlert",
            starterFile: `public class PriceAlert {
    private final String id;
    private final String userId;
    private final Money threshold;
    private final AlertDirection direction;
    private AlertStatus status;
    private DateTime triggeredAt;

    public PriceAlert(String id, String userId, Money threshold, AlertDirection direction) {
        this.id = id;
        this.userId = userId;
        this.threshold = threshold;
        this.direction = direction;
        this.status = AlertStatus.ACTIVE;
    }

    public String getId() { return id; }
    public String getUserId() { return userId; }
    public AlertStatus getStatus() { return status; }
    public DateTime getTriggeredAt() { return triggeredAt; }

    public void resetAlert() {
        this.status = AlertStatus.ACTIVE;
        this.triggeredAt = null;
    }

    public void onPriceUpdate(Money previousPrice, Money newPrice) {
        // Ignore anything but an ACTIVE alert, then fire only on a real
        // crossing in this alert's own direction: was on one side of the
        // threshold before, on (or past) it now.
    }
}
`,
            referenceFile: `public class PriceAlert {
    private final String id;
    private final String userId;
    private final Money threshold;
    private final AlertDirection direction;
    private AlertStatus status;
    private DateTime triggeredAt;

    public PriceAlert(String id, String userId, Money threshold, AlertDirection direction) {
        this.id = id;
        this.userId = userId;
        this.threshold = threshold;
        this.direction = direction;
        this.status = AlertStatus.ACTIVE;
    }

    public String getId() { return id; }
    public String getUserId() { return userId; }
    public AlertStatus getStatus() { return status; }
    public DateTime getTriggeredAt() { return triggeredAt; }

    public void resetAlert() {
        this.status = AlertStatus.ACTIVE;
        this.triggeredAt = null;
    }

    public void onPriceUpdate(Money previousPrice, Money newPrice) {
        if (status != AlertStatus.ACTIVE) {
            return;
        }
        boolean crossedAbove = direction == AlertDirection.ABOVE
            && previousPrice.isLessThan(threshold)
            && newPrice.isGreaterThanOrEqual(threshold);
        boolean crossedBelow = direction == AlertDirection.BELOW
            && previousPrice.isGreaterThan(threshold)
            && newPrice.isLessThanOrEqual(threshold);
        if (crossedAbove || crossedBelow) {
            this.status = AlertStatus.TRIGGERED;
            this.triggeredAt = DateTime.now();
        }
    }
}
`,
            support: [
              { className: "Money", source: MONEY_JAVA },
              { className: "DateTime", source: DATE_TIME_JAVA },
              { className: "AlertDirection", source: ALERT_DIRECTION_JAVA },
              { className: "AlertStatus", source: ALERT_STATUS_JAVA },
            ],
            tests: [
              {
                id: "crossing-above-triggers",
                label: "a price crossing up through the threshold triggers an ABOVE alert",
                body: `PriceAlert alert = new PriceAlert("a1", "u1", new Money(100.0), AlertDirection.ABOVE);
alert.onPriceUpdate(new Money(95.0), new Money(105.0));
expectedText = "status TRIGGERED with triggeredAt recorded";
actualText = "status " + alert.getStatus() + (alert.getTriggeredAt() == null ? " with no triggeredAt" : " with triggeredAt recorded");
passed = alert.getStatus() == AlertStatus.TRIGGERED && alert.getTriggeredAt() != null;`,
              },
              {
                id: "already-past-does-not-fire",
                label: "a price already past the threshold does not fire on every update",
                body: `PriceAlert alert = new PriceAlert("a1", "u1", new Money(100.0), AlertDirection.ABOVE);
alert.onPriceUpdate(new Money(105.0), new Money(112.0));
expectedText = "status ACTIVE, since 105 to 112 never crossed 100";
actualText = "status " + alert.getStatus();
passed = alert.getStatus() == AlertStatus.ACTIVE;`,
              },
              {
                id: "wrong-direction-ignored",
                label: "an ABOVE alert ignores a downward crossing",
                body: `PriceAlert alert = new PriceAlert("a1", "u1", new Money(100.0), AlertDirection.ABOVE);
alert.onPriceUpdate(new Money(108.0), new Money(92.0));
expectedText = "status ACTIVE, the price crossed the wrong way";
actualText = "status " + alert.getStatus();
passed = alert.getStatus() == AlertStatus.ACTIVE;`,
              },
              {
                id: "crossing-below-triggers",
                label: "a BELOW alert fires on a downward crossing, landing exactly on the threshold included",
                body: `PriceAlert alert = new PriceAlert("a1", "u1", new Money(50.0), AlertDirection.BELOW);
alert.onPriceUpdate(new Money(60.0), new Money(50.0));
expectedText = "status TRIGGERED";
actualText = "status " + alert.getStatus();
passed = alert.getStatus() == AlertStatus.TRIGGERED;`,
              },
              {
                id: "one-shot-until-reset",
                label: "a triggered alert does not re-fire when the price oscillates back across",
                body: `PriceAlert alert = new PriceAlert("a1", "u1", new Money(100.0), AlertDirection.ABOVE);
alert.onPriceUpdate(new Money(95.0), new Money(105.0));
DateTime firstTrigger = alert.getTriggeredAt();
alert.onPriceUpdate(new Money(105.0), new Money(96.0));
alert.onPriceUpdate(new Money(96.0), new Money(104.0));
expectedText = "still TRIGGERED from the first crossing only";
boolean refired = alert.getTriggeredAt() != firstTrigger;
actualText = alert.getStatus() != AlertStatus.TRIGGERED ? "status " + alert.getStatus() + ", the first crossing never triggered" : (refired ? "TRIGGERED, but it re-fired on the second crossing" : "still TRIGGERED from the first crossing only");
passed = alert.getStatus() == AlertStatus.TRIGGERED && !refired;`,
              },
              {
                id: "rearmed-after-reset",
                label: "an explicitly reset alert can fire again on a fresh crossing",
                body: `PriceAlert alert = new PriceAlert("a1", "u1", new Money(100.0), AlertDirection.ABOVE);
alert.onPriceUpdate(new Money(95.0), new Money(105.0));
alert.resetAlert();
alert.onPriceUpdate(new Money(98.0), new Money(101.0));
expectedText = "status TRIGGERED again after the reset";
actualText = "status " + alert.getStatus() + " after the reset and a fresh crossing";
passed = alert.getStatus() == AlertStatus.TRIGGERED;`,
              },
            ],
          },
        },
      },
      {
        id: "m5",
        signature: "resetAlert(): void",
        ownerId: "pricealert",
        justification: "Re-arming a triggered alert is a transition on this alert's own status field. Only PriceAlert should be the one to move itself back to ACTIVE.",
      },
      {
        id: "m6",
        signature: "send(user, message): boolean",
        ownerId: "notificationservice",
        justification: "Delivering a message is a distinct concern with its own failure modes (a bounced email, a down SMS provider). Bundling it into PriceAlert would mean delivery failures corrupt trigger-detection logic.",
      },
      {
        id: "m7",
        signature: "getContactInfo(): string",
        ownerId: "user",
        justification: "Contact info is data User itself holds, and a plain accessor belongs on the object whose field it's reading.",
      },
    ],
    relationships: ["Stock has many PriceAlerts (subscribers)", "PriceAlert references one Stock and one User (by userId)", "PriceAlert notifies via NotificationService when triggered"],
    edgeCases: [
      {
        scenario: "The same stock crosses its threshold twice in one day (price dips below then rises above again).",
        handling: "PriceAlert.status distinguishes ACTIVE from TRIGGERED. Once triggered it won't fire again until explicitly reset, so a single alert doesn't spam the user every time the price oscillates around the threshold.",
      },
      {
        scenario: "A user has multiple alerts on the same stock at different thresholds.",
        handling: "Stock.subscribers is a list, not a single reference. updatePrice() notifies every subscriber independently, since one alert triggering has no bearing on whether another alert's own threshold was crossed.",
      },
      {
        scenario: "Notification delivery fails (the user's email bounces or the SMS provider is down).",
        handling: "PriceAlert shouldn't flip to TRIGGERED only after a successful send without a plan for the failure case. Delivery failure needs to be tracked separately from the trigger condition, or a crossed threshold can silently be lost forever.",
      },
      {
        scenario: "The stock price update itself arrives out of order or duplicated (the same tick delivered twice).",
        handling: "updatePrice() compares against the last known price rather than treating every incoming tick as a fresh crossing. Otherwise a duplicated tick could double-fire an alert that already triggered once.",
      },
    ],
    tradeoffs: [
      {
        decision: "PriceAlert is a real class per (stock, user, threshold) triple instead of Stock holding a flat list of raw threshold numbers.",
        reasoning: "A raw list of numbers can't track direction, per-alert status, or which user owns which threshold. PriceAlert needs its own identity so the same stock can have many independent alerts with independent lifecycles.",
      },
      {
        decision: "NotificationService is separate from PriceAlert instead of PriceAlert calling an email/SMS API directly.",
        reasoning: "Delivery mechanics (which channel, retry policy, provider APIs) change independently of trigger-detection logic. Collapsing them means every new notification channel requires touching PriceAlert itself.",
      },
      {
        decision: "Stock pushes updates to subscribers (Observer) instead of PriceAlert polling Stock's price on some interval.",
        reasoning: "Polling means every alert checks price on its own schedule, which either wastes work checking when nothing changed or misses fast moves checking too infrequently. Pushing means an alert reacts the instant the price actually changes.",
      },
    ],
    principles: [
      {
        name: "Observer Pattern",
        explanation: "Stock (the subject) holds a list of PriceAlert (observers) and calls onPriceUpdate() on each one whenever its own price changes. Stock never asks 'has any alert triggered', it just tells every subscriber and lets each one decide for itself. That inversion, push instead of pull, is what makes this Observer rather than a plain method call.",
      },
      {
        name: "Single Responsibility Principle",
        explanation: "Stock only tracks price and its subscriber list. PriceAlert only tracks one condition and its own status. NotificationService only knows how to deliver a message. None of them do each other's job.",
      },
      {
        name: "Encapsulation",
        explanation: "PriceAlert.status only changes inside onPriceUpdate()/resetAlert(). No external caller reaches in and flips ACTIVE/TRIGGERED directly.",
      },
      {
        name: "Separation of Concerns",
        explanation: "Detecting that a threshold was crossed (PriceAlert) is kept apart from actually delivering a message (NotificationService). A delivery failure is a completely different failure mode than a wrong trigger condition.",
      },
    ],
  },
};
