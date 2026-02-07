/**
 * Enquêtes feature — component exports.
 * DetailsPanel and ChatPanel are heavy; re-export from shared components for now.
 */

export { default as PathCard } from './PathCard';
export { default as FlowView } from './FlowView';
export { default as TimelineView } from './TimelineView';
export { default as MapView } from './MapView';
export { default as InvestigationMap } from './InvestigationMap';

// Re-export from existing shared components so we don't duplicate 300+ lines
export { default as DetailsPanel, type DetailsSelection } from '../../../components/investigation/InvestigationDetailsPanel';
export { default as ChatPanel } from '../../../components/investigation/InvestigationChatPanel';
