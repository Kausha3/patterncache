import type { DSALesson } from "@/types";

export const bfs: DSALesson = {
  id: "bfs",
  track: "dsa",
  title: "BFS / Shortest Path",
  blurb: "Explore in rings. The first time you reach the goal, that's the shortest way.",
  estMinutes: 5,
  concept: {
    bruteForce:
      "To find the fewest steps through a maze, you could follow every route to the end and keep the shortest. But that commits to one direction at a time and can wander deep down a long corridor before ever discovering a short path beside it.",
    bruteForceComplexity: "exponential",
    insight:
      "Explore in rings of equal distance. A FIFO queue always hands back the nearest unexplored cell next, so cells come out in strict distance order. The first time you dequeue the target, you've reached it in the fewest possible steps, because no route is ever explored out of order.",
    complexity: "O(V + E)",
    recognize:
      "Reach for BFS on any 'fewest moves' or shortest-path question over an unweighted grid or graph, where every step costs the same and you want the minimum number of them.",
  },
  trace: {
    input: "S..#./.#.#./.#.../.###./...#T",
    algorithm: "bfs",
    goal: "Shortest path from S to T",
  },
  practice: {
    input: "S...T/.###./.....",
    goal: "You control the queue. Reach T in the fewest steps.",
  },
  recap: [
    "BFS explores in order of distance, so the first time it touches the target, that's the shortest path. That's true by construction, not because anything checked it.",
    "The FIFO queue is the whole trick: oldest-first keeps exploration shallow and even; pulling newest-first turns it into DFS and loses the guarantee.",
    "Recognize it on any 'fewest moves' or shortest-path question over an unweighted grid or graph.",
  ],
  relatedLessons: ["two-pointer", "sliding-window"],
};
