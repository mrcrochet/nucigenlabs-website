/**
 * Pathways - First/second order effects
 * 
 * chaque effet = bullet + confidence
 */

import Card from '../ui/Card';
import SectionHeader from '../ui/SectionHeader';
import Badge from '../ui/Badge';
import type { Impact } from '../../types/intelligence';

interface PathwaysProps {
  impact: Impact;
}

export default function Pathways({ impact }: PathwaysProps) {
  const pathways = impact.pathways;

  if (!pathways) {
    return (
      <Card>
        <SectionHeader title="Pathways" />
        <div className="mt-4 text-sm text-text-secondary text-center py-4">
          No pathways data available
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <SectionHeader title="Pathways" />
      
      <div className="mt-4 space-y-6">
        {/* First Order Effects */}
        {pathways.first_order_effects && pathways.first_order_effects.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-text-secondary mb-3">First Order Effects</h3>
            <div className="space-y-2">
              {pathways.first_order_effects.map((effect, index) => (
                <div key={index} className="flex items-start gap-2 p-3 bg-background-glass-subtle rounded-lg">
                  <span className="text-text-secondary mt-1">•</span>
                  <p className="text-sm text-text-primary flex-1">{effect.effect}</p>
                  <Badge variant="neutral">{effect.confidence}%</Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Second Order Effects */}
        {pathways.second_order_effects && pathways.second_order_effects.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-text-secondary mb-3">Second Order Effects</h3>
            <div className="space-y-2">
              {pathways.second_order_effects.map((effect, index) => (
                <div key={index} className="flex items-start gap-2 p-3 bg-background-glass-subtle rounded-lg">
                  <span className="text-text-secondary mt-1">•</span>
                  <p className="text-sm text-text-primary flex-1">{effect.effect}</p>
                  <Badge variant="neutral">{effect.confidence}%</Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
