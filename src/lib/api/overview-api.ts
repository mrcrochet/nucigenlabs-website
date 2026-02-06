/**
 * Overview map API – Global Situation signals and side panel data
 */

import type { OverviewMapData } from '../../types/overview';
import { apiUrl } from '../api-base';

const FALLBACK_DATA: OverviewMapData = {
  signals: [
    { id: '1', lat: -2.5, lon: 28.8, type: 'security', impact: 'regional', importance: 85, confidence: 82, occurred_at: new Date().toISOString(), label_short: 'DRC – North Kivu', subtitle_short: 'ADF activity escalation', impact_one_line: 'Gold supply risk', investigate_id: '/investigations' },
    { id: '2', lat: 25.2, lon: 55.3, type: 'supply-chains', impact: 'global', importance: 78, confidence: 76, occurred_at: new Date().toISOString(), label_short: 'UAE – Dubai', subtitle_short: 'Gold trade hub disruption', impact_one_line: 'Precious metals flow', investigate_id: '/investigations' },
    { id: '3', lat: 51.5, lon: -0.1, type: 'geopolitics', impact: 'global', importance: 90, confidence: 94, occurred_at: new Date().toISOString(), label_short: 'UK – London', subtitle_short: 'Sanctions policy update', impact_one_line: 'Financial compliance', investigate_id: '/investigations' },
    { id: '4', lat: 55.7, lon: 37.6, type: 'energy', impact: 'regional', importance: 72, confidence: 88, occurred_at: new Date().toISOString(), label_short: 'Russia – Moscow', subtitle_short: 'Energy export reconfiguration', impact_one_line: 'Gas supply routes', investigate_id: '/investigations' },
    { id: '5', lat: 39.9, lon: 116.4, type: 'supply-chains', impact: 'global', importance: 80, confidence: 79, occurred_at: new Date().toISOString(), label_short: 'China – Beijing', subtitle_short: 'Strategic minerals stockpiling', impact_one_line: 'Rare earth dominance', investigate_id: '/investigations' },
    { id: '6', lat: 40.7, lon: -74.0, type: 'markets', impact: 'global', importance: 88, confidence: 91, occurred_at: new Date().toISOString(), label_short: 'USA – New York', subtitle_short: 'Financial markets volatility', impact_one_line: 'Commodity futures', investigate_id: '/investigations' },
  ],
  top_events: [
    { id: '1', label_short: 'DRC – North Kivu', impact_one_line: 'Gold supply risk', investigate_id: '/investigations' },
    { id: '2', label_short: 'UAE – Dubai', impact_one_line: 'Precious metals flow', investigate_id: '/investigations' },
    { id: '3', label_short: 'UK – London', impact_one_line: 'Financial compliance', investigate_id: '/investigations' },
  ],
  top_impacts: [
    { name: 'Barrick Gold', impact_one_line: 'Production disruption', investigate_id: '/investigations' },
    { name: 'Gazprom', impact_one_line: 'Route reconfiguration', investigate_id: '/investigations' },
    { name: 'HSBC', impact_one_line: 'Compliance costs', investigate_id: '/investigations' },
  ],
};

export async function getOverviewMapData(): Promise<OverviewMapData> {
  try {
    const res = await fetch(apiUrl('/api/overview/map'));
    if (!res.ok) throw new Error('Overview map fetch failed');
    const json = await res.json();
    if (!json.success || !json.data) throw new Error('Invalid overview map response');
    return json.data as OverviewMapData;
  } catch {
    return FALLBACK_DATA;
  }
}
