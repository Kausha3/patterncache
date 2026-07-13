import type { LLDLesson } from "@/types";

export const chessGame: LLDLesson = {
  id: "chess-game",
  track: "lld",
  title: "Design a Chess Game",
  blurb: "Board state, move validation, and rules as an object model.",
  estMinutes: 8,
  overview:
    "Chess looks like it's about pieces, but the real design content is legality: a move a piece can normally make isn't the same as a move that's actually legal right now — that check depends on the whole board, not just one piece. The special rules (castling, en passant, promotion, checkmate vs. stalemate) are where the actual complexity lives; basic movement is the easy 80%.",
  terms: ["client", "server"],
  interview: {
    prompt: "Design a chess game.",
    opening: "Design the rules engine and state for a two-player chess game — no UI, just the model. Where do you want to start?",
    summary:
      "You've scoped it: full special-move support (castling, en passant, promotion), a rules-engine-only design with move history tracked. That's enough — go identify the classes.",
    questions: [
      {
        id: "special-rules",
        ask: "Do we need special rules — castling, en passant, pawn promotion — or just basic piece movement?",
        category: "scope",
        answer: "Yes — include castling, en passant, and pawn promotion. Not just basic movement.",
        why: "This is the decision that most affects Move and Piece — special-rule handling is where most of the real complexity lives, far more than basic movement patterns.",
        establishes: "Castling, en passant, promotion in scope",
        lp: ["dive-deep"],
      },
      {
        id: "ui",
        ask: "Do we need a full UI or rendering layer, or just the rules engine and game state?",
        category: "scope",
        answer: "Just the rules engine and state — no rendering.",
        why: "Scopes the whole exercise to the rules classes — nothing about display.",
        establishes: "Rules engine only, no UI",
        lp: ["customer-obsession"],
      },
      {
        id: "history",
        ask: "Do we need move history and undo, or just the current position?",
        category: "constraints",
        answer: "Track move history — we need it for rules like castling eligibility and en passant, and it's useful for undo later.",
        why: "This confirms Move needs to be tracked over time, not just evaluated and discarded — directly required by at least one rule.",
        establishes: "Move history tracked",
        lp: ["dive-deep"],
      },
      {
        id: "storage-premature",
        ask: "Should we use bitboards or a 2D array to represent the board internally?",
        category: "premature",
        redirect: "That's a data-structure and performance detail — get the class responsibilities right first.",
      },
    ],
  },
  design: {
    entities: [
      { id: "board", name: "Board", isEntity: true, why: "The 8x8 grid — owns the current position and knows what occupies each square." },
      { id: "piece", name: "Piece", isEntity: true, why: "A single chess piece — has a type, a color, and knows its own legal-move pattern." },
      { id: "move", name: "Move", isEntity: true, why: "A single ply — a from-square, a to-square, and enough info to represent special cases like castling or en passant." },
      { id: "player", name: "Player", isEntity: true, why: "One of the two participants — has a color and takes turns making moves." },
      { id: "game", name: "Game", isEntity: true, why: "The top-level controller — owns the Board and both Players, enforces turn order, and detects check, checkmate, and stalemate." },
      { id: "square", name: "Square", isEntity: false, why: "A coordinate, not a class with behavior of its own — Board can answer 'what's on square X' without Square needing independent identity." },
      { id: "clock", name: "Clock", isEntity: false, why: "A real tournament feature, but nobody asked for timing — adding it invents scope beyond what was requested." },
      { id: "chessset", name: "ChessSet", isEntity: false, why: "The physical pieces and board object, not the software domain model — irrelevant to this system." },
      { id: "spectator", name: "Spectator", isEntity: false, why: "An external, read-only observer with no effect on game state or rules — not a class the domain logic needs." },
      { id: "notation", name: "Notation", isEntity: false, why: "A serialization format for describing moves (like PGN), not a class in the core rules and state model itself." },
    ],
    methods: [
      { id: "m1", signature: "getPieceAt(square): Piece", ownerId: "board" },
      { id: "m2", signature: "movePiece(move): void", ownerId: "board" },
      { id: "m3", signature: "isSquareUnderAttack(square, color): boolean", ownerId: "board" },
      { id: "m4", signature: "getLegalMoves(board): List<Move>", ownerId: "piece" },
      { id: "m5", signature: "isCastling(): boolean", ownerId: "move" },
      { id: "m6", signature: "makeMove(move): void", ownerId: "player" },
      { id: "m7", signature: "isCheck(color): boolean", ownerId: "game" },
      { id: "m8", signature: "isCheckmate(color): boolean", ownerId: "game" },
      { id: "m9", signature: "switchTurn(): void", ownerId: "game" },
      { id: "m10", signature: "isValidMove(move): boolean", ownerId: "game" },
    ],
    edgeCases: [
      {
        id: "self-check",
        scenario: "A player attempts a move that would leave — or keep — their own king in check.",
        options: [
          { id: "a", label: "Allow the move since it's the piece's normal legal-move pattern.", correct: false, feedback: "A piece's raw movement pattern isn't the same as a legal chess move — a move that exposes your own king is illegal regardless of the piece's normal pattern." },
          { id: "b", label: "Reject the move — Game.isValidMove() must simulate it and confirm it doesn't leave the mover's own king in check.", correct: true, feedback: "Right — legality depends on board-wide state (is my king safe after this?), not just what one Piece can normally do, which is why this check lives on Game, not Piece." },
          { id: "c", label: "Allow it, but immediately declare the game over.", correct: false, feedback: "A self-checking move isn't a game-ending event — it's simply an illegal move that should never be permitted in the first place." },
        ],
      },
      {
        id: "promotion",
        scenario: "A pawn reaches the opposite end of the board.",
        options: [
          { id: "a", label: "Leave it as a pawn — the rules didn't say anything about promotion.", correct: false, feedback: "Pawn promotion is a core chess rule, not an optional extra — a design that silently ignores it is incomplete, not simplified." },
          { id: "b", label: "Board replaces the pawn Piece with a new Piece of the player's chosen type at that square.", correct: true, feedback: "Right — this is exactly why Piece needs a type that can change identity mid-game, handled at the Board level where the position lives." },
          { id: "c", label: "End the game immediately when any pawn reaches the last rank.", correct: false, feedback: "Reaching the last rank triggers promotion, not the end of the game — those are two different rules." },
        ],
      },
      {
        id: "castling-history",
        scenario: "Castling is requested when the king or rook has already moved earlier in the game, but is currently back in its starting square.",
        options: [
          { id: "a", label: "Allow it as long as the king and rook are currently in their starting squares.", correct: false, feedback: "Castling's rule is specifically about neither piece having EVER moved, not just currently being in the starting square." },
          { id: "b", label: "Track whether the king and rook have ever moved, and reject castling if either has, even if they're back in their starting squares now.", correct: true, feedback: "This is a case where move history — not just current position — has to be tracked to get the rule right." },
          { id: "c", label: "Allow it any time the king and rook are adjacent to their standard castling positions.", correct: false, feedback: "Position alone isn't sufficient — the rule depends on history, not just the current snapshot of the board." },
        ],
      },
      {
        id: "stalemate",
        scenario: "Neither player can make a legal move, but the player to move is NOT in check.",
        options: [
          { id: "a", label: "Declare it a win for whoever isn't in check.", correct: false, feedback: "This is a stalemate — a real, distinct chess rule — and stalemate is a DRAW, not a win for either side." },
          { id: "b", label: "Game.isCheckmate() correctly returns false here, and a separate stalemate check declares the game a draw.", correct: true, feedback: "Right — checkmate and stalemate are both 'no legal moves' but differ on whether the king is in check, and they resolve completely differently, so that distinction has to be modeled explicitly." },
          { id: "c", label: "Treat it the same as checkmate since no moves are available either way.", correct: false, feedback: "Collapsing checkmate and stalemate into one outcome gets the actual result of the game wrong — one is a loss, the other is a draw." },
        ],
      },
    ],
    relationships: [
      "Game owns one Board and two Players",
      "Board tracks which Piece occupies each square",
      "Piece generates candidate Moves; Game validates them against check and checkmate rules",
      "Player alternates turns, each producing one Move per turn",
    ],
  },
  recap: [
    "Legality in chess is board-wide, not piece-local — a move that exposes your own king is illegal no matter what the piece's normal pattern allows, which is why that check lives on Game, not Piece.",
    "Some rules depend on history, not just the current position — castling requires knowing whether a piece has EVER moved, not just where it currently sits.",
    "Checkmate and stalemate look identical ('no legal moves') but resolve completely differently — a loss versus a draw — so both conditions must be modeled and returned distinctly.",
    "The special rules — promotion, castling, en passant — are where the real design complexity is; basic movement is the easy 80%.",
  ],
  relatedLessons: ["parking-lot", "elevator-system"],
};
