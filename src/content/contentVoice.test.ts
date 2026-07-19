import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import ts from "typescript";
import { describe, expect, it } from "vitest";

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    if (!/\.tsx?$/.test(entry.name) || entry.name.endsWith(".test.ts") || entry.name.endsWith(".test.tsx")) return [];
    return [path];
  });
}

function userFacingDashes(file: string): string[] {
  const source = ts.createSourceFile(
    file,
    readFileSync(file, "utf8"),
    ts.ScriptTarget.Latest,
    true,
    file.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
  const hits: string[] = [];
  const visit = (node: ts.Node) => {
    if ((ts.isStringLiteralLike(node) || ts.isJsxText(node)) && /[—–]/.test(node.getText(source))) {
      const position = source.getLineAndCharacterOfPosition(node.getStart(source));
      hits.push(`${file}:${position.line + 1}`);
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  return hits;
}

describe("content voice", () => {
  it("keeps em and en dashes out of user-facing source text", () => {
    const hits = sourceFiles(join(process.cwd(), "src")).flatMap(userFacingDashes);
    expect(hits, `Replace long dashes in: ${hits.join(", ")}`).toEqual([]);
  });
});
