/**
 * Scenarios Page v2 — Strategic Decision Engine
 *
 * Two views:
 * 1. HOME: "+ Create Custom Scenario" button + scenario history
 * 2. DASHBOARD: Full analysis grid (shown after selecting a scenario)
 */

import { useState, useCallback } from 'react';
import AppShell from '../components/layout/AppShell';
import ProtectedRoute from '../components/ProtectedRoute';
import SEO from '../components/SEO';

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

// ── Scenario History (mock) ─────────────────────────────────────
interface ScenarioHistoryItem {
  id: string;
  title: string;
  scope: string;
  severity: string;
  timeframe: string;
  createdAt: string;
  status: 'completed' | 'running' | 'queued';
  plausibility: number;
}

const SCENARIO_HISTORY: ScenarioHistoryItem[] = [
  {
    id: 'sc-001',
    title: 'Sanctions US contre l\'Iran — Escalade 2025',
    scope: 'GEOPOLITICAL',
    severity: 'CRITICAL',
    timeframe: 'IMMEDIATE',
    createdAt: '2025-02-11 14:32',
    status: 'completed',
    plausibility: 82,
  },
  {
    id: 'sc-002',
    title: 'Restrictions exportations chinoises — Semi-conducteurs',
    scope: 'ECONOMIC',
    severity: 'HIGH',
    timeframe: 'NEAR-TERM',
    createdAt: '2025-02-10 09:15',
    status: 'completed',
    plausibility: 78,
  },
  {
    id: 'sc-003',
    title: 'Conflit Russie-Ukraine — Phase 3 Escalade',
    scope: 'GEOPOLITICAL',
    severity: 'CRITICAL',
    timeframe: 'IMMEDIATE',
    createdAt: '2025-02-08 22:41',
    status: 'completed',
    plausibility: 91,
  },
  {
    id: 'sc-004',
    title: 'Coup d\'État Niger — Implications régionales CEDEAO',
    scope: 'GEOPOLITICAL',
    severity: 'MEDIUM',
    timeframe: 'NEAR-TERM',
    createdAt: '2025-02-06 11:08',
    status: 'completed',
    plausibility: 74,
  },
  {
    id: 'sc-005',
    title: 'OPEC+ Emergency Production Cut — 2M barrels/day',
    scope: 'MARKETS',
    severity: 'HIGH',
    timeframe: 'IMMEDIATE',
    createdAt: '2025-02-04 16:55',
    status: 'completed',
    plausibility: 85,
  },
];

const SEVERITY_COLORS: Record<string, string> = {
  CRITICAL: '#ff0000',
  HIGH: '#ff6600',
  MEDIUM: '#ffaa00',
  LOW: '#00ff00',
};

const STATUS_LABELS: Record<string, { text: string; color: string }> = {
  completed: { text: 'COMPLETED', color: '#00ff00' },
  running: { text: 'RUNNING', color: '#ffaa00' },
  queued: { text: 'QUEUED', color: '#666' },
};

// ─────────────────────────────────────────────────────────────────

function ScenariosPageContent() {
  // View state: null = home, string = active scenario id
  const [activeScenarioId, setActiveScenarioId] = useState<string | null>(null);
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);

  // Dashboard state
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);
  const [warGameParams, setWarGameParams] = useState(MOCK_WAR_GAME_PARAMS);
  const [branches, setBranches] = useState(MOCK_BRANCHES);
  const [isRecalculating, setIsRecalculating] = useState(false);

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
    console.log('[CustomScenario] Generated:', data);
    // After generation, open the dashboard with the first mock scenario
    setActiveScenarioId('sc-001');
  }, []);

  const handleOpenScenario = useCallback((id: string) => {
    setActiveScenarioId(id);
  }, []);

  const handleBackToHome = useCallback(() => {
    setActiveScenarioId(null);
    setSelectedBranchId(null);
  }, []);

  const activeScenario = SCENARIO_HISTORY.find(s => s.id === activeScenarioId);

  return (
    <AppShell>
      <SEO
        title="Scenario Engine — Nucigen"
        description="Strategic Decision Engine — Probabilistic scenario modeling with transmission chains and market divergence"
      />

      {!activeScenarioId ? (
        /* ══════════════════════════════════════════════════════════
         *  HOME VIEW — Create button + scenario history
         * ══════════════════════════════════════════════════════════ */
        <div className="col-span-1 sm:col-span-12">
          <div className="max-w-[1800px] mx-auto">
            {/* Create button */}
            <div className="p-6 pb-0">
              <button
                onClick={() => setIsCustomModalOpen(true)}
                className="bg-black border border-[#2a2a2a] text-white py-3.5 px-6 font-mono text-[0.75rem] tracking-[2px] uppercase cursor-pointer transition-all duration-200 hover:border-white hover:bg-[#0a0a0a]"
              >
                + CREATE CUSTOM SCENARIO
              </button>
            </div>

            {/* Scenario History */}
            <div className="p-6 pt-10">
              <div className="flex items-center justify-between mb-6">
                <div className="text-[0.65rem] font-mono text-[#444] tracking-[2px] uppercase">
                  SCENARIO HISTORY
                </div>
                <div className="text-[0.6rem] font-mono text-[#333] tracking-[1px]">
                  {SCENARIO_HISTORY.length} SCENARIOS
                </div>
              </div>

              <div className="flex flex-col gap-px bg-[#111]">
                {SCENARIO_HISTORY.map((scenario) => {
                  const status = STATUS_LABELS[scenario.status];
                  return (
                    <div
                      key={scenario.id}
                      onClick={() => handleOpenScenario(scenario.id)}
                      className="group bg-black border border-[#1a1a1a] p-5 cursor-pointer transition-all duration-200 hover:border-[#333] hover:bg-[#0a0a0a]"
                    >
                      {/* Top row: title + status */}
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="text-[0.8rem] font-mono text-[#b4b4b4] group-hover:text-white transition-colors duration-200 leading-relaxed">
                          {scenario.title}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <div
                            className="w-1.5 h-1.5"
                            style={{ backgroundColor: status.color }}
                          />
                          <span
                            className="text-[0.55rem] font-mono tracking-[1px]"
                            style={{ color: status.color }}
                          >
                            {status.text}
                          </span>
                        </div>
                      </div>

                      {/* Bottom row: metadata */}
                      <div className="flex items-center gap-5 flex-wrap">
                        <span className="text-[0.6rem] font-mono text-[#444] tracking-[1px]">
                          {scenario.scope}
                        </span>
                        <span
                          className="text-[0.6rem] font-mono tracking-[1px]"
                          style={{ color: SEVERITY_COLORS[scenario.severity] || '#666' }}
                        >
                          {scenario.severity}
                        </span>
                        <span className="text-[0.6rem] font-mono text-[#444] tracking-[1px]">
                          {scenario.timeframe}
                        </span>
                        <span className="text-[0.6rem] font-mono text-[#333] tracking-[1px]">
                          {scenario.createdAt}
                        </span>
                        <span className="text-[0.6rem] font-mono text-[#444] tracking-[1px] ml-auto">
                          PLAUSIBILITY <span className="text-white">{scenario.plausibility}</span>/100
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ══════════════════════════════════════════════════════════
         *  DASHBOARD VIEW — Full analysis grid
         * ══════════════════════════════════════════════════════════ */
        <>
          {/* Dashboard header with back button */}
          <div className="col-span-1 sm:col-span-12">
            <div className="flex items-center justify-between py-4 px-6 bg-[#0a0a0a] border-b border-[#1a1a1a]">
              <div className="flex items-center gap-6">
                <button
                  onClick={handleBackToHome}
                  className="text-[#666] font-mono text-[0.7rem] tracking-[1px] cursor-pointer hover:text-white transition-colors duration-200"
                >
                  ← BACK
                </button>
                {activeScenario && (
                  <span className="text-[0.75rem] font-mono text-white tracking-[1px]">
                    {activeScenario.title}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setIsCustomModalOpen(true)}
                  className="bg-black border border-[#2a2a2a] text-[#666] py-2 px-4 font-mono text-[0.65rem] tracking-[1px] uppercase cursor-pointer transition-all duration-200 hover:border-white hover:text-white"
                >
                  + NEW SCENARIO
                </button>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-[#00ff00] animate-pulse" />
                  <span className="text-[0.65rem] font-mono tracking-[1px] text-[#00ff00]">
                    LIVE
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Grid */}
          <div className="col-span-1 sm:col-span-12">
            <div className="scenario-v2-grid bg-[#1a1a1a]">
              <div style={{ gridArea: 'regime' }}>
                <GlobalRegimeDashboard data={MOCK_REGIME} />
              </div>
              <div style={{ gridArea: 'overview' }}>
                <EventStateModel event={MOCK_EVENT} />
              </div>
              <div style={{ gridArea: 'divergence' }}>
                <DivergenceMonitor data={MOCK_DIVERGENCE} />
              </div>
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
        </>
      )}

      {/* Custom Scenario Modal — available from both views */}
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
