import { Card } from "./ui/Card";

export interface StatTileProps {
  value: string;
  label: string;
}

export function StatTile({ value, label }: StatTileProps) {
  return (
    <Card>
      <div className="chiffres font-display font-black [font-stretch:116%] text-[26px] leading-none text-projecteur truncate">
        {value}
      </div>
      <div className="font-data text-[9.5px] text-gris-fonce uppercase tracking-[0.1em] mt-2">
        {label}
      </div>
    </Card>
  );
}
