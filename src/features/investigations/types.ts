/**
 * Enquêtes feature — single source of truth for types.
 * Re-exports from global types so the feature has one entry point.
 */

export type {
  InvestigationScope,
  ThreadStatus,
  InvestigationThread,
  InvestigationSignal,
  InvestigationMessage,
  CreateThreadPayload,
  SendMessagePayload,
} from '../../types/investigation';

export type {
  InvestigationNodeType,
  InvestigationEdgeRelation,
  InvestigationPathStatus,
  InvestigationGraphNode,
  InvestigationGraphEdge,
  InvestigationGraphPath,
  InvestigationGraph,
} from '../../types/investigation-graph';
