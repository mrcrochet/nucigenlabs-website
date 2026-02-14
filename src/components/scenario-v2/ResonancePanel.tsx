import type { ScenarioResonance } from '../../types/scenario-v2';

interface ResonancePanelProps {
  data: ScenarioResonance | null | undefined;
}

export default function ResonancePanel({ data }: ResonancePanelProps) {
  if (!data?.events?.length) {
    return (
      <div className="bg-black border border-[#1a1a1a] p-6 h-full">
        <div className="text-[0.7rem] font-mono font-normal text-white tracking-[2px] uppercase mb-4 pb-2 border-b border-[#1a1a1a]">
          ÉVÉNEMENTS QUI RÉSONNENT
        </div>
        <p className="text-[0.75rem] text-[#666] font-mono">
          Aucun événement réel ne correspond encore à ce scénario.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-black border border-[#1a1a1a] p-6 h-full">
      <div className="text-[0.7rem] font-mono font-normal text-white tracking-[2px] uppercase mb-4 pb-2 border-b border-[#1a1a1a]">
        ÉVÉNEMENTS QUI RÉSONNENT
      </div>
      <div className="flex flex-col gap-2 mt-4">
        {data.events.map((ev) => (
          <a
            key={ev.id}
            href={ev.investigateId}
            className="block p-3 bg-[#111] border border-[#2a2a2a] hover:border-[#444] transition-colors"
          >
            <div className="text-[0.8rem] font-medium text-white line-clamp-2">{ev.title}</div>
            {(ev.country || ev.occurredAt) && (
              <div className="text-[0.65rem] font-mono text-[#666] mt-1">
                {[ev.country, ev.occurredAt ? new Date(ev.occurredAt).toLocaleDateString() : null]
                  .filter(Boolean)
                  .join(' · ')}
              </div>
            )}
          </a>
        ))}
      </div>
    </div>
  );
}
