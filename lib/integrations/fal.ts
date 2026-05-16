export async function generateImage({
  prompt,
  imageSize = "landscape_16_9",
}: {
  prompt: string;
  imageSize?: string;
}): Promise<string | null> {
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
        image_size: imageSize,
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

export async function submitVideo(prompt: string): Promise<string | null> {
  const key = process.env.FAL_KEY;
  if (!key) return null;
  try {
    const res = await fetch("https://queue.fal.run/fal-ai/veo3/fast", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Key ${key}`,
      },
      body: JSON.stringify({ prompt }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return (data?.request_id as string) ?? null;
  } catch {
    return null;
  }
}

export async function pollVideo(requestId: string): Promise<string | null> {
  const key = process.env.FAL_KEY;
  if (!key) return null;
  try {
    const statusRes = await fetch(
      `https://queue.fal.run/fal-ai/veo3/fast/requests/${requestId}/status`,
      {
        headers: { Authorization: `Key ${key}` },
      },
    );
    if (!statusRes.ok) return null;
    const status = await statusRes.json();
    if (status?.status !== "COMPLETED") return null;

    const resultRes = await fetch(
      `https://queue.fal.run/fal-ai/veo3/fast/requests/${requestId}`,
      {
        headers: { Authorization: `Key ${key}` },
      },
    );
    if (!resultRes.ok) return null;
    const result = await resultRes.json();
    return (result?.video?.url as string) ?? null;
  } catch {
    return null;
  }
}

// Legacy alias for backward compat
export async function falWinningCreative(prompt: string): Promise<string | null> {
  return generateImage({ prompt, imageSize: "portrait_16_9" });
}
