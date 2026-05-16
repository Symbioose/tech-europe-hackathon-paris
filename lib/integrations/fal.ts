export async function falWinningCreative(prompt: string): Promise<string | null> {
  const key = process.env.FAL_KEY;
  if (!key) return null;
  try {
    const res = await fetch("https://fal.run/fal-ai/flux/schnell", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Key ${key}`,
      },
      body: JSON.stringify({
        prompt,
        image_size: "portrait_16_9",
        num_inference_steps: 4,
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return (data?.images?.[0]?.url as string) ?? null;
  } catch {
    return null;
  }
}
