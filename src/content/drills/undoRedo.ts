import type { ColdDrillPrompt } from "@/types";

// Compilable domain model shared by this drill's runnable Java exercises.
// Each string is a complete file; the exercise runner writes them next to
// the learner's class and compiles everything together in the browser.

const COMMAND_JAVA = `public interface Command {
    void execute();
    void undo();
}
`;

const DOCUMENT_JAVA = `public class Document {
    private final String id;
    private String content;

    public Document(String id, String content) {
        this.id = id;
        this.content = content;
    }

    public String getId() { return id; }
    public String getContent() { return content; }

    public void insertText(int position, String text) {
        content = content.substring(0, position) + text + content.substring(position);
    }

    public String deleteText(int position, int length) {
        String removed = content.substring(position, position + length);
        content = content.substring(0, position) + content.substring(position + length);
        return removed;
    }
}
`;

const INSERT_TEXT_COMMAND_JAVA = `public class InsertTextCommand implements Command {
    private final Document document;
    private final int position;
    private final String insertedText;

    public InsertTextCommand(Document document, int position, String insertedText) {
        this.document = document;
        this.position = position;
        this.insertedText = insertedText;
    }

    public void execute() {
        document.insertText(position, insertedText);
    }

    public void undo() {
        document.deleteText(position, insertedText.length());
    }
}
`;

const DELETE_TEXT_COMMAND_JAVA = `public class DeleteTextCommand implements Command {
    private final Document document;
    private final int position;
    private final int length;
    private String deletedText;

    public DeleteTextCommand(Document document, int position, int length) {
        this.document = document;
        this.position = position;
        this.length = length;
    }

    public void execute() {
        deletedText = document.deleteText(position, length);
    }

    public void undo() {
        document.insertText(position, deletedText);
    }
}
`;

// The fully-implemented CommandHistory: the reference file for both
// exercises. Each exercise's starter stubs exactly one of its methods.
const COMMAND_HISTORY_REFERENCE_JAVA = `import java.util.ArrayDeque;
import java.util.Deque;

public class CommandHistory {
    private final Deque<Command> undoStack = new ArrayDeque<Command>();
    private final Deque<Command> redoStack = new ArrayDeque<Command>();

    public void executeCommand(Command command) {
        command.execute();
        undoStack.push(command);
        redoStack.clear();
    }

    public void undo() {
        if (undoStack.isEmpty()) {
            return;
        }
        Command command = undoStack.pop();
        command.undo();
        redoStack.push(command);
    }

    public void redo() {
        if (redoStack.isEmpty()) {
            return;
        }
        Command command = redoStack.pop();
        command.execute();
        undoStack.push(command);
    }
}
`;

const UNDO_REDO_SUPPORT = [
  { className: "Command", source: COMMAND_JAVA },
  { className: "Document", source: DOCUMENT_JAVA },
  { className: "InsertTextCommand", source: INSERT_TEXT_COMMAND_JAVA },
  { className: "DeleteTextCommand", source: DELETE_TEXT_COMMAND_JAVA },
];

export const undoRedo: ColdDrillPrompt = {
  id: "undo-redo",
  title: "Design Undo/Redo for a Text Editor",
  prompt: "Design an undo/redo system for a text editor: a sequence of edit actions that can be undone and redone.",
  reference: {
    clarifyingQuestions: [
      {
        question: "Is the undo history bounded (a fixed number of steps) or unlimited?",
        why: "Decides whether CommandHistory needs an eviction policy on its undo stack (e.g. dropping the oldest entry) or can just grow unbounded. Changes whether the stack needs a max-size field at all.",
      },
      {
        question: "Do actions need to be grouped into one undoable unit (e.g. pasting 10 characters undoes as one step), or is every keystroke its own undo step?",
        why: "Decides whether commands are created per-keystroke or batched. Changes how many command objects exist and what one undo() actually reverses.",
      },
      {
        question: "Does undo/redo need to survive the app closing and reopening, or is it fine if history resets each session?",
        why: "Decides whether CommandHistory's stacks need to be serializable, or can just live in memory for the process lifetime.",
      },
      {
        question: "Is this single-user, or does it need to handle two people editing the same document at once?",
        why: "Multi-user collaborative undo (whose action gets undone if edits interleave) is a materially harder L5+ problem needing operational transforms or CRDTs. Single-user keeps the undo/redo stacks a clean LIFO pair.",
      },
    ],
    entities: [
      {
        id: "document",
        name: "Document",
        isEntity: true,
        why: "The receiver whose actual text content changes. Every command's execute()/undo() ultimately calls back into this class to mutate or restore content.",
        properties: [
          { name: "id", type: "string" },
          { name: "content", type: "string" },
        ],
      },
      {
        id: "inserttextcommand",
        name: "InsertTextCommand",
        isEntity: true,
        why: "One concrete Command. It knows how to insert text into the Document (execute()) and how to reverse that exact insertion (undo()). Implements the same execute()/undo() contract as every other command, which is what lets CommandHistory treat any command interchangeably.",
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
        why: "The other concrete Command. It must capture what it actually deleted at execute() time, since by the time undo() runs later, the document has already changed shape and can't tell you what used to be there.",
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
        why: "Owns the undo and redo stacks and sequences commands forward and backward. It's a cross-cutting concern kept separate from Document, so Document only has to know how to hold text, not how to remember what happened to it.",
        properties: [
          { name: "id", type: "string" },
          { name: "undoStack", type: "List<Command>" },
          { name: "redoStack", type: "List<Command>" },
        ],
      },
      { id: "keystroke", name: "Keystroke", isEntity: false, why: "A raw input event, not itself a Command. It's the trigger that causes an InsertTextCommand to be created, not a command with its own execute()/undo()." },
      { id: "cursor", name: "Cursor", isEntity: false, why: "Tracks where typing happens, a separate concern from what changed. Nobody asked for cursor-position undo, so modeling it here is scope nobody requested." },
      { id: "clipboard", name: "Clipboard", isEntity: false, why: "Copy/paste is its own separate feature, and it's out of scope unless the interviewer specifically asks for it." },
    ],
    methods: [
      {
        id: "m1",
        signature: "insertText(position, text): void",
        ownerId: "document",
        justification: "Document owns content, so it's the only class that should mutate its own text. A Command should never reach in and manipulate the string directly.",
      },
      {
        id: "m2",
        signature: "deleteText(position, length): string",
        ownerId: "document",
        justification: "Same reasoning as insertText. Document is the only class allowed to change content, and returning the removed substring is what lets the calling command remember what it deleted.",
      },
      {
        id: "m3",
        signature: "execute(): void",
        ownerId: "inserttextcommand",
        justification: "This command already knows what to insert and where. Calling document.insertText(position, insertedText) is the forward action it exists to encapsulate.",
      },
      {
        id: "m4",
        signature: "undo(): void",
        ownerId: "inserttextcommand",
        justification: "Undoing an insert means deleting exactly what was inserted. Only this command knows insertedText's length, which is what makes it the right class to reverse itself.",
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
        justification: "Restoring exactly what was deleted means re-inserting its own stored deletedText at its own stored position. That mirrors execute() in reverse using state only this command has.",
      },
      {
        id: "m7",
        signature: "executeCommand(command): void",
        ownerId: "history",
        justification: "CommandHistory is the only class that sequences commands. It's the one place that both runs a command and records it, so nothing else can push to the undo stack without actually having executed something first.",
        codeExercise: {
          language: "java",
          starter: "void executeCommand(Command command) {\n    // your code here\n}",
          reference:
            "void executeCommand(Command command) {\n    command.execute();\n    undoStack.push(command);\n    redoStack.clear();\n}",
          checklist: [
            "Executes the command before pushing it (pushing first and executing after would record history for an action that hasn't actually happened yet)",
            "Pushes the command onto the undo stack after it executes",
            "Clears the redo stack, since a new action invalidates whatever 'future' could have been redone, and silently keeping it would let redo() replay against a document state it was never designed for",
            "Bonus (L5+, not required here): if execute() can throw, the command should NOT end up on the undo stack at all",
          ],
          java: {
            editClassName: "CommandHistory",
            starterFile: `import java.util.ArrayDeque;
import java.util.Deque;

public class CommandHistory {
    private final Deque<Command> undoStack = new ArrayDeque<Command>();
    private final Deque<Command> redoStack = new ArrayDeque<Command>();

    public void executeCommand(Command command) {
        // Run the command, then record it so undo() can reverse it later.
        // A brand-new action also invalidates anything waiting to be redone.
    }

    public void undo() {
        if (undoStack.isEmpty()) {
            return;
        }
        Command command = undoStack.pop();
        command.undo();
        redoStack.push(command);
    }

    public void redo() {
        if (redoStack.isEmpty()) {
            return;
        }
        Command command = redoStack.pop();
        command.execute();
        undoStack.push(command);
    }
}
`,
            referenceFile: COMMAND_HISTORY_REFERENCE_JAVA,
            support: UNDO_REDO_SUPPORT,
            tests: [
              {
                id: "runs-the-command",
                label: "executing an insert actually changes the document",
                body: `Document doc = new Document("d1", "");
CommandHistory history = new CommandHistory();
history.executeCommand(new InsertTextCommand(doc, 0, "hello"));
expectedText = "document reads 'hello'";
actualText = "document reads '" + doc.getContent() + "'";
passed = doc.getContent().equals("hello");`,
              },
              {
                id: "recorded-for-undo",
                label: "the executed command lands on the undo stack",
                body: `Document doc = new Document("d1", "");
CommandHistory history = new CommandHistory();
history.executeCommand(new InsertTextCommand(doc, 0, "abc"));
String afterExecute = doc.getContent();
history.undo();
String afterUndo = doc.getContent();
expectedText = "'abc' after execute, '' after undo";
actualText = "'" + afterExecute + "' after execute, '" + afterUndo + "' after undo";
passed = afterExecute.equals("abc") && afterUndo.equals("");`,
              },
              {
                id: "clears-stale-redo",
                label: "a new action wipes whatever was waiting to be redone",
                body: `Document doc = new Document("d1", "");
CommandHistory history = new CommandHistory();
history.executeCommand(new InsertTextCommand(doc, 0, "one"));
history.undo();
history.executeCommand(new InsertTextCommand(doc, 0, "two"));
history.redo();
expectedText = "document reads 'two', the stale redo was discarded";
actualText = doc.getContent().equals("two") ? "document reads 'two', the stale redo was discarded" : "document reads '" + doc.getContent() + "', redo replayed a stale command";
passed = doc.getContent().equals("two");`,
              },
              {
                id: "newest-undone-first",
                label: "commands are recorded in LIFO order, so undo reverses the newest",
                body: `Document doc = new Document("d1", "");
CommandHistory history = new CommandHistory();
history.executeCommand(new InsertTextCommand(doc, 0, "a"));
history.executeCommand(new InsertTextCommand(doc, 1, "b"));
String afterBoth = doc.getContent();
history.undo();
expectedText = "'ab' after both inserts, 'a' after one undo";
actualText = "'" + afterBoth + "' after both inserts, '" + doc.getContent() + "' after one undo";
passed = afterBoth.equals("ab") && doc.getContent().equals("a");`,
              },
              {
                id: "delete-command-roundtrip",
                label: "a DeleteTextCommand executes and can be undone through the same flow",
                body: `Document doc = new Document("d1", "hello world");
CommandHistory history = new CommandHistory();
history.executeCommand(new DeleteTextCommand(doc, 0, 6));
String afterDelete = doc.getContent();
history.undo();
expectedText = "'world' after the delete, 'hello world' after undo";
actualText = "'" + afterDelete + "' after the delete, '" + doc.getContent() + "' after undo";
passed = afterDelete.equals("world") && doc.getContent().equals("hello world");`,
              },
            ],
          },
        },
      },
      {
        id: "m8",
        signature: "undo(): void",
        ownerId: "history",
        justification: "Reversing the most recent action means popping the top of the undo stack and asking that specific command to undo itself. CommandHistory doesn't need to know HOW any command reverses, just that it can.",
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
          java: {
            editClassName: "CommandHistory",
            starterFile: `import java.util.ArrayDeque;
import java.util.Deque;

public class CommandHistory {
    private final Deque<Command> undoStack = new ArrayDeque<Command>();
    private final Deque<Command> redoStack = new ArrayDeque<Command>();

    public void executeCommand(Command command) {
        command.execute();
        undoStack.push(command);
        redoStack.clear();
    }

    public void undo() {
        // Reverse the MOST RECENT command, not the oldest, then hand it to
        // the redo stack. An empty history is a quiet no-op, never a crash.
    }

    public void redo() {
        if (redoStack.isEmpty()) {
            return;
        }
        Command command = redoStack.pop();
        command.execute();
        undoStack.push(command);
    }
}
`,
            referenceFile: COMMAND_HISTORY_REFERENCE_JAVA,
            support: UNDO_REDO_SUPPORT,
            tests: [
              {
                id: "reverses-last-insert",
                label: "undo removes exactly what the last insert added",
                body: `Document doc = new Document("d1", "");
CommandHistory history = new CommandHistory();
history.executeCommand(new InsertTextCommand(doc, 0, "hello"));
history.undo();
expectedText = "document back to ''";
actualText = "document reads '" + doc.getContent() + "'";
passed = doc.getContent().equals("");`,
              },
              {
                id: "empty-history-noop",
                label: "undo on an empty history is a quiet no-op",
                body: `CommandHistory history = new CommandHistory();
expectedText = "undo on an empty history returns quietly";
try {
    history.undo();
    actualText = "undo on an empty history returns quietly";
    passed = true;
} catch (Exception threw) {
    actualText = "undo threw " + threw.getClass().getSimpleName() + " on an empty history";
    passed = false;
}`,
              },
              {
                id: "lifo-not-fifo",
                label: "two undos peel commands back newest-first",
                body: `Document doc = new Document("d1", "");
CommandHistory history = new CommandHistory();
history.executeCommand(new InsertTextCommand(doc, 0, "a"));
history.executeCommand(new InsertTextCommand(doc, 1, "b"));
history.undo();
String afterFirstUndo = doc.getContent();
history.undo();
expectedText = "'a' after the first undo, '' after the second";
actualText = "'" + afterFirstUndo + "' after the first undo, '" + doc.getContent() + "' after the second";
passed = afterFirstUndo.equals("a") && doc.getContent().equals("");`,
              },
              {
                id: "feeds-redo-stack",
                label: "an undone command can be brought back by redo",
                body: `Document doc = new Document("d1", "");
CommandHistory history = new CommandHistory();
history.executeCommand(new InsertTextCommand(doc, 0, "hello"));
history.undo();
String afterUndo = doc.getContent();
history.redo();
expectedText = "'' after undo, 'hello' after redo";
actualText = "'" + afterUndo + "' after undo, '" + doc.getContent() + "' after redo";
passed = afterUndo.equals("") && doc.getContent().equals("hello");`,
              },
              {
                id: "restores-deleted-text",
                label: "undoing a delete restores the exact text that was removed",
                body: `Document doc = new Document("d1", "hello world");
CommandHistory history = new CommandHistory();
history.executeCommand(new DeleteTextCommand(doc, 0, 6));
history.undo();
expectedText = "document restored to 'hello world'";
actualText = "document reads '" + doc.getContent() + "'";
passed = doc.getContent().equals("hello world");`,
              },
            ],
          },
        },
      },
      {
        id: "m9",
        signature: "redo(): void",
        ownerId: "history",
        justification: "Redo is the mirror of undo: pop from the redo side, re-run the command's own execute(), and move it back onto the undo stack, so undo/redo can alternate indefinitely on the same command objects.",
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
        handling: "undo() must be a no-op rather than throwing. Same defensive empty-check shape as popping any empty stack.",
      },
      {
        scenario: "A new command is executed after the user has already undone a few steps.",
        handling: "executeCommand() must clear the redo stack before pushing the new command. The old 'future' is no longer valid once a new action branches off from an earlier point, and keeping it would let redo() replay a command against a document state it no longer matches.",
      },
      {
        scenario: "redo() is called when the redo stack is empty.",
        handling: "Same defensive no-op as undo() on an empty stack. There's nothing left to reapply.",
      },
      {
        scenario: "The document is modified directly, bypassing CommandHistory, while commands are still on the undo stack.",
        handling: "Every mutation must go through a Command's execute()/undo(). A direct edit means a stored command's undo() (e.g. 'delete 5 characters at position 10') no longer matches what's actually there, silently corrupting undo.",
      },
    ],
    tradeoffs: [
      {
        decision: "Undo/redo stacks live on a separate CommandHistory class instead of Document tracking its own history.",
        reasoning: "Keeping Document purely about what the text currently is (not what happened to it) stops one class from doing two unrelated jobs. Undo/redo is a cross-cutting concern that could apply to any receiver, not something specific to what a document is.",
      },
      {
        decision: "Each edit type is its own concrete Command class instead of one generic EditCommand with an operation-type field and a branch in execute().",
        reasoning: "A type-tagged generic command just moves the type-switching problem into execute()/undo() themselves. Separate classes mean a new edit type (e.g. ReplaceTextCommand) is a new class, not a new branch in code that already works.",
      },
      {
        decision: "DeleteTextCommand stores the actual deleted text at execute() time instead of just storing position + length and re-reading from the document later.",
        reasoning: "By the time undo() runs, the document has already changed shape, so position and length alone can't say what text used to be there. Capturing the real substring the instant it's removed is the only way undo() can restore the exact original content.",
      },
    ],
    principles: [
      {
        name: "Command Pattern",
        explanation: "InsertTextCommand and DeleteTextCommand both implement the same execute()/undo() contract. CommandHistory never needs to know which concrete command it's holding, just that it can execute() and undo() it, which is what lets the undo/redo stacks treat every command interchangeably.",
      },
      {
        name: "Single Responsibility Principle",
        explanation: "Document only knows how to mutate its own text, and CommandHistory only knows how to sequence commands forward and backward. Neither reaches into the other's job.",
      },
      {
        name: "Encapsulation",
        explanation: "Document's content only ever changes through insertText()/deleteText(). No command reaches in and manipulates the string directly, which is what keeps every command's stored undo-state trustworthy.",
      },
      {
        name: "Open/Closed Principle",
        explanation: "Adding a new kind of edit (e.g. ReplaceTextCommand) means writing one new class that implements execute()/undo(). CommandHistory, Document, and every existing command stay completely untouched.",
      },
    ],
  },
};
