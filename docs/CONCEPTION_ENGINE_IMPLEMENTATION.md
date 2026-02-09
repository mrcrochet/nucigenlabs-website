# Engine & Views — Implementation Conception

This document bridges **conception** and **code**: pipeline stages, view contracts, and shared state.

Refs: [CONCEPTION_INVESTIGATION_ENGINE.md](CONCEPTION_INVESTIGATION_ENGINE.md), [CONCEPTION_PATH_ALGORITHM.md](CONCEPTION_PATH_ALGORITHM.md).

---

## 1. Pipeline (implementation)

**Input:** `InvestigationThread` + `InvestigationSignal[]` (from API: thread + signals).

**Output:** `InvestigationGraph` (nodes, edges, paths).

**Stages:**

| Stage | Input | Output | Module / responsibility |
|--------|--------|--------|---------------------------|
| 1. Signal → Nodes | Thread, Signals | `InvestigationGraphNode[]` | Map each signal (or extracted fact) to one or more nodes. Node id, type (`event` default), label (source or summary slice), date, confidence (from credibility_score or default), sources = [url]. |
| 2. Edge inference | Nodes | `InvestigationGraphEdge[]` | From temporal order, actors, and impact_on_hypothesis: create edges (from → to) with relation, strength, confidence. v1: simple rules (e.g. same actors, temporal sequence). |
| 3. Path generation | Nodes, Edges | `InvestigationGraphPath[]` | Clustering → path birth → scoring → lifecycle. See CONCEPTION_PATH_ALGORITHM.md. v1: one path per “chain” of edges, status and confidence from scoring. |
| 4. Graph assembly | Nodes, Edges, Paths | `InvestigationGraph` | Single object `{ nodes, edges, paths }`. |

**Entry point (v1):** `buildGraphFromSignals(thread, signals): InvestigationGraph` in `src/lib/investigation/build-graph.ts` (or equivalent). No backend call inside; pure function.

---

## 2. View contracts

All three views consume the **same** `InvestigationGraph`. No view-specific API.

### 2.1 Shared props (all views)

| Prop | Type | Description |
|------|------|--------------|
| `graph` | `InvestigationGraph` | Current graph (single source of truth). |
| `selectedNodeId` | `string \| null` | Node selected for the details panel. |
| `onNodeClick` | `(nodeId: string) => void` | Called when user clicks a node (open panel). |

### 2.2 Flow View

- **Component:** `InvestigationFlowView.tsx`
- **Role:** Sankey-style: left → right = time; nodes as boxes with date; edges with width = strength, color = confidence.
- **Renders:** `graph.nodes`, `graph.edges`, `graph.paths` (dominant vs weak/dead: style).
- **Interactions:** Hover node → tooltip (sources); Click node → `onNodeClick(node.id)`.

### 2.3 Timeline View

- **Component:** `InvestigationTimelineView.tsx`
- **Role:** Vertical timeline; events as cards with date, description, sources, confidence; time bands; turning points; alternative explanations (faded).
- **Renders:** Same `graph`; nodes grouped by date; optionally tagged by path.
- **Interactions:** Click card/node → `onNodeClick(node.id)`.

### 2.4 Map View

- **Component:** `InvestigationMapView.tsx`
- **Role:** Radial or force-directed; same nodes and edges; outcome at center or focus.
- **Renders:** Same `graph`; layout computed from nodes/edges.
- **Interactions:** Click node → `onNodeClick(node.id)`; optional drag to reorganize.

### 2.5 Details panel (shared)

- **Component:** `InvestigationDetailsPanel.tsx`
- **Props:** `node: InvestigationGraphNode \| null`, `graph: InvestigationGraph` (to show paths containing this node, in/out edges).
- **Role:** Summary, sources, confidence, paths this node belongs to, incoming/outgoing relations. Same panel for all views.

---

## 3. Shared state (workspace)

In the investigation workspace (e.g. `InvestigationWorkspacePage` or a dedicated workspace layout):

| State | Type | Description |
|-------|------|--------------|
| `graph` | `InvestigationGraph \| null` | Built from thread + signals; updated when thread/signals change. |
| `viewMode` | `'flow' \| 'timeline' \| 'map'` | Current view (user can switch). |
| `selectedNodeId` | `string \| null` | Node selected for the details panel. |

**Data flow:**

1. Load thread + signals (existing API: `getThread(threadId)`).
2. `graph = buildGraphFromSignals(thread, signals)`.
3. Render: view selector + `FlowView` or `TimelineView` or `MapView` (all receive `graph`, `selectedNodeId`, `onNodeClick`) + `InvestigationDetailsPanel(node, graph)` where `node = graph.nodes.find(n => n.id === selectedNodeId)`.

---

## 4. File layout (conception)

| File | Role |
|------|------|
| `src/types/investigation-graph.ts` | Already exists: Node, Edge, Path, Graph. |
| `src/lib/investigation/build-graph.ts` | `buildGraphFromSignals(thread, signals): InvestigationGraph`. |
| `src/components/investigation/InvestigationFlowView.tsx` | Flow view (Sankey-style). |
| `src/components/investigation/InvestigationTimelineView.tsx` | Timeline view (vertical cards). |
| `src/components/investigation/InvestigationMapView.tsx` | Map view (radial/force-directed). |
| `src/components/investigation/InvestigationDetailsPanel.tsx` | Shared details panel. |

Later: path algorithm in `src/lib/investigation/path-algorithm.ts` (clustering, scoring, lifecycle) called from `build-graph.ts`.

---

## 5. v1 implementation order

1. **build-graph.ts (v1):** Signals → nodes only (1 node per signal); no edges; 1 path with all nodes (date order); status `active`, confidence 50. So the graph is non-empty and viewable.
2. **InvestigationDetailsPanel:** Accept `node \| null`, `graph`; show label, date, confidence, sources; “Paths” and “Relations” empty or minimal.
3. **InvestigationFlowView (v1):** Accept `graph`, `selectedNodeId`, `onNodeClick`; render nodes as list or simple boxes; no real Sankey yet; clickable nodes.
4. **InvestigationTimelineView (v1):** Same props; render nodes grouped by date; cards with label, date, confidence; clickable.
5. **InvestigationMapView (v1):** Same props; render nodes as dots/circles in a simple layout (grid or radial); clickable.
6. **Workspace:** Load thread + signals; build graph; view selector (Flow / Timeline / Map); render selected view + details panel; wire `onNodeClick` → `setSelectedNodeId`.

Then iterate: edges in build-graph, path algorithm, real Sankey/Timeline/Map layouts.
