import { buildAgentsForTribes } from "@/lib/agents";
import {
  extractPage,
  searchCommunity,
  searchCompetitors,
  searchPricing,
  searchTrends,
} from "@/lib/integrations/tavily";
import { summarizeProduct, generateTribes, generateAssets } from "@/lib/integrations/openai";
import type { ProductBrief } from "@/lib/types";
import { buildAssetsForTribes } from "@/lib/launch-assets";

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
        if (!url) {
          emit("error", { message: "A product URL is required." });
          emit("done", { mode: "error" });
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

        // ── Step 3: 4 deep searches in parallel ──────────────────────────────
        // Each lane streams its own event so the UI shows progressive depth.
        const compP = race(searchCompetitors(market, productName), 10000);
        const trendP = race(searchTrends(market), 10000);
        const pricingP = race(searchPricing(productName, market), 10000);
        const communityP = race(searchCommunity(productName, market), 10000);

        // Emit each as soon as it resolves (not waiting for the slowest).
        compP.then((r) => emit("tavily:competitors", r ?? []));
        trendP.then((r) => emit("tavily:trends", r ?? []));
        pricingP.then((r) => emit("tavily:pricing", r ?? []));
        communityP.then((r) => emit("tavily:community", r ?? []));

        const [compResults, trendResults, pricingResults, communityResults] = await Promise.all([
          compP,
          trendP,
          pricingP,
          communityP,
        ]);

        // Enrich brief with signals before tribe generation
        const briefWithSignals: ProductBrief = {
          ...brief,
          competitorSignals: [
            ...((compResults ?? []).map((r) => r.title).filter(Boolean)),
            ...((pricingResults ?? []).slice(0, 3).map((r) => r.title).filter(Boolean)),
          ].slice(0, 8),
          trendSignals: [
            ...((trendResults ?? []).map((r) => r.title).filter(Boolean)),
            ...((communityResults ?? []).slice(0, 3).map((r) => r.title).filter(Boolean)),
          ].slice(0, 8),
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
          emit("agents", buildAgentsForTribes(liveTribes));

          // ── Step 5: generate live assets per tribe ────────────────────────
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
            const merged = liveTribes.map((tribe) => {
              const live = liveAssets.find((a) => a.tribeId === tribe.id);
              const generated = buildAssetsForTribes(briefWithSignals, [tribe])[0];
              if (!live) return generated;
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
            emit("initialAssets", buildAssetsForTribes(briefWithSignals, liveTribes));
            emit("done", { mode: "live" });
          }
        } else {
          emit("error", {
            message:
              "Could not generate customer populations. Check OPENAI_API_KEY and try again.",
          });
          emit("done", { mode: "error" });
        }
      } catch (err) {
        emit("error", { message: String(err) });
        emit("done", { mode: "error" });
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
