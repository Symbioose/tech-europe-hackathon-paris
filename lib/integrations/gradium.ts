export async function gradiumSpeak(text: string): Promise<string | null> {
  const key = process.env.GRADIUM_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch("https://api.gradium.ai/v1/voice/synthesize", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        text,
        voice: process.env.GRADIUM_VOICE_ID ?? "claire-eu",
        format: "mp3",
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return (data?.audio_url as string) ?? null;
  } catch {
    return null;
  }
}
