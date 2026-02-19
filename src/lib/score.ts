/**
 * 점수 = max(0, 10 - |정답순위 - 선택순위|)
 * 완전 일치 → 10점, 1칸 차이 → 9점, 9칸 차이 → 1점, 완전 틀림 → 0점
 */
export function calculateScore(
  correctRankMap: Map<string, number>,
  answers: { name: string; rank: number }[]
): number {
  let total = 0;
  for (const { name, rank } of answers) {
    const correctRank = correctRankMap.get(name);
    if (correctRank === undefined) continue;
    const diff = Math.abs(correctRank - rank);
    total += Math.max(0, 10 - diff);
  }
  return total;
}
