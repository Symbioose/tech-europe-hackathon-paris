import { ouraBrief, tribes, baseAgents, assetsRound1 } from "@/lib/demo-data";
import { extractPage, searchCompetitors, searchTrends } from "@/lib/integrations/tavily";
import { summarizeProduct, generateTribes, generateAssets } from "@/lib/integrations/openai";
import type { TavilyResult } from "@/lib/integrations/tavily";
import type { ProductBrief } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

function inferProductName(url: string): string {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    const slug = host.split(".")[0] ?? host;
    return slug
      .split(/[-_]/)
      .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
      .join(" ");
  } catch {
    return "the product";
  }
}

function race<T>(promise: Promise<T>, ms: number): Promise<T | null> {
  return Promise.race([
    promise.catch(() => null),
    new Promise<null>((r) => setTimeout(() => r(null), ms)),
  ]);
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as {
    productUrl?: string;
    platform?: string;
    testType?: string;
    productNote?: string;
    targetMarket?: string;
    assetMode?: string;
  };
  const url: string | undefined = body?.productUrl;

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      function emit(event: string, data: unknown) {
        const line = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(encoder.encode(line));
      }

      try {
        // ── Oura / demo fast-path ────────────────────────────────────────────
        if (!url || /ouraring|oura/i.test(url) || process.env.CRUCIBLE_DEMO_MODE === "1") {
          const stubProduct: TavilyResult[] = [
            {
              title: "Oura Ring — Smart Health Ring",
              url: "https://ouraring.com",
              snippet:
                "Oura Ring tracks sleep, readiness, and activity 24/7. Worn on your finger, it's the most accurate wearable health monitor.",
              favicon: "https://www.google.com/s2/favicons?domain=ouraring.com&sz=32",
            },
          ];
          emit("tavily:product", stubProduct);
          emit("brief", ouraBrief);
          emit("tavily:competitors", []);
          emit("tavily:trends", []);
          emit("tribes:all", tribes);
          emit("agents", baseAgents);
          emit("initialAssets", assetsRound1);
          emit("done", { mode: "fallback" });
          controller.close();
          return;
        }

        // ── Step 1: extractPage ──────────────────────────────────────────────
        const productResults = await race(extractPage(url), 8000);
        emit("tavily:product", productResults ?? []);

        const productName = inferProductName(url);
        const rawSnippet = productResults?.[0]?.snippet ?? "";

        // ── Step 2: summarizeProduct ─────────────────────────────────────────
        const partial = await race(summarizeProduct(url, rawSnippet), 6000);

        const market: string =
          body.targetMarket ||
          (typeof partial?.market === "string" && partial.market) ||
          "Unknown — infer from context";

        const brief: ProductBrief = {
          name: productName,
          url,
          oneLiner:
            typeof partial?.oneLiner === "string" && partial.oneLiner
              ? partial.oneLiner
              : `${productName} — product launch`,
          description:
            typeof partial?.description === "string" && partial.description
              ? partial.description
              : rawSnippet || `Product at ${url}.`,
          market,
          keyPromise:
            typeof partial?.keyPromise === "string" && partial.keyPromise
              ? partial.keyPromise
              : "Infer from the page",
          competitorSignals: [],
          trendSignals: [],
          source: "tavily",
        };

        if (body.productNote) {
          brief.description = brief.description
            ? `${body.productNote} — ${brief.description}`
            : body.productNote;
        }

        emit("brief", brief);

        // ── Step 3: competitors + trends in parallel ─────────────────────────
        const [compResults, trendResults] = await Promise.all([
          race(searchCompetitors(market, productName), 8000),
          race(searchTrends(market), 8000),
        ]);

        emit("tavily:competitors", compResults ?? []);
        emit("tavily:trends", trendResults ?? []);

        // Enrich brief with signals before tribe generation
        const briefWithSignals: ProductBrief = {
          ...brief,
          competitorSignals: (compResults ?? []).map((r) => r.title).filter(Boolean),
          trendSignals: (trendResults ?? []).map((r) => r.title).filter(Boolean),
        };

        // ── Step 4: generateTribes ───────────────────────────────────────────
        const liveTribes = await race(
          generateTribes(briefWithSignals, {
            testType: body.testType,
            productNote: body.productNote,
            targetMarket: body.targetMarket,
            assetMode: body.assetMode,
          }),
          25000,
        );

        if (liveTribes && liveTribes.length === 7) {
          emit("tribes:all", liveTribes);
          emit("agents", baseAgents);

          // ── Step 5: generate live assets per tribe (so FAL images use live hooks, not Oura) ──
          const liveAssets = await race(
            generateAssets(briefWithSignals, liveTribes, {
              testType: body.testType,
              productNote: body.productNote,
              targetMarket: body.targetMarket,
              assetMode: body.assetMode,
            }),
            18000,
          );

          if (liveAssets && liveAssets.length === 7) {
            // Merge live asset fields onto the assetsRound1 shape (preserves any defaults)
            const merged = liveTribes.map((tribe) => {
              const live = liveAssets.find((a) => a.tribeId === tribe.id);
              const fallback = assetsRound1.find((a) => a.tribeId === tribe.id) ?? assetsRound1[0];
              if (!live) return { ...fallback, tribeId: tribe.id };
              return {
                tribeId: tribe.id,
                hook: live.hook,
                landingHeadline: live.landingHeadline,
                cta: live.cta,
                videoScript: live.videoScript,
                benefits: live.benefits,
                dmReply: live.dmReply,
              };
            });
            emit("initialAssets", merged);
            emit("done", { mode: "live" });
          } else {
            // Live tribes but fallback assets — better than nothing
            emit("initialAssets", assetsRound1);
            emit("done", { mode: "live-tribes-fallback-assets" });
          }
        } else {
          emit("tribes:all", tribes);
          emit("agents", baseAgents);
          emit("initialAssets", assetsRound1);
          emit("done", { mode: "fallback-tribes" });
        }
      } catch (err) {
        // Emit a safe fallback so the client isn't left hanging
        emit("tribes:all", tribes);
        emit("agents", baseAgents);
        emit("initialAssets", assetsRound1);
        emit("done", { mode: "fallback", error: String(err) });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
