import { useState } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { java } from "@codemirror/lang-java";
import { vscodeDark } from "@uiw/codemirror-theme-vscode";
import type { CodeExercise } from "@/types";
import { color, font, radius } from "@/theme/tokens";
import { Button, Eyebrow, Divider } from "./ui";
import { Icon } from "./Icon";

/** Commit-then-compare code exercise for the handful of methods with real
 * logic. Not auto-graded — there's no backend to execute arbitrary code
 * against, and this is meant to be practiced in the learner's own interview
 * language, not a JS-only sandbox. Same "commit, then see ground truth"
 * shape as the reasoning reveal in <ClassModeler/>, extended into code.
 * Lives in its own file and is lazy-loaded from there — CodeMirror + a
 * language grammar are heavy enough that DSA/SD lessons shouldn't pay for
 * them on first load. */
export default function CodeExerciseBlock({ exercise }: { exercise: CodeExercise }) {
  const [code, setCode] = useState(exercise.starter);
  const [revealed, setRevealed] = useState(false);
  const [checked, setChecked] = useState<Set<number>>(new Set());

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <Divider />
      <Eyebrow tone={color.teal}>Now write it — {exercise.language}</Eyebrow>
      <div style={{ border: `1px solid ${color.hairline}`, borderRadius: radius.md, overflow: "hidden" }}>
        <CodeMirror
          value={code}
          height="150px"
          theme={vscodeDark}
          extensions={[java()]}
          onChange={setCode}
          basicSetup={{ lineNumbers: true, foldGutter: false, highlightActiveLine: false }}
          style={{ fontSize: 13 }}
        />
      </div>

      {!revealed ? (
        <div>
          <Button variant="subtle" onClick={() => setRevealed(true)}>
            Compare against a reference solution
          </Button>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          <span style={{ fontSize: 11, color: color.textFaint, fontFamily: font.mono }}>Reference solution</span>
          <div style={{ border: `1px solid ${color.hairline}`, borderRadius: radius.md, overflow: "hidden" }}>
            <CodeMirror
              value={exercise.reference}
              theme={vscodeDark}
              extensions={[java()]}
              editable={false}
              basicSetup={{ lineNumbers: true, foldGutter: false, highlightActiveLine: false }}
              style={{ fontSize: 13 }}
            />
          </div>
          <div style={{ display: "grid", gap: 7 }}>
            <Eyebrow>Does your version handle all of this?</Eyebrow>
            {exercise.checklist.map((item, i) => {
              const isChecked = checked.has(i);
              return (
                <button
                  key={i}
                  onClick={() =>
                    setChecked((s) => {
                      const next = new Set(s);
                      if (next.has(i)) next.delete(i);
                      else next.add(i);
                      return next;
                    })
                  }
                  style={{ display: "flex", alignItems: "flex-start", gap: 8, textAlign: "left", background: "none", border: "none", padding: 0, cursor: "pointer" }}
                >
                  <span
                    style={{
                      width: 15,
                      height: 15,
                      flexShrink: 0,
                      marginTop: 2,
                      borderRadius: 4,
                      border: `1.5px solid ${isChecked ? color.green : color.panelBorder}`,
                      background: isChecked ? "rgba(130,184,114,0.15)" : "transparent",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {isChecked && <Icon name="check" size={10} color={color.green} strokeWidth={3} />}
                  </span>
                  <span style={{ fontSize: 12.5, color: isChecked ? color.textFaint : color.textDim, textDecoration: isChecked ? "line-through" : "none", lineHeight: 1.5 }}>
                    {item}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
