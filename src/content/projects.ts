export type ProjectSlug = 'scoutlab' | 'devflow' | 'stockflow';

export interface Entity {
  id: string;
  label: string;
  fields: string[];
  /** Grid position for the system diagram (column, row). */
  at: [number, number];
}

export interface Project {
  slug: ProjectSlug;
  index: string;
  name: string;
  kind: string;
  /** CSS colour used for the project's accents and page transition. */
  ink: string;
  tagline: string;
  brief: string;
  meta: Array<{ k: string; v: string }>;
  stack: string[];
  problem: string;
  approach: string;
  decisions: Array<{ title: string; body: string }>;
  system: { caption: string; entities: Entity[]; links: Array<[string, string, string]> };
  learned: string;
  next: string[];
}

export const projects: Project[] = [
  {
    slug: 'scoutlab',
    index: '01',
    name: 'ScoutLab',
    kind: 'Football scouting & player analysis',
    ink: 'var(--ink-scout)',
    tagline: 'A shortlist you can argue for.',
    brief:
      'A scouting workspace for building a case for a player. Shortlists, role-based radars and notes that live next to the numbers they are about.',
    meta: [
      { k: 'Role', v: 'Design & full-stack development' },
      { k: 'Type', v: 'Personal project' },
      { k: 'Status', v: 'In active development' },
    ],
    stack: ['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'D3'],
    problem:
      'Football data is everywhere, but it is scattered. Stats live in one tab, video notes in another, and the actual shortlist lives in someone’s head. I wanted one place where a scout could build an argument — and where someone else could follow it.',
    approach:
      'Compare like with like. Every metric is normalised per 90 minutes and shown as a percentile against players in the same role. A full-back is never judged on a striker’s numbers, and every chart answers the same question: compared to whom?',
    decisions: [
      {
        title: 'Percentiles over raw numbers',
        body: 'Raw totals reward minutes played. Percentiles within a role tell you whether a number is actually unusual.',
      },
      {
        title: 'Fixed axes for every role',
        body: 'Axes are fixed per role and always in the same order, so two shapes can be compared at a glance. No auto-scaling that makes everyone look elite.',
      },
      {
        title: 'Notes are data',
        body: 'A note can be pinned to a match, a metric or a moment, so an opinion always sits next to the evidence it is about.',
      },
    ],
    system: {
      caption: 'Core data model. Metrics are stored raw and percentiles are computed per role and season.',
      entities: [
        { id: 'player', label: 'Player', fields: ['id', 'name', 'foot', 'born'], at: [0, 0] },
        { id: 'season', label: 'SeasonStat', fields: ['player_id', 'season', 'minutes'], at: [1, 0] },
        { id: 'metric', label: 'Metric', fields: ['stat_id', 'key', 'per90'], at: [2, 0] },
        { id: 'role', label: 'Role', fields: ['id', 'label', 'axes[]'], at: [2, 1] },
        { id: 'list', label: 'Shortlist', fields: ['id', 'owner', 'role_id'], at: [0, 1] },
        { id: 'note', label: 'Note', fields: ['target', 'body', 'match_ts'], at: [1, 1] },
      ],
      links: [
        ['player', 'season', '1 — n'],
        ['season', 'metric', '1 — n'],
        ['metric', 'role', 'ranked in'],
        ['list', 'player', 'n — n'],
        ['note', 'player', 'about'],
      ],
    },
    learned:
      'Data modelling is design work. Once the schema was right, the interface got simpler — no component library could have done that for me.',
    next: ['Import from public data sources', 'A match timeline for video notes', 'Shareable scouting reports'],
  },
  {
    slug: 'devflow',
    index: '02',
    name: 'DevFlow',
    kind: 'Developer workflow & productivity',
    ink: 'var(--ink-devflow)',
    tagline: 'One timeline from idea to merged pull request.',
    brief:
      'DevFlow connects the steps between an idea and a merged pull request — tasks, branches, reviews and notes — on one timeline that mostly updates itself.',
    meta: [
      { k: 'Role', v: 'Design & full-stack development' },
      { k: 'Type', v: 'Personal project' },
      { k: 'Status', v: 'Prototype, in use by me' },
    ],
    stack: ['TypeScript', 'Next.js', 'Node.js', 'PostgreSQL', 'WebSockets'],
    problem:
      'My own projects kept stalling in the gaps. A task in one app, a branch name I’d forgotten, review notes buried in a chat. The work itself was fine. The handoffs between steps were not.',
    approach:
      'Model the work as a flow of states. Each task moves through states — idea, building, review, shipped — and every change of state is an event. The interface is just a view over those events.',
    decisions: [
      {
        title: 'An event log as the source of truth',
        body: 'Undo, history and the activity feed come almost for free when nothing is overwritten. Current state is a fold over events.',
      },
      {
        title: 'Keyboard first',
        body: 'Every action has a shortcut and a command-palette entry. The mouse is welcome, but optional.',
      },
      {
        title: 'Realtime that stays calm',
        body: 'Updates arrive over WebSockets, and the UI batches them so the screen doesn’t twitch while you are reading it.',
      },
    ],
    system: {
      caption: 'Tasks never change in place. Every transition is appended as an event, and views are projections.',
      entities: [
        { id: 'task', label: 'Task', fields: ['id', 'title', 'state'], at: [0, 0] },
        { id: 'event', label: 'Event', fields: ['task_id', 'type', 'at', 'payload'], at: [1, 0] },
        { id: 'branch', label: 'Branch', fields: ['name', 'task_id', 'head'], at: [2, 0] },
        { id: 'review', label: 'Review', fields: ['branch', 'status', 'notes'], at: [2, 1] },
        { id: 'view', label: 'Projection', fields: ['board', 'timeline', 'feed'], at: [0, 1] },
      ],
      links: [
        ['task', 'event', '1 — n'],
        ['event', 'branch', 'mentions'],
        ['branch', 'review', '1 — n'],
        ['event', 'view', 'folds into'],
      ],
    },
    learned:
      'Designing the task state machine felt exactly like designing game states. Same diagrams, same edge cases, different stakes.',
    next: ['Git provider webhooks', 'Offline-first sync', 'A weekly review generated from the event log'],
  },
  {
    slug: 'stockflow',
    index: '03',
    name: 'StockFlow',
    kind: 'Inventory & stock management',
    ink: 'var(--ink-stock)',
    tagline: 'What do I need to order, and when?',
    brief:
      'Stock levels, reorder points and suppliers for a small business that has outgrown its spreadsheet. Built around one question, answered clearly.',
    meta: [
      { k: 'Role', v: 'Design & full-stack development' },
      { k: 'Type', v: 'Personal project' },
      { k: 'Status', v: 'Core features complete' },
    ],
    stack: ['React', 'TypeScript', 'Express', 'PostgreSQL', 'Zod'],
    problem:
      'Small shops track stock in spreadsheets until the spreadsheet becomes the problem. Counts drift, nobody knows which column is current, and reorders happen when the shelf is already empty.',
    approach:
      'Stock is never edited directly. Every change is a movement — received, sold, returned, adjusted — and the current level is calculated from them. When a number looks wrong, you can always ask it why.',
    decisions: [
      {
        title: 'A ledger of movements',
        body: 'Every change is recorded, so every number can be explained and every mistake reversed. Totals are cached, never trusted blindly.',
      },
      {
        title: 'Reorder points that explain themselves',
        body: '“Order 40 by Thursday — at the current rate you run out in 6 days.” A sentence beats a red cell.',
      },
      {
        title: 'Validation at the edges',
        body: 'Zod schemas are shared between the API and the forms, so a bad value is rejected once, with the same message everywhere.',
      },
    ],
    system: {
      caption: 'On-hand quantity is derived from the movement ledger. Reorder logic works from the recent consumption rate.',
      entities: [
        { id: 'product', label: 'Product', fields: ['sku', 'name', 'unit'], at: [0, 0] },
        { id: 'movement', label: 'Movement', fields: ['sku', 'qty', 'kind', 'at'], at: [1, 0] },
        { id: 'location', label: 'Location', fields: ['id', 'name'], at: [2, 0] },
        { id: 'supplier', label: 'Supplier', fields: ['id', 'lead_days'], at: [0, 1] },
        { id: 'rule', label: 'ReorderRule', fields: ['sku', 'min', 'target'], at: [1, 1] },
      ],
      links: [
        ['product', 'movement', '1 — n'],
        ['movement', 'location', 'at'],
        ['supplier', 'product', 'supplies'],
        ['rule', 'product', 'watches'],
      ],
    },
    learned:
      'Resource-management games teach you to watch the rate of change before the total. Stockrooms work the same way.',
    next: ['Barcode scanning on mobile', 'Supplier purchase orders', 'Multi-location transfers'],
  },
];

export const playgroundProject = {
  index: '&',
  name: 'Interactive Playground',
  kind: 'Experiments in motion, physics & game feel',
  ink: 'var(--ink-play)',
  tagline: 'Where the square came from.',
  brief:
    'Where ideas go before they are allowed to become projects: physics, game mechanics and interface experiments — including the engine behind the square at the top of the page.',
};

export const getProject = (slug: string) => projects.find((p) => p.slug === slug);
