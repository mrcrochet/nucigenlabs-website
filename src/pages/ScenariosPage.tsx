/**
 * Scenarios Page v2 — Strategic Decision Engine
 *
 * Two views:
 * 1. HOME: "+ Create Custom Scenario" button + scenario history
 * 2. DASHBOARD: Full analysis grid (shown after selecting a scenario)
 *
 * Connects to real backend via useScenarioEngine hooks.
 * Falls back to mock data when backend data is unavailable.
 */

import { useState, useCallback } from 'react';
import { useUser } from '@clerk/clerk-react';
import { toast } from 'sonner';
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
import ResonancePanel from '../components/scenario-v2/ResonancePanel';
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

import { useGenerateScenario, useScenarioHistory, useScenarioById } from '../hooks/useScenarioEngine';
import type { ManipulationParameter } from '../types/scenario-v2';

// ── Constants ────────────────────────────────────────────────────

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
  const { user } = useUser();
  const userId = user?.id;

  // View state: null = home, string = active scenario id
  const [activeScenarioId, setActiveScenarioId] = useState<string | null>(null);
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);

  // Inline scenario data (from generate mutation, before it's saved to DB)
  const [inlineScenario, setInlineScenario] = useState<Record<string, any> | null>(null);

  // Dashboard state
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);
  const [warGameParams, setWarGameParams] = useState(MOCK_WAR_GAME_PARAMS);
  const [branches, setBranches] = useState(MOCK_BRANCHES);
  const [isRecalculating, setIsRecalculating] = useState(false);

  // ── Hooks ──
  const generateMutation = useGenerateScenario();
  const historyQuery = useScenarioHistory(userId);
  const scenarioByIdQuery = useScenarioById(
    // Only fetch by ID when we have a DB id (not inline data)
    activeScenarioId && !inlineScenario ? activeScenarioId : null
  );

  // Resolve the current scenario data (inline > fetched > null)
  const scenarioData = inlineScenario
    || (scenarioByIdQuery.data?.scenario as Record<string, any> | undefined)
    || null;

  const historyItems = historyQuery.data?.scenarios ?? [];

  // ── Callbacks ──

  const handleRecalculate = useCallback(() => {
    const baseBranches = scenarioData?.branches ?? MOCK_BRANCHES;
    setIsRecalculating(true);
    setTimeout(() => {
      const newBranches = recalculateBranches(baseBranches, warGameParams);
      setBranches(newBranches);
      setIsRecalculating(false);
    }, 400);
  }, [warGameParams, scenarioData]);

  const handleParamsChange = useCallback((params: ManipulationParameter[]) => {
    setWarGameParams(params);
  }, []);

  const handleCustomScenario = useCallback(async (data: CustomScenarioFormData) => {
    try {
      const result = await generateMutation.mutateAsync(data);
      // Store the generated scenario inline and open dashboard
      setInlineScenario(result.scenario as Record<string, any>);
      if (result.id) {
        setActiveScenarioId(result.id);
      } else {
        setActiveScenarioId('inline');
      }
      // Reset dashboard state for the new scenario
      const newParams = (result.scenario as any)?.warGameParams ?? MOCK_WAR_GAME_PARAMS;
      setWarGameParams(newParams);
      setBranches((result.scenario as any)?.branches ?? MOCK_BRANCHES);
      setSelectedBranchId(null);
      setIsCustomModalOpen(false);
      toast.success('Scenario generated successfully');
    } catch (err: any) {
      console.error('[CustomScenario] Generation failed:', err);
      toast.error(err?.message || 'Scenario generation failed — please try again');
    }
  }, [generateMutation]);

  const handleOpenScenario = useCallback((id: string) => {
    setInlineScenario(null); // clear inline, will fetch from DB
    setActiveScenarioId(id);
    setSelectedBranchId(null);
  }, []);

  const handleBackToHome = useCallback(() => {
    setActiveScenarioId(null);
    setInlineScenario(null);
    setSelectedBranchId(null);
  }, []);

  // Find active scenario metadata from history
  const activeScenarioMeta = historyItems.find((s: any) => s.id === activeScenarioId)
    ?? scenarioByIdQuery.data?.meta;

  // Dashboard loading: fetching by ID from DB (not inline)
  const isDashboardLoading = !inlineScenario && !!activeScenarioId && activeScenarioId !== 'inline' && scenarioByIdQuery.isLoading;

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
                  {historyQuery.isLoading ? '...' : `${historyItems.length} SCENARIOS`}
                </div>
              </div>

              {historyQuery.isLoading ? (
                <div className="flex flex-col gap-px">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="bg-[#0a0a0a] border border-[#1a1a1a] p-5 animate-pulse">
                      <div className="h-4 bg-[#1a1a1a] rounded w-3/4 mb-3" />
                      <div className="h-3 bg-[#1a1a1a] rounded w-1/2" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col gap-px bg-[#111]">
                  {historyItems.length === 0 && (
                    <div className="bg-black border border-[#1a1a1a] p-8 text-center">
                      <div className="text-[0.7rem] font-mono text-[#444] tracking-[1px]">
                        NO SCENARIOS YET — CREATE YOUR FIRST ONE
                      </div>
                    </div>
                  )}
                  {historyItems.map((scenario: any) => {
                    const status = STATUS_LABELS[scenario.status] || STATUS_LABELS.completed;
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
              )}
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
                {activeScenarioMeta && (
                  <span className="text-[0.75rem] font-mono text-white tracking-[1px]">
                    {(activeScenarioMeta as any).title}
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

          {isDashboardLoading ? (
            <div className="col-span-1 sm:col-span-12">
              <div className="max-w-[1800px] mx-auto p-12 flex flex-col items-center justify-center gap-4">
                <div className="w-6 h-6 border-2 border-[#333] border-t-white rounded-full animate-spin" />
                <div className="text-[0.7rem] font-mono text-[#444] tracking-[2px] uppercase">
                  LOADING SCENARIO DATA
                </div>
              </div>
            </div>
          ) : (
            /* Main Grid */
            <div className="col-span-1 sm:col-span-12">
              <div className="scenario-v2-grid bg-[#1a1a1a]">
                <div style={{ gridArea: 'regime' }}>
                  <GlobalRegimeDashboard data={scenarioData?.regime ?? MOCK_REGIME} />
                </div>
                <div style={{ gridArea: 'overview' }}>
                  <EventStateModel event={scenarioData?.event ?? MOCK_EVENT} />
                </div>
                <div style={{ gridArea: 'divergence' }}>
                  <DivergenceMonitor data={scenarioData?.divergence ?? MOCK_DIVERGENCE} />
                </div>
                <div style={{ gridArea: 'timeline' }}>
                  <ScenarioBranches
                    branches={branches}
                    selectedBranchId={selectedBranchId}
                    onSelectBranch={setSelectedBranchId}
                  />
                </div>
                <div style={{ gridArea: 'transmission' }}>
                  <TransmissionGraph data={scenarioData?.transmission ?? MOCK_TRANSMISSION} height={420} />
                </div>
                <div style={{ gridArea: 'decision' }}>
                  <DecisionLeveragePanel data={scenarioData?.decisionLeverage ?? MOCK_DECISION_LEVERAGE} />
                </div>
                <div style={{ gridArea: 'analogs' }}>
                  <HistoricalAnalogPanel analogs={scenarioData?.analogs ?? MOCK_ANALOGS} />
                </div>
                <div style={{ gridArea: 'manipulation' }}>
                  <WarGamePanel
                    params={warGameParams}
                    onParamsChange={handleParamsChange}
                    onRecalculate={handleRecalculate}
                    isRecalculating={isRecalculating}
                  />
                </div>
                <div style={{ gridArea: 'resonance' }}>
                  <ResonancePanel data={scenarioData?.resonance} />
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Custom Scenario Modal — available from both views */}
      <CustomScenarioModal
        isOpen={isCustomModalOpen}
        onClose={() => setIsCustomModalOpen(false)}
        onGenerate={handleCustomScenario}
        isGenerating={generateMutation.isPending}
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
            "decision analogs manipulation"
            "resonance resonance resonance";
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
              "manipulation manipulation"
              "resonance resonance";
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
              "manipulation"
              "resonance";
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
