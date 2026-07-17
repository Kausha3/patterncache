import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button, Eyebrow } from "@/components/ui";
import {
  createRecognitionSession,
  getInterviewSpeechCapabilities,
  mergeSpeechTranscript,
  SPEECH_PRIVACY_DISCLOSURE,
  speakInterviewQuestion,
} from "@/interview/speech";
import type { RecognitionSession, RecognitionState, SpokenQuestion } from "@/interview/speech";
import { color, font, radius } from "@/theme/tokens";

type VoiceMode = "off" | "consent" | "enabled";

export function InterviewSpeechControls({
  questionId,
  question,
  answer,
  onAnswerChange,
  disabled,
}: {
  questionId: string;
  question: string;
  answer: string;
  onAnswerChange: (answer: string) => void;
  disabled: boolean;
}) {
  const capabilities = useMemo(() => getInterviewSpeechCapabilities(), []);
  const [mode, setMode] = useState<VoiceMode>("off");
  const [recognitionState, setRecognitionState] = useState<RecognitionState>("idle");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [message, setMessage] = useState<string>();
  const recognitionRef = useRef<RecognitionSession>();
  const spokenQuestionRef = useRef<SpokenQuestion>();
  const baseAnswerRef = useRef("");
  const modeRef = useRef<VoiceMode>("off");

  const stopRecognition = useCallback((abort = false) => {
    const active = recognitionRef.current;
    if (!active) return;
    if (abort) active.abort();
    else active.stop();
    if (abort) recognitionRef.current = undefined;
  }, []);

  const stopQuestion = useCallback(() => {
    spokenQuestionRef.current?.cancel();
    spokenQuestionRef.current = undefined;
    setIsSpeaking(false);
  }, []);

  const playQuestion = useCallback((text: string) => {
    stopQuestion();
    setMessage(undefined);
    const spoken = speakInterviewQuestion(text, {
      onStart: () => setIsSpeaking(true),
      onEnd: () => setIsSpeaking(false),
      onError: setMessage,
    });
    if (!spoken) {
      setMessage("Question playback is unavailable in this browser. The written question remains available.");
      return;
    }
    spokenQuestionRef.current = spoken;
  }, [stopQuestion]);

  useEffect(() => {
    stopRecognition(true);
    stopQuestion();
    setRecognitionState("idle");
    setMessage(undefined);
    if (modeRef.current === "enabled" && capabilities.synthesis) playQuestion(question);
  }, [capabilities.synthesis, playQuestion, question, questionId, stopQuestion, stopRecognition]);

  useEffect(() => {
    if (!disabled) return;
    stopRecognition(true);
    stopQuestion();
  }, [disabled, stopQuestion, stopRecognition]);

  useEffect(() => () => {
    recognitionRef.current?.abort();
    spokenQuestionRef.current?.cancel();
  }, []);

  const enableMode = () => {
    modeRef.current = "enabled";
    setMode("enabled");
    setMessage(undefined);
    if (capabilities.synthesis) playQuestion(question);
  };

  const disableMode = () => {
    modeRef.current = "off";
    setMode("off");
    stopRecognition(true);
    stopQuestion();
    setMessage(undefined);
  };

  const startAnswering = () => {
    stopQuestion();
    setMessage(undefined);
    baseAnswerRef.current = answer.trim();
    const session = createRecognitionSession({
      onTranscript: (update) => onAnswerChange(mergeSpeechTranscript(baseAnswerRef.current, update)),
      onState: setRecognitionState,
      onError: setMessage,
    });
    if (!session) {
      setRecognitionState("error");
      setMessage("Voice transcription is unavailable in this browser. Your answer box still works normally.");
      return;
    }
    recognitionRef.current = session;
    session.start();
  };

  const stopAnswering = () => stopRecognition(false);

  if (mode === "off") {
    return (
      <button
        type="button"
        onClick={() => setMode("consent")}
        disabled={disabled}
        style={QUIET_BUTTON}
      >
        Try speaking mode
      </button>
    );
  }

  if (mode === "consent") {
    const unavailable = !capabilities.synthesis && !capabilities.recognition;
    return (
      <section aria-labelledby="voice-privacy-title" style={NOTICE_STYLE}>
        <Eyebrow tone={color.amber}>Before the microphone turns on</Eyebrow>
        <strong id="voice-privacy-title" style={{ fontSize: 13.5 }}>Know where your voice may go</strong>
        <p style={NOTICE_COPY_STYLE}>
          {SPEECH_PRIVACY_DISCLOSURE.recognition}
        </p>
        <p style={NOTICE_COPY_STYLE}>
          {SPEECH_PRIVACY_DISCLOSURE.playback}
        </p>
        {unavailable ? (
          <p role="status" style={{ ...NOTICE_COPY_STYLE, color: color.red }}>
            This browser exposes neither speech playback nor transcription. You can continue with the typed interview.
          </p>
        ) : null}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Button icon="microphone" onClick={enableMode} disabled={unavailable}>Enable speaking mode</Button>
          <Button variant="ghost" onClick={() => setMode("off")}>Keep typing</Button>
        </div>
      </section>
    );
  }

  const listening = recognitionState === "listening";
  const processing = recognitionState === "processing";
  return (
    <section aria-label="Speaking mode" style={ENABLED_STYLE}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
        <span style={{ fontFamily: font.mono, fontSize: 11, fontWeight: 700, color: color.green }}>
          Speaking mode on
        </span>
        <button type="button" onClick={disableMode} style={QUIET_BUTTON}>Turn off</button>
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <Button
          variant="subtle"
          icon={isSpeaking ? "pause" : "volume"}
          onClick={() => (isSpeaking ? stopQuestion() : playQuestion(question))}
          disabled={!capabilities.synthesis || disabled}
        >
          {isSpeaking ? "Stop question" : "Replay question"}
        </Button>
        <Button
          icon={listening ? "pause" : "microphone"}
          onClick={listening ? stopAnswering : startAnswering}
          disabled={!capabilities.recognition || processing || disabled}
        >
          {listening ? "Stop and edit transcript" : processing ? "Finishing transcript…" : "Start answering"}
        </Button>
        <span style={{ fontFamily: font.mono, fontSize: 10.5, color: listening ? color.red : color.textFaint }}>
          {listening ? "Listening now · speak naturally" : "No audio is recorded by PatternCache"}
        </span>
      </div>
      <p aria-live="polite" style={{ margin: 0, minHeight: 18, fontSize: 11.5, color: message ? color.amber : color.textDim }}>
        {message ?? (listening
          ? "Your words appear live in the answer box. Stop listening before editing them."
          : "Replay the prompt, answer out loud, then edit the transcript before submitting.")}
      </p>
    </section>
  );
}

const QUIET_BUTTON = {
  width: "fit-content",
  padding: 0,
  border: "none",
  background: "none",
  color: color.violet,
  fontFamily: font.mono,
  fontSize: 11.5,
  fontWeight: 650,
  cursor: "pointer",
} as const;

const NOTICE_STYLE = {
  display: "grid",
  gap: 9,
  padding: 14,
  border: `1px solid ${color.amber}55`,
  borderRadius: radius.md,
  background: "rgba(240, 182, 91, 0.07)",
} as const;

const NOTICE_COPY_STYLE = {
  margin: 0,
  maxWidth: 760,
  color: color.textDim,
  fontSize: 11.5,
  lineHeight: 1.55,
} as const;

const ENABLED_STYLE = {
  display: "grid",
  gap: 10,
  padding: 12,
  border: `1px solid ${color.green}44`,
  borderRadius: radius.md,
  background: "rgba(89, 201, 165, 0.06)",
} as const;
