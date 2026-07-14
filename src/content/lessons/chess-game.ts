import type { LLDLesson } from "@/types";

export const chessGame: LLDLesson = {
  id: "chess-game",
  track: "lld",
  title: "Design a Chess Game",
  blurb: "Board state, move validation, and rules as an object model.",
  estMinutes: 8,
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
