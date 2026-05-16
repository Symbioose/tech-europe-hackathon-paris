import type { VoiceProfile } from "@/lib/types";

const VOICE_MAP: Record<VoiceProfile, string> = {
  "f-young": "claire-eu",
  "f-mid": "elena-eu",
  "m-young": "lucas-eu",
  "m-mid": "marco-eu",
  "m-mature": "henri-eu",
};

const FALLBACK_M4A: Record<VoiceProfile, string> = {
  "f-young": "/demo/voice-f-young-sample.m4a",
  "f-mid": "/demo/voice-f-mid-sample.m4a",
  "m-young": "/demo/voice-m-young-sample.m4a",
  "m-mid": "/demo/voice-m-mid-sample.m4a",
  "m-mature": "/demo/voice-m-mature-sample.m4a",
};

export async function gradiumSpeak(
  text: string,
  profile: VoiceProfile = "f-mid",
): Promise<string | null> {
  const key = process.env.GRADIUM_API_KEY;
  const voice = VOICE_MAP[profile] ?? VOICE_MAP["f-mid"];
  if (!key) return FALLBACK_M4A[profile];
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
    const res = await fetch("https://api.gradium.ai/v1/voice/synthesize", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({ text, voice, format: "mp3" }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (!res.ok) return FALLBACK_M4A[profile];
    const data = await res.json();
    return (data?.audio_url as string) ?? FALLBACK_M4A[profile];
  } catch {
    return FALLBACK_M4A[profile];
  }
}

export const FALLBACK_VOICE_PATHS = FALLBACK_M4A;
