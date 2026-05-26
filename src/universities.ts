export interface University {
  name: string;
  svg:  string;
}

export function getUniversitySvg(name: string): string {
  return universities.find(u => u.name === name)?.svg ?? '';
}

export const universities: University[] = [
  {
    name: 'None',
    svg: `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="20" fill="#000000"/>
      <text x="20" y="25" text-anchor="middle" font-family="serif" font-weight="bold" font-size="13" fill="white">N/A</text>
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
  {
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
      <text x="20" y="25" text-anchor="middle" font-family="serif" font-weight="bold" font-size="10" fill="white">HU</text>
    </svg>`,
  },
  {
    name: 'Yale University',
    svg: `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="20" fill="#00356B"/>
      <text x="20" y="25" text-anchor="middle" font-family="serif" font-weight="bold" font-size="10" fill="white">YU</text>
    </svg>`,
  },
  {
    name: 'Princeton University',
    svg: `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="20" fill="#FF8F00"/>
      <text x="20" y="25" text-anchor="middle" font-family="serif" font-weight="bold" font-size="9" fill="black">PU</text>
    </svg>`,
  },
  {
    name: 'Stanford University',
    svg: `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="20" fill="#8C1515"/>
      <text x="20" y="25" text-anchor="middle" font-family="serif" font-weight="bold" font-size="9" fill="white">SU</text>
    </svg>`,
  },
  {
    name: 'Massachusetts Institute of Technology',
    svg: `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="20" fill="#A31F34"/>
      <text x="20" y="24" text-anchor="middle" font-family="serif" font-weight="bold" font-size="8" fill="white">MIT</text>
    </svg>`,
  },
  {
    name: 'California Institute of Technology',
    svg: `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="20" fill="#FF6F00"/>
      <text x="20" y="24" text-anchor="middle" font-family="serif" font-weight="bold" font-size="8" fill="white">CIT</text>
    </svg>`,
  },
  {
    name: 'Columbia University',
    svg: `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="20" fill="#9BDDFF"/>
      <text x="20" y="25" text-anchor="middle" font-family="serif" font-weight="bold" font-size="8" fill="#003366">CU</text>
    </svg>`,
  },
  {
    name: 'University of Pennsylvania',
    svg: `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="20" fill="#011F5B"/>
      <text x="20" y="24" text-anchor="middle" font-family="serif" font-weight="bold" font-size="8" fill="#990000">UP</text>
    </svg>`,
  },
  {
    name: 'Cornell University',
    svg: `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="20" fill="#B31B1B"/>
      <text x="20" y="25" text-anchor="middle" font-family="serif" font-weight="bold" font-size="8" fill="white">CU</text>
    </svg>`,
  },
  {
    name: 'Duke University',
    svg: `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="20" fill="#003087"/>
      <text x="20" y="25" text-anchor="middle" font-family="serif" font-weight="bold" font-size="9" fill="white">DU</text>
    </svg>`,
  },
  {
    name: 'Northwestern University',
    svg: `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="20" fill="#4E2A84"/>
      <text x="20" y="25" text-anchor="middle" font-family="serif" font-weight="bold" font-size="8" fill="white">NU</text>
    </svg>`,
  },
  {
    name: 'University of Michigan',
    svg: `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="20" fill="#00274C"/>
      <text x="20" y="24" text-anchor="middle" font-family="serif" font-weight="bold" font-size="9" fill="#FFCB05">UM</text>
    </svg>`,
  },
  {
    name: 'University of California, Berkeley',
    svg: `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="20" fill="#003262"/>
      <text x="20" y="24" text-anchor="middle" font-family="serif" font-weight="bold" font-size="8" fill="#FDB515">UCB</text>
    </svg>`,
  },
  {
    name: 'University of California, Los Angeles',
    svg: `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="20" fill="#2774AE"/>
      <text x="20" y="24" text-anchor="middle" font-family="serif" font-weight="bold" font-size="8" fill="#FFD100">UCLA</text>
    </svg>`,
  },
  {
    name: 'University of Southern California',
    svg: `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="20" fill="#990000"/>
      <text x="20" y="24" text-anchor="middle" font-family="serif" font-weight="bold" font-size="8" fill="#FFC72C">USC</text>
    </svg>`,
  },
  {
    name: 'New York University',
    svg: `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="20" fill="#57068C"/>
      <text x="20" y="25" text-anchor="middle" font-family="serif" font-weight="bold" font-size="8" fill="white">NYU</text>
    </svg>`,
  },
  {
    name: 'University of Texas at Austin',
    svg: `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="20" fill="#BF5700"/>
      <text x="20" y="24" text-anchor="middle" font-family="serif" font-weight="bold" font-size="8" fill="white">UT</text>
    </svg>`,
  },
  {
    name: 'Texas A&M University',
    svg: `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="20" fill="#500000"/>
      <text x="20" y="24" text-anchor="middle" font-family="serif" font-weight="bold" font-size="8" fill="white">TAMU</text>
    </svg>`,
  },
  {
    name: 'University of Florida',
    svg: `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="20" fill="#0021A5"/>
      <text x="20" y="24" text-anchor="middle" font-family="serif" font-weight="bold" font-size="8" fill="#FA4616">UF</text>
    </svg>`,
  },
  {
    name: 'Florida State University',
    svg: `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="20" fill="#782F40"/>
      <text x="20" y="24" text-anchor="middle" font-family="serif" font-weight="bold" font-size="8" fill="#CEB888">FSU</text>
    </svg>`,
  },
  {
    name: 'Ohio State University',
    svg: `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="20" fill="#BB0000"/>
      <text x="20" y="24" text-anchor="middle" font-family="serif" font-weight="bold" font-size="8" fill="white">OSU</text>
    </svg>`,
  },
  {
    name: 'Pennsylvania State University',
    svg: `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="20" fill="#041E42"/>
      <text x="20" y="24" text-anchor="middle" font-family="serif" font-weight="bold" font-size="7" fill="white">PSU</text>
    </svg>`,
  },
  {
    name: 'University of Washington',
    svg: `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="20" fill="#4B2E83"/>
      <text x="20" y="24" text-anchor="middle" font-family="serif" font-weight="bold" font-size="8" fill="#B7A57A">UW</text>
    </svg>`,
  },
  {
    name: 'University of Wisconsin–Madison',
    svg: `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="20" fill="#C5050C"/>
      <text x="20" y="24" text-anchor="middle" font-family="serif" font-weight="bold" font-size="8" fill="white">UW</text>
    </svg>`,
  },
  {
    name: 'University of Illinois Urbana-Champaign',
    svg: `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="20" fill="#13294B"/>
      <text x="20" y="24" text-anchor="middle" font-family="serif" font-weight="bold" font-size="7" fill="#E84A27">UIUC</text>
    </svg>`,
  },
  {
    name: 'Purdue University',
    svg: `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="20" fill="#CFB991"/>
      <text x="20" y="24" text-anchor="middle" font-family="serif" font-weight="bold" font-size="8" fill="black">PU</text>
    </svg>`,
  },
  {
    name: 'Indiana University Bloomington',
    svg: `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="20" fill="#990000"/>
      <text x="20" y="24" text-anchor="middle" font-family="serif" font-weight="bold" font-size="8" fill="white">IU</text>
    </svg>`,
  },
  {
    name: 'University of Miami',
    svg: `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="20" fill="#F47321"/>
      <text x="20" y="24" text-anchor="middle" font-family="serif" font-weight="bold" font-size="8" fill="#005030">UM</text>
    </svg>`,
  },
  {
    name: 'University of North Carolina at Chapel Hill',
    svg: `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="20" fill="#7BAFD4"/>
      <text x="20" y="24" text-anchor="middle" font-family="serif" font-weight="bold" font-size="7" fill="white">UNC</text>
    </svg>`,
  },
  {
    name: 'North Carolina State University',
    svg: `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="20" fill="#CC0000"/>
      <text x="20" y="24" text-anchor="middle" font-family="serif" font-weight="bold" font-size="7" fill="white">NCSU</text>
    </svg>`,
  },
  {
    name: 'Clemson University',
    svg: `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="20" fill="#F56600"/>
      <text x="20" y="24" text-anchor="middle" font-family="serif" font-weight="bold" font-size="8" fill="#522D80">CU</text>
    </svg>`,
  },
  {
    name: 'Auburn University',
    svg: `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="20" fill="#0C2340"/>
      <text x="20" y="24" text-anchor="middle" font-family="serif" font-weight="bold" font-size="8" fill="#E87722">AU</text>
    </svg>`,
  },
  {
    name: 'University of Alabama',
    svg: `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="20" fill="#9E1B32"/>
      <text x="20" y="24" text-anchor="middle" font-family="serif" font-weight="bold" font-size="7" fill="white">UA</text>
    </svg>`,
  },
  {
    name: 'University of Tennessee',
    svg: `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="20" fill="#FF8200"/>
      <text x="20" y="24" text-anchor="middle" font-family="serif" font-weight="bold" font-size="7" fill="white">UTK</text>
    </svg>`,
  },
  {
    name: 'Louisiana State University',
    svg: `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="20" fill="#461D7C"/>
      <text x="20" y="24" text-anchor="middle" font-family="serif" font-weight="bold" font-size="7" fill="#FDD023">LSU</text>
    </svg>`,
  },
  {
    name: 'University of Virginia',
    svg: `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="20" fill="#232D4B"/>
      <text x="20" y="24" text-anchor="middle" font-family="serif" font-weight="bold" font-size="7" fill="#F84C1E">UVA</text>
    </svg>`,
  },
  {
    name: 'Virginia Tech',
    svg: `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="20" fill="#630031"/>
      <text x="20" y="24" text-anchor="middle" font-family="serif" font-weight="bold" font-size="7" fill="#CF4420">VT</text>
    </svg>`,
  },
  {
    name: 'Arizona State University',
    svg: `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="20" fill="#8C1D40"/>
      <text x="20" y="24" text-anchor="middle" font-family="serif" font-weight="bold" font-size="7" fill="#FFC627">ASU</text>
    </svg>`,
  },
  {
    name: 'University of Arizona',
    svg: `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="20" fill="#AB0520"/>
      <text x="20" y="24" text-anchor="middle" font-family="serif" font-weight="bold" font-size="7" fill="#0C234B">UA</text>
    </svg>`,
  },
  {
    name: 'University of Colorado Boulder',
    svg: `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="20" fill="#000000"/>
      <text x="20" y="24" text-anchor="middle" font-family="serif" font-weight="bold" font-size="7" fill="#CFB87C">CU</text>
    </svg>`,
  },
  {
    name: 'University of Oregon',
    svg: `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="20" fill="#154733"/>
      <text x="20" y="24" text-anchor="middle" font-family="serif" font-weight="bold" font-size="7" fill="#FEE123">UO</text>
    </svg>`,
  },
  {
    name: 'Oregon State University',
    svg: `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="20" fill="#DC4405"/>
      <text x="20" y="24" text-anchor="middle" font-family="serif" font-weight="bold" font-size="7" fill="black">OSU</text>
    </svg>`,
  },
  {
    name: 'University of Minnesota',
    svg: `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="20" fill="#7A0019"/>
      <text x="20" y="24" text-anchor="middle" font-family="serif" font-weight="bold" font-size="7" fill="#FFCC33">UMN</text>
    </svg>`,
  },
  {
    name: 'Michigan State University',
    svg: `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="20" fill="#18453B"/>
      <text x="20" y="24" text-anchor="middle" font-family="serif" font-weight="bold" font-size="7" fill="white">MSU</text>
    </svg>`,
  },
  {
    name: 'University of Notre Dame',
    svg: `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="20" fill="#0C2340"/>
      <text x="20" y="24" text-anchor="middle" font-family="serif" font-weight="bold" font-size="7" fill="#C99700">ND</text>
    </svg>`,
  },
  {
    name: 'Rice University',
    svg: `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="20" fill="#00205B"/>
      <text x="20" y="24" text-anchor="middle" font-family="serif" font-weight="bold" font-size="7" fill="white">RU</text>
    </svg>`,
  },
  {
    name: 'Vanderbilt University',
    svg: `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="20" fill="#866D4B"/>
      <text x="20" y="24" text-anchor="middle" font-family="serif" font-weight="bold" font-size="7" fill="black">VU</text>
    </svg>`,
  },
  {
    name: 'Exampletown College',
    svg: `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="20" fill="#fbff00"/>
      <text x="20" y="25" text-anchor="middle" font-family="serif" font-weight="bold" font-size="13" fill="red">EX</text>
    </svg>`,
  },
];