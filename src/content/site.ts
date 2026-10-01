/**
 * Everything personal lives here, so updating the site never means
 * hunting through components.
 */
export const site = {
  name: 'Emir Şeren',
  role: 'Game designer, writing software',
  /** Replace with a real inbox before publishing. */
  email: 'hello@emirseren.dev',
  links: [{ label: 'GitHub', href: 'https://github.com/emirseren100' }],
  year: 2026,
  season: 'Autumn 2026',
};

export const nav = [
  { id: 'work', label: 'Work' },
  { id: 'about', label: 'About' },
  { id: 'playground', label: 'Playground' },
  { id: 'contact', label: 'Contact' },
] as const;

/** Chapter labels shown in the navigation as you scroll. */
export const chapters: Record<string, string> = {
  top: 'Start',
  practice: 'Practice',
  work: 'Selected work',
  about: 'About',
  toolkit: 'Toolkit',
  now: 'Now',
  playground: 'Playground',
  contact: 'Contact',
};

export const practice = {
  // Segments: plain strings, or annotated words with a margin note.
  body: [
    'I build ',
    { word: 'interfaces', note: 'React, TypeScript, and CSS I actually understand.' },
    ' that answer back, ',
    { word: 'backends', note: 'Node, REST and PostgreSQL. Learning to love boring.' },
    ' that don’t surprise anyone, and ',
    { word: 'small games', note: 'Canvas, Unity, game jams. Where most of my ideas start.' },
    ' when nobody is watching.',
  ] as Array<string | { word: string; note: string }>,
  follow:
    'I care about the parts most people skip: the easing on a menu, the empty state, the error message, the half second before a page loads.',
  picky: [
    'Kerning in buttons',
    'Loading states',
    'Focus rings',
    'Naming things',
    'The 8 pixels nobody measured',
  ],
};

export const translation = [
  {
    from: 'Systems design',
    to: 'Architecture',
    note: 'Rules that interact without breaking each other.',
  },
  {
    from: 'Playtesting',
    to: 'User testing & debugging',
    note: 'Watching someone struggle with your thing, and not explaining it to them.',
  },
  {
    from: 'Game feel',
    to: 'Interaction design',
    note: 'Timing, feedback, response. The gap between “works” and “feels right”.',
  },
  {
    from: 'Level pacing',
    to: 'Information flow',
    note: 'What someone sees first, what they learn next, and when.',
  },
  {
    from: 'Prototyping',
    to: 'Iteration',
    note: 'Make it ugly, make it work, then make it good. In that order.',
  },
  {
    from: 'Balancing',
    to: 'Trade-offs',
    note: 'Every number you change moves three others.',
  },
];

export const rules = [
  'Make it work. Make it honest. Then make it fast.',
  'Every state gets designed: empty, loading, error, done.',
  'Motion should explain something, or it should go.',
  'Name things for the next person. Usually that’s me.',
];

export const now = [
  { k: 'Studying', v: 'Digital Game Design, at university.' },
  { k: 'Building', v: 'ScoutLab, toward a first public version.' },
  { k: 'Learning', v: 'Backend depth: databases, auth, testing, deployment.' },
  { k: 'Using', v: 'AI tools every day — and reading every line they write.' },
  { k: 'Looking for', v: 'An internship or junior role where craft is taken seriously.' },
];

export const toolkit = [
  {
    group: 'Daily',
    note: 'Comfortable. I reach for these without thinking.',
    items: ['TypeScript', 'React', 'HTML & modern CSS', 'Git', 'Figma', 'Node.js'],
  },
  {
    group: 'Getting fluent',
    note: 'Shipping with them, still learning the edges.',
    items: ['PostgreSQL', 'Express', 'REST API design', 'Vitest & Playwright', 'Next.js', 'Docker'],
  },
  {
    group: 'Next up',
    note: 'Where the next year of evenings goes.',
    items: ['System design', 'Auth, done properly', 'CI/CD pipelines', 'Performance profiling', 'WebGL'],
  },
  {
    group: 'From game design',
    note: 'The foundation everything else sits on.',
    items: ['Unity & C#', 'Systems design', 'Playtesting', 'Rapid prototyping', 'Level design'],
  },
];
