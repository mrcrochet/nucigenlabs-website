/**
 * Enquêtes feature — API client.
 * Re-exports investigation API so the feature has one entry point.
 */

export {
  createThread,
  getThreads,
  getThread,
  sendMessage,
  getSignals,
  updateThread,
  triggerGenerateGraph,
  getDetectiveGraph,
  getBrief,
  getOrCreatePlaygroundForSearchSession,
} from '../../lib/api/investigation-api';
export type { InvestigationApiOptions } from '../../lib/api/investigation-api';
