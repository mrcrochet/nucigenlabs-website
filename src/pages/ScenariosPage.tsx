/**
 * Scenarios Page v2 — Strategic Decision Engine
 *
 * Layout: CSS Grid 3 colonnes (desktop) → 2 col (tablet) → 1 col (mobile)
 * Grid areas: "overview overview divergence"
 *             "timeline timeline transmission"
 *             "decision analogs manipulation"
 */

import { useState, useCallback } from 'react';
import AppShell from '../components/layout/AppShell';
import ProtectedRoute from '../components/ProtectedRoute';
import SEO from '../components/SEO';

// Scenario v2 Components
import ScenarioEventSelector from '../components/scenario-v2/ScenarioEventSelector';
import EventStateModel from '../components/scenario-v2/EventStateModel';
import DivergenceMonitor from '../components/scenario-v2/DivergenceMonitor';
import ScenarioBranches from '../components/scenario-v2/ScenarioBranches';
import TransmissionGraph from '../components/scenario-v2/TransmissionGraph';
import DecisionLeveragePanel from '../components/scenario-v2/DecisionLeveragePanel';
import HistoricalAnalogPanel from '../components/scenario-v2/HistoricalAnalogPanel';
import WarGamePanel from '../components/scenario-v2/WarGamePanel';

// Mock Data
import {
  MOCK_EVENT_OPTIONS,
  MOCK_EVENT,
  MOCK_BRANCHES,
  MOCK_DIVERGENCE,
  MOCK_TRANSMISSION,
  MOCK_DECISION_LEVERAGE,
  MOCK_ANALOGS,
  MOCK_WAR_GAME_PARAMS,
  recalculateBranches,
} from '../data/scenario-v2-mock';

import type { ManipulationParameter } from '../types/scenario-v2';

function ScenariosPageContent() {
  const [selectedEventIndex, setSelectedEventIndex] = useState(0);
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);
  const [warGameParams, setWarGameParams] = useState(MOCK_WAR_GAME_PARAMS);
  const [branches, setBranches] = useState(MOCK_BRANCHES);
  const [isRecalculating, setIsRecalculating] = useState(false);

  const handleRecalculate = useCallback(() => {
    setIsRecalculating(true);
    // Simulate recalculation delay
    setTimeout(() => {
      const newBranches = recalculateBranches(MOCK_BRANCHES, warGameParams);
      setBranches(newBranches);
      setIsRecalculating(false);
    }, 400);
  }, [warGameParams]);

  const handleParamsChange = useCallback((params: ManipulationParameter[]) => {
    setWarGameParams(params);
  }, []);

  return (
    <AppShell>
      <SEO
        title="Scenario Engine — Nucigen"
        description="Strategic Decision Engine — Probabilistic scenario modeling with transmission chains and market divergence"
      />

      {/* Event Selector — full width */}
      <div className="col-span-1 sm:col-span-12 mb-2">
        <ScenarioEventSelector
          events={MOCK_EVENT_OPTIONS}
          selectedIndex={selectedEventIndex}
          onSelect={setSelectedEventIndex}
        />
      </div>

      {/* Main Grid — 3 column layout */}
      <div className="col-span-1 sm:col-span-12">
        <div
          className="grid gap-3"
          style={{
            gridTemplateColumns: 'repeat(3, 1fr)',
            gridTemplateAreas: `
              "overview overview divergence"
              "timeline timeline transmission"
              "decision analogs manipulation"
            `,
          }}
        >
          {/* Row 1: Event State Model + Divergence Monitor */}
          <div style={{ gridArea: 'overview' }}>
            <EventStateModel event={MOCK_EVENT} />
          </div>
          <div style={{ gridArea: 'divergence' }}>
            <DivergenceMonitor data={MOCK_DIVERGENCE} />
          </div>

          {/* Row 2: Probability Branches + Transmission Graph */}
          <div style={{ gridArea: 'timeline' }}>
            <ScenarioBranches
              branches={branches}
              selectedBranchId={selectedBranchId}
              onSelectBranch={setSelectedBranchId}
            />
          </div>
          <div style={{ gridArea: 'transmission' }}>
            <TransmissionGraph data={MOCK_TRANSMISSION} height={420} />
          </div>

          {/* Row 3: Decision Leverage + Historical Analogs + War-Game */}
          <div style={{ gridArea: 'decision' }}>
            <DecisionLeveragePanel items={MOCK_DECISION_LEVERAGE} />
          </div>
          <div style={{ gridArea: 'analogs' }}>
            <HistoricalAnalogPanel analogs={MOCK_ANALOGS} />
          </div>
          <div style={{ gridArea: 'manipulation' }}>
            <WarGamePanel
              params={warGameParams}
              onParamsChange={handleParamsChange}
              onRecalculate={handleRecalculate}
              isRecalculating={isRecalculating}
            />
          </div>
        </div>
      </div>

      {/* Responsive override for smaller screens */}
      <style>{`
        @media (max-width: 1200px) {
          .col-span-1.sm\\:col-span-12 > div[style*="gridTemplateAreas"] {
            grid-template-columns: 1fr 1fr !important;
            grid-template-areas:
              "overview divergence"
              "timeline timeline"
              "transmission transmission"
              "decision analogs"
              "manipulation manipulation" !important;
          }
        }
        @media (max-width: 768px) {
          .col-span-1.sm\\:col-span-12 > div[style*="gridTemplateAreas"] {
            grid-template-columns: 1fr !important;
            grid-template-areas:
              "overview"
              "divergence"
              "timeline"
              "transmission"
              "decision"
              "analogs"
              "manipulation" !important;
          }
        }
      `}</style>
    </AppShell>
  );
}

export default function ScenariosPage() {
  return (
    <ProtectedRoute>
      <ScenariosPageContent />
    </ProtectedRoute>
  );
}
