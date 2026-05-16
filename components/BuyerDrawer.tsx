"use client";

import { useState, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { BuyerAgent, Tribe } from "@/lib/types";
import { stateColor } from "@/lib/simulation";
import { isSupported, createRecognition } from "@/lib/voice/recognition";
import { play, stop as stopAudio } from "@/lib/voice/playback";

type RecordingState = "idle" | "recording" | "thinking" | "speaking";

type Props = {
  agent: BuyerAgent | null;
  tribe: Tribe | null;
  onClose: () => void;
  hookSeen?: string;
  prefilledQuestion?: string;
};

export function BuyerDrawer({ agent, tribe, onClose, hookSeen, prefilledQuestion }: Props) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isAsking, setIsAsking] = useState(false);

  // Voice state
  const [recordingState, setRecordingState] = useState<RecordingState>("idle");
  const [interim, setInterim] = useState("");
  const [transcript, setTranscript] = useState("");
  const [answerText, setAnswerText] = useState("");
  const [supported] = useState(() => isSupported());
  const recRef = useRef<ReturnType<typeof createRecognition> | null>(null);

  useEffect(() => {
    setQuestion(prefilledQuestion ?? "");
    setAnswer(null);
    setAudioUrl(null);
    setInterim("");
    setTranscript("");
    setAnswerText("");
    setRecordingState("idle");
  }, [agent?.id, prefilledQuestion]);

  // Pre-warm mic permission on mount
  useEffect(() => {
    if (typeof navigator !== "undefined" && navigator.mediaDevices) {
      navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then((s) => s.getTracks().forEach((t) => t.stop()))
        .catch(() => {});
    }
  }, []);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      stopAudio();
    };
  }, []);

  if (!agent || !tribe) return null;
  const color = stateColor(agent.state);

  async function ask() {
    if (!question.trim() || !agent || !tribe) return;
    setIsAsking(true);
    try {
      const res = await fetch("/api/ask-buyer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ buyer: agent, tribe, question, hookSeen }),
      });
      const data = await res.json();
      setAnswer(data.text);
      setAudioUrl(data.audioUrl ?? null);
    } catch {
      setAnswer(
        agent.feedback ??
          "It clicked because the pain was specific. The 3am moment turned a vague bad night into evidence I could show myself.",
      );
    } finally {
      setIsAsking(false);
    }
  }

  function startListen() {
    if (!agent || !tribe) return;
    setTranscript("");
    setInterim("");
    setAnswerText("");
    setRecordingState("recording");
    stopAudio();

    recRef.current = createRecognition({
      lang: "en-US",
      onInterim: (text) => setInterim(text),
      onFinal: (text) => {
        setTranscript((prev) => prev + text);
        setInterim("");
      },
      onError: (msg) => {
        console.warn("STT error:", msg);
        setRecordingState("idle");
      },
    });
    recRef.current.start();
  }

  async function stopListen() {
    recRef.current?.stop();
    recRef.current = null;

    const captured = transcript + interim;
    setInterim("");

    if (!captured.trim() || !agent || !tribe) {
      setRecordingState("idle");
      return;
    }

    setRecordingState("thinking");
    try {
      const res = await fetch("/api/ask-buyer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          buyer: agent,
          tribe,
          question: captured.trim(),
          hookSeen,
        }),
      });
      const data = await res.json();
      setAnswerText(data.text ?? "");
      const url: string | null = data.audioUrl ?? null;

      if (url) {
        setRecordingState("speaking");
        await play(url);
        setRecordingState("idle");
      } else {
        setRecordingState("idle");
      }
    } catch {
      setAnswerText(
        agent.feedback ??
          "It clicked because the pain was specific. The 3am moment turned a vague bad night into evidence I could show myself.",
      );
      setRecordingState("idle");
    }
  }

  const micLabel: Record<RecordingState, string> = {
    idle: "Tap to ask",
    recording: "Listening… tap to send",
    thinking: "Thinking…",
    speaking: "Speaking…",
  };

  const micActive = recordingState === "recording";
  const micBusy = recordingState === "thinking" || recordingState === "speaking";

  return (
    <AnimatePresence>
      <motion.div
        key="backdrop"
        className="fixed inset-0 bg-ink-950/40 backdrop-blur-[2px] z-40"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />
      <motion.div
        key="drawer"
        className="fixed left-1/2 -translate-x-1/2 bottom-4 w-[min(700px,calc(100vw-440px))] z-50 rounded-2xl border border-ink-700/80 bg-ink-900/95 backdrop-blur-md shadow-glow overflow-hidden"
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }}
        transition={{ type: "spring", stiffness: 280, damping: 28 }}
      >
        <div className="px-5 pt-4 pb-3 flex items-start gap-4 border-b border-ink-700/60">
          <div className="relative">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-lg shrink-0"
              style={{ background: `${tribe.accent}22`, boxShadow: `inset 0 0 0 1px ${tribe.accent}60` }}
            >
              {tribe.emoji}
            </div>
            <span
              className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-ink-900"
              style={{ background: color.fill }}
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold">{agent.name}</h2>
              <span
                className="text-[9px] uppercase tracking-[0.16em] px-1.5 py-0.5 rounded border"
                style={{
                  color: color.fill,
                  borderColor: `${color.fill}55`,
                  background: `${color.fill}11`,
                }}
              >
                {color.label}
              </span>
              {agent.isHero && (
                <span className="text-[9px] uppercase tracking-[0.16em] text-flame-300 border border-flame-600/60 bg-flame-900/40 px-1.5 py-0.5 rounded">
                  Hero buyer · voice
                </span>
              )}
            </div>
            <div className="text-[12px] text-ink-400 mt-0.5">{agent.role}</div>
            <div className="text-[11px] text-ink-400 mt-0.5">
              <span className="text-ink-300">Tribe:</span> {tribe.name}
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-ink-400 hover:text-ink-50 text-xl leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="px-5 py-4 grid grid-cols-2 gap-4">
          <div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-ink-400 mb-1.5">
              Why this state
            </div>
            <p className="text-[12.5px] leading-relaxed text-ink-200">
              {agent.state === "converted" &&
                `${agent.name.split(" ")[0]} showed strong purchase intent because the hook named a specific moment they recognized.`}
              {agent.state === "curious" &&
                `${agent.name.split(" ")[0]} clicked but didn't buy. The hook landed, but the page felt heavier than the promise.`}
              {agent.state === "seen" &&
                `${agent.name.split(" ")[0]} scrolled past. The hook didn't name a pain they currently feel.`}
              {agent.state === "repelled" &&
                `${agent.name.split(" ")[0]} bounced. Either the format doesn't fit their context or the promise felt too broad to trust.`}
              {agent.state === "idle" &&
                `${agent.name.split(" ")[0]} hasn't been targeted yet — they're in the cohort waiting on the next campaign.`}
            </p>
          </div>

          <div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-ink-400 mb-1.5">
              Ask this buyer
            </div>
            <div className="flex flex-col gap-2">
              {/* Mic button — single click toggles recording, release fires the question */}
              {supported && (
                <button
                  type="button"
                  onClick={() => {
                    if (recordingState === "recording") stopListen();
                    else if (recordingState === "idle") startListen();
                  }}
                  disabled={micBusy}
                  className={[
                    "w-full px-3 py-2.5 rounded-lg font-medium text-[12.5px] transition-all select-none",
                    micActive
                      ? "bg-flame-500 text-ink-950 shadow-inner"
                      : micBusy
                      ? "bg-ink-700 text-ink-300 cursor-not-allowed"
                      : "bg-ink-800 border border-ink-600 hover:border-flame-500/60 hover:bg-ink-750 text-ink-100",
                  ].join(" ")}
                >
                  {micActive ? "⏹ " : micBusy ? "" : "🎙 "}
                  {micLabel[recordingState]}
                </button>
              )}

              {/* Interim transcript display while recording */}
              {(interim || (transcript && recordingState === "recording")) && (
                <div className="px-3 py-1.5 rounded-lg bg-ink-850 border border-ink-700 text-[11px] text-ink-300 italic min-h-[28px]">
                  {transcript}
                  <span className="text-ink-500">{interim}</span>
                </div>
              )}

              {/* Text input stays visible as backup when voice input is unavailable. */}
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") ask();
                }}
                placeholder={
                  supported
                    ? "Or type your question…"
                    : agent.state === "converted"
                    ? "Why did you click?"
                    : "What stopped you?"
                }
                className="w-full px-3 py-2 rounded-lg bg-ink-850 border border-ink-700 focus:border-flame-500 focus:outline-none text-[12.5px] placeholder:text-ink-400"
              />
              <button
                onClick={ask}
                disabled={isAsking || !question.trim()}
                className="px-3 py-2 rounded-lg bg-flame-500/90 hover:bg-flame-400 text-ink-950 font-medium text-[12.5px] disabled:bg-ink-700 disabled:text-ink-400 disabled:cursor-not-allowed transition-colors"
              >
                {isAsking ? "Asking…" : "Ask"}
              </button>
            </div>
          </div>
        </div>

        {/* Voice answer panel */}
        {answerText && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-5 mb-2 px-4 py-3 rounded-xl border border-flame-500/30 bg-flame-900/10"
          >
            <div className="flex items-center gap-2 mb-1.5">
              <div className="text-[10px] uppercase tracking-[0.18em] text-flame-300">
                {agent.name.split(" ")[0]} responds · voice
              </div>
              {recordingState === "speaking" && (
                <span className="text-[10px] text-flame-400 animate-pulse">🔊 Speaking…</span>
              )}
            </div>
            <p className="text-[13px] leading-relaxed text-ink-100">{answerText}</p>
            <div className="mt-1.5 text-[10px] uppercase tracking-[0.18em] text-ink-400">
              🎤 Gradium · voice synthesis
            </div>
          </motion.div>
        )}

        {/* Text answer panel (from text input) */}
        {answer && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-5 mb-4 px-4 py-3 rounded-xl border border-plasma/30 bg-plasma/5"
          >
            <div className="flex items-center gap-2 mb-1.5">
              <div className="text-[10px] uppercase tracking-[0.18em] text-plasma">
                {agent.name.split(" ")[0]} responds
              </div>
              {audioUrl && (
                <>
                  <div className="h-px flex-1 bg-plasma/20" />
                  <audio src={audioUrl} controls className="h-7" />
                </>
              )}
            </div>
            <p className="text-[13px] leading-relaxed text-ink-100">{answer}</p>
            <div className="mt-1.5 text-[10px] uppercase tracking-[0.18em] text-ink-400">
              {audioUrl ? "🎤 Gradium · voice synthesis" : "Persona · OpenAI"}
            </div>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
