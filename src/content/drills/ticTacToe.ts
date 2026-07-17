import type { ColdDrillPrompt } from "@/types";

// Compilable domain model shared by this drill's runnable Java exercises.
// Each string is a complete file; the exercise runner writes them next to
// the learner's class and compiles everything together in the browser.

const PLAYER_JAVA = `public class Player {
    private final String id;
    private final String symbol;

    public Player(String id, String symbol) {
        this.id = id;
        this.symbol = symbol;
    }

    public String getId() { return id; }
    public String getSymbol() { return symbol; }
}
`;

const GAME_STATUS_JAVA = `public enum GameStatus {
    IN_PROGRESS, X_WON, O_WON, DRAW;
}
`;

// The full Board with running-counter win detection. It is both the reference
// file for the checkWin exercise and the support Board for the makeMove one.
const BOARD_REFERENCE_JAVA = `public class Board {
    private final int size;
    private final Player[][] cells;
    private final int[] rowCounts;
    private final int[] colCounts;
    private int diagonalCount;
    private int antiDiagonalCount;

    public Board(int size) {
        this.size = size;
        this.cells = new Player[size][size];
        this.rowCounts = new int[size];
        this.colCounts = new int[size];
    }

    public int getSize() { return size; }
    public Player getCellAt(int row, int col) { return cells[row][col]; }

    public void recordMark(int row, int col, Player player) {
        cells[row][col] = player;
        int delta = player.getSymbol().equals("X") ? 1 : -1;
        rowCounts[row] += delta;
        colCounts[col] += delta;
        if (row == col) {
            diagonalCount += delta;
        }
        if (row + col == size - 1) {
            antiDiagonalCount += delta;
        }
    }

    public boolean checkWin(int row, int col) {
        if (Math.abs(rowCounts[row]) == size) {
            return true;
        }
        if (Math.abs(colCounts[col]) == size) {
            return true;
        }
        if (row == col && Math.abs(diagonalCount) == size) {
            return true;
        }
        if (row + col == size - 1 && Math.abs(antiDiagonalCount) == size) {
            return true;
        }
        return false;
    }
}
`;

export const ticTacToe: ColdDrillPrompt = {
  id: "tic-tac-toe",
  title: "Design Tic-Tac-Toe",
  prompt: "Design Tic-Tac-Toe. Two players take turns marking a grid, and first to get a line wins.",
  reference: {
    clarifyingQuestions: [
      {
        question: "Is the board a fixed 3x3, or does it need to support a configurable NxN size?",
        why: "Decides whether size is a hardcoded constant or a real field on Board, and whether win-detection can special-case 'three in a row' or must generalize. The running-counter approach only pays off once size is a variable, not a literal 3.",
      },
      {
        question: "Is this strictly two players (X and O), or does it need to support more symbols on a larger board?",
        why: "Two players keeps Player as a simple X/O pair and lets win-detection use a signed +1/-1 counter. More players turns that into a per-symbol count array, which is a real algorithmic fork, not just more data.",
      },
      {
        question: "Does a full board with no winner need to be reported as an explicit draw, or is 'no winner yet' enough?",
        why: "Decides whether GameStatus needs a DRAW value and Game needs to track a move count to detect a full board, versus leaving status at IN_PROGRESS forever with no terminal signal.",
      },
      {
        question: "Is this a single game, or does it need to track a match/series across multiple games?",
        why: "A single game needs no memory beyond the current board, but a series means Player (or a new Match class) needs to accumulate wins across games. That's scope the current model deliberately doesn't cover unless asked.",
      },
    ],
    entities: [
      {
        id: "board",
        name: "Board",
        isEntity: true,
        why: "Owns the grid itself and the running win-detection counters. It's the only class with enough state to know instantly whether the mark just placed completed a line.",
        properties: [
          { name: "size", type: "int" },
          { name: "cells", type: "Player[][]" },
          { name: "rowCounts", type: "int[]" },
          { name: "colCounts", type: "int[]" },
          { name: "diagonalCount", type: "int" },
          { name: "antiDiagonalCount", type: "int" },
        ],
      },
      {
        id: "game",
        name: "Game",
        isEntity: true,
        why: "The top-level controller. It enforces turn order and tracks whether the game has already ended.",
        properties: [
          { name: "id", type: "string" },
          { name: "board", type: "Board" },
          { name: "players", type: "List<Player>" },
          { name: "currentPlayer", type: "Player" },
          { name: "status", type: "GameStatus" },
          { name: "movesPlayed", type: "int" },
        ],
      },
      {
        id: "player",
        name: "Player",
        isEntity: true,
        why: "Represents one of the two participants and the symbol they mark the board with.",
        properties: [
          { name: "id", type: "string" },
          { name: "symbol", type: "String" },
        ],
      },
      { id: "cell", name: "Cell", isEntity: false, why: "Just a mark stored in Board's own grid. Giving it independent identity and behavior is unnecessary since Board can already answer 'what's at row, col' without Cell needing its own class." },
      { id: "referee", name: "Referee", isEntity: false, why: "Nobody asked for officiating or spectators. Game already owns turn enforcement and win detection, so a separate referee class would just duplicate a responsibility Game already has." },
      { id: "matchhistory", name: "MatchHistory", isEntity: false, why: "Tracking results across multiple games wasn't asked for. A single game's outcome lives on Game.status, and a running series record is out of scope until the clarifying question about a match/series comes back yes." },
    ],
    methods: [
      {
        id: "m1",
        signature: "recordMark(row, col, player): void",
        ownerId: "board",
        justification: "Only Board holds the grid and the running counters together, so placing a mark and updating rowCounts/colCounts/diagonal counts in the same step is Board's own state mutation. Nothing else should reach in and flip a cell or a counter directly.",
      },
      {
        id: "m2",
        signature: "checkWin(row, col): boolean",
        ownerId: "board",
        justification: "Win-detection reads the same counters recordMark() just updated. Board is the only class holding that state, so it's the only class that can answer 'did that move win' in O(1).",
        codeExercise: {
          language: "java",
          starter: "boolean checkWin(int row, int col) {\n    // your code here\n}",
          reference:
            "boolean checkWin(int row, int col) {\n    if (Math.abs(rowCounts[row]) == size) {\n        return true;\n    }\n    if (Math.abs(colCounts[col]) == size) {\n        return true;\n    }\n    if (row == col && Math.abs(diagonalCount) == size) {\n        return true;\n    }\n    if (row + col == size - 1 && Math.abs(antiDiagonalCount) == size) {\n        return true;\n    }\n    return false;\n}",
          checklist: [
            "Checks only the row and column counters for the cell just played, not every row/column on the board",
            "Only checks the main diagonal when row == col, and the anti-diagonal when row + col == size - 1, so a mark elsewhere can't win on a diagonal it isn't actually on",
            "Runs in O(1) using the running counters, and never rescans the grid to look for a line",
            "Reads size as a field rather than a hardcoded 3, so the same check works on any NxN board",
          ],
          java: {
            editClassName: "Board",
            starterFile: `public class Board {
    private final int size;
    private final Player[][] cells;
    private final int[] rowCounts;
    private final int[] colCounts;
    private int diagonalCount;
    private int antiDiagonalCount;

    public Board(int size) {
        this.size = size;
        this.cells = new Player[size][size];
        this.rowCounts = new int[size];
        this.colCounts = new int[size];
    }

    public int getSize() { return size; }
    public Player getCellAt(int row, int col) { return cells[row][col]; }

    public void recordMark(int row, int col, Player player) {
        cells[row][col] = player;
        int delta = player.getSymbol().equals("X") ? 1 : -1;
        rowCounts[row] += delta;
        colCounts[col] += delta;
        if (row == col) {
            diagonalCount += delta;
        }
        if (row + col == size - 1) {
            antiDiagonalCount += delta;
        }
    }

    public boolean checkWin(int row, int col) {
        // The running counters recordMark() maintains already hold the answer.
        // Check only the row, the column, and (when the cell actually sits on
        // one) the diagonals passing through (row, col). O(1), never rescan.
        return false;
    }
}
`,
            referenceFile: BOARD_REFERENCE_JAVA,
            support: [{ className: "Player", source: PLAYER_JAVA }],
            tests: [
              {
                id: "row-win",
                label: "completing a row is a win",
                body: `Board board = new Board(3);
Player x = new Player("p1", "X");
board.recordMark(0, 0, x);
board.recordMark(0, 1, x);
board.recordMark(0, 2, x);
boolean won = board.checkWin(0, 2);
expectedText = "win reported after X completes row 0";
actualText = won ? "win reported after X completes row 0" : "no win reported";
passed = won;`,
              },
              {
                id: "column-win",
                label: "O completing a column is a win (the signed counter works both ways)",
                body: `Board board = new Board(3);
Player o = new Player("p2", "O");
board.recordMark(0, 1, o);
board.recordMark(1, 1, o);
board.recordMark(2, 1, o);
boolean won = board.checkWin(2, 1);
expectedText = "win reported after O completes column 1";
actualText = won ? "win reported after O completes column 1" : "no win reported";
passed = won;`,
              },
              {
                id: "diagonal-win",
                label: "the main diagonal wins for a mark with row == col",
                body: `Board board = new Board(3);
Player x = new Player("p1", "X");
board.recordMark(0, 0, x);
board.recordMark(1, 1, x);
board.recordMark(2, 2, x);
boolean won = board.checkWin(2, 2);
expectedText = "win reported on the main diagonal";
actualText = won ? "win reported on the main diagonal" : "no win reported";
passed = won;`,
              },
              {
                id: "anti-diagonal-win",
                label: "the anti-diagonal wins for a mark with row + col == size - 1",
                body: `Board board = new Board(3);
Player o = new Player("p2", "O");
board.recordMark(0, 2, o);
board.recordMark(1, 1, o);
board.recordMark(2, 0, o);
boolean won = board.checkWin(2, 0);
expectedText = "win reported on the anti-diagonal";
actualText = won ? "win reported on the anti-diagonal" : "no win reported";
passed = won;`,
              },
              {
                id: "not-on-diagonal",
                label: "a mark off the diagonal must not win through the diagonal counter",
                body: `Board board = new Board(3);
Player x = new Player("p1", "X");
Player o = new Player("p2", "O");
board.recordMark(0, 0, x);
board.recordMark(1, 1, x);
board.recordMark(2, 2, x);
board.recordMark(0, 1, o);
boolean won = board.checkWin(0, 1);
expectedText = "no win for the mark at (0,1), it completes no line of its own";
actualText = won ? "reported a win for a cell that sits on no completed line" : "no win for the mark at (0,1), it completes no line of its own";
passed = !won;`,
              },
              {
                id: "scales-past-three",
                label: "a 4x4 board needs 4 in a row, not a hardcoded 3",
                body: `Board board = new Board(4);
Player x = new Player("p1", "X");
board.recordMark(1, 0, x);
board.recordMark(1, 1, x);
board.recordMark(1, 2, x);
boolean early = board.checkWin(1, 2);
board.recordMark(1, 3, x);
boolean completed = board.checkWin(1, 3);
expectedText = "no win at 3 marks, win once all 4 are down";
if (early) {
    actualText = "reported a win after only 3 marks on a 4x4 board";
} else if (!completed) {
    actualText = "no win reported even with the full row of 4";
} else {
    actualText = "no win at 3 marks, win once all 4 are down";
}
passed = !early && completed;`,
              },
            ],
          },
        },
      },
      {
        id: "m3",
        signature: "getCellAt(row, col): Player",
        ownerId: "board",
        justification: "A plain accessor into Board's own grid. Reading what's at a square is Board's data, not a decision, so it belongs on the class that actually holds the grid.",
      },
      {
        id: "m4",
        signature: "isFull(): boolean",
        ownerId: "board",
        justification: "Whether every cell is occupied is derived entirely from Board's own grid. No other class has enough visibility to answer this without reaching into Board's internals.",
      },
      {
        id: "m5",
        signature: "makeMove(row, col, player): boolean",
        ownerId: "game",
        justification: "Making a move touches turn order, game-over status, and the board all at once. Game is the only class positioned to enforce 'is it this player's turn and is the game still on' before ever touching Board.",
        codeExercise: {
          language: "java",
          starter: "boolean makeMove(int row, int col, Player player) {\n    // your code here\n}",
          reference:
            "boolean makeMove(int row, int col, Player player) {\n    if (status != GameStatus.IN_PROGRESS) {\n        throw new IllegalStateException(\"Game is already over\");\n    }\n    if (board.getCellAt(row, col) != null) {\n        throw new IllegalStateException(\"Cell is already occupied\");\n    }\n    board.recordMark(row, col, player);\n    movesPlayed++;\n    if (board.checkWin(row, col)) {\n        status = player.getSymbol().equals(\"X\") ? GameStatus.X_WON : GameStatus.O_WON;\n        return true;\n    }\n    if (movesPlayed == board.getSize() * board.getSize()) {\n        status = GameStatus.DRAW;\n    } else {\n        switchTurn();\n    }\n    return false;\n}",
          checklist: [
            "Rejects a move on an already-occupied cell before mutating anything",
            "Rejects a move once the game already has a winner or already ended in a draw",
            "Checks for a win immediately after recording the mark, using Board's O(1) checkWin() instead of a full rescan",
            "Only switches turns when the game is still in progress, since a winning or board-filling move shouldn't hand the turn to the other player",
          ],
          java: {
            editClassName: "Game",
            starterFile: `import java.util.Arrays;
import java.util.List;

public class Game {
    private final String id;
    private final Board board;
    private final List<Player> players;
    private Player currentPlayer;
    private GameStatus status;
    private int movesPlayed;

    public Game(String id, Board board, Player playerX, Player playerO) {
        this.id = id;
        this.board = board;
        this.players = Arrays.asList(playerX, playerO);
        this.currentPlayer = playerX;
        this.status = GameStatus.IN_PROGRESS;
        this.movesPlayed = 0;
    }

    public GameStatus getStatus() { return status; }
    public Player getCurrentPlayer() { return currentPlayer; }

    private void switchTurn() {
        currentPlayer = currentPlayer == players.get(0) ? players.get(1) : players.get(0);
    }

    public boolean makeMove(int row, int col, Player player) {
        // Reject a move once the game is over, and a mark on an occupied cell
        // (both are IllegalStateException). Record the mark, then let
        // board.checkWin(row, col) decide: a win sets status and returns true,
        // a full board sets DRAW, and any other move hands the turn over.
        return false;
    }
}
`,
            referenceFile: `import java.util.Arrays;
import java.util.List;

public class Game {
    private final String id;
    private final Board board;
    private final List<Player> players;
    private Player currentPlayer;
    private GameStatus status;
    private int movesPlayed;

    public Game(String id, Board board, Player playerX, Player playerO) {
        this.id = id;
        this.board = board;
        this.players = Arrays.asList(playerX, playerO);
        this.currentPlayer = playerX;
        this.status = GameStatus.IN_PROGRESS;
        this.movesPlayed = 0;
    }

    public GameStatus getStatus() { return status; }
    public Player getCurrentPlayer() { return currentPlayer; }

    private void switchTurn() {
        currentPlayer = currentPlayer == players.get(0) ? players.get(1) : players.get(0);
    }

    public boolean makeMove(int row, int col, Player player) {
        if (status != GameStatus.IN_PROGRESS) {
            throw new IllegalStateException("Game is already over");
        }
        if (board.getCellAt(row, col) != null) {
            throw new IllegalStateException("Cell is already occupied");
        }
        board.recordMark(row, col, player);
        movesPlayed++;
        if (board.checkWin(row, col)) {
            status = player.getSymbol().equals("X") ? GameStatus.X_WON : GameStatus.O_WON;
            return true;
        }
        if (movesPlayed == board.getSize() * board.getSize()) {
            status = GameStatus.DRAW;
        } else {
            switchTurn();
        }
        return false;
    }
}
`,
            support: [
              { className: "Player", source: PLAYER_JAVA },
              { className: "GameStatus", source: GAME_STATUS_JAVA },
              { className: "Board", source: BOARD_REFERENCE_JAVA },
            ],
            tests: [
              {
                id: "winning-move-ends-game",
                label: "the winning mark returns true and flips status to X_WON",
                body: `Board board = new Board(3);
Player x = new Player("p1", "X");
Player o = new Player("p2", "O");
Game game = new Game("g1", board, x, o);
game.makeMove(0, 0, x);
game.makeMove(1, 0, o);
game.makeMove(0, 1, x);
game.makeMove(1, 1, o);
boolean winner = game.makeMove(0, 2, x);
expectedText = "makeMove returns true and status is X_WON";
if (!winner) {
    actualText = "makeMove returned false for the winning mark (status " + game.getStatus() + ")";
} else if (game.getStatus() != GameStatus.X_WON) {
    actualText = "returned true but status is " + game.getStatus();
} else {
    actualText = "makeMove returns true and status is X_WON";
}
passed = winner && game.getStatus() == GameStatus.X_WON;`,
              },
              {
                id: "rejects-occupied-cell",
                label: "a mark on an occupied cell fails loudly and never overwrites",
                body: `Board board = new Board(3);
Player x = new Player("p1", "X");
Player o = new Player("p2", "O");
Game game = new Game("g1", board, x, o);
game.makeMove(1, 1, x);
expectedText = "IllegalStateException and the cell still belongs to X";
try {
    game.makeMove(1, 1, o);
    actualText = "no exception, O was allowed onto an occupied cell";
    passed = false;
} catch (IllegalStateException expectedFailure) {
    Player occupant = board.getCellAt(1, 1);
    boolean stillX = occupant != null && occupant.getSymbol().equals("X");
    actualText = stillX ? "IllegalStateException and the cell still belongs to X" : "exception thrown but the cell no longer belongs to X";
    passed = stillX;
}`,
              },
              {
                id: "rejects-after-game-over",
                label: "no more moves once the game already has a winner",
                body: `Board board = new Board(3);
Player x = new Player("p1", "X");
Player o = new Player("p2", "O");
Game game = new Game("g1", board, x, o);
game.makeMove(0, 0, x);
game.makeMove(0, 2, o);
game.makeMove(1, 1, x);
game.makeMove(1, 2, o);
game.makeMove(2, 1, x);
game.makeMove(2, 2, o);
expectedText = "status O_WON and IllegalStateException for a move after the game ended";
try {
    game.makeMove(2, 0, x);
    actualText = "the move after the game ended was allowed (status " + game.getStatus() + ")";
    passed = false;
} catch (IllegalStateException expectedFailure) {
    boolean oWon = game.getStatus() == GameStatus.O_WON;
    actualText = oWon ? "status O_WON and IllegalStateException for a move after the game ended" : "exception thrown but status is " + game.getStatus();
    passed = oWon;
}`,
              },
              {
                id: "switches-turn-after-plain-move",
                label: "a non-winning move hands the turn to the other player",
                body: `Board board = new Board(3);
Player x = new Player("p1", "X");
Player o = new Player("p2", "O");
Game game = new Game("g1", board, x, o);
game.makeMove(0, 0, x);
Player next = game.getCurrentPlayer();
expectedText = "turn belongs to O";
actualText = next == null ? "no current player" : "turn belongs to " + next.getSymbol();
passed = next != null && next.getSymbol().equals("O");`,
              },
              {
                id: "full-board-is-draw",
                label: "the ninth mark with no line sets DRAW instead of staying IN_PROGRESS",
                body: `Board board = new Board(3);
Player x = new Player("p1", "X");
Player o = new Player("p2", "O");
Game game = new Game("g1", board, x, o);
game.makeMove(0, 0, x);
game.makeMove(0, 1, o);
game.makeMove(0, 2, x);
game.makeMove(1, 1, o);
game.makeMove(1, 0, x);
game.makeMove(1, 2, o);
game.makeMove(2, 1, x);
game.makeMove(2, 0, o);
boolean lastMove = game.makeMove(2, 2, x);
expectedText = "status DRAW and false returned on the ninth mark";
if (lastMove) {
    actualText = "the ninth mark was reported as a win";
} else {
    actualText = "false returned and status is " + game.getStatus();
}
passed = !lastMove && game.getStatus() == GameStatus.DRAW;`,
              },
              {
                id: "win-keeps-the-turn",
                label: "a winning move must not hand the turn to the loser",
                body: `Board board = new Board(3);
Player x = new Player("p1", "X");
Player o = new Player("p2", "O");
Game game = new Game("g1", board, x, o);
game.makeMove(0, 0, x);
game.makeMove(1, 0, o);
game.makeMove(0, 1, x);
game.makeMove(1, 1, o);
game.makeMove(0, 2, x);
Player current = game.getCurrentPlayer();
boolean stillX = current != null && current.getSymbol().equals("X");
expectedText = "status X_WON and the turn never passed to O";
if (game.getStatus() != GameStatus.X_WON) {
    actualText = "status is " + game.getStatus();
} else {
    actualText = stillX ? "status X_WON and the turn never passed to O" : "the winning move handed the turn to O";
}
passed = game.getStatus() == GameStatus.X_WON && stillX;`,
              },
            ],
          },
        },
      },
      {
        id: "m6",
        signature: "switchTurn(): void",
        ownerId: "game",
        justification: "currentPlayer is Game's own turn-tracking field; only Game should be the one thing that flips whose turn it is, so two callers can't disagree about who moves next.",
      },
      {
        id: "m7",
        signature: "getCurrentPlayer(): Player",
        ownerId: "game",
        justification: "A plain accessor onto Game's own currentPlayer field. Reading whose turn it is doesn't require any other class's state.",
      },
      {
        id: "m8",
        signature: "getSymbol(): String",
        ownerId: "player",
        justification: "Symbol is data Player itself holds. It's a plain accessor, not a decision, so it belongs on the object whose field it's reading.",
      },
    ],
    relationships: ["Game owns one Board", "Game owns two Players", "Board tracks per-row, per-column, and per-diagonal counters alongside its grid"],
    edgeCases: [
      {
        scenario: "A player tries to mark a cell that's already occupied.",
        handling: "makeMove() checks board.getCellAt(row, col) for null before recording anything. An occupied cell rejects the move immediately, and it never silently overwrites the existing mark.",
      },
      {
        scenario: "A player tries to move after the game already has a winner.",
        handling: "makeMove() checks status != IN_PROGRESS first and rejects the move outright. Once status flips to X_WON, O_WON, or DRAW, no further mutation is allowed.",
      },
      {
        scenario: "The board fills completely with no line ever completed.",
        handling: "Game tracks movesPlayed and compares it to size*size right after a mark that didn't win. Reaching the max with no win sets status to DRAW instead of leaving the game silently stuck at IN_PROGRESS forever.",
      },
      {
        scenario: "The board size changes from 3x3 to a much larger NxN. Does win-detection still work?",
        handling: "Because checkWin() reads size from Board's own field and compares counters against it rather than hardcoding the number 3, the exact same O(1) logic scales to any NxN board with no code changes.",
      },
    ],
    tradeoffs: [
      {
        decision: "Win-detection uses running per-row/column/diagonal counters updated on every move, instead of rescanning the whole board after each move.",
        reasoning: "The rescan approach is the 'naive' first pass interviewers expect you to name and move past: O(size) per move, re-deriving information the game already has. The counter approach is what actually impresses: O(1) per move by maintaining just 2*size + 2 integers instead of touching every cell again.",
      },
      {
        decision: "Player is a real class with a symbol field instead of encoding X/O as a raw boolean or char scattered through Game and Board.",
        reasoning: "A raw 'isPlayerOneTurn' boolean works for exactly two players but breaks the moment a third symbol or a series/rematch feature comes up. Player as a class is the one-line-cheaper-now decision that costs more later.",
      },
      {
        decision: "Board owns and updates the win-detection counters itself (via recordMark), instead of Game maintaining them externally.",
        reasoning: "Counters are derived entirely from marks on the grid, which is data only Board holds. Keeping them on Board means Game never has to keep two representations of the same fact in sync.",
      },
    ],
    principles: [
      {
        name: "Single Responsibility Principle",
        explanation: "Board only knows about the grid and win-detection counters, and Game only knows about turn order and overall game status. Neither reaches into the other's job.",
      },
      {
        name: "Encapsulation",
        explanation: "Board.recordMark() is the only way a cell or a counter changes. Nothing else reaches in and flips cells[row][col] or rowCounts[row] directly, so the counters can never drift out of sync with the actual grid.",
      },
      {
        name: "Algorithmic efficiency as a design decision",
        explanation: "Choosing running counters over a full rescan isn't an optimization bolted on afterward. It's why Board needs rowCounts/colCounts/diagonalCount/antiDiagonalCount as real fields in the first place, not just a to-do.",
      },
      {
        name: "Generalization over hardcoding",
        explanation: "size is a field on Board, not a literal 3, and checkWin()'s diagonal checks use row == col / row + col == size - 1 instead of hardcoded coordinates. So the exact same class handles a 3x3 or a 15x15 board with no code changes.",
      },
    ],
  },
};
