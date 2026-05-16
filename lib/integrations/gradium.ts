import type { VoiceProfile } from "@/lib/types";

// Real Gradium voice IDs from https://docs.gradium.ai/guides/voices/all-voices.md
// f-young = Emily, f-mid = Anna, m-young = Brandon, m-mid = James, m-mature = Austin
const GRADIUM_VOICE_MAP: Record<VoiceProfile, string> = {
  "f-young": "i1kmq28cO60ia35K",
  "f-mid": "PS7enm5lVZiIvEKV",
  "m-young": "2j8TWGsIiUl4G3kj",
  "m-mid": "MZWrEHL2Fe_uc2Rv",
  "m-mature": "-0MuXG9RcCsuSVtb",
};

// OpenAI TTS is used as an optional secondary provider when Gradium is not configured.
const OPENAI_VOICE_MAP: Record<VoiceProfile, string> = {
  "f-young": "nova",
  "f-mid": "shimmer",
  "m-young": "echo",
  "m-mid": "alloy",
  "m-mature": "onyx",
};

async function tryGradium(text: string, profile: VoiceProfile): Promise<string | null> {
  const key = process.env.GRADIUM_API_KEY;
  if (!key) return null;
  const voiceId = GRADIUM_VOICE_MAP[profile] ?? GRADIUM_VOICE_MAP["f-mid"];
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    // Real Gradium TTS endpoint per https://docs.gradium.ai/api-reference/endpoint/tts-post.md
    // Auth is x-api-key (NOT bearer). only_audio:true returns raw binary audio.
    const res = await fetch("https://api.gradium.ai/api/post/speech/tts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": key,
      },
      body: JSON.stringify({
        text,
        voice_id: voiceId,
        output_format: "wav",
        only_audio: true,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.warn(`[gradium] ${res.status} ${detail.slice(0, 200)}`);
      return null;
    }
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length === 0) return null;
    return `data:audio/wav;base64,${buf.toString("base64")}`;
  } catch (err) {
    console.warn(`[gradium] request failed:`, err);
    return null;
  }
}

async function tryOpenAITTS(text: string, profile: VoiceProfile): Promise<string | null> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  const voice = OPENAI_VOICE_MAP[profile] ?? OPENAI_VOICE_MAP["f-mid"];
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    const res = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: "tts-1",
        voice,
        input: text,
        response_format: "mp3",
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    return `data:audio/mpeg;base64,${buf.toString("base64")}`;
  } catch {
    return null;
  }
}

export async function gradiumSpeak(
  text: string,
  profile: VoiceProfile = "f-mid",
): Promise<string | null> {
  const gradium = await tryGradium(text, profile);
  if (gradium) return gradium;
  const openai = await tryOpenAITTS(text, profile);
  if (openai) return openai;
  return null;
}
