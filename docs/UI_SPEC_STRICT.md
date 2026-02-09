# 🔒 Nucigen UI Specification — Strict Implementation Rules

## Architecture Rules (Non-Negotiable)

### 1. Terminology is Frozen
- **Event** = factual occurrence (who, what, where, when)
- **Signal** = interpreted pattern of events (present interpretation)
- **Impact** = projected future effect (future projection)

**Never rename these terms in UI or code.**

### 2. Data Flow is Frozen
```
Event → Signal → Impact
```

**Forbidden:**
- Displaying Signals in Events pages
- Displaying Impacts in Events or Signals pages
- Any prediction outside Impact pages
- "Why it matters" in Events pages (that's Signal territory)
- Impact scores in Events pages (that's Signal/Impact territory)

### 3. Component Names are Frozen
**Component names must be used verbatim.**
Do not rename, merge, or split components.

### 4. Navigation Order is Frozen
```
Overview → Events → Signals → Impacts → Markets → Watchlists → Entities → Research → Alerts → Settings → Admin
```
Do not reorder, hide, or regroup.

### 5. Page Responsibilities are Strict

#### Events Pages
- **Facts only**: who, what, where, when
- **No interpretation**: no "why it matters", no impact assessment
- **No predictions**: no future effects
- **Sources required**: every event must show sources or "No sources available"
- **Timestamps required**: all market data must show timestamps

#### Signals Pages
- **Interpretation only**: patterns from events
- **No projections**: no future scenarios
- **Evidence required**: must show linked events
- **Market validation**: correlation, not causality

#### Impacts Pages
- **Projections only**: future scenarios
- **Probability required**: must show confidence
- **Timeframe required**: must show horizon
- **Invalidation conditions**: "What would change my mind?"

### 6. Narrative Elements Must Be Factual
- Overview "NarrativeCard" = factual aggregation only
- No causal reasoning in Events context
- No predictions in Events context

### 7. Market Data Rules
- All market data must display **timestamps**
- All market data must display **sources**
- Event markers on charts = temporal proximity, not causality
- AttributionPanel = "temporal proximity", not "caused by"

### 8. No Creative Liberties
- No extra pages
- No merged pages
- No reworded components
- No invented UI flows
- Use placeholder data if endpoints not ready

### 9. No Social Mechanics
- No likes, comments, sharing
- No infinite scroll
- No "for you" algorithmic feed
- No engagement metrics

### 10. Professional Tone
- Analytical, restrained, professional
- Not a news app, not a trading app, not a social app
- Intelligence and decision-support interface

---

## Design System Global

### Layout Global
- **AppShell**
  - `TopNav` (height: 64px)
  - `SideNav` (width: 260px, collapsible)
  - `MainContent` (max-width: 1280px, centered)
  - `RightInspector` (optional, width: 360px)

### Grid Standard
- Desktop: **12 columns**
- Gaps: **24px**
- Cards: radius **16px**, border **1px**, padding **16-20px**

### Typography
- H1: 24-28px
- H2: 18-20px
- Body: 14-16px

### Required Graphical Components
- `Sparkline` (mini chart)
- `PriceChart` (grand chart + timeframe)
- `VolumeBars`
- `EventMarkersOverlay` (points on chart)

---

## Page Specifications

See detailed specifications in `UI_SPEC_DETAILED.md` for:
- Exact layouts (grid + sizes)
- Component names and props
- Required data (props + endpoints)
- States (loading/empty/error)
- UX rules (what's forbidden)
- Actions/CTAs
- Graphical touches

---

## Implementation Checklist

Before implementing any page:
1. ✅ Verify component names match spec exactly
2. ✅ Verify data flow respects Event → Signal → Impact
3. ✅ Verify no forbidden elements (predictions in Events, etc.)
4. ✅ Verify all market data has timestamps
5. ✅ Verify all events have sources
6. ✅ Verify professional tone (no social mechanics)
