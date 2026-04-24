// All values are additive score bonuses applied to each photographer's ranking.
// Higher score = ranked higher in search results.
//
// PRO_BIAS:          flat bonus for pro-tier photographers
// OPEN_BIAS:         flat bonus for photographers open for commission
// PLUS_BIAS:         flat bonus for plus-tier photographers
// RATING_BIAS:       multiplier on avg_rating (0–5), e.g. 0.40 × 4.5 = +1.8
// AVATAR_BIAS:       flat bonus for having a profile photo
// REVIEW_COUNT_BIAS: per-review bonus, capped at 10 reviews

export const PRO_BIAS          = 0.75;
export const OPEN_BIAS         = 0.75;
export const PLUS_BIAS         = 0.25;
export const RATING_BIAS       = 0.50;
export const AVATAR_BIAS       = 0.15;
export const REVIEW_COUNT_BIAS = 0.05;

export function biasOrderClause(): string {
  return `(
    CASE WHEN p.subscription_level = 'pro'  THEN ${PRO_BIAS}  ELSE 0 END +
    CASE WHEN p.subscription_level = 'plus' THEN ${PLUS_BIAS} ELSE 0 END +
    CASE WHEN p.commission_open = 1          THEN ${OPEN_BIAS} ELSE 0 END +
    CASE WHEN p.avatar_url IS NOT NULL        THEN ${AVATAR_BIAS} ELSE 0 END +
    COALESCE(ROUND(AVG(r.score), 1), 0) * ${RATING_BIAS} +
    MIN(COUNT(r.id), 10) * ${REVIEW_COUNT_BIAS}
  ) DESC`;
}