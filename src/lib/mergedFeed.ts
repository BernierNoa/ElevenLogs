import type { FeedLogItem } from "./feedMapping";
import type { PublicCustomLogItem } from "./customLogFeedMapping";

export type MergedFeedEntry =
  | { kind: "log"; createdAt: string; log: FeedLogItem }
  | { kind: "custom"; createdAt: string; customLog: PublicCustomLogItem };

// Fusionne logs standards + matchs personnalisés dans un seul fil trié par
// date de création — les deux sources sont chargées séparément (tables
// distinctes, cf. 20260731000000_add_custom_logs.sql) mais doivent
// s'afficher entremêlées comme un flux unique.
export function mergeFeedEntries(
  logs: FeedLogItem[],
  customLogs: PublicCustomLogItem[],
): MergedFeedEntry[] {
  const entries: MergedFeedEntry[] = [
    ...logs.map((log): MergedFeedEntry => ({ kind: "log", createdAt: log.createdAt, log })),
    ...customLogs.map(
      (customLog): MergedFeedEntry => ({ kind: "custom", createdAt: customLog.createdAt, customLog }),
    ),
  ];
  return entries.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
