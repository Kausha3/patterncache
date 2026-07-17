import type { ColdDrillPrompt } from "@/types";

// Compilable domain model shared by this drill's runnable Java exercises.
// Each string is a complete file; the exercise runner writes them next to
// the learner's class and compiles everything together in the browser.

const FILE_SYSTEM_NODE_JAVA = `public abstract class FileSystemNode {
    private final String id;
    private final String name;
    private Folder parent;

    protected FileSystemNode(String id, String name) {
        this.id = id;
        this.name = name;
    }

    public String getId() { return id; }
    public String getName() { return name; }
    public Folder getParent() { return parent; }
    public void setParent(Folder parent) { this.parent = parent; }

    public abstract long getSize();
}
`;

const FILE_JAVA = `public class File extends FileSystemNode {
    private final long sizeBytes;

    public File(String id, String name, long sizeBytes) {
        super(id, name);
        this.sizeBytes = sizeBytes;
    }

    public long getSize() { return sizeBytes; }
}
`;

const FILE_SYSTEM_SUPPORT = [
  { className: "FileSystemNode", source: FILE_SYSTEM_NODE_JAVA },
  { className: "File", source: FILE_JAVA },
];

export const fileSystem: ColdDrillPrompt = {
  id: "file-system",
  title: "Design a File System (folders containing files or other folders)",
  prompt: "Design a file system where folders can contain files or other folders.",
  reference: {
    clarifyingQuestions: [
      {
        question: "Can a folder contain other folders, or just files (a flat directory vs. a real nested tree)?",
        why: "Decides whether Folder needs a heterogeneous children list at all (of FileSystemNode) or just a flat List<File>. That pins down whether Composite is even the right shape here.",
      },
      {
        question: "Do we need to support operations like copy/move, or just size and listing?",
        why: "Move is specifically where the circular-reference guard matters. Scoping this out means addChild()'s cycle check becomes optional rather than core.",
      },
      {
        question: "Is this in-memory only, or does it need to persist to real disk storage?",
        why: "A premature-leaning question, but worth asking. Real persistence would introduce I/O failure edge cases this model doesn't need to handle if it stays in-memory.",
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
        why: "The shared abstraction both File and Folder implement. Letting any operation (getSize(), getPath()) work on either one without the caller needing to check which it's holding is the entire point of modeling this as one shared type instead of two unrelated classes.",
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
        why: "A leaf node, with an actual byte size and no children of its own.",
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
        why: "A composite node. It holds a list of FileSystemNode, which could themselves be Files or more Folders, and that's what makes the tree arbitrarily nestable.",
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
        why: "The overall system. It owns the root Folder and is the entry point for path-based lookups.",
        properties: [
          { name: "id", type: "string" },
          { name: "root", type: "Folder" },
        ],
      },
      { id: "path", name: "Path", isEntity: false, why: "A string representation used to locate a node, not a class with its own behavior beyond parsing. Folder can resolve one without Path needing independent identity." },
      { id: "disk", name: "StorageDevice", isEntity: false, why: "The physical or virtual storage medium underneath, out of scope for the logical file-system model being asked about." },
      { id: "permission", name: "Permission", isEntity: false, why: "Nobody asked about access control, and inventing permission scope adds complexity beyond what the prompt requested." },
    ],
    methods: [
      {
        id: "m1",
        signature: "getSize(): long",
        ownerId: "file",
        justification: "File is the leaf case. Its size is just the byte count it already stores, no children to sum, and this is the base case of the shared getSize() contract every FileSystemNode must honor.",
      },
      {
        id: "m2",
        signature: "getSize(): long",
        ownerId: "folder",
        justification: "Folder is the composite case. Summing every child's own getSize() without checking whether each child is a File or another Folder is exactly what makes the tree arbitrarily deep without Folder needing special-case code per level.",
        codeExercise: {
          language: "java",
          starter: "long getSize() {\n    // your code here\n}",
          reference: "long getSize() {\n    long total = 0;\n    for (FileSystemNode child : children) {\n        total += child.getSize();\n    }\n    return total;\n}",
          checklist: [
            "Sums every child's own getSize(), not just direct files",
            "Calls child.getSize() polymorphically, never checking 'if child is a File' vs 'if child is a Folder' first",
            "Handles an empty folder by returning 0, not null or an exception",
            "Bonus (L5+, not required here): notes that a very deep tree risks stack depth on pure recursion. An iterative traversal with an explicit stack is the production alternative",
          ],
          java: {
            editClassName: "Folder",
            starterFile: `import java.util.ArrayList;
import java.util.List;

public class Folder extends FileSystemNode {
    private final List<FileSystemNode> children = new ArrayList<FileSystemNode>();

    public Folder(String id, String name) {
        super(id, name);
    }

    public List<FileSystemNode> getChildren() { return children; }

    public void addChild(FileSystemNode node) {
        if (isAncestorOf(node, this)) {
            throw new IllegalArgumentException("Cannot add an ancestor as a child, would create a cycle");
        }
        node.setParent(this);
        children.add(node);
    }

    private boolean isAncestorOf(FileSystemNode candidateAncestor, FileSystemNode folder) {
        FileSystemNode current = folder;
        while (current != null) {
            if (current == candidateAncestor) {
                return true;
            }
            current = current.getParent();
        }
        return false;
    }

    public long getSize() {
        // Sum every child's own getSize(), files and folders alike.
        // An empty folder is 0 bytes.
        return 0;
    }
}
`,
            referenceFile: `import java.util.ArrayList;
import java.util.List;

public class Folder extends FileSystemNode {
    private final List<FileSystemNode> children = new ArrayList<FileSystemNode>();

    public Folder(String id, String name) {
        super(id, name);
    }

    public List<FileSystemNode> getChildren() { return children; }

    public void addChild(FileSystemNode node) {
        if (isAncestorOf(node, this)) {
            throw new IllegalArgumentException("Cannot add an ancestor as a child, would create a cycle");
        }
        node.setParent(this);
        children.add(node);
    }

    private boolean isAncestorOf(FileSystemNode candidateAncestor, FileSystemNode folder) {
        FileSystemNode current = folder;
        while (current != null) {
            if (current == candidateAncestor) {
                return true;
            }
            current = current.getParent();
        }
        return false;
    }

    public long getSize() {
        long total = 0;
        for (FileSystemNode child : children) {
            total += child.getSize();
        }
        return total;
    }
}
`,
            support: FILE_SYSTEM_SUPPORT,
            tests: [
              {
                id: "sums-direct-files",
                label: "a folder of two files reports their combined size",
                body: `Folder docs = new Folder("f1", "docs");
docs.addChild(new File("a", "resume.pdf", 100L));
docs.addChild(new File("b", "cover.pdf", 250L));
expectedText = "350 bytes";
long total = docs.getSize();
actualText = total + " bytes";
passed = total == 350L;`,
              },
              {
                id: "recurses-into-nested-folders",
                label: "files inside subfolders count too, not just direct children",
                body: `Folder root = new Folder("f1", "root");
root.addChild(new File("a", "top.txt", 100L));
Folder photos = new Folder("f2", "photos");
photos.addChild(new File("b", "beach.jpg", 200L));
Folder raw = new Folder("f3", "raw");
raw.addChild(new File("c", "beach.raw", 50L));
photos.addChild(raw);
root.addChild(photos);
expectedText = "350 bytes, counting files at every depth";
long total = root.getSize();
actualText = total + " bytes";
passed = total == 350L;`,
              },
              {
                id: "empty-folder-is-zero",
                label: "an empty folder is 0 bytes, not null or a crash",
                body: `Folder empty = new Folder("f1", "empty");
expectedText = "0 bytes";
long total = empty.getSize();
actualText = total + " bytes";
passed = total == 0L;`,
              },
              {
                id: "deep-chain-counts-leaf",
                label: "a file four folders down still reaches the top-level total",
                body: `Folder level1 = new Folder("f1", "level1");
Folder level2 = new Folder("f2", "level2");
Folder level3 = new Folder("f3", "level3");
Folder level4 = new Folder("f4", "level4");
level3.addChild(level4);
level2.addChild(level3);
level1.addChild(level2);
level4.addChild(new File("a", "buried.bin", 64L));
expectedText = "64 bytes from the file four folders down";
long total = level1.getSize();
actualText = total + " bytes";
passed = total == 64L;`,
              },
              {
                id: "empty-subfolders-add-nothing",
                label: "mixed children: empty subfolders contribute 0, files still count",
                body: `Folder root = new Folder("f1", "root");
root.addChild(new Folder("f2", "emptyA"));
root.addChild(new Folder("f3", "emptyB"));
root.addChild(new File("a", "note.txt", 10L));
expectedText = "10 bytes, empty subfolders add nothing";
long total = root.getSize();
actualText = total + " bytes";
passed = total == 10L;`,
              },
            ],
          },
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
            "void addChild(FileSystemNode node) {\n    if (isAncestorOf(node, this)) {\n        throw new IllegalArgumentException(\"Cannot add an ancestor as a child, would create a cycle\");\n    }\n    node.setParent(this);\n    children.add(node);\n}\n\n// Walks up from 'folder' through parent references, checking whether it ever reaches 'candidateAncestor'\nprivate boolean isAncestorOf(FileSystemNode candidateAncestor, FileSystemNode folder) {\n    FileSystemNode current = folder;\n    while (current != null) {\n        if (current == candidateAncestor) {\n            return true;\n        }\n        current = current.getParent();\n    }\n    return false;\n}",
          checklist: [
            "Checks whether the node being added is an ancestor of this folder before adding it, not just whether it equals this folder directly",
            "Sets the child's parent reference, not just adding it to the list. Otherwise getPath() would break for that node",
            "Throws or otherwise signals failure instead of silently creating a cycle",
            "Bonus (L5+, not required here): notes this check alone doesn't cover a folder being moved to a new location concurrently from elsewhere",
          ],
          java: {
            editClassName: "Folder",
            starterFile: `import java.util.ArrayList;
import java.util.List;

public class Folder extends FileSystemNode {
    private final List<FileSystemNode> children = new ArrayList<FileSystemNode>();

    public Folder(String id, String name) {
        super(id, name);
    }

    public List<FileSystemNode> getChildren() { return children; }

    public long getSize() {
        long total = 0;
        for (FileSystemNode child : children) {
            total += child.getSize();
        }
        return total;
    }

    public void addChild(FileSystemNode node) {
        // Guard against cycles first (adding this folder's own ancestor, or
        // itself, must fail loudly), then wire the child's parent reference
        // and add it to children.
    }
}
`,
            referenceFile: `import java.util.ArrayList;
import java.util.List;

public class Folder extends FileSystemNode {
    private final List<FileSystemNode> children = new ArrayList<FileSystemNode>();

    public Folder(String id, String name) {
        super(id, name);
    }

    public List<FileSystemNode> getChildren() { return children; }

    public long getSize() {
        long total = 0;
        for (FileSystemNode child : children) {
            total += child.getSize();
        }
        return total;
    }

    public void addChild(FileSystemNode node) {
        if (isAncestorOf(node, this)) {
            throw new IllegalArgumentException("Cannot add an ancestor as a child, would create a cycle");
        }
        node.setParent(this);
        children.add(node);
    }

    // Walks up from 'folder' through parent references, checking whether it ever reaches 'candidateAncestor'
    private boolean isAncestorOf(FileSystemNode candidateAncestor, FileSystemNode folder) {
        FileSystemNode current = folder;
        while (current != null) {
            if (current == candidateAncestor) {
                return true;
            }
            current = current.getParent();
        }
        return false;
    }
}
`,
            support: FILE_SYSTEM_SUPPORT,
            tests: [
              {
                id: "adds-node-to-children",
                label: "the added node actually lands in the children list",
                body: `Folder docs = new Folder("f1", "docs");
File resume = new File("a", "resume.pdf", 100L);
docs.addChild(resume);
expectedText = "children contains resume.pdf";
actualText = docs.getChildren().contains(resume) ? "children contains resume.pdf" : "children has " + docs.getChildren().size() + " entries and no resume.pdf";
passed = docs.getChildren().contains(resume);`,
              },
              {
                id: "sets-parent-reference",
                label: "adding a child wires its parent back to this folder",
                body: `Folder docs = new Folder("f1", "docs");
Folder taxes = new Folder("f2", "taxes");
docs.addChild(taxes);
expectedText = "parent of taxes is docs";
actualText = taxes.getParent() == null ? "taxes has no parent" : "parent of taxes is " + taxes.getParent().getName();
passed = taxes.getParent() == docs;`,
              },
              {
                id: "rejects-self-add",
                label: "a folder cannot be added to itself",
                body: `Folder docs = new Folder("f1", "docs");
expectedText = "IllegalArgumentException when a folder is added to itself";
try {
    docs.addChild(docs);
    actualText = "no exception, the folder now contains itself";
    passed = false;
} catch (IllegalArgumentException expectedFailure) {
    actualText = "IllegalArgumentException when a folder is added to itself";
    passed = true;
}`,
              },
              {
                id: "rejects-grandparent-cycle",
                label: "an ancestor two levels up is rejected, not just a direct self-add",
                body: `Folder root = new Folder("f1", "root");
Folder mid = new Folder("f2", "mid");
Folder leaf = new Folder("f3", "leaf");
root.getChildren().add(mid);
mid.setParent(root);
mid.getChildren().add(leaf);
leaf.setParent(mid);
expectedText = "IllegalArgumentException when a grandparent is added under its own descendant";
try {
    leaf.addChild(root);
    actualText = "no exception, root is now inside its own grandchild";
    passed = false;
} catch (IllegalArgumentException expectedFailure) {
    actualText = "IllegalArgumentException when a grandparent is added under its own descendant";
    passed = true;
}`,
              },
              {
                id: "reject-leaves-tree-untouched",
                label: "a rejected add must not half-mutate the tree first",
                body: `Folder root = new Folder("f1", "root");
Folder mid = new Folder("f2", "mid");
root.getChildren().add(mid);
mid.setParent(root);
try {
    mid.addChild(root);
} catch (IllegalArgumentException expectedFailure) {
    // The guard fired; the tree must be exactly as it was.
}
expectedText = "mid has no children and root still has no parent";
boolean untouched = mid.getChildren().isEmpty() && root.getParent() == null;
actualText = untouched ? "mid has no children and root still has no parent" : "the rejected add still mutated the tree";
passed = untouched;`,
              },
            ],
          },
        },
      },
      {
        id: "m4",
        signature: "removeChild(node): void",
        ownerId: "folder",
        justification: "Mirrors addChild(). Folder is the only class that should mutate its own children list.",
      },
      {
        id: "m5",
        signature: "rename(newName): void",
        ownerId: "filesystemnode",
        justification: "Renaming just changes the shared 'name' field every node has. File and Folder don't need their own version of this, so it lives once on FileSystemNode instead of being duplicated on both.",
      },
      {
        id: "m6",
        signature: "getPath(): String",
        ownerId: "filesystemnode",
        justification: "Building a full path means walking up through 'parent' references. Every node (File or Folder) has a parent, so this is shared logic too, not something each subtype reimplements separately.",
      },
      {
        id: "m7",
        signature: "findChild(name): FileSystemNode",
        ownerId: "folder",
        justification: "Looking up a child by name only makes sense on something that HAS children. File doesn't have any, so this lives only on Folder, not on the shared FileSystemNode base.",
      },
      {
        id: "m8",
        signature: "getRoot(): Folder",
        ownerId: "filesystem",
        justification: "FileSystem is the one class that owns the top-level root reference. Everything else navigates down from there, not up to some global.",
      },
    ],
    relationships: [
      "FileSystem owns one root Folder",
      "Folder has many FileSystemNodes (children), and each child may itself be a File or another Folder",
      "FileSystemNode references one parent Folder (nullable for the root)",
    ],
    edgeCases: [
      {
        scenario: "Computing the total size of a folder that's nested 10 levels deep.",
        handling: "getSize() being defined recursively on both File (base case) and Folder (sum of children) means depth is handled automatically by the recursion itself. No special-casing for how deep the tree goes.",
      },
      {
        scenario: "Two files or folders with the same name are added to the same parent folder.",
        handling: "addChild() should reject a duplicate name within the same Folder, or the model needs to explicitly decide same-name siblings are allowed. Silently permitting it makes getPath()/findChild() ambiguous about which node a name actually refers to.",
      },
      {
        scenario: "Someone tries to add a folder inside one of its own descendants (making it contain itself).",
        handling: "addChild() walks up the candidate parent's own ancestor chain checking against the node being added. If the node being added is found among its own future ancestors, the operation is rejected, since otherwise getSize()/getPath() would recurse forever.",
      },
      {
        scenario: "Deleting a folder that still has files inside it.",
        handling: "removeChild() operating on the parent's list doesn't by itself decide whether non-empty folders can be deleted. That's a real product decision (recursive delete vs. reject-if-not-empty) worth naming out loud rather than assuming either way.",
      },
    ],
    tradeoffs: [
      {
        decision: "File and Folder both implement a shared FileSystemNode abstraction instead of Folder having two separate lists (List<File> and List<Folder>).",
        reasoning: "Two separate lists means every operation that walks the tree (getSize, getPath, listing contents) needs to handle files and folders as two different cases everywhere it's touched. One shared type means the same code path handles both, which is the entire reason Composite exists as a pattern.",
      },
      {
        decision: "getSize() is declared once on FileSystemNode but implemented separately on File and Folder, instead of one shared implementation that type-checks internally.",
        reasoning: "A single shared implementation with an 'if this is a File do X else do Y' check just relocates the type-branching problem instead of removing it. Letting each subtype own its own version means adding a new node type later doesn't require touching existing code.",
      },
      {
        decision: "addChild() enforces the circular-reference guard, rather than trusting callers to never construct a cycle.",
        reasoning: "A tree that's supposed to always be acyclic needs the invariant enforced at the one point the structure actually changes. Folder is that point, so it's the only place this check can live reliably.",
      },
    ],
    principles: [
      {
        name: "Composite Pattern",
        explanation: "FileSystemNode is the shared abstraction that both File (a leaf) and Folder (a composite holding more FileSystemNodes) conform to. Any code calling getSize() or getPath() never needs to know or check which one it's actually holding. That uniform treatment of leaves and composites through one interface is what Composite means.",
      },
      {
        name: "Single Responsibility Principle",
        explanation: "File only knows its own byte size. Folder only knows how to aggregate its own children. Neither one reaches into the other's job.",
      },
      {
        name: "Encapsulation",
        explanation: "Folder.addChild()/removeChild() are the only ways its children list changes. Nothing else reaches in and mutates the list directly, and that's exactly where the circular-reference guard gets enforced.",
      },
      {
        name: "Recursion mirrors structure",
        explanation: "getSize() and getPath() are both written recursively because the data itself (a tree) is recursive. Computing either with a flat loop over 'all nodes' would require flattening the tree first, which is strictly more work than trusting the recursive structure.",
      },
    ],
  },
};
