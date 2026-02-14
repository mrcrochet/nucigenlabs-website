/**
 * Scenarios Page v2 — Strategic Decision Engine
 *
 * Terminal aesthetic with CSS Grid 3 colonnes, 4 rows
 * Grid areas: "regime regime regime"
 *             "overview overview divergence"
 *             "timeline timeline transmission"
 *             "decision analogs manipulation"
 */

import { useState, useCallback } from 'react';
import AppShell from '../components/layout/AppShell';
import ProtectedRoute from '../components/ProtectedRoute';
import SEO from '../components/SEO';

import ScenarioEventSelector from '../components/scenario-v2/ScenarioEventSelector';
import GlobalRegimeDashboard from '../components/scenario-v2/GlobalRegimeDashboard';
import EventStateModel from '../components/scenario-v2/EventStateModel';
import DivergenceMonitor from '../components/scenario-v2/DivergenceMonitor';
import ScenarioBranches from '../components/scenario-v2/ScenarioBranches';
import TransmissionGraph from '../components/scenario-v2/TransmissionGraph';
import DecisionLeveragePanel from '../components/scenario-v2/DecisionLeveragePanel';
import HistoricalAnalogPanel from '../components/scenario-v2/HistoricalAnalogPanel';
import WarGamePanel from '../components/scenario-v2/WarGamePanel';
import CustomScenarioModal from '../components/scenario-v2/CustomScenarioModal';
import type { CustomScenarioFormData } from '../components/scenario-v2/CustomScenarioModal';

import {
  MOCK_EVENT_OPTIONS,
  MOCK_EVENT,
  MOCK_BRANCHES,
  MOCK_DIVERGENCE,
  MOCK_TRANSMISSION,
  MOCK_DECISION_LEVERAGE,
  MOCK_ANALOGS,
  MOCK_WAR_GAME_PARAMS,
  MOCK_REGIME,
  recalculateBranches,
} from '../data/scenario-v2-mock';

import type { ManipulationParameter } from '../types/scenario-v2';

function ScenariosPageContent() {
  const [selectedEventIndex, setSelectedEventIndex] = useState(0);
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);
  const [warGameParams, setWarGameParams] = useState(MOCK_WAR_GAME_PARAMS);
  const [branches, setBranches] = useState(MOCK_BRANCHES);
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);

  const handleRecalculate = useCallback(() => {
    setIsRecalculating(true);
    setTimeout(() => {
      const newBranches = recalculateBranches(MOCK_BRANCHES, warGameParams);
      setBranches(newBranches);
      setIsRecalculating(false);
    }, 400);
  }, [warGameParams]);

  const handleParamsChange = useCallback((params: ManipulationParameter[]) => {
    setWarGameParams(params);
  }, []);

  const handleCustomScenario = useCallback((data: CustomScenarioFormData) => {
    // TODO: Connect to real API — for now log the custom scenario
    console.log('[CustomScenario] Generated:', data);
  }, []);

  return (
    <AppShell>
      <SEO
        title="Scenario Engine — Nucigen"
        description="Strategic Decision Engine — Probabilistic scenario modeling with transmission chains and market divergence"
      />

      {/* Event Selector Header */}
      <div className="col-span-1 sm:col-span-12">
        <ScenarioEventSelector
          events={MOCK_EVENT_OPTIONS}
          selectedIndex={selectedEventIndex}
          onSelect={setSelectedEventIndex}
          onCreateCustom={() => setIsCustomModalOpen(true)}
        />
      </div>

      {/* Main Grid — terminal aesthetic, 4 rows */}
      <div className="col-span-1 sm:col-span-12">
        <div className="scenario-v2-grid bg-[#1a1a1a]">
          {/* Row 0: Global Regime Dashboard */}
          <div style={{ gridArea: 'regime' }}>
            <GlobalRegimeDashboard data={MOCK_REGIME} />
          </div>

          {/* Row 1: Event State + Divergence */}
          <div style={{ gridArea: 'overview' }}>
            <EventStateModel event={MOCK_EVENT} />
          </div>
          <div style={{ gridArea: 'divergence' }}>
            <DivergenceMonitor data={MOCK_DIVERGENCE} />
          </div>

          {/* Row 2: Probability Branches + Transmission */}
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

          {/* Row 3: Decision + Analogs + War-Game */}
          <div style={{ gridArea: 'decision' }}>
            <DecisionLeveragePanel data={MOCK_DECISION_LEVERAGE} />
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

      {/* Custom Scenario Modal */}
      <CustomScenarioModal
        isOpen={isCustomModalOpen}
        onClose={() => setIsCustomModalOpen(false)}
        onGenerate={handleCustomScenario}
      />

      <style>{`
        .scenario-v2-grid {
          max-width: 1800px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          grid-template-rows: auto auto auto auto;
          gap: 1px;
          grid-template-areas:
            "regime regime regime"
            "overview overview divergence"
            "timeline timeline transmission"
            "decision analogs manipulation";
        }

        @keyframes slideIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @media (max-width: 1400px) {
          .scenario-v2-grid {
            grid-template-columns: 1fr 1fr;
            grid-template-areas:
              "regime regime"
              "overview divergence"
              "timeline timeline"
              "transmission transmission"
              "decision analogs"
              "manipulation manipulation";
          }
        }

        @media (max-width: 768px) {
          .scenario-v2-grid {
            grid-template-columns: 1fr;
            grid-template-areas:
              "regime"
              "overview"
              "divergence"
              "timeline"
              "transmission"
              "decision"
              "analogs"
              "manipulation";
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
