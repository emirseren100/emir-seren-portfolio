/**
 * Everything personal lives here, so updating the site never means
 * hunting through components.
 */
export const site = {
  name: 'Emir Şeren',
  role: 'Digital Game Design student transitioning into full-stack development',
  email: 'e34emir@gmail.com',
  links: [
    { label: 'GitHub', href: 'https://github.com/emirseren100' },
    { label: 'LinkedIn', href: 'https://www.linkedin.com/in/emirseren' },
  ],
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
    'I learn software by ',
    { word: 'building', note: 'Small projects with a clear goal. StockFlow is how I practised JavaScript.' },
    ' things, ',
    { word: 'breaking', note: 'Bugs teach me the most. I try to find the cause before I change anything.' },
    ' them, and ',
    { word: 'understanding', note: 'I want to know what the code I use is doing, including code written with AI tools.' },
    ' why they work.',
  ] as Array<string | { word: string; note: string }>,
  follow:
    'I’m working toward full-stack development one step at a time: JavaScript first, then TypeScript, React and the back end. Along the way I care about the parts people skip — the empty state, the error message, the focus ring.',
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
  'Make it work. Make it clear. Then make it fast.',
  'Every state gets designed: empty, loading, error, done.',
  'Motion should explain something, or it should go.',
  'Name things for the next person. Usually that’s me.',
];

export const now = [
  { k: 'Studying', v: 'Digital Game Design, at university.' },
  { k: 'Learning', v: 'TypeScript, now that the JavaScript fundamentals are done.' },
  { k: 'Looking for', v: 'An internship in software development.' },
];

/** Current skills first. Only "Using now" is a skill claim; everything else is labelled for what it is. */
export const toolkit = [
  {
    group: 'Using now',
    note: 'What I build with today.',
    items: ['HTML', 'CSS', 'JavaScript', 'Git', 'GitHub'],
  },
  {
    group: 'Learning next',
    note: 'In this order, after JavaScript. Not skills yet.',
    items: ['TypeScript', 'React', 'Testing', 'Node.js / Express', 'SQL / PostgreSQL', 'Next.js', 'Docker / deployment'],
  },
  {
    group: 'AI-assisted workflow',
    note: 'Tools I work with, not languages.',
    items: ['Claude', 'Cursor', 'Codex', 'Antigravity'],
  },
  {
    group: 'Game design background',
    note: 'Ways of thinking that carry over.',
    items: ['Systems thinking', 'Prototyping', 'Playtesting', 'Interaction thinking'],
  },
];
