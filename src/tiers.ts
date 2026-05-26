export type Tier = 'basic' | 'plus' | 'pro';

export const TIERS: Record<Tier, {
  label:            string;
  photoLimit:       number;
  maxFileMb:        number;
  ads:              boolean;
  proBadge:         boolean;
  alsoServesLimit:  number;
  monthlyPrice:     number | null;
  yearlyPrice:      number | null;
}> = {
  basic: {
    label:            'Basic',
    photoLimit:       6,
    maxFileMb:        10,
    ads:              true,
    proBadge:         false,
    alsoServesLimit:  0,
    monthlyPrice:     null,
    yearlyPrice:      null,
  },
  plus: {
    label:            'Plus',
    photoLimit:       12,
    maxFileMb:        18,
    ads:              false,
    proBadge:         false,
    alsoServesLimit:  2,
    monthlyPrice:     1,
    yearlyPrice:      10,
  },
  pro: {
    label:            'Pro',
    photoLimit:       24,
    maxFileMb:        26,
    ads:              false,
    proBadge:         true,
    alsoServesLimit:  5,
    monthlyPrice:     2,
    yearlyPrice:      20,
  },
};

export function getTier(level: string): Tier {
  if (level === 'plus' || level === 'pro') return level;
  return 'basic';
}