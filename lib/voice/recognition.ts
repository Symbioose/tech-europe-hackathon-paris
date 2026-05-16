type Listener = (text: string) => void;

// Web Speech API types not fully in TS dom lib — inline minimal shapes.
interface SpeechRecognitionResultItem {
  readonly transcript: string;
  readonly confidence: number;
}

interface SpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly length: number;
  item(index: number): SpeechRecognitionResultItem;
  [index: number]: SpeechRecognitionResultItem;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
}

interface WebSpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
}

export function isSupported(): boolean {
  if (typeof window === "undefined") return false;
  return "SpeechRecognition" in window || "webkitSpeechRecognition" in window;
}

export function createRecognition(opts: {
  lang?: string;
  onInterim?: Listener;
  onFinal?: Listener;
  onError?: (msg: string) => void;
}) {
  if (!isSupported()) {
    return {
      start: () => opts.onError?.("Speech recognition not supported in this browser"),
      stop: () => {},
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const SpeechRecognitionCtor = (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition;
  const rec = new SpeechRecognitionCtor() as WebSpeechRecognition;
  rec.continuous = false;
  rec.interimResults = true;
  rec.lang = opts.lang ?? "en-US";

  rec.onresult = (event: SpeechRecognitionEvent) => {
    let interim = "";
    let final = "";
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const result = event.results[i];
      if (result.isFinal) {
        final += result[0].transcript;
      } else {
        interim += result[0].transcript;
      }
    }
    if (interim) opts.onInterim?.(interim);
    if (final) opts.onFinal?.(final);
  };

  rec.onerror = (event: SpeechRecognitionErrorEvent) => {
    opts.onError?.(event.error ?? "Speech recognition error");
  };

  return {
    start: () => {
      try {
        rec.start();
      } catch (e) {
        opts.onError?.(`Could not start: ${String(e)}`);
      }
    },
    stop: () => {
      try {
        rec.stop();
      } catch {
        // ignore
      }
    },
  };
}
