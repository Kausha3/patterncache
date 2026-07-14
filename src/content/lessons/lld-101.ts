import type { LLDLesson } from "@/types";

/**
 * The LLD on-ramp — the equivalent of System Design 101, but for low-level
 * design. No prior OOP vocabulary assumed. Deliberately the smallest possible
 * example (one real class) so the Watch → Practice → Edge Cases mechanic can
 * be learned once, cleanly, before Parking Lot asks for the same reasoning
 * across six interacting classes. Skips the Clarify phase on purpose — that's
 * a different skill, already covered by "The Interview" — this lesson is
 * only about the four core words: class, object, property, method.
 */
export const lld101: LLDLesson = {
  id: "lld-101",
  track: "lld",
  title: "LLD Basics: Classes, Objects, and Responsibility",
  blurb: "Start here if you've never designed a class before — what a class actually is, in plain English.",
  estMinutes: 5,
  overview:
    "Before any of this makes sense, four words you'll see constantly: CLASS, OBJECT, PROPERTY, METHOD.\n\n" +
    "Think of a dog. \"Dog\" is the blueprint — the category. That's a CLASS. Your actual dog, the one asleep on the couch right now, is one real example of that blueprint — that's an OBJECT (or \"instance\"). Your dog's name and age are PROPERTIES — data it holds. Your dog can bark() — that's a METHOD, something it can DO.\n\n" +
    "Low-level design is this, over and over: look at a vague prompt, decide which real-world things deserve to be their own class, decide what data each one holds, and decide what each one can do. That's the whole game. Every multi-class system, every edge case, every trade-off in this app is the same four ideas applied more times, on more classes.\n\n" +
    "This lesson uses the smallest possible example — a single alarm clock — so you can watch that reasoning happen once, cleanly, before Parking Lot asks you to do it across six classes at once. No clarifying-questions phase here on purpose; that's a real interview skill worth its own lesson later. This one is just about the four words above.",
  design: {
    entities: [
      {
        id: "clock",
        name: "AlarmClock",
        isEntity: true,
        why: "The one real thing in this tiny system — it holds the current time, the alarm time, and whether it's ringing right now. That's a class: a real object with its own data and its own behavior.",
        properties: [
          { name: "currentTime", type: "Time" },
          { name: "alarmTime", type: "Time" },
          { name: "isAlarmSet", type: "boolean" },
          { name: "isRinging", type: "boolean" },
        ],
      },
      { id: "sound", name: "AlarmSound", isEntity: false, why: "Just an attribute the clock plays when it rings — a file reference, not a class with its own data or behavior. Giving it a full class would be over-engineering for what this system needs." },
      { id: "button", name: "Button", isEntity: false, why: "A physical input on the device, not part of the software's own domain model — pressing it just calls a method on AlarmClock, the same way a person calling a method isn't itself a class." },
      { id: "battery", name: "Battery", isEntity: false, why: "Power management nobody asked about — inventing scope the prompt never requested is a trap you'll see again in every lesson after this one." },
    ],
    methods: [
      {
        id: "m1",
        signature: "setAlarm(time): void",
        ownerId: "clock",
        justification: "AlarmClock owns the alarmTime field, so it's the only class that should be allowed to change it — this is the exact same idea as a ParkingSpot owning isOccupied, just with one class instead of six.",
      },
      {
        id: "m2",
        signature: "checkTime(): void",
        ownerId: "clock",
        justification: "Comparing currentTime to alarmTime and deciding whether to start ringing needs both pieces of data at once — AlarmClock is the only class holding both, so it's the only one that can make this call.",
      },
      {
        id: "m3",
        signature: "stopAlarm(): void",
        ownerId: "clock",
        justification: "Turning off isRinging is a state change on AlarmClock's own field — only the class that owns a piece of data should be the one changing it.",
      },
      {
        id: "m4",
        signature: "snooze(): void",
        ownerId: "clock",
        justification: "Snoozing pushes alarmTime forward and stops the current ring — both are AlarmClock's own fields, so the method that touches both lives there too.",
      },
    ],
    relationships: [],
    edgeCases: [
      {
        id: "already-ringing",
        scenario: "The alarm time arrives again while the clock is already ringing from a previous unstopped alarm.",
        options: [
          { id: "a", label: "checkTime() starts a second, overlapping ring on top of the first.", correct: false, feedback: "Two overlapping rings isn't a real state this device can be in — it's just a bug from not checking what's already true." },
          { id: "b", label: "checkTime() checks isRinging first and does nothing if it's already true.", correct: true, feedback: "Right — a method should always ask 'what's already true?' before changing state, not just blindly apply its action." },
          { id: "c", label: "checkTime() resets currentTime so the comparison no longer matches.", correct: false, feedback: "Never mutate a field you don't own the meaning of just to dodge a bug — currentTime should always reflect real time, nothing else." },
        ],
      },
      {
        id: "snooze-when-silent",
        scenario: "The user hits snooze, but no alarm is currently ringing.",
        options: [
          { id: "a", label: "snooze() sets a new alarmTime a few minutes from now even though nothing was ringing.", correct: false, feedback: "That invents a phantom alarm the user never actually asked for — snooze only makes sense as a reaction to an active ring." },
          { id: "b", label: "snooze() checks isRinging first and does nothing if it's false.", correct: true, feedback: "Same instinct as the last edge case — check what's already true before acting. A method with no valid state to act on should just be a no-op, not force something to happen." },
          { id: "c", label: "snooze() throws an error and crashes the app.", correct: false, feedback: "Crashing over a harmless button press is worse than doing nothing — reserve hard failures for situations that actually corrupt data." },
        ],
      },
    ],
    tradeoffs: [
      {
        decision: "One AlarmClock class holds everything — time, alarm, ringing state — instead of splitting a separate Alarm class out.",
        reasoning: "For a single alarm on one clock, a separate Alarm class adds a layer of indirection with nothing to show for it. If this device needed to support multiple alarms at once, splitting Alarm out would immediately become worth it — asking yourself 'would a real feature change my answer?' is a habit worth building from lesson one.",
      },
    ],
    principles: [
      {
        name: "Single Responsibility Principle",
        explanation: "AlarmClock is small enough that this feels obvious right now — one class, one clear job. That exact instinct is what keeps a six-class system from turning into spaghetti later.",
      },
      {
        name: "Encapsulation",
        explanation: "setAlarm(), stopAlarm(), and snooze() are the only ways to change AlarmClock's own fields — nothing reaches in and flips isRinging directly. You'll see this same idea protect a lot more in the next lesson.",
      },
    ],
  },
  recap: [
    "A class is a blueprint — the real-world thing that deserves its own data and behavior. Not every noun in a prompt earns one.",
    "A property is data the class holds (currentTime, isRinging). A method is something the class can DO (setAlarm(), stopAlarm()).",
    "Assign each method to the class that owns the data it touches — even in a one-class system, that instinct is the whole game.",
    "Next up: Parking Lot, where you'll do this exact same reasoning across six interacting classes instead of one.",
  ],
  relatedLessons: ["parking-lot"],
};
