export interface BadgesSummaryProps {
  unlockedCount: number;
  total: number;
}

export function BadgesSummary({ unlockedCount, total }: BadgesSummaryProps) {
  return (
    <div className="carte p-5 flex items-center justify-between gap-4 flex-wrap">
      <div>
        <div className="chiffres font-display font-black [font-stretch:116%] text-[30px] text-projecteur leading-none">
          {unlockedCount}
          <span className="text-gris-fonce text-[18px]"> / {total}</span>
        </div>
        <p className="text-gris-fonce text-[12.5px] mt-1.5">badges débloqués</p>
      </div>
      <div className="h-2 rounded-full bg-ligne overflow-hidden flex-1 min-w-[140px] max-w-[280px]">
        <div
          className="h-full rounded-full bg-projecteur"
          style={{ width: `${total > 0 ? (unlockedCount / total) * 100 : 0}%` }}
        />
      </div>
    </div>
  );
}
