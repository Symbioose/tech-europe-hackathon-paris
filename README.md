# Crucible

> A self-improving launch agent. Paste a product URL. Watch the agent learn which tribe to target, which hook to lead with, and which page to send traffic to — in 3 simulated rounds.

Built for the **Tech: Europe Paris AI Hackathon** (May 16, 2026).

---

## What it does

1. You paste a product URL.
2. Tavily pulls competitor and trend signals.
3. OpenAI generates 7 customer tribes (10 buyers each = 70 simulated buyers).
4. OpenAI generates 7 launch campaigns — one per tribe — with hook, video script, landing headline, CTA, and DM reply.
5. The agent runs the campaigns through the simulated buyers across **3 rounds**:
   - **Round 1** — broad exploration, ~9% conversion.
   - **Round 2** — rewrite the weak hooks based on what failed, ~18% conversion.
   - **Round 3** — sharpen the winning message, ~31% conversion.
6. After round 3, the agent returns one launch decision: target tribe, hook, landing headline, CTA, objection to avoid, and a recommended next action for tomorrow.
7. Click any of the 70 buyers and ask them a question. They answer in persona (OpenAI). The hero buyer answers in voice (Gradium).

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
| OpenAI    | Product summary, tribe + campaign generation, buyer persona Q&A, learning synthesis | Live with `OPENAI_API_KEY`; falls back to demo data   |
| Tavily    | URL extraction, competitor + viral trend signals              | Live with `TAVILY_API_KEY`; falls back to demo data   |
| fal       | Winning short-form video creative for the recommendation     | Live with `FAL_KEY`; falls back to cached video path  |
| Gradium   | Hero buyer voice response                                     | Live with `GRADIUM_API_KEY`; falls back to a cached macOS-synthesized clip |
| SLNG      | Future outbound voice campaign layer (mentioned, not built)  | —                                                     |

The current demo uses **deterministic ranking** to pick the winning tribe and surface the dominant objection. Pioneer is the natural next step for a fine-tuned reaction classifier (intent + objection + confidence), but the current hackathon demo uses deterministic ranking for reliability — see `lib/integrations/pioneer.ts` for the placeholder wrapper.

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
