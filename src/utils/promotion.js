// Groups promotions that are one company under different names, so filters show it once.
// Entries keep the name in use at the time (WWWF in 1963, WWF in 1997, WWE in 2004).
const LINEAGES = [
  { label: 'WWE (including WWWF and WWF)', pattern: /\((WWWF|WWF|WWE)\)|^(WWWF|WWF|WWE)$/ },
];

export function promotionGroup(promotion) {
  const lineage = LINEAGES.find(({ pattern }) => pattern.test(promotion || ''));
  return lineage ? lineage.label : promotion;
}
