# Path Generation Algorithm — Detective Core

**Role:** Transform a set of real signals into distinct, evolving, competing investigative paths.

A path is **not** a timeline, an answer, or a conclusion.  
A path is **a causal hypothesis under validation**.

---

## 1. Golden rule

> **Detective does not optimize for one answer. It optimizes for an honest representation of uncertainty.**

---

## 2. Definitions

### Signal

A **raw fact** from the real world:

- Article, statement, data point, public event
- A signal **does not reason**; it is neutral.

### Path (investigative lead)

A **coherent sequence of signals** that suggests a causal mechanism.

- A path **explains something**, partially.
- Multiple paths can coexist for the same phenomenon.

---

## 3. Algorithm goal

From N signals, the algorithm must:

1. Create **multiple paths**
2. Attach a signal to **one or more paths**
3. Measure the **strength** of each path
4. Detect when a path **strengthens**, **weakens**, or **dies**
5. Allow **multiple paths to coexist**

---

## 4. High-level pipeline

```
Signals → Clustering → Path candidates → Scoring → Path lifecycle
```

---

## 5. Step A — Clustering (grouping signals)

**Question:** *Which signals talk about “the same thing”?*

**Rule v1:** A signal belongs to a cluster if it shares at least **2 strong elements** with other signals:

- Same actors
- Same resource
- Same mechanism (sanctions, cut, funding)
- Temporal proximity

A signal can belong to **several clusters**.  
**Uniqueness is not enforced** — that is where branching comes from.

---

## 6. Step B — Birth of a path

**When is a path created?**

When a cluster has **enough signals to suggest a causal mechanism**.

**Rule v1:** Create a path if:

- ≥ 3 coherent signals
- From at least **2 distinct sources**
- Linked by an explicit or implicit mechanism

Example: sanctions → policy decision → market reaction → **Path created**.

---

## 7. Step C — Internal structure of a path

A path has:

- A **main chain** (dominant)
- **Secondary branches**
- Weaker signals at the periphery

Visually: **core = strong**, **edge = uncertain**.  
Paths are **not necessarily linear**.

---

## 8. Step D — Path scoring (critical)

Each path has a **dynamic score** based on:

| Factor       | What it measures                          |
|-------------|-------------------------------------------|
| **Quantity** | Number of signals                         |
| **Quality**  | Source credibility, signal type (data > statement) |
| **Coherence**| Temporal continuity, no major contradictions |
| **Convergence** | Several independent signals point to the same effect |

**Score v1 (simplified):**

```
Path confidence = weighted average(
  signal credibility,
  signal convergence,
  temporal consistency
)
```

**Ranges:**

- **No path reaches 100%.**
- 60–80% = normal
- >85% = very solid
- <40% = fragile

---

## 9. Step E — Path lifecycle (essential)

| Status    | Meaning |
|----------|---------|
| **Active** | New signals strengthen it; coherence maintained |
| **Weak**   | Few new signals; contradictions; lack of evidence |
| **Dead**   | Contradicted by solid facts; abandoned by the agent — **but never deleted** |

Dead paths remain **visible** (dashed, faded).  
This is **crucial for credibility**.

---

## 10. Step F — Competing paths (differentiator)

It is **normal** that:

- Several paths explain the same phenomenon
- With different mechanisms
- And different confidence levels

Detective **does not choose one** immediately. It shows:

- Path A: 82%
- Path B: 61%
- Path C: 28%

**The user sees the complexity.**

---

## 11. What the agent does (and does not)

**The agent:**

- Creates paths
- Compares them
- Updates them
- Weakens or abandons some

**The agent does NOT:**

- Impose a single truth
- Erase a path
- Tell a final story

---

## 12. Mental test

Take a real case (e.g. Sudan / Gold).

If the algorithm allows:

- 2–3 credible paths
- One main path
- One or two alternatives
- Different confidence levels

→ **The algorithm is sound.**

If everything converges too quickly → **too simplistic.**

---

## 13. Validation question

Before moving to schema / API / UI:

> *Does this model allow explaining why two intelligent analysts can disagree?*

If yes → proceed.  
If no → adjust.

---

## 14. Cursor prompt (Step 1 — Path algorithm only)

Use this prompt when implementing **only** the path generation logic.  
**No UI, no DB, no API** in this step.

```
You are designing the core reasoning algorithm for a feature called "Detective".

This task is ONLY about defining the algorithm that generates investigative paths.
Do NOT design UI, database schemas, APIs, or frontend components.

--------------------------------
CONTEXT
--------------------------------

Detective is a non-linear investigation engine.

An investigation is NOT a linear A → B journey.
It consists of multiple investigative paths (leads) that:
- emerge from real-world signals
- evolve over time
- compete with each other
- may strengthen, weaken, or die

The goal of the algorithm is NOT to find a final answer,
but to model uncertainty and causal reasoning.

--------------------------------
DEFINITIONS
--------------------------------

Signal:
- A normalized factual observation from the real world
- Examples: article, public decision, market reaction, data point
- Signals are neutral and do not reason

Path (Investigative Lead):
- A coherent causal hypothesis built from multiple signals
- A path explains something partially
- Multiple paths can coexist for the same phenomenon

--------------------------------
ALGORITHM GOALS
--------------------------------

Design an algorithm that can:

1. Group signals into multiple overlapping clusters
2. Create new paths when enough signals suggest a causal mechanism
3. Attach a signal to one or more paths
4. Score each path dynamically (confidence)
5. Detect when a path becomes:
   - active
   - weak
   - dead (but never deleted)
6. Allow competing and contradictory paths to coexist

--------------------------------
REASONING CONSTRAINTS
--------------------------------

- Paths must NOT be forced into a single explanation
- Signals can belong to multiple paths
- Confidence must never reach 100%
- Weak or dead paths must remain visible
- The system must avoid confirmation bias

--------------------------------
SCORING PRINCIPLES
--------------------------------

Path confidence should be based on:
- signal quantity
- signal credibility
- source diversity
- temporal consistency
- convergence toward similar effects

--------------------------------
EXPECTED OUTPUT
--------------------------------

Produce:
- A clear step-by-step description of the algorithm
- The lifecycle of a path (birth → evolution → weakening → death)
- Rules for when paths branch, merge, or diverge
- A simple v1 scoring logic (no math-heavy optimization)
- Examples using a geopolitical or economic investigation

Do NOT write code unless necessary to clarify logic.
Focus on reasoning clarity over implementation details.
```

---

## 15. References

- [CONCEPTION_INVESTIGATION_ENGINE.md](CONCEPTION_INVESTIGATION_ENGINE.md) — graph, views, pipeline.
- [CONCEPTION_INTELLIGENCE_DETECTIVE.md](CONCEPTION_INTELLIGENCE_DETECTIVE.md) — threads, signals, API.
