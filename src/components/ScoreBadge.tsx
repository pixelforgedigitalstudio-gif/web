import { scoreTier } from '../scoring/score';

interface Props {
  score: number;
  size?: 'sm' | 'md' | 'lg';
}

/** The SeatGeek-style 1–10 score chip, colored by tier. */
export function ScoreBadge({ score, size = 'md' }: Props) {
  const tier = scoreTier(score);
  return (
    <span className={`score-badge score-${tier} score-${size}`} title={`TiPi score: ${score} / 10`}>
      {score.toFixed(1)}
    </span>
  );
}
