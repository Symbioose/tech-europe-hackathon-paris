# Crucible

> **Synthetic market research for product launches.** Paste a B2B URL, get 70 simulated buyers reacting across 7 ICPs in real time, talk to any of them by voice, and walk away with a 4-block launch decision — in two minutes.

Built for the **Tech: Europe Paris AI Hackathon** (May 16, 2026).

Crucible sits in the same product category as [Societies.io](https://societies.io/) (enterprise synthetic personas at scale), positioned for **early-stage founders** rather than Fortune-500 strategy teams.

---

## What it does

1. You paste a product URL (or pick a test type in the setup wizard).
2. **Tavily** orchestrates three live web searches — reading the product page, finding competitors, surfacing market trends — and streams results into a visible orchestrator panel.
3. **OpenAI** generates 7 customer tribes adapted to your test type (10 buyers each = 70 simulated buyers).
4. **FAL Flux Schnell** generates 7 ad-creative images in parallel, one per tribe, painted onto each TribeCard as they arrive.
5. The agent runs the campaigns through the simulated buyers across **3 rounds**:
   - **Round 1** — broad exploration, ~9% conversion.
   - **Round 2** — for the 2 worst-performing tribes, OpenAI rewrites the hook AND FAL regenerates the creative image in place (visible before/after). ~18% conversion.
   - **Round 3** — sharpened on the strongest tribe. In the background, **FAL Veo3 fast** kicks off a single rich finale video built from every learning. ~31% conversion.
6. The recommendation card lays out four explicit blocks: **WHO TO TARGET**, **WHAT TO SAY**, **WHERE TO SEND THEM**, **WHAT OBJECTION TO AVOID** — with a "Synthetic confidence · ~85%" badge.
7. **Click any of the 70 buyers** in the 3D market and **hold the mic to ask them a question**. They answer in persona (OpenAI) and their voice plays back via **Gradium** (5 distinct voice profiles).

## Why this matters

Most founders burn a week and thousands of euros testing the wrong launch message. Crucible turns a seven-day launch test into a two-minute decision.

> One product in. Seven tribes. Seventy buyers. Three learning rounds. One launch decision.

## Stack

- **Next.js 14** (App Router) + **TypeScript** + **Tailwind CSS** + **Framer Motion**
- Single Next.js app, no separate backend, no database.
- In-memory state during the session; deterministic fallback session under `lib/demo/` for demo reliability.

### Sponsor integrations

| Partner   | What it powers                                                | Live or fallback                                      |
| --------- | ------------------------------------------------------------- | ----------------------------------------------------- |
| OpenAI    | Product brief, 7 tribe generation (wizard-aware), Round 2 hook rewrites, buyer persona Q&A | Live with `OPENAI_API_KEY`; falls back to demo data |
| Tavily    | Multi-step orchestrator — product page extract + competitors search + market trends search, streamed via SSE | Live with `TAVILY_API_KEY`; falls back to demo signals |
| FAL       | Flux Schnell × 7 ad-creative images per tribe; +2 regenerated images on Round 2; Veo3 fast video at the finale (built from every learning) | Live with `FAL_KEY`; 9 pre-cached PNGs for the Oura fallback path; Ken Burns image loop if video timeouts |
| Gradium   | Voice synthesis for any of the 70 buyers, mapped to 5 voice profiles (gender × age) derived from each persona | Live with `GRADIUM_API_KEY`; 5 macOS-synthesized m4a fallbacks (one per voice profile) |

The current demo uses **deterministic ranking** to pick the winning tribe and surface the dominant objection. Recommendation cards display a "Synthetic confidence · ~85%" badge — a deterministic v1 display value, derived from the gap between R3 winner conversion and runner-up. Never claimed as benchmark-validated.

## Run locally

```bash
pnpm install
pnpm dev
```

Open <http://localhost:3000>.

For the recorded demo, no API keys are required — the fallback session for `https://ouraring.com` is deterministic and runs purely from `lib/demo/`. Set `CRUCIBLE_DEMO_MODE=1` to force fallback even with live keys.

### Optional: live mode

Create a `.env.local` with any of:

```bash
OPENAI_API_KEY=...
OPENAI_MODEL=gpt-4o-mini
TAVILY_API_KEY=...
FAL_KEY=...
GRADIUM_API_KEY=...
GRADIUM_VOICE_ID=claire-eu
```

Live mode kicks in when the product URL is not Oura. If any sponsor API fails or times out, the route falls back to the deterministic demo data — every call is wrapped in try/catch and never blocks the UI for more than ~5s.

## API surface

All routes are POST and return JSON.

| Route               | Body                                                                                 | Notes                                                               |
| ------------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------- |
| `/api/run`          | `{ productUrl, platform }`                                                          | Returns brief, tribes, initialAssets, agents                        |
| `/api/round`        | `{ round, brief, tribes, previousRounds }`                                          | Returns roundResult, updatedAssets, updatedAgents                   |
| `/api/ask-buyer`    | `{ buyer, tribe, question }`                                                        | Returns text answer (OpenAI) + audioUrl (Gradium for hero buyer)    |
| `/api/finalize`     | `{ rounds, tribes, assets }`                                                        | Returns recommendation + winning video URL                          |

## URL shortcuts for the demo

For convenience while recording or rehearsing:

- `?stage=tribes` — skip to tribes generated state
- `?stage=r1` — jump to round 1 results
- `?stage=r2` — jump to round 2 results
- `?stage=r3` — jump to round 3 results
- `?stage=winner` — jump to final recommendation
- `?stage=winner&select=tribe_2_a1` — open hero buyer drawer

## File map

```text
app/
  layout.tsx
  page.tsx                       # orchestrator
  globals.css
  api/
    run/route.ts                  # /api/run
    round/route.ts                # /api/round
    ask-buyer/route.ts            # /api/ask-buyer
    finalize/route.ts             # /api/finalize
components/
  TopBar.tsx
  TribeCard.tsx / TribeColumn.tsx
  MarketWorld.tsx                 # 70 animated buyers + clusters
  RightPanel.tsx                  # round metrics, learning, recommendation
  BuyerDrawer.tsx                 # ask-a-buyer with Gradium voice
lib/
  types.ts
  session.ts                      # state machine for the UI
  simulation.ts
  integrations/
    openai.ts / tavily.ts / fal.ts / gradium.ts / pioneer.ts
  demo/
    brief.ts                      # Oura fallback brief
    tribes.ts                     # 7 tribes
    agents.ts                     # 70 buyers + per-round state sequences
    assets.ts                     # 21 launch assets (3 rounds × 7 tribes)
    rounds.ts                     # round results + learnings
    recommendation.ts             # final launch decision
  demo-data.ts                    # composes everything
public/
  demo/
    buyer-voice.m4a               # cached hero buyer voice
```

## Demo design rules (followed)

- One perfect flow over many fragile ones.
- Deterministic fallback session that runs without any keys.
- No more than 7 LLM calls per round (tribe-level reactions, not per-buyer).
- Every sponsor call wrapped in try/catch with cached fallback.
- All visible numbers chosen to make the learning loop legible: 9% → 18% → 31%.

## License

MIT for the code. The Oura Ring brand is referenced only for demo purposes.
