/**
 * My World Changed — Ce qui a changé depuis la dernière fois.
 * 3 colonnes : Triggered Alerts | Decision Points | Watchlist Changes.
 * Chaque item cliquable → Enquête / Investigate. Max 3–5 items par colonne.
 */

import TriggeredAlertsFeed from './TriggeredAlertsFeed';
import WatchlistChangesCard from './WatchlistChangesCard';
import DecisionPointsList from './DecisionPointsList';

export default function MyWorldChangedSection() {
  return (
    <section className="col-span-1 sm:col-span-12 mb-6" aria-labelledby="my-world-changed-heading">
      <h2
        id="my-world-changed-heading"
        className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4"
      >
        My World Changed
      </h2>
      <p className="text-xs text-text-muted mb-4 max-w-2xl">
        Ce qui a changé par rapport à la dernière fois. Cliquez pour creuser.
      </p>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        <div className="min-w-0">
          <TriggeredAlertsFeed limit={5} />
        </div>
        <div className="min-w-0">
          <DecisionPointsList limit={5} />
        </div>
        <div className="min-w-0">
          <WatchlistChangesCard limit={5} />
        </div>
      </div>
    </section>
  );
}
