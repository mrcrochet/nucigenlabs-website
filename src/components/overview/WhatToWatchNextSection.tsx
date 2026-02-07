/**
 * What to Watch Next — Pont mental vers l’avenir.
 * Emerging Signals : 3 items max, pas encore critiques, à surveiller. Cliquable → Enquête.
 */

import EmergingSignalsList from './EmergingSignalsList';

export default function WhatToWatchNextSection() {
  return (
    <section className="col-span-1 sm:col-span-12 mb-6" aria-labelledby="what-to-watch-heading">
      <h2
        id="what-to-watch-heading"
        className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4"
      >
        What to Watch Next
      </h2>
      <p className="text-xs text-text-muted mb-4 max-w-2xl">
        Signaux émergents – pas d’urgence, mais attention directionnelle.
      </p>
      <div className="max-w-xl">
        <EmergingSignalsList limit={3} />
      </div>
    </section>
  );
}
