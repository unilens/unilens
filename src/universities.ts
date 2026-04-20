export interface University {
  name: string;
  svg:  string;
}

export function getUniversitySvg(name: string): string {
  return universities.find(u => u.name === name)?.svg ?? '';
}

export const universities: University[] = [
  {
    name: 'Exampletown College',
    svg: `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="20" fill="#fbff00"/>
      <text x="20" y="25" text-anchor="middle" font-family="serif" font-weight="bold" font-size="13" fill="red">EX</text>
    </svg>`,
  },
    {
    name: 'University of Georgia',
    svg: `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="20" fill="#BA0C2F"/>
      <text x="20" y="25" text-anchor="middle" font-family="serif" font-weight="bold" font-size="13" fill="white">UGA</text>
    </svg>`,
  },
  {
    name: 'University of Vermont',
    svg: `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="20" fill="#077e23"/>
      <text x="20" y="25" text-anchor="middle" font-family="serif" font-weight="bold" font-size="13" fill="gold">UVM</text>
    </svg>`,
  },
  /*{
    name: 'Georgia Institute of Technology',
    svg: `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="20" fill="#003057"/>
      <text x="20" y="23" text-anchor="middle" font-family="serif" font-weight="bold" font-size="10" fill="#B3A369">GT</text>
    </svg>`,
  },
  {
    name: 'Harvard University',
    svg: `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="20" fill="#A51C30"/>
      <text x="20" y="25" text-anchor="middle" font-family="serif" font-weight="bold" font-size="10" fill="white">HARV</text>
    </svg>`,
  },
  {
    name: 'Massachusetts Institute of Technology',
    svg: `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="20" fill="#A31F34"/>
      <text x="20" y="25" text-anchor="middle" font-family="serif" font-weight="bold" font-size="13" fill="white">MIT</text>
    </svg>`,
  },
  {
    name: 'Stanford University',
    svg: `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="20" fill="#8C1515"/>
      <text x="20" y="25" text-anchor="middle" font-family="serif" font-weight="bold" font-size="10" fill="white">STAN</text>
    </svg>`,
  },
  {
    name: 'University of California, Los Angeles',
    svg: `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="20" fill="#2774AE"/>
      <text x="20" y="25" text-anchor="middle" font-family="serif" font-weight="bold" font-size="11" fill="#FFD100">UCLA</text>
    </svg>`,
  },
  {
    name: 'University of Texas at Austin',
    svg: `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="20" fill="#BF5700"/>
      <text x="20" y="25" text-anchor="middle" font-family="serif" font-weight="bold" font-size="14" fill="white">UT</text>
    </svg>`,
  },
  {
    name: 'Duke University',
    svg: `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="20" fill="#012169"/>
      <text x="20" y="25" text-anchor="middle" font-family="serif" font-weight="bold" font-size="10" fill="white">DUKE</text>
    </svg>`,
  },
  {
    name: 'Vanderbilt University',
    svg: `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="20" fill="#1D2E4F"/>
      <text x="20" y="25" text-anchor="middle" font-family="serif" font-weight="bold" font-size="12" fill="#CFAE70">VU</text>
    </svg>`,
  },
  {
    name: 'Emory University',
    svg: `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="20" fill="#002878"/>
      <text x="20" y="25" text-anchor="middle" font-family="serif" font-weight="bold" font-size="10" fill="#F2A900">EMO</text>
    </svg>`,
  },*/
];