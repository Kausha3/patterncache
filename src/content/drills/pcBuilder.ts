import type { ColdDrillPrompt } from "@/types";

// Compilable domain model shared by this drill's runnable Java exercise.
// Each string is a complete file; the exercise runner writes them next to
// the learner's class and compiles everything together in the browser.

const SOCKET_TYPE_JAVA = `public enum SocketType {
    AM5, LGA1700;
}
`;

const CPU_JAVA = `public class CPU {
    private final String name;
    private final SocketType socketType;
    private final int tdpWatts;

    public CPU(String name, SocketType socketType, int tdpWatts) {
        this.name = name;
        this.socketType = socketType;
        this.tdpWatts = tdpWatts;
    }

    public String getName() { return name; }
    public SocketType getSocketType() { return socketType; }
    public int getTdpWatts() { return tdpWatts; }
}
`;

const MOTHERBOARD_JAVA = `public class Motherboard {
    private final String name;
    private final SocketType socketType;

    public Motherboard(String name, SocketType socketType) {
        this.name = name;
        this.socketType = socketType;
    }

    public String getName() { return name; }
    public SocketType getSocketType() { return socketType; }
}
`;

const GPU_JAVA = `public class GPU {
    private final String name;
    private final int tdpWatts;

    public GPU(String name, int tdpWatts) {
        this.name = name;
        this.tdpWatts = tdpWatts;
    }

    public String getName() { return name; }
    public int getTdpWatts() { return tdpWatts; }
}
`;

const PSU_JAVA = `public class PSU {
    private final String name;
    private final int wattageRating;

    public PSU(String name, int wattageRating) {
        this.name = name;
        this.wattageRating = wattageRating;
    }

    public String getName() { return name; }
    public int getWattageRating() { return wattageRating; }
}
`;

// The finished, immutable spec build() produces: no setters on purpose.
const PC_BUILD_JAVA = `public class PCBuild {
    private final CPU cpu;
    private final Motherboard motherboard;
    private final GPU gpu;
    private final PSU psu;
    private final int ramGb;
    private final int storageGb;
    private final int totalPowerDrawWatts;

    public PCBuild(CPU cpu, Motherboard motherboard, GPU gpu, PSU psu, int ramGb, int storageGb, int totalPowerDrawWatts) {
        this.cpu = cpu;
        this.motherboard = motherboard;
        this.gpu = gpu;
        this.psu = psu;
        this.ramGb = ramGb;
        this.storageGb = storageGb;
        this.totalPowerDrawWatts = totalPowerDrawWatts;
    }

    public CPU getCpu() { return cpu; }
    public Motherboard getMotherboard() { return motherboard; }
    public GPU getGpu() { return gpu; }
    public PSU getPsu() { return psu; }
    public int getRamGb() { return ramGb; }
    public int getStorageGb() { return storageGb; }
    public int getTotalPowerDrawWatts() { return totalPowerDrawWatts; }
}
`;

export const pcBuilder: ColdDrillPrompt = {
  id: "pc-builder",
  title: "Design a Custom PC Builder",
  prompt:
    "Design a custom PC / computer builder where a customer picks components (CPU, GPU, RAM, storage, PSU) step by step and the system validates compatibility before final purchase.",
  reference: {
    clarifyingQuestions: [
      {
        question: "Do we need to validate compatibility incrementally as each component is picked, or only at final build() time?",
        why: "Decides whether selectCpu()/selectMotherboard() themselves need validation logic, or whether all checking can be deferred to one place in build(). It's a real structural choice about where the invariant lives.",
      },
      {
        question: "Is this a single build session per customer, or do we need to support saving a partial build and resuming later?",
        why: "Resuming later means PCBuilder itself needs to be persisted with an id and reloaded. A stateless one-shot session needs no such persistence layer at all.",
      },
      {
        question: "Do we need to support pre-built bundles/presets, or is every build fully custom component-by-component?",
        why: "Presets would need a separate PresetConfiguration entity that pre-fills a PCBuilder. Without that scope, PCBuilder only ever starts empty.",
      },
      {
        question: "Is pricing/total cost in scope, or just compatibility validation?",
        why: "Pricing-in-scope means every component needs a price field and PCBuild needs a calculateTotalPrice(). Same scoping question as whether Payment is in scope in the Parking Lot lesson.",
      },
    ],
    entities: [
      {
        id: "pcbuilder",
        name: "PCBuilder",
        isEntity: true,
        why: "The in-progress, mutable accumulation of the customer's choices. Exists only during the build session, and is nothing but selection methods plus the validation that guards them.",
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
        why: "Has a socket type that must physically match the motherboard, and a power draw that feeds directly into the PSU wattage check. Real compatibility-relevant data, not just a label.",
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
        why: "Has its own socket type that either matches or rejects whatever CPU is chosen. That's the other half of the socket-compatibility check.",
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
        why: "Contributes its own power draw to the total wattage budget the PSU has to cover. Same reason CPU carries a tdpWatts field.",
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
        why: "Has a wattage rating that must cover the CPU+GPU's combined draw. It's the class the whole power-budget check is actually about.",
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
        why: "The finished, immutable spec produced only once build() succeeds. It's a completely different lifecycle from PCBuilder, which is why it's a separate class instead of PCBuilder just marking itself 'done'.",
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
      { id: "cart", name: "ShoppingCart", isEntity: false, why: "A separate checkout/payment concern once build() succeeds. Nobody asked for purchasing flow, only compatibility validation." },
      {
        id: "checker",
        name: "CompatibilityChecker",
        isEntity: false,
        why: "Tempting to model as its own class, but the compatibility checks only ever need data PCBuilder already holds about its own selections. Pulling that logic into a separate class would just move a method sideways with no new state or reuse to justify it.",
      },
    ],
    methods: [
      { id: "m1", signature: "selectCpu(cpu): void", ownerId: "pcbuilder", justification: "Recording the chosen CPU is PCBuilder's own accumulation step, the same incremental-state-gathering role every selectX() method plays." },
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
            "Bonus (L5+, not required here): if a CPU is selected AFTER an incompatible motherboard, selectCpu() needs the same reverse check. This exercise only covers one direction",
          ],
        },
      },
      { id: "m3", signature: "selectGpu(gpu): void", ownerId: "pcbuilder", justification: "Same accumulation role as selectCpu(). GPU has no socket constraint to check here, only a power draw that matters later at build()." },
      { id: "m4", signature: "selectPsu(psu): void", ownerId: "pcbuilder", justification: "Same accumulation role as the other selectX() methods. The wattage check is deferred to build(), once every draw-contributing component is known." },
      { id: "m5", signature: "selectRam(ramGb): void", ownerId: "pcbuilder", justification: "RAM has no compatibility rule modeled in this scope, so this is a plain field assignment, the same reasoning that kept RAM as an int instead of its own class." },
      { id: "m6", signature: "selectStorage(storageGb): void", ownerId: "pcbuilder", justification: "Same reasoning as selectRam(). No compatibility constraint modeled, so nothing beyond recording the choice belongs here." },
      { id: "m7", signature: "checkCompatibility(): boolean", ownerId: "pcbuilder", justification: "A pure query over PCBuilder's own already-selected components (socket match, wattage budget). Kept separate from build() so the customer's UI can show a live compatibility signal before they even try to finalize." },
      {
        id: "m8",
        signature: "build(): PCBuild",
        ownerId: "pcbuilder",
        justification: "build() is the one moment PCBuilder commits its accumulated, mutable choices into a final, immutable PCBuild. That's the defining Builder-pattern moment: construct only when explicitly asked, never before.",
        codeExercise: {
          language: "java",
          starter: "PCBuild build() {\n    // your code here\n}",
          reference:
            "PCBuild build() {\n    if (selectedCpu == null || selectedMotherboard == null || selectedGpu == null || selectedPsu == null) {\n        throw new IllegalStateException(\"Cannot build - required components are missing\");\n    }\n    int totalDraw = selectedCpu.getTdpWatts() + selectedGpu.getTdpWatts();\n    if (selectedPsu.getWattageRating() < totalDraw) {\n        throw new IllegalStateException(\"Selected PSU cannot supply enough wattage for this build\");\n    }\n    return new PCBuild(selectedCpu, selectedMotherboard, selectedGpu, selectedPsu, ramGb, storageGb, totalDraw);\n}",
          checklist: [
            "Rejects build() if any required component (CPU, motherboard, GPU, PSU) hasn't been selected yet",
            "Sums CPU + GPU wattage draw and checks it against the selected PSU's rating before allowing the build",
            "Fails loudly (exception) rather than returning a partially-valid PCBuild",
            "Bonus (L5+, not required here): a real build might budget wattage headroom (e.g. require the PSU rated 20% above draw) rather than an exact threshold. This exercise uses an exact comparison",
          ],
          java: {
            editClassName: "PCBuilder",
            starterFile: `public class PCBuilder {
    private CPU selectedCpu;
    private Motherboard selectedMotherboard;
    private GPU selectedGpu;
    private PSU selectedPsu;
    private int ramGb;
    private int storageGb;

    public void selectCpu(CPU cpu) { this.selectedCpu = cpu; }

    public void selectMotherboard(Motherboard motherboard) {
        if (selectedCpu != null && selectedCpu.getSocketType() != motherboard.getSocketType()) {
            throw new IllegalStateException("Motherboard socket does not match already-selected CPU socket");
        }
        this.selectedMotherboard = motherboard;
    }

    public void selectGpu(GPU gpu) { this.selectedGpu = gpu; }
    public void selectPsu(PSU psu) { this.selectedPsu = psu; }
    public void selectRam(int ramGb) { this.ramGb = ramGb; }
    public void selectStorage(int storageGb) { this.storageGb = storageGb; }

    public PCBuild build() {
        // Reject a build with any required component missing, check the PSU
        // covers the CPU+GPU draw, then commit everything into a PCBuild.
        return null;
    }
}
`,
            referenceFile: `public class PCBuilder {
    private CPU selectedCpu;
    private Motherboard selectedMotherboard;
    private GPU selectedGpu;
    private PSU selectedPsu;
    private int ramGb;
    private int storageGb;

    public void selectCpu(CPU cpu) { this.selectedCpu = cpu; }

    public void selectMotherboard(Motherboard motherboard) {
        if (selectedCpu != null && selectedCpu.getSocketType() != motherboard.getSocketType()) {
            throw new IllegalStateException("Motherboard socket does not match already-selected CPU socket");
        }
        this.selectedMotherboard = motherboard;
    }

    public void selectGpu(GPU gpu) { this.selectedGpu = gpu; }
    public void selectPsu(PSU psu) { this.selectedPsu = psu; }
    public void selectRam(int ramGb) { this.ramGb = ramGb; }
    public void selectStorage(int storageGb) { this.storageGb = storageGb; }

    public PCBuild build() {
        if (selectedCpu == null || selectedMotherboard == null || selectedGpu == null || selectedPsu == null) {
            throw new IllegalStateException("Cannot build - required components are missing");
        }
        int totalDraw = selectedCpu.getTdpWatts() + selectedGpu.getTdpWatts();
        if (selectedPsu.getWattageRating() < totalDraw) {
            throw new IllegalStateException("Selected PSU cannot supply enough wattage for this build");
        }
        return new PCBuild(selectedCpu, selectedMotherboard, selectedGpu, selectedPsu, ramGb, storageGb, totalDraw);
    }
}
`,
            support: [
              { className: "SocketType", source: SOCKET_TYPE_JAVA },
              { className: "CPU", source: CPU_JAVA },
              { className: "Motherboard", source: MOTHERBOARD_JAVA },
              { className: "GPU", source: GPU_JAVA },
              { className: "PSU", source: PSU_JAVA },
              { className: "PCBuild", source: PC_BUILD_JAVA },
            ],
            tests: [
              {
                id: "complete-build",
                label: "a fully selected, compatible rig builds with the right total draw",
                body: `PCBuilder builder = new PCBuilder();
builder.selectCpu(new CPU("Ryzen 7", SocketType.AM5, 105));
builder.selectMotherboard(new Motherboard("B650 Tomahawk", SocketType.AM5));
builder.selectGpu(new GPU("RTX 4070", 200));
builder.selectPsu(new PSU("750W Gold", 750));
builder.selectRam(32);
builder.selectStorage(2000);
PCBuild built = builder.build();
expectedText = "a PCBuild drawing 305 watts";
actualText = built == null ? "null, no build produced" : "a PCBuild drawing " + built.getTotalPowerDrawWatts() + " watts";
passed = built != null && built.getTotalPowerDrawWatts() == 305;`,
              },
              {
                id: "carries-selections",
                label: "the returned PCBuild carries exactly what was selected",
                body: `PCBuilder builder = new PCBuilder();
CPU cpu = new CPU("Ryzen 7", SocketType.AM5, 105);
builder.selectCpu(cpu);
builder.selectMotherboard(new Motherboard("B650 Tomahawk", SocketType.AM5));
builder.selectGpu(new GPU("RTX 4070", 200));
builder.selectPsu(new PSU("750W Gold", 750));
builder.selectRam(32);
builder.selectStorage(1000);
PCBuild built = builder.build();
expectedText = "the selected CPU, 32 GB RAM, 1000 GB storage";
actualText = built == null ? "null, no build produced" : (built.getCpu() == cpu ? "the selected CPU, " : "a different CPU, ") + built.getRamGb() + " GB RAM, " + built.getStorageGb() + " GB storage";
passed = built != null && built.getCpu() == cpu && built.getRamGb() == 32 && built.getStorageGb() == 1000;`,
              },
              {
                id: "missing-cpu-rejected",
                label: "build() with no CPU selected fails loudly",
                body: `PCBuilder builder = new PCBuilder();
builder.selectMotherboard(new Motherboard("B650 Tomahawk", SocketType.AM5));
builder.selectGpu(new GPU("RTX 4070", 200));
builder.selectPsu(new PSU("750W Gold", 750));
expectedText = "IllegalStateException, required components are missing";
try {
    PCBuild built = builder.build();
    actualText = built == null ? "no exception, build() just returned null" : "no exception, a PCBuild was produced without a CPU";
    passed = false;
} catch (IllegalStateException expectedFailure) {
    actualText = "IllegalStateException, required components are missing";
    passed = true;
}`,
              },
              {
                id: "missing-psu-rejected",
                label: "build() with no PSU selected fails loudly instead of crashing on the wattage check",
                body: `PCBuilder builder = new PCBuilder();
builder.selectCpu(new CPU("Ryzen 7", SocketType.AM5, 105));
builder.selectMotherboard(new Motherboard("B650 Tomahawk", SocketType.AM5));
builder.selectGpu(new GPU("RTX 4070", 200));
expectedText = "IllegalStateException, required components are missing";
try {
    PCBuild built = builder.build();
    actualText = built == null ? "no exception, build() just returned null" : "no exception, a PCBuild was produced without a PSU";
    passed = false;
} catch (IllegalStateException expectedFailure) {
    actualText = "IllegalStateException, required components are missing";
    passed = true;
}`,
              },
              {
                id: "underpowered-psu-rejected",
                label: "a PSU rated below the CPU+GPU draw fails the build",
                body: `PCBuilder builder = new PCBuilder();
builder.selectCpu(new CPU("i9-13900K", SocketType.LGA1700, 253));
builder.selectMotherboard(new Motherboard("Z790 Hero", SocketType.LGA1700));
builder.selectGpu(new GPU("RTX 4090", 450));
builder.selectPsu(new PSU("650W Bronze", 650));
expectedText = "IllegalStateException, a 650W PSU cannot cover a 703W draw";
try {
    PCBuild built = builder.build();
    actualText = built == null ? "no exception, build() just returned null" : "no exception, an underpowered build was produced";
    passed = false;
} catch (IllegalStateException expectedFailure) {
    actualText = "IllegalStateException, a 650W PSU cannot cover a 703W draw";
    passed = true;
}`,
              },
              {
                id: "exact-wattage-builds",
                label: "a PSU rated exactly at the total draw is enough",
                body: `PCBuilder builder = new PCBuilder();
builder.selectCpu(new CPU("Ryzen 7", SocketType.AM5, 105));
builder.selectMotherboard(new Motherboard("B650 Tomahawk", SocketType.AM5));
builder.selectGpu(new GPU("RTX 4060", 245));
builder.selectPsu(new PSU("350W", 350));
PCBuild built = builder.build();
expectedText = "a PCBuild drawing 350 watts";
actualText = built == null ? "null, no build produced" : "a PCBuild drawing " + built.getTotalPowerDrawWatts() + " watts";
passed = built != null && built.getTotalPowerDrawWatts() == 350;`,
              },
            ],
          },
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
        handling: "build() must check every required component is non-null before doing anything else. Same 'fail before you commit' shape as ParkingLot rejecting entry before a Ticket is ever issued.",
      },
      {
        scenario: "The customer selects a CPU on one socket type, then picks a motherboard with a different socket.",
        handling: "selectMotherboard() must check socket compatibility against whatever CPU is already selected and reject immediately, rather than letting an invalid pair sit unnoticed until build() finally checks.",
      },
      {
        scenario: "The customer picks a low-wattage PSU after already selecting a power-hungry CPU and GPU.",
        handling: "build() computes total draw from CPU+GPU and compares it against the selected PSU's rating. That catches the problem at build() time rather than producing a PCBuild that would never actually power on.",
      },
      {
        scenario: "The customer changes their CPU choice after already selecting a compatible motherboard.",
        handling: "selectCpu() needs the same reverse compatibility check as selectMotherboard(). Swapping in a new CPU with a different socket should reject the change (or invalidate the motherboard choice), not silently leave an incompatible pair in place.",
      },
    ],
    tradeoffs: [
      {
        decision: "PCBuilder is a separate class from PCBuild, the final product it returns.",
        reasoning: "Splits the in-progress, mutable accumulation of choices from the finished, immutable spec. Same shape as this app's Session/ATM split. PCBuild never needs setters once built, and PCBuilder is nothing but setters and validation.",
      },
      {
        decision: "Compatibility validation lives inside PCBuilder itself instead of a separate CompatibilityChecker class.",
        reasoning: "The checks only ever need data PCBuilder already holds about its own selections. Extracting a separate validator class would just move a method sideways with no new state or reuse to justify it.",
      },
      {
        decision: "RAM and storage are plain int fields (ramGb, storageGb) instead of their own RAMModule/StorageDevice classes.",
        reasoning: "Nothing in this system's compatibility rules depends on RAM or storage specifics (no slot-count or speed-matching modeled). Giving them full class treatment would add ceremony with no behavior attached to it.",
      },
    ],
    principles: [
      {
        name: "Builder Pattern",
        explanation: "PCBuilder accumulates optional component choices across separate method calls (selectCpu(), selectGpu(), ...) and only produces the final, immutable PCBuild when build() is explicitly called. Construction happens step by step instead of one large constructor demanding every component upfront.",
      },
      { name: "Single Responsibility Principle", explanation: "PCBuilder only accumulates and validates selections. PCBuild only holds the finished spec, and neither reaches into the other's job." },
      { name: "Encapsulation", explanation: "selectedCpu, selectedMotherboard, and the rest only change through their own selectX() methods, which are also the only places compatibility gets checked. Nothing bypasses them to set a component directly." },
      { name: "Fail fast", explanation: "Catching a socket mismatch the moment an incompatible motherboard is selected, rather than waiting until build(), gives the customer immediate feedback instead of a late, confusing rejection after several more steps." },
    ],
  },
};
