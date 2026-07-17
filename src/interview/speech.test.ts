import { beforeEach, describe, expect, it } from "vitest";
import {
  createRecognitionSession,
  getInterviewSpeechCapabilities,
  mergeSpeechTranscript,
  recognitionErrorMessage,
  SPEECH_PRIVACY_DISCLOSURE,
  speakInterviewQuestion,
} from "./speech";
import type { InterviewSpeechEnvironment, RecognitionState, SpeechTranscriptUpdate } from "./speech";

class FakeRecognition {
  static latest: FakeRecognition;
  continuous = false;
  interimResults = false;
  lang = "";
  onresult: ((event: never) => void) | null = null;
  onerror: ((event: never) => void) | null = null;
  onend: (() => void) | null = null;
  started = 0;
  stopped = 0;
  aborted = 0;
  throwOnStart = false;

  constructor() {
    FakeRecognition.latest = this;
  }

  start() {
    if (this.throwOnStart) throw new Error("already active");
    this.started += 1;
  }

  stop() {
    this.stopped += 1;
  }

  abort() {
    this.aborted += 1;
  }

  emitResults(resultIndex: number, results: Array<{ transcript: string; isFinal: boolean }>) {
    this.onresult?.({
      resultIndex,
      results: results.map((result) => ({ 0: { transcript: result.transcript }, isFinal: result.isFinal })),
    } as never);
  }

  emitError(error: string) {
    this.onerror?.({ error } as never);
  }

  end() {
    this.onend?.();
  }
}

class FakeUtterance {
  static latest: FakeUtterance;
  readonly text: string;
  rate = 1;
  pitch = 1;
  lang = "";
  onstart: (() => void) | null = null;
  onend: (() => void) | null = null;
  onerror: (() => void) | null = null;

  constructor(text = "") {
    this.text = text;
    FakeUtterance.latest = this;
  }
}

function recognitionEnvironment(useWebkit = false): InterviewSpeechEnvironment {
  return useWebkit
    ? { webkitSpeechRecognition: FakeRecognition as never }
    : { SpeechRecognition: FakeRecognition as never };
}

function synthesisEnvironment() {
  const synthesis = {
    spoken: [] as FakeUtterance[],
    cancelCount: 0,
    speak(utterance: FakeUtterance) {
      this.spoken.push(utterance);
    },
    cancel() {
      this.cancelCount += 1;
    },
  };
  return {
    environment: {
      speechSynthesis: synthesis as never,
      SpeechSynthesisUtterance: FakeUtterance as never,
    } satisfies InterviewSpeechEnvironment,
    synthesis,
  };
}

beforeEach(() => {
  FakeRecognition.latest = undefined as never;
  FakeUtterance.latest = undefined as never;
});

describe("speech capabilities and transcript merging", () => {
  it("keeps the cloud-audio and local-transcript disclosure explicit", () => {
    expect(SPEECH_PRIVACY_DISCLOSURE.recognition).toContain("sent to Google's speech service");
    expect(SPEECH_PRIVACY_DISCLOSURE.recognition).toContain("does not receive or store the audio");
    expect(SPEECH_PRIVACY_DISCLOSURE.recognition).toContain("stored locally");
    expect(SPEECH_PRIVACY_DISCLOSURE.playback).toContain("permission is requested only after");
  });

  it("detects standard and prefixed recognition independently from playback", () => {
    expect(getInterviewSpeechCapabilities({})).toEqual({ synthesis: false, recognition: false });
    expect(getInterviewSpeechCapabilities(recognitionEnvironment())).toEqual({ synthesis: false, recognition: true });
    expect(getInterviewSpeechCapabilities(recognitionEnvironment(true))).toEqual({ synthesis: false, recognition: true });
    expect(getInterviewSpeechCapabilities(synthesisEnvironment().environment)).toEqual({ synthesis: true, recognition: false });
  });

  it("keeps an existing typed answer, finalized speech, and the current live fragment in order", () => {
    expect(mergeSpeechTranscript("I owned the service.", {
      finalText: "Then I traced the query.",
      interimText: "the result was",
    })).toBe("I owned the service. Then I traced the query. the result was");
    expect(mergeSpeechTranscript("", { finalText: "  hello   world ", interimText: "" })).toBe("hello world");
  });
});

describe("recognition session", () => {
  it("configures continuous English recognition and separates final from interim text", () => {
    const states: RecognitionState[] = [];
    const updates: SpeechTranscriptUpdate[] = [];
    const errors: string[] = [];
    const session = createRecognitionSession({
      onTranscript: (update) => updates.push(update),
      onState: (state) => states.push(state),
      onError: (message) => errors.push(message),
    }, recognitionEnvironment())!;

    session.start();
    expect(FakeRecognition.latest).toMatchObject({
      continuous: true,
      interimResults: true,
      lang: "en-US",
      started: 1,
    });
    FakeRecognition.latest.emitResults(0, [
      { transcript: "I owned the migration", isFinal: true },
      { transcript: "and reduced", isFinal: false },
    ]);
    FakeRecognition.latest.emitResults(1, [
      { transcript: "ignored prior result", isFinal: true },
      { transcript: "errors by 30 percent", isFinal: true },
    ]);

    expect(updates).toEqual([
      { finalText: "I owned the migration", interimText: "and reduced" },
      { finalText: "I owned the migration errors by 30 percent", interimText: "" },
    ]);
    session.stop();
    FakeRecognition.latest.end();
    expect(states).toEqual(["listening", "processing", "idle"]);
    expect(errors).toEqual([]);
  });

  it("maps permission, microphone, no-speech, and network failures into actionable copy", () => {
    expect(recognitionErrorMessage("not-allowed")).toContain("site settings");
    expect(recognitionErrorMessage("audio-capture")).toContain("microphone");
    expect(recognitionErrorMessage("no-speech")).toContain("No speech");
    expect(recognitionErrorMessage("network")).toContain("speech service");

    const states: RecognitionState[] = [];
    const errors: string[] = [];
    createRecognitionSession({
      onTranscript: () => undefined,
      onState: (state) => states.push(state),
      onError: (message) => errors.push(message),
    }, recognitionEnvironment())!.start();
    FakeRecognition.latest.emitError("not-allowed");
    expect(states[states.length - 1]).toBe("error");
    expect(errors[0]).toContain("Microphone access was blocked");
  });

  it("treats an intentional abort as idle and does not show a false failure", () => {
    const states: RecognitionState[] = [];
    const errors: string[] = [];
    const session = createRecognitionSession({
      onTranscript: () => undefined,
      onState: (state) => states.push(state),
      onError: (message) => errors.push(message),
    }, recognitionEnvironment())!;
    session.start();
    session.abort();
    FakeRecognition.latest.emitError("aborted");
    expect(states[states.length - 1]).toBe("idle");
    expect(errors).toEqual([]);
  });

  it("returns undefined when recognition is unsupported", () => {
    expect(createRecognitionSession({
      onTranscript: () => undefined,
      onState: () => undefined,
      onError: () => undefined,
    }, {})).toBeUndefined();
  });
});

describe("question playback", () => {
  it("cancels old speech, configures a calm English voice, and reports lifecycle events", () => {
    const { environment, synthesis } = synthesisEnvironment();
    const lifecycle: string[] = [];
    const spoken = speakInterviewQuestion("Tell me about a difficult trade-off.", {
      onStart: () => lifecycle.push("start"),
      onEnd: () => lifecycle.push("end"),
      onError: (message) => lifecycle.push(message),
    }, environment)!;

    expect(synthesis.cancelCount).toBe(1);
    expect(synthesis.spoken).toHaveLength(1);
    expect(FakeUtterance.latest).toMatchObject({
      text: "Tell me about a difficult trade-off.",
      lang: "en-US",
      rate: 0.96,
      pitch: 1,
    });
    FakeUtterance.latest.onstart?.();
    FakeUtterance.latest.onend?.();
    expect(lifecycle).toEqual(["start", "end"]);
    spoken.cancel();
    expect(synthesis.cancelCount).toBe(2);
  });

  it("keeps playback failure non-blocking", () => {
    const { environment } = synthesisEnvironment();
    const errors: string[] = [];
    speakInterviewQuestion("Question", {
      onStart: () => undefined,
      onEnd: () => undefined,
      onError: (message) => errors.push(message),
    }, environment);
    FakeUtterance.latest.onerror?.();
    expect(errors[0]).toContain("playback was interrupted");
    expect(speakInterviewQuestion("Question", {
      onStart: () => undefined,
      onEnd: () => undefined,
      onError: () => undefined,
    }, {})).toBeUndefined();
  });
});
