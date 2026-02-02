# Investigation Graph Engine — Architecture

**Rule:** One investigation = one internal state. Flow, Timeline, and Map are **projections** of that state.

We do not generate "a Flow answer" or "a Timeline answer". We generate **one investigation graph**. Each view reads the same graph.

---

## 1. Principle

> **We don't generate answers. We generate an investigation state. Views are just lenses.**

- No mock data, no static JSON.
- One **Investigation Graph Engine**.
- Three **synchronized renderings** of the same graph.
- Responses (signals, paths, links) are **computed once**, then **displayed differently**.

---

## 2. The engine: what it is

**Investigation Graph Engine** = an evolving graph made of:

### 2.1 Nodes (facts / events / actors)

| Field     | Type     | Description                          |
|----------|----------|--------------------------------------|
| id       | string   | Unique id                             |
| type     | enum     | `event` \| `actor` \| `resource` \| `decision` \| `impact` |
| label    | string   | Short label                           |
| date     | string?  | ISO date when applicable              |
| confidence| number   | 0–100                                 |
| sources  | string[] | Source IDs or URLs                    |

### 2.2 Edges (causal / influence relations)

| Field      | Type   | Description                                    |
|-----------|--------|------------------------------------------------|
| from      | string | Node id                                        |
| to        | string | Node id                                        |
| relation  | enum   | `causes` \| `influences` \| `funds` \| `restricts` \| `triggers` |
| strength  | number | 0–1 (e.g. for Flow width)                      |
| confidence| number | 0–100                                          |

### 2.3 Paths (dynamic leads)

Paths are **computed**, not hand-written.

| Field      | Type   | Description                          |
|-----------|--------|--------------------------------------|
| id        | string | Unique id                            |
| nodes     | string[] | Ordered node ids                   |
| status    | enum   | `active` \| `weak` \| `dead`         |
| confidence| number | 0–100                                |

---

## 3. Response pipeline (core)

When the user creates or updates an investigation:

```
Hypothesis
   ↓
Signal extraction
   ↓
Node creation
   ↓
Edge inference
   ↓
Path generation   ← see CONCEPTION_PATH_ALGORITHM.md (clustering, scoring, lifecycle)
   ↓
Graph update
```

This **single output** feeds all three views. Path generation is defined in [CONCEPTION_PATH_ALGORITHM.md](CONCEPTION_PATH_ALGORITHM.md): signals → clustering → path candidates → scoring → path lifecycle (active / weak / dead).

---

## 4. How the three views use the graph

### Flow View (reasoning)

- Renders **dominant and weak paths**.
- Weak/dead paths: dashed or faded.
- **Width = strength** of edge.
- Nodes = graph nodes; edges = graph edges.
- **Visual only** — no long text.

### Timeline View (chronology)

- **Same nodes**, regrouped by **date**.
- Grouped or tagged by **path**.
- Each event belongs to one or more paths.

### Map View (ecosystem)

- **Same nodes**, **same edges**.
- Layout: radial or force-directed.
- User explores the **same facts**, different perspective.

---

## 5. Shared Details Panel (UX pivot)

In **any** view:

- **Click on a node** → open **Details Panel**.

The panel shows (same for Flow / Timeline / Map):

- Summary
- Sources
- Confidence
- Paths this node belongs to
- Incoming / outgoing relations

This panel is the **common anchor** across views.

---

## 6. Non-linear responses

| Case | Behaviour |
|------|-----------|
| Multiple possible answers | Several paths visible |
| Conflicting interpretation | Edges with different confidence; show both |
| Insufficient data | Path weak or dead |

**We don't hide uncertainty. We show it.**

---

## 7. Implementation constraints

- **No chat UI** as primary interface.
- **No narrative-first** approach.
- Focus: **reasoning**, **uncertainty**, **visual causality**.
- All views stay **synchronized** from one graph state.
- Clicking a node in any view opens the **same** details panel.

---

## 8. View specs (from sketches)

How each view renders the **same graph** — concrete layout and interactions.

### 8.1 Flow View (Sankey-style)

- **Title:** `Investigation: [hypothesis start] → [hypothesis end]` (e.g. "Russia Sanctions → European Gas Crisis").
- **Layout:** Horizontal left → right = time. Nodes = labeled boxes with **date** (e.g. "EU energy pivot (Mar 8)", "Russia cuts Nord Stream (Sep 2)", "Gas storage depletes (Aug 15)", "Industry shutdowns (Sep 20)", "Price spike").
- **Edges:** Arrows between nodes.
  - **Width of arrow = strength** (importance/impact).
  - **Color = confidence** (e.g. green = high, red = low).
- **Below diagram:** Global **Confidence** (e.g. 82%), **Sources** (e.g. "24 articles"), actions: **[Explore Alternative Paths]**, **[Export Report]**.
- **Interactions:**
  - **Hover on node** → popup with **sources**.
  - **Click on node** → open **shared Details Panel**.

### 8.2 Timeline View (vertical with branches)

- **Header:** "Investigation Journey" + hypothesis question (e.g. "How did Russia sanctions lead to European gas crisis?").
- **Layout:** Vertical dashed line = main progression. **Cards** for each event, with:
  - Title, **date**, short description
  - **Sources** (count or names, e.g. "Reuters, Bloomberg, EU Official Statement")
  - **Confidence** bar (e.g. 95%, 88%, 72%)
  - Link: **[Read N articles →]**
- **Time bands:** Labels between sections, e.g. "Direct Effect (within 2 weeks)", "Cascade Effect (2–4 months)", "Final Impact (1–2 months)".
- **Branches:** Horizontal lines from the main timeline to parallel events (e.g. "EU Energy Pivot" and "Market Panic" on left/right).
- **Turning points:** Explicit label (e.g. "⚡ TURNING POINT: This triggered the crisis") on key nodes.
- **End card:** Overall outcome (e.g. "European Gas Crisis" with "Prices: €200/MWh", "Impact: €500B economic cost"), **Overall Confidence** (e.g. 87%), **Research Quality** (e.g. "HIGH (24 verified sources)").
- **Alternative explanations:** Separate section, **visually faded**, e.g. "Some analysts argue crisis was manufactured" with **Confidence: 35% (3 sources, low credibility)** and **[Explore this path →]**.
- **Actions:** **[Run New Investigation]**, **[Export to PDF]**.
- **Interactions:** Click node/card → shared Details Panel.

### 8.3 Map View (radial / mind map)

- **Layout:** Outcome (**Point B**, e.g. "Gas Crisis €200/MWh") at **center**. Causes radiate outward (e.g. Nord Stream Cuts, EU Policy, Trader Behavior, Weather → then Storage Crisis, Industry Shutdowns, Market Panic → origin Point A "Russia Sanctions Feb 24").
- **Nodes:** Same graph nodes; **edges** = causal/influence links.
- **Interactions:**
  - **Click node** → zoom in on that **causal branch** (or open Details Panel).
  - **Drag** → reorganize layout (e.g. force-directed).
- **Hint:** "Click any node to explore that branch."

---

## 9. References

- [CONCEPTION_ENGINE_IMPLEMENTATION.md](CONCEPTION_ENGINE_IMPLEMENTATION.md) — pipeline implementation, view contracts, shared state, file layout.
- [CONCEPTION_PATH_ALGORITHM.md](CONCEPTION_PATH_ALGORITHM.md) — path generation algorithm (clustering, scoring, lifecycle, Cursor prompt).
- [CONCEPTION_INTELLIGENCE_DETECTIVE.md](CONCEPTION_INTELLIGENCE_DETECTIVE.md) — threads, signals, messages, API.
- Types: `src/types/investigation.ts` (API/DB), `src/types/investigation-graph.ts` (engine: nodes, edges, paths, graph).
- Code: `src/lib/investigation/build-graph.ts`, `src/components/investigation/InvestigationFlowView.tsx`, `InvestigationTimelineView.tsx`, `InvestigationMapView.tsx`, `InvestigationDetailsPanel.tsx`. Workspace: tabs Signals | Flow | Timeline | Map; details panel on node click.
