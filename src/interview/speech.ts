/**
 * Small adapters around the browser Web Speech APIs. Speech recognition is
 * intentionally kept behind an explicit user action: some browsers send
 * microphone audio to their own cloud speech service for transcription.
 */

export interface InterviewSpeechCapabilities {
  synthesis: boolean;
  recognition: boolean;
}

export interface SpeechTranscriptUpdate {
  finalText: string;
  interimText: string;
}

export type RecognitionState = "idle" | "listening" | "processing" | "error";

export const SPEECH_PRIVACY_DISCLOSURE = {
  recognition:
    "Speech recognition is provided by your browser. In Chrome, microphone audio may be sent to Google's speech service for transcription. PatternCache does not receive or store the audio. The transcript enters this answer box and, if submitted, is stored locally with the mock session.",
  playback:
    "Question playback uses browser speech synthesis and may use installed or browser-provided voices. Microphone permission is requested only after you press Start answering. Typing always remains available.",
} as const;

interface RecognitionResultLike {
  isFinal: boolean;
  0: { transcript: string };
}

interface RecognitionEventLike {
  resultIndex: number;
  results: ArrayLike<RecognitionResultLike>;
}

interface RecognitionErrorEventLike {
  error: string;
}

interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: RecognitionEventLike) => void) | null;
  onerror: ((event: RecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

interface SpeechUtteranceLike {
  rate: number;
  pitch: number;
  lang: string;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
}

type SpeechUtteranceConstructor = new (text?: string) => SpeechUtteranceLike;

interface SpeechSynthesisLike {
  speak(utterance: SpeechUtteranceLike): void;
  cancel(): void;
}

export interface InterviewSpeechEnvironment {
  speechSynthesis?: SpeechSynthesisLike;
  SpeechSynthesisUtterance?: SpeechUtteranceConstructor;
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
}

export interface RecognitionSession {
  start(): void;
  stop(): void;
  abort(): void;
}

export interface SpokenQuestion {
  cancel(): void;
}

function browserSpeechEnvironment(): InterviewSpeechEnvironment {
  const scope = globalThis as typeof globalThis & InterviewSpeechEnvironment;
  return {
    speechSynthesis: scope.speechSynthesis,
    SpeechSynthesisUtterance: scope.SpeechSynthesisUtterance,
    SpeechRecognition: scope.SpeechRecognition,
    webkitSpeechRecognition: scope.webkitSpeechRecognition,
  };
}

export function getInterviewSpeechCapabilities(
  environment: InterviewSpeechEnvironment = browserSpeechEnvironment(),
): InterviewSpeechCapabilities {
  return {
    synthesis: !!environment.speechSynthesis && !!environment.SpeechSynthesisUtterance,
    recognition: !!(environment.SpeechRecognition ?? environment.webkitSpeechRecognition),
  };
}

export function mergeSpeechTranscript(baseAnswer: string, update: SpeechTranscriptUpdate): string {
  return [baseAnswer, update.finalText, update.interimText]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ");
}

export function recognitionErrorMessage(error: string): string {
  switch (error) {
    case "not-allowed":
    case "service-not-allowed":
      return "Microphone access was blocked. Allow it in the browser's site settings, or keep typing.";
    case "audio-capture":
      return "No working microphone was available. Check the selected input device, or keep typing.";
    case "no-speech":
      return "No speech was detected. Try again and speak after the listening indicator appears.";
    case "network":
      return "The browser's speech service could not be reached. Your typed answer still works.";
    case "language-not-supported":
      return "This browser does not support English speech recognition. Your typed answer still works.";
    default:
      return "Speech recognition stopped unexpectedly. Your existing transcript is still editable.";
  }
}

export function createRecognitionSession(
  {
    onTranscript,
    onState,
    onError,
  }: {
    onTranscript: (update: SpeechTranscriptUpdate) => void;
    onState: (state: RecognitionState) => void;
    onError: (message: string) => void;
  },
  environment: InterviewSpeechEnvironment = browserSpeechEnvironment(),
): RecognitionSession | undefined {
  const Recognition = environment.SpeechRecognition ?? environment.webkitSpeechRecognition;
  if (!Recognition) return undefined;

  const recognition = new Recognition();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = "en-US";
  let finalSegments: string[] = [];
  let aborted = false;

  recognition.onresult = (event) => {
    let interimText = "";
    for (let index = event.resultIndex; index < event.results.length; index += 1) {
      const result = event.results[index];
      const transcript = result[0]?.transcript?.trim() ?? "";
      if (!transcript) continue;
      if (result.isFinal) finalSegments = [...finalSegments, transcript];
      else interimText = `${interimText} ${transcript}`.trim();
    }
    onTranscript({ finalText: finalSegments.join(" "), interimText });
  };
  recognition.onerror = (event) => {
    if (event.error === "aborted" || aborted) {
      onState("idle");
      return;
    }
    onState("error");
    onError(recognitionErrorMessage(event.error));
  };
  recognition.onend = () => onState("idle");

  return {
    start() {
      aborted = false;
      finalSegments = [];
      onState("listening");
      try {
        recognition.start();
      } catch {
        onState("error");
        onError("Speech recognition could not start. Wait a moment and try again, or keep typing.");
      }
    },
    stop() {
      onState("processing");
      recognition.stop();
    },
    abort() {
      aborted = true;
      recognition.abort();
      onState("idle");
    },
  };
}

export function speakInterviewQuestion(
  text: string,
  {
    onStart,
    onEnd,
    onError,
  }: {
    onStart: () => void;
    onEnd: () => void;
    onError: (message: string) => void;
  },
  environment: InterviewSpeechEnvironment = browserSpeechEnvironment(),
): SpokenQuestion | undefined {
  if (!environment.speechSynthesis || !environment.SpeechSynthesisUtterance) return undefined;
  environment.speechSynthesis.cancel();
  const utterance = new environment.SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  utterance.rate = 0.96;
  utterance.pitch = 1;
  utterance.onstart = onStart;
  utterance.onend = onEnd;
  utterance.onerror = () => {
    onEnd();
    onError("Question playback was interrupted. You can replay it or read the question on screen.");
  };
  environment.speechSynthesis.speak(utterance);
  return {
    cancel() {
      environment.speechSynthesis?.cancel();
      onEnd();
    },
  };
}
