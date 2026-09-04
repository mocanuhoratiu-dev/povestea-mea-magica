export function isUsableLineArtStatistics({
  average,
  contrast,
  inkCoverage,
}: {
  average: number;
  contrast: number;
  inkCoverage: number;
}) {
  return average >= 150
    && average <= 254.5
    && contrast >= 5
    && inkCoverage >= 0.004
    && inkCoverage <= 0.6;
}
