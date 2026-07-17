import type { LLDLesson } from "@/types";

// Compilable domain model shared by this lesson's runnable Java exercises.
// Each string is a complete file; the exercise runner writes them next to
// the learner's class and compiles everything together in the browser.
// The model is deliberately small: only the piece types the exercises place
// (king, rook, knight, pawn), because that is all the references need.

const COLOR_JAVA = `public enum Color {
    WHITE, BLACK;
}
`;

const PIECE_TYPE_JAVA = `public enum PieceType {
    KING, ROOK, KNIGHT, PAWN;
}
`;

const MOVE_JAVA = `public class Move {
    private final String fromSquare;
    private final String toSquare;

    public Move(String fromSquare, String toSquare) {
        this.fromSquare = fromSquare;
        this.toSquare = toSquare;
    }

    public String getFromSquare() { return fromSquare; }
    public String getToSquare() { return toSquare; }
}
`;

const PIECE_JAVA = `import java.util.ArrayList;
import java.util.List;

public class Piece {
    private final PieceType type;
    private final Color color;
    private final String square;

    public Piece(PieceType type, Color color, String square) {
        this.type = type;
        this.color = color;
        this.square = square;
    }

    public PieceType getType() { return type; }
    public Color getColor() { return color; }
    public String getSquare() { return square; }

    // Raw movement pattern for the piece types this lesson's exercises place:
    // king, rook, knight, and pawn. Sliding stops at the first occupied square.
    public List<Move> getLegalMoves(Board board) {
        List<Move> moves = new ArrayList<Move>();
        int file = square.charAt(0) - 'a';
        int rank = square.charAt(1) - '1';
        if (type == PieceType.ROOK) {
            int[][] directions = { { 1, 0 }, { -1, 0 }, { 0, 1 }, { 0, -1 } };
            for (int[] direction : directions) {
                int f = file + direction[0];
                int r = rank + direction[1];
                while (onBoard(f, r)) {
                    Piece occupant = board.getPieceAt(squareName(f, r));
                    if (occupant == null) {
                        moves.add(new Move(square, squareName(f, r)));
                    } else {
                        if (occupant.getColor() != color) {
                            moves.add(new Move(square, squareName(f, r)));
                        }
                        break;
                    }
                    f = f + direction[0];
                    r = r + direction[1];
                }
            }
        } else if (type == PieceType.KNIGHT) {
            int[][] jumps = { { 1, 2 }, { 2, 1 }, { 2, -1 }, { 1, -2 }, { -1, -2 }, { -2, -1 }, { -2, 1 }, { -1, 2 } };
            for (int[] jump : jumps) {
                addIfLandable(moves, board, file + jump[0], rank + jump[1]);
            }
        } else if (type == PieceType.KING) {
            for (int df = -1; df <= 1; df = df + 1) {
                for (int dr = -1; dr <= 1; dr = dr + 1) {
                    if (df != 0 || dr != 0) {
                        addIfLandable(moves, board, file + df, rank + dr);
                    }
                }
            }
        } else if (type == PieceType.PAWN) {
            int forward = (color == Color.WHITE) ? 1 : -1;
            if (onBoard(file, rank + forward) && board.getPieceAt(squareName(file, rank + forward)) == null) {
                moves.add(new Move(square, squareName(file, rank + forward)));
            }
            int[] captureFiles = { file - 1, file + 1 };
            for (int captureFile : captureFiles) {
                if (onBoard(captureFile, rank + forward)) {
                    Piece occupant = board.getPieceAt(squareName(captureFile, rank + forward));
                    if (occupant != null && occupant.getColor() != color) {
                        moves.add(new Move(square, squareName(captureFile, rank + forward)));
                    }
                }
            }
        }
        return moves;
    }

    private void addIfLandable(List<Move> moves, Board board, int f, int r) {
        if (!onBoard(f, r)) {
            return;
        }
        Piece occupant = board.getPieceAt(squareName(f, r));
        if (occupant == null || occupant.getColor() != color) {
            moves.add(new Move(square, squareName(f, r)));
        }
    }

    private boolean onBoard(int f, int r) {
        return f >= 0 && f < 8 && r >= 0 && r < 8;
    }

    private String squareName(int f, int r) {
        return "" + (char) ('a' + f) + (char) ('1' + r);
    }
}
`;

// Fully implemented Board. Doubles as the reference file for the
// isSquareUnderAttack exercise and as a support class for isCheck, where the
// board is not the class under edit. placePiece exists so tests can set up
// positions in one readable line per piece.
const BOARD_JAVA = `import java.util.HashMap;
import java.util.Map;

public class Board {
    private final Map<String, Piece> grid = new HashMap<String, Piece>();

    public Piece getPieceAt(String square) {
        return grid.get(square);
    }

    public void placePiece(String square, PieceType type, Color color) {
        grid.put(square, new Piece(type, color, square));
    }

    public String findKingSquare(Color color) {
        for (Map.Entry<String, Piece> entry : grid.entrySet()) {
            Piece piece = entry.getValue();
            if (piece.getType() == PieceType.KING && piece.getColor() == color) {
                return entry.getKey();
            }
        }
        return null;
    }

    public boolean isSquareUnderAttack(String square, Color attackerColor) {
        for (Piece piece : grid.values()) {
            if (piece.getColor() != attackerColor) {
                continue;
            }
            boolean canReach = piece.getLegalMoves(this).stream()
                .anyMatch(move -> move.getToSquare().equals(square));
            if (canReach) {
                return true;
            }
        }
        return false;
    }
}
`;

export const chessGame: LLDLesson = {
  id: "chess-game",
  track: "lld",
  title: "Design a Chess Game",
  blurb: "Board state, move validation, and rules as an object model.",
  estMinutes: 35,
  overview:
    "Chess looks like it's about pieces, but the real design content is legality. A move a piece can normally make isn't the same as a move that's actually legal right now, and that check depends on the whole board, not just one piece. The special rules (castling, en passant, promotion, checkmate vs. stalemate) are where the actual complexity lives. Basic movement is the easy 80%.",
  terms: ["client", "server"],
  interview: {
    prompt: "Design a chess game.",
    opening: "Design the rules engine and state for a two-player chess game. No UI, just the model. Where do you want to start?",
    summary:
      "You've scoped it: full special-move support (castling, en passant, promotion), a rules-engine-only design with move history tracked. That's enough, so go identify the classes.",
    questions: [
      {
        id: "special-rules",
        ask: "Do we need special rules like castling, en passant, and pawn promotion, or just basic piece movement?",
        category: "scope",
        answer: "Yes, include castling, en passant, and pawn promotion. Not just basic movement.",
        why: "This is the decision that most affects Move and Piece. Special-rule handling is where most of the real complexity lives, far more than basic movement patterns.",
        establishes: "Castling, en passant, promotion in scope",
        lp: ["dive-deep"],
        branches: [
          { label: "Basic movement only", approach: "Move would just be a fromSquare/toSquare pair, with no isCastling, isEnPassant, or promotionType fields, and Piece.getLegalMoves() would never need to reason about anything beyond each piece's raw movement pattern. A much thinner Move class, but it doesn't match how chess is actually played." },
          { label: "Full special rules (this)", approach: "Move needs extra fields (isCastling, isEnPassant, promotionType) to represent moves that aren't just 'piece goes from A to B', and legality checks need access to move history to know if castling is still eligible. That's exactly why Move ends up richer than a plain coordinate pair." },
        ],
      },
      {
        id: "ui",
        ask: "Do we need a full UI or rendering layer, or just the rules engine and game state?",
        category: "scope",
        answer: "Just the rules engine and state, no rendering.",
        why: "Scopes the whole exercise to the rules classes. Nothing about display.",
        establishes: "Rules engine only, no UI",
        lp: ["customer-obsession"],
      },
      {
        id: "history",
        ask: "Do we need move history and undo, or just the current position?",
        category: "constraints",
        answer: "Track move history. We need it for rules like castling eligibility and en passant, and it's useful for undo later.",
        why: "This confirms Move needs to be tracked over time, not just evaluated and discarded, since it's directly required by at least one rule.",
        establishes: "Move history tracked",
        lp: ["dive-deep"],
        branches: [
          { label: "No history, just current position", approach: "Game wouldn't own a moveHistory list at all, and castling eligibility would have to be tracked some other way, like a hasMoved flag baked directly onto Piece. Cheaper, but loses undo and any general move log." },
          { label: "Full move history (this)", approach: "Game owns a moveHistory: List<Move>, which is what lets castling eligibility and en passant (which only applies to the immediately preceding move) be derived from history instead of ad hoc flags scattered across Piece and Board." },
        ],
      },
      {
        id: "storage-premature",
        ask: "Should we use bitboards or a 2D array to represent the board internally?",
        category: "premature",
        redirect: "That's a data-structure and performance detail. Get the class responsibilities right first.",
      },
    ],
  },
  design: {
    entities: [
      {
        id: "board",
        name: "Board",
        isEntity: true,
        why: "The 8x8 grid. It owns the current position and knows what occupies each square.",
        properties: [
          { name: "id", type: "string" },
          { name: "grid", type: "Map<String, Piece>" },
        ],
      },
      {
        id: "piece",
        name: "Piece",
        isEntity: true,
        why: "A single chess piece that has a type, a color, and knows its own legal-move pattern.",
        properties: [
          { name: "id", type: "string" },
          { name: "type", type: "PieceType" },
          { name: "color", type: "Color" },
          { name: "hasMoved", type: "boolean" },
        ],
      },
      {
        id: "move",
        name: "Move",
        isEntity: true,
        why: "A single ply: a from-square, a to-square, and enough info to represent special cases like castling or en passant.",
        properties: [
          { name: "fromSquare", type: "String" },
          { name: "toSquare", type: "String" },
          { name: "movedPiece", type: "Piece" },
          { name: "isCastling", type: "boolean" },
          { name: "isEnPassant", type: "boolean" },
          { name: "promotionType", type: "PieceType" },
        ],
      },
      {
        id: "player",
        name: "Player",
        isEntity: true,
        why: "One of the two participants. Has a color and takes turns making moves.",
        properties: [
          { name: "id", type: "string" },
          { name: "color", type: "Color" },
        ],
      },
      {
        id: "game",
        name: "Game",
        isEntity: true,
        why: "The top-level controller. Owns the Board and both Players, enforces turn order, and detects check, checkmate, and stalemate.",
        properties: [
          { name: "id", type: "string" },
          { name: "board", type: "Board" },
          { name: "players", type: "List<Player>" },
          { name: "currentTurn", type: "Color" },
          { name: "moveHistory", type: "List<Move>" },
        ],
      },
      { id: "square", name: "Square", isEntity: false, why: "A coordinate, not a class with behavior of its own. Board can answer 'what's on square X' without Square needing independent identity." },
      { id: "clock", name: "Clock", isEntity: false, why: "A real tournament feature, but nobody asked for timing. Adding it invents scope beyond what was requested." },
      { id: "chessset", name: "ChessSet", isEntity: false, why: "The physical pieces and board object, not the software domain model. Irrelevant to this system." },
      { id: "spectator", name: "Spectator", isEntity: false, why: "An external, read-only observer with no effect on game state or rules. Not a class the domain logic needs." },
      { id: "notation", name: "Notation", isEntity: false, why: "A serialization format for describing moves (like PGN), not a class in the core rules and state model itself." },
    ],
    methods: [
      {
        id: "m1",
        signature: "getPieceAt(square): Piece",
        ownerId: "board",
        justification: "Board is the only class holding the grid mapping squares to pieces, so it's the one that can answer 'what's here.' Exposing the raw grid instead would let other classes bypass Board's control over position.",
      },
      {
        id: "m2",
        signature: "movePiece(move): void",
        ownerId: "board",
        justification: "Applying a move's effect on the grid (removing the piece from its old square, placing it on the new one, handling captures) mutates Board's own internal state. Only Board should be allowed to change what's on a square.",
      },
      {
        id: "m3",
        signature: "isSquareUnderAttack(square, color): boolean",
        ownerId: "board",
        justification: "Answering 'is this square attacked' requires scanning every piece on the board and asking whether any of them could move there. That board-wide scan only makes sense on the class that holds the whole grid, not on any single Piece.",
        codeExercise: {
          language: "java",
          starter: "boolean isSquareUnderAttack(String square, Color attackerColor) {\n    // your code here\n}",
          reference:
            "boolean isSquareUnderAttack(String square, Color attackerColor) {\n    for (Piece piece : grid.values()) {\n        if (piece.getColor() != attackerColor) {\n            continue;\n        }\n        boolean canReach = piece.getLegalMoves(this).stream()\n            .anyMatch(move -> move.getToSquare().equals(square));\n        if (canReach) {\n            return true;\n        }\n    }\n    return false;\n}",
          checklist: [
            "Checks every piece of the attacking color, not just the first one found",
            "Skips pieces that don't belong to the attacking color instead of throwing",
            "Returns true as soon as any piece can reach the square, without needlessly scanning the rest",
            "Works even when the target square is empty. Attack detection can't require a piece to already be standing there (needed for castling's 'king's path must not pass through check' rule)",
          ],
          java: {
            editClassName: "Board",
            starterFile: `import java.util.HashMap;
import java.util.Map;

public class Board {
    private final Map<String, Piece> grid = new HashMap<String, Piece>();

    public Piece getPieceAt(String square) {
        return grid.get(square);
    }

    public void placePiece(String square, PieceType type, Color color) {
        grid.put(square, new Piece(type, color, square));
    }

    public String findKingSquare(Color color) {
        for (Map.Entry<String, Piece> entry : grid.entrySet()) {
            Piece piece = entry.getValue();
            if (piece.getType() == PieceType.KING && piece.getColor() == color) {
                return entry.getKey();
            }
        }
        return null;
    }

    public boolean isSquareUnderAttack(String square, Color attackerColor) {
        // Scan every piece of the attacking color and ask whether any of its
        // legal moves lands on this square. Return false when none can reach it.
        return false;
    }
}
`,
            referenceFile: BOARD_JAVA,
            support: [
              { className: "Color", source: COLOR_JAVA },
              { className: "PieceType", source: PIECE_TYPE_JAVA },
              { className: "Move", source: MOVE_JAVA },
              { className: "Piece", source: PIECE_JAVA },
            ],
            tests: [
              {
                id: "rook-open-file",
                label: "a rook attacks an empty square down an open file",
                body: `Board board = new Board();
board.placePiece("e1", PieceType.ROOK, Color.WHITE);
boolean attacked = board.isSquareUnderAttack("e4", Color.WHITE);
expectedText = "e4 attacked by the rook on e1";
actualText = attacked ? "e4 attacked by the rook on e1" : "e4 reported as safe";
passed = attacked;`,
              },
              {
                id: "rook-blocked-by-pawn",
                label: "an intervening pawn blocks the rook's line of attack",
                body: `Board board = new Board();
board.placePiece("e1", PieceType.ROOK, Color.WHITE);
board.placePiece("e2", PieceType.PAWN, Color.WHITE);
boolean attacked = board.isSquareUnderAttack("e4", Color.WHITE);
expectedText = "e4 safe, the pawn on e2 blocks the rook on e1";
actualText = attacked ? "e4 reported as attacked through the blocker" : "e4 safe, the pawn on e2 blocks the rook on e1";
passed = !attacked;`,
              },
              {
                id: "knight-jumps-blockers",
                label: "a knight boxed in by its own pawns still attacks over them",
                body: `Board board = new Board();
board.placePiece("g1", PieceType.KNIGHT, Color.WHITE);
board.placePiece("f2", PieceType.PAWN, Color.WHITE);
board.placePiece("g2", PieceType.PAWN, Color.WHITE);
board.placePiece("h2", PieceType.PAWN, Color.WHITE);
boolean attacked = board.isSquareUnderAttack("e2", Color.WHITE);
expectedText = "e2 attacked by the knight on g1, jumping the pawns";
actualText = attacked ? "e2 attacked by the knight on g1, jumping the pawns" : "e2 reported as safe";
passed = attacked;`,
              },
              {
                id: "attacker-color-only",
                label: "only pieces of the attacking color count",
                body: `Board board = new Board();
board.placePiece("e1", PieceType.ROOK, Color.WHITE);
boolean attacked = board.isSquareUnderAttack("e4", Color.BLACK);
expectedText = "e4 not attacked by black, only a white rook is on the board";
actualText = attacked ? "the white rook was counted as a black attacker" : "e4 not attacked by black, only a white rook is on the board";
passed = !attacked;`,
              },
              {
                id: "own-piece-not-attacked",
                label: "a square holding a friendly piece is defended, not attacked",
                body: `Board board = new Board();
board.placePiece("e1", PieceType.ROOK, Color.WHITE);
board.placePiece("e4", PieceType.KNIGHT, Color.WHITE);
boolean attacked = board.isSquareUnderAttack("e4", Color.WHITE);
expectedText = "e4 not attacked, the rook cannot land on its own knight";
actualText = attacked ? "e4 reported as attacked by its own side" : "e4 not attacked, the rook cannot land on its own knight";
passed = !attacked;`,
              },
              {
                id: "pawn-attacks-forward-only",
                label: "a pawn attacks diagonally forward, never backward",
                body: `Board forward = new Board();
forward.placePiece("e5", PieceType.PAWN, Color.BLACK);
forward.placePiece("d4", PieceType.KNIGHT, Color.WHITE);
boolean blackPawnHits = forward.isSquareUnderAttack("d4", Color.BLACK);
Board backward = new Board();
backward.placePiece("e5", PieceType.PAWN, Color.WHITE);
backward.placePiece("d4", PieceType.KNIGHT, Color.BLACK);
boolean whitePawnHits = backward.isSquareUnderAttack("d4", Color.WHITE);
expectedText = "black pawn on e5 attacks d4, white pawn on e5 does not";
if (blackPawnHits && !whitePawnHits) {
    actualText = "black pawn on e5 attacks d4, white pawn on e5 does not";
} else if (!blackPawnHits) {
    actualText = "black pawn on e5 was not counted as attacking d4";
} else {
    actualText = "white pawn on e5 was counted as attacking d4 behind it";
}
passed = blackPawnHits && !whitePawnHits;`,
              },
            ],
          },
        },
      },
      {
        id: "m4",
        signature: "getLegalMoves(board): List<Move>",
        ownerId: "piece",
        justification: "Each piece type has its own movement pattern (how a Rook moves is different from a Bishop), so that pattern-specific logic belongs on Piece itself, even though it needs to read Board to know what's currently occupied.",
      },
      {
        id: "m5",
        signature: "isCastling(): boolean",
        ownerId: "move",
        justification: "Whether a given Move represents castling is a property of that specific move. Move already holds fromSquare/toSquare/movedPiece, so it's the class with the data to answer this without asking anyone else.",
      },
      {
        id: "m6",
        signature: "makeMove(move): void",
        ownerId: "player",
        justification: "Player is the actor that submits a move on their turn. makeMove() is the entry point that hands the move to Game for validation, keeping 'whose turn is it acting' separate from 'is this move actually legal.'",
      },
      {
        id: "m7",
        signature: "isCheck(color): boolean",
        ownerId: "game",
        justification: "Check depends on the whole board (is any enemy piece attacking my king's square right now), which only Game can evaluate since it owns Board and tracks whose turn it is. A single Piece can't answer this about itself.",
        codeExercise: {
          language: "java",
          starter: "boolean isCheck(Color color) {\n    // your code here\n}",
          reference:
            "boolean isCheck(Color color) {\n    // findKingSquare is a small Board helper that scans the grid for this color's King\n    String kingSquare = board.findKingSquare(color);\n    if (kingSquare == null) {\n        return false;\n    }\n    Color attackerColor = (color == Color.WHITE) ? Color.BLACK : Color.WHITE;\n    return board.isSquareUnderAttack(kingSquare, attackerColor);\n}",
          checklist: [
            "Finds the actual king's square for the given color, not an assumed fixed starting square",
            "Checks attacks from the OPPONENT's color, not the same color as the king being checked",
            "Reuses isSquareUnderAttack() rather than re-scanning pieces itself, since check is a special case of the same board-wide attack question",
            "Handles a missing/not-found king square defensively instead of crashing on a null lookup",
          ],
          java: {
            editClassName: "Game",
            starterFile: `public class Game {
    private final Board board;

    public Game(Board board) {
        this.board = board;
    }

    public boolean isCheck(Color color) {
        // Find this color's king (findKingSquare is a small Board helper), then
        // ask the board whether the OPPONENT's color attacks that square.
        return false;
    }
}
`,
            referenceFile: `public class Game {
    private final Board board;

    public Game(Board board) {
        this.board = board;
    }

    public boolean isCheck(Color color) {
        // findKingSquare is a small Board helper that scans the grid for this color's King
        String kingSquare = board.findKingSquare(color);
        if (kingSquare == null) {
            return false;
        }
        Color attackerColor = (color == Color.WHITE) ? Color.BLACK : Color.WHITE;
        return board.isSquareUnderAttack(kingSquare, attackerColor);
    }
}
`,
            support: [
              { className: "Color", source: COLOR_JAVA },
              { className: "PieceType", source: PIECE_TYPE_JAVA },
              { className: "Move", source: MOVE_JAVA },
              { className: "Piece", source: PIECE_JAVA },
              { className: "Board", source: BOARD_JAVA },
            ],
            tests: [
              {
                id: "rook-checks-king",
                label: "a rook on an open file puts the enemy king in check",
                body: `Board board = new Board();
board.placePiece("e8", PieceType.KING, Color.BLACK);
board.placePiece("e1", PieceType.ROOK, Color.WHITE);
Game game = new Game(board);
boolean check = game.isCheck(Color.BLACK);
expectedText = "black in check, the rook on e1 sees the king on e8";
actualText = check ? "black in check, the rook on e1 sees the king on e8" : "no check reported for black";
passed = check;`,
              },
              {
                id: "blocker-stops-check",
                label: "a pawn shielding the king means no check",
                body: `Board board = new Board();
board.placePiece("e8", PieceType.KING, Color.BLACK);
board.placePiece("e5", PieceType.PAWN, Color.BLACK);
board.placePiece("e1", PieceType.ROOK, Color.WHITE);
Game game = new Game(board);
boolean check = game.isCheck(Color.BLACK);
expectedText = "no check, the pawn on e5 blocks the rook on e1";
actualText = check ? "check reported through the blocking pawn" : "no check, the pawn on e5 blocks the rook on e1";
passed = !check;`,
              },
              {
                id: "knight-check-over-pawns",
                label: "a knight checks the king over the pawns in front of it",
                body: `Board board = new Board();
board.placePiece("g1", PieceType.KING, Color.WHITE);
board.placePiece("f2", PieceType.PAWN, Color.WHITE);
board.placePiece("g2", PieceType.PAWN, Color.WHITE);
board.placePiece("h2", PieceType.PAWN, Color.WHITE);
board.placePiece("f3", PieceType.KNIGHT, Color.BLACK);
Game game = new Game(board);
boolean check = game.isCheck(Color.WHITE);
expectedText = "white in check, the knight on f3 jumps the pawn shield";
actualText = check ? "white in check, the knight on f3 jumps the pawn shield" : "no check reported for white";
passed = check;`,
              },
              {
                id: "pawn-check-direction",
                label: "a pawn only checks the king it is facing",
                body: `Board board = new Board();
board.placePiece("e5", PieceType.KING, Color.BLACK);
board.placePiece("d4", PieceType.PAWN, Color.WHITE);
Game game = new Game(board);
boolean check = game.isCheck(Color.BLACK);
Board reversed = new Board();
reversed.placePiece("e5", PieceType.KING, Color.WHITE);
reversed.placePiece("d4", PieceType.PAWN, Color.BLACK);
Game second = new Game(reversed);
boolean wrongWay = second.isCheck(Color.WHITE);
expectedText = "white pawn on d4 checks the king on e5, black pawn on d4 does not";
if (check && !wrongWay) {
    actualText = "white pawn on d4 checks the king on e5, black pawn on d4 does not";
} else if (!check) {
    actualText = "the white pawn's check on e5 was missed";
} else {
    actualText = "a black pawn on d4 was counted as checking the king behind it";
}
passed = check && !wrongWay;`,
              },
              {
                id: "no-check-quiet-board",
                label: "a quiet position reports no check for either side",
                body: `Board board = new Board();
board.placePiece("e1", PieceType.KING, Color.WHITE);
board.placePiece("e8", PieceType.KING, Color.BLACK);
board.placePiece("a8", PieceType.ROOK, Color.BLACK);
Game game = new Game(board);
boolean whiteCheck = game.isCheck(Color.WHITE);
boolean blackCheck = game.isCheck(Color.BLACK);
expectedText = "no check for white or black";
if (!whiteCheck && !blackCheck) {
    actualText = "no check for white or black";
} else if (whiteCheck) {
    actualText = "white reported in check by a rook that never sees e1";
} else {
    actualText = "black reported in check with no attacker on the board";
}
passed = !whiteCheck && !blackCheck;`,
              },
              {
                id: "missing-king-no-crash",
                label: "a board with no king for that color returns false, not a crash",
                body: `Board board = new Board();
board.placePiece("a8", PieceType.ROOK, Color.BLACK);
Game game = new Game(board);
boolean check = game.isCheck(Color.WHITE);
expectedText = "false, there is no white king on the board";
actualText = check ? "check reported with no king present" : "false, there is no white king on the board";
passed = !check;`,
              },
            ],
          },
        },
      },
      {
        id: "m8",
        signature: "isCheckmate(color): boolean",
        ownerId: "game",
        justification: "Checkmate combines isCheck() with 'no legal move escapes it,' and both are board-wide questions Game already owns, so building on Game's own isCheck() and isValidMove() keeps this logic in one place instead of scattered across Piece.",
      },
      {
        id: "m9",
        signature: "switchTurn(): void",
        ownerId: "game",
        justification: "Turn order is Game's own state (currentTurn). Game is the only class that should flip whose turn it is, otherwise two different callers could disagree about who moves next.",
      },
      {
        id: "m10",
        signature: "isValidMove(move): boolean",
        ownerId: "game",
        justification: "Legality isn't just 'can this piece normally move this way' (that's Piece.getLegalMoves()). It also requires simulating the move and checking it doesn't leave the mover's own king in check, which needs board-wide state only Game has access to.",
      },
    ],
    edgeCases: [
      {
        id: "self-check",
        scenario: "A player attempts a move that would leave or keep their own king in check.",
        options: [
          { id: "a", label: "Allow the move since it's the piece's normal legal-move pattern.", correct: false, feedback: "A piece's raw movement pattern isn't the same as a legal chess move. A move that exposes your own king is illegal regardless of the piece's normal pattern." },
          { id: "b", label: "Reject the move; Game.isValidMove() must simulate it and confirm it doesn't leave the mover's own king in check.", correct: true, feedback: "Right, legality depends on board-wide state (is my king safe after this?), not just what one Piece can normally do, which is why this check lives on Game, not Piece." },
          { id: "c", label: "Allow it, but immediately declare the game over.", correct: false, feedback: "A self-checking move isn't a game-ending event. It's simply an illegal move that should never be permitted in the first place." },
        ],
      },
      {
        id: "promotion",
        scenario: "A pawn reaches the opposite end of the board.",
        options: [
          { id: "a", label: "Leave it as a pawn since the rules didn't say anything about promotion.", correct: false, feedback: "Pawn promotion is a core chess rule, not an optional extra. A design that silently ignores it is incomplete, not simplified." },
          { id: "b", label: "Board replaces the pawn Piece with a new Piece of the player's chosen type at that square.", correct: true, feedback: "Right, this is exactly why Piece needs a type that can change identity mid-game, handled at the Board level where the position lives." },
          { id: "c", label: "End the game immediately when any pawn reaches the last rank.", correct: false, feedback: "Reaching the last rank triggers promotion, not the end of the game. Those are two different rules." },
        ],
      },
      {
        id: "castling-history",
        scenario: "Castling is requested when the king or rook has already moved earlier in the game, but is currently back in its starting square.",
        options: [
          { id: "a", label: "Allow it as long as the king and rook are currently in their starting squares.", correct: false, feedback: "Castling's rule is specifically about neither piece having EVER moved, not just currently being in the starting square." },
          { id: "b", label: "Track whether the king and rook have ever moved, and reject castling if either has, even if they're back in their starting squares now.", correct: true, feedback: "This is a case where move history, not just current position, has to be tracked to get the rule right." },
          { id: "c", label: "Allow it any time the king and rook are adjacent to their standard castling positions.", correct: false, feedback: "Position alone isn't sufficient. The rule depends on history, not just the current snapshot of the board." },
        ],
      },
      {
        id: "stalemate",
        scenario: "Neither player can make a legal move, but the player to move is NOT in check.",
        options: [
          { id: "a", label: "Declare it a win for whoever isn't in check.", correct: false, feedback: "This is a stalemate, a real, distinct chess rule, and stalemate is a DRAW, not a win for either side." },
          { id: "b", label: "Game.isCheckmate() correctly returns false here, and a separate stalemate check declares the game a draw.", correct: true, feedback: "Right, checkmate and stalemate are both 'no legal moves' but differ on whether the king is in check, and they resolve completely differently, so that distinction has to be modeled explicitly." },
          { id: "c", label: "Treat it the same as checkmate since no moves are available either way.", correct: false, feedback: "Collapsing checkmate and stalemate into one outcome gets the actual result of the game wrong. One is a loss, the other is a draw." },
        ],
      },
    ],
    relationships: [
      "Game owns one Board and two Players",
      "Board tracks which Piece occupies each square",
      "Piece generates candidate Moves, and Game validates them against check and checkmate rules",
      "Player alternates turns, each producing one Move per turn",
    ],
    tradeoffs: [
      {
        decision: "Piece is a single class with a type field (PieceType enum) instead of a subclass per piece type (Pawn, Rook, Bishop, and so on).",
        reasoning: "A subclass hierarchy reads nicely for six piece types, but getLegalMoves() is really just movement logic keyed by type. One Piece class with type-dispatched behavior avoids six near-identical classes and keeps Move/Board from needing to type-check against a Piece subclass hierarchy everywhere they touch a piece.",
      },
      {
        decision: "Move records isCastling/isEnPassant/promotionType as explicit fields instead of Game re-deriving 'what kind of move was this' after the fact from a board-state diff.",
        reasoning: "Costs a slightly heavier Move class, but recording intent at move-creation time means undo, move-history serialization, and rules like 'promotion happened on this move' never have to be re-inferred later. The move is self-describing the moment it's made.",
      },
      {
        decision: "Legality (isValidMove) lives on Game, not on Piece or Move, even though a piece's raw movement pattern lives on Piece.",
        reasoning: "Splits 'can this piece type normally move this way' (Piece.getLegalMoves(), local knowledge) from 'is this move actually legal right now' (Game.isValidMove(), needs the whole board plus whose king would end up in check). Collapsing them into one method on Piece would force every Piece to know about check detection, which is really a Game-level, board-wide concern.",
      },
    ],
    principles: [
      {
        name: "Single Responsibility Principle",
        explanation: "Piece only knows its own type's movement pattern, Board only knows what occupies each square, and Game only knows whose turn it is and whether a king is in check. None of them reach into another's job to answer a question they don't own.",
      },
      {
        name: "Encapsulation",
        explanation: "Board.movePiece() is the only way the grid changes. No other class reaches in and mutates the position map directly, so the board can never end up holding two pieces on one square or a piece nobody actually moved there.",
      },
      {
        name: "Separation of Concerns",
        explanation: "'What can this piece normally do' (Piece.getLegalMoves()) is kept separate from 'is this specific move legal right now' (Game.isValidMove()). The first is local pattern-matching, the second is a board-wide legality question, and conflating them is exactly the self-check bug the edge cases warn about.",
      },
      {
        name: "Law of Demeter",
        explanation: "Game.isValidMove() asks board.isSquareUnderAttack(...) rather than reaching into Board's internal grid to re-implement the scan itself. Each class exposes the question other classes need answered, instead of exposing its raw internals for everyone else to pick through.",
      },
    ],
  },
  recap: [
    "Legality in chess is board-wide, not piece-local. A move that exposes your own king is illegal no matter what the piece's normal pattern allows, which is why that check lives on Game, not Piece.",
    "Some rules depend on history, not just the current position. Castling requires knowing whether a piece has EVER moved, not just where it currently sits.",
    "Checkmate and stalemate look identical ('no legal moves') but resolve completely differently, a loss versus a draw, so both conditions must be modeled and returned distinctly.",
    "The special rules (promotion, castling, en passant) are where the real design complexity is. Basic movement is the easy 80%.",
  ],
  relatedLessons: ["parking-lot", "elevator-system"],
};
