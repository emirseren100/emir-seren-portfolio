export type ProjectSlug = 'stockflow' | 'devflow' | 'follow-clarity' | 'crypto-ta';

export interface Entity {
  id: string;
  label: string;
  fields: string[];
  /** Grid position for the system diagram (column, row). */
  at: [number, number];
}

/**
 * Every claim here comes from the project's own repository: its README, code and docs.
 * `stack` is what the project uses — not a list of Emir's skills. `stackNote` says so per project.
 */
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
  links: { code: string; live?: string };
  stack: string[];
  stackNote: string;
  /** What the project does. */
  does: string;
  /** Heading for the "why" block; descriptive where no personal motivation is confirmed. */
  whyLabel: 'Why I built it' | 'About the project';
  why: string;
  system: { caption: string; entities: Entity[]; links: Array<[string, string, string]> };
  details: Array<{ title: string; body: string }>;
  /** What Emir learned (only where he has said so) or what the project explores. */
  learnedLabel: 'What I learned' | 'What the project explores';
  learned: string;
  limits: string[];
}

export const projects: Project[] = [
  {
    slug: 'stockflow',
    index: '01',
    name: 'StockFlow',
    kind: 'Inventory dashboard · JavaScript practice',
    ink: 'var(--ink-stock)',
    tagline: 'The project I practised JavaScript with.',
    brief:
      'A small inventory dashboard: add products, change stock with + and −, and search, filter and sort the list. Built with HTML, CSS and plain JavaScript while I was learning the language.',
    meta: [
      { k: 'Type', v: 'Personal learning project' },
      { k: 'Status', v: 'Finished' },
    ],
    links: { code: 'https://github.com/emirseren100/stockflow' },
    stack: ['HTML', 'CSS', 'JavaScript', 'LocalStorage'],
    stackNote: 'No framework, no libraries and no build step: just the three files a browser can open.',
    does:
      'StockFlow keeps a list of products and how many of each are in stock. You can add a product, raise or lower its stock, delete it, and find things with a search box, an in-stock / out-of-stock filter and sorting by name or quantity. Three counters at the top update with every change, and the list is saved in the browser.',
    whyLabel: 'Why I built it',
    why:
      'I built it while learning JavaScript, to practise on something that behaves like a real app. An inventory is a small problem with a lot of moving parts: every click changes the data, and the screen has to keep up. It’s an important project for me because it’s where the basics started to connect.',
    system: {
      caption:
        'How the code is organised. One array of products is the only source of truth. Every change goes through syncApp(), which saves, updates the counters and redraws the list.',
      entities: [
        { id: 'events', label: 'Event listeners', fields: ['+ / − / Delete', 'add form', 'search · filter · sort'], at: [0, 0] },
        { id: 'products', label: 'products[]', fields: ['id', 'name', 'stock'], at: [1, 0] },
        { id: 'storage', label: 'localStorage', fields: ['"products"', 'JSON string'], at: [2, 0] },
        { id: 'sync', label: 'syncApp()', fields: ['saveProducts()', 'updateStats()', 'applyFilters()'], at: [1, 1] },
        { id: 'render', label: 'renderProducts()', fields: ['filtered list', 'product cards'], at: [2, 1] },
      ],
      links: [
        ['events', 'products', 'change'],
        ['products', 'sync', 'then'],
        ['sync', 'storage', 'save'],
        ['sync', 'render', 'redraw'],
      ],
    },
    details: [
      {
        title: 'One array, one sync function',
        body: 'Every change — plus, minus, delete or add — edits the products array and then calls syncApp(). Saving, the counters and the list all update from the same place, so they can’t drift apart.',
      },
      {
        title: 'Search, filter and sort as one step',
        body: 'applyFilters() starts from the full list, keeps the names that match the search, applies the stock filter, then sorts what’s left. All three controls call the same function.',
      },
      {
        title: 'Check the input before saving',
        body: 'The add form rejects an empty name or an invalid quantity with a message, instead of adding a broken product. A new product gets the next free id.',
      },
    ],
    learnedLabel: 'What I learned',
    learned:
      'How to keep data and the screen in sync with plain JavaScript: the DOM, events, state and LocalStorage working together.',
    limits: [
      'The data lives in one browser. There are no accounts and no server.',
      'Stock status is either in stock or out of stock; there are no low-stock levels.',
      'There’s no live demo yet. The repository has the code and a screenshot.',
    ],
  },
  {
    slug: 'devflow',
    index: '02',
    name: 'DevFlow',
    kind: 'Issue tracker, built with AI tools',
    ink: 'var(--ink-devflow)',
    tagline: 'What a larger full-stack app looks like.',
    brief:
      'An AI-assisted full-stack issue and sprint tracker with projects, roles, authentication, Kanban workflows, comments, activity feeds, testing and deployment.',
    meta: [
      { k: 'Type', v: 'AI-assisted full-stack exploration' },
      { k: 'Status', v: 'Live demo on Render' },
    ],
    links: { code: 'https://github.com/emirseren100/DevFlow', live: 'https://devflow-902d.onrender.com' },
    stack: [
      'React',
      'TypeScript',
      'React Router',
      'TanStack Query',
      'Node.js',
      'Express',
      'PostgreSQL',
      'Prisma',
      'Zod',
      'Vitest',
      'Docker',
      'GitHub Actions',
    ],
    stackNote:
      'This is the project’s stack, not a list of my skills. Most of it is on my learning path; I can’t build with it on my own yet.',
    does:
      'DevFlow is an issue tracker for small software teams. A team creates a workspace with owner, admin and member roles, adds projects and sprints, and files issues — tasks or bugs with a priority, status, assignee and due date, numbered per project like API-1. Issues can be searched, filtered and sorted, moved across a Kanban board and discussed in comments, and an activity feed records what changed.',
    whyLabel: 'About the project',
    why:
      'DevFlow is an AI-assisted exploration of a larger full-stack application: an issue and sprint tracker with a React client, an Express API, a PostgreSQL database, authentication, role-based permissions, tests and deployment. It was built with AI tools, and the stack is the project’s, not a claim of my own mastery.',
    system: {
      caption:
        'A simplified view of the database schema. On every request the server reads the member’s role from the database before it touches a workspace’s data.',
      entities: [
        { id: 'workspace', label: 'Workspace', fields: ['id', 'name', 'slug'], at: [0, 0] },
        { id: 'project', label: 'Project', fields: ['key', 'nextIssueNumber'], at: [1, 0] },
        { id: 'sprint', label: 'Sprint', fields: ['name', 'status', 'start · end'], at: [2, 0] },
        { id: 'member', label: 'WorkspaceMember', fields: ['userId', 'role'], at: [0, 1] },
        { id: 'issue', label: 'Issue', fields: ['number', 'type', 'status', 'priority', 'position'], at: [1, 1] },
        { id: 'comment', label: 'Comment', fields: ['issueId', 'authorId', 'body'], at: [2, 1] },
      ],
      links: [
        ['workspace', 'project', '1 — n'],
        ['project', 'sprint', '1 — n'],
        ['workspace', 'member', '1 — n'],
        ['project', 'issue', '1 — n'],
        ['sprint', 'issue', '0 — n'],
        ['issue', 'comment', '1 — n'],
      ],
    },
    details: [
      {
        title: 'Permissions are checked on the server',
        body: 'Roles are read from the database on every request. Hiding a button in the interface is treated as convenience, never as security.',
      },
      {
        title: 'Issue numbers that can’t collide',
        body: 'Each project keeps a counter. A new issue takes the next number inside a database transaction, and a unique index on project and number is the final guarantee.',
      },
      {
        title: 'The server decides the board order',
        body: 'When a card moves, the client only sends where it should go. The server reorders the columns in one transaction and returns the confirmed board.',
      },
    ],
    learnedLabel: 'What the project explores',
    learned:
      'This project explores how the parts of a full-stack app fit together — client, API, database, authentication, tests and deployment — and was built with AI assistance.',
    limits: [
      'No realtime updates, notifications or email.',
      'No password reset or email invitations; members must already have an account.',
      'There’s no shared demo account. You register your own to try it.',
      'The demo runs on Render’s free tier, so the first load after a quiet period is slow.',
    ],
  },
  {
    slug: 'follow-clarity',
    index: '03',
    name: 'Follow Clarity',
    kind: 'Instagram follow analyzer · privacy-first',
    ink: 'var(--ink-follow)',
    tagline: 'Your data stays in your browser.',
    brief:
      'Upload your own Instagram data export and see who doesn’t follow you back, who you don’t follow back, and your mutuals. Everything is processed locally — no login, no scraping, no upload.',
    meta: [
      { k: 'Type', v: 'Privacy-first web tool' },
      { k: 'Status', v: 'Live on Netlify' },
    ],
    links: {
      code: 'https://github.com/emirseren100/privacy-first-instagram-follow-analyzer',
      live: 'https://follow-clarity.netlify.app',
    },
    stack: ['Next.js', 'React', 'TypeScript', 'Tailwind CSS', 'JSZip', 'Vitest'],
    stackNote:
      'The project’s stack, not my skill list. React and TypeScript are still on my learning path.',
    does:
      'Follow Clarity reads the followers and following files from an Instagram data export — the ZIP, or the JSON or HTML files inside it. It compares the two lists and shows who you follow that doesn’t follow you back, who follows you that you don’t follow back, and your mutual follows. Each list can be searched, sorted A–Z or Z–A, copied, exported as CSV, and opened as profile links.',
    whyLabel: 'Why I built it',
    why:
      'The project explores a privacy-first way to analyse an Instagram export: everything runs locally in the browser, using only the data export Instagram already provides — no login, no scraping, no unofficial APIs and no upload to a server.',
    system: {
      caption:
        'The whole pipeline runs in the browser. There is no backend, no API route and no upload endpoint, so the export has nowhere to go.',
      entities: [
        { id: 'file', label: 'Your export', fields: ['.zip', '.json', '.html'], at: [0, 0] },
        { id: 'parse', label: 'parseInstagramExport()', fields: ['unzip (JSZip)', 'followers / following', 'read usernames'], at: [1, 0] },
        { id: 'normal', label: 'normalizeUsernames()', fields: ['trim, strip @', 'lowercase', 'dedupe'], at: [2, 0] },
        { id: 'analyze', label: 'analyzeFollows()', fields: ['difference', 'intersection'], at: [2, 1] },
        { id: 'results', label: 'Result tabs', fields: ['search · sort', 'copy · CSV'], at: [1, 1] },
      ],
      links: [
        ['file', 'parse', 'read locally'],
        ['parse', 'normal', 'usernames'],
        ['normal', 'analyze', 'two lists'],
        ['analyze', 'results', 'three lists'],
      ],
    },
    details: [
      {
        title: 'No server at all',
        body: 'Parsing and comparing happen in the browser. The project’s rules rule out a backend, API routes and sending export data anywhere — including analytics.',
      },
      {
        title: 'A parser for messy exports',
        body: 'Exports come in several shapes: split files like followers_1.json and followers_2.json, HTML instead of JSON, different profile link formats. The parser recognises each file by its name or content and reads usernames from all of them.',
      },
      {
        title: 'Compare clean names',
        body: 'Usernames are trimmed, stripped of @, lowercased and de-duplicated before comparing, so the same account can’t end up on both sides by accident.',
      },
    ],
    learnedLabel: 'What the project explores',
    learned:
      'This project demonstrates a privacy-first architecture where Instagram export data is parsed locally in the browser, without login credentials, scraping, unofficial APIs or server-side uploads.',
    limits: [
      'It can’t look up an account by username. It only reads an export you provide.',
      'Results are only as complete as the export; a limited date range can give incomplete counts.',
    ],
  },
  {
    slug: 'crypto-ta',
    index: '04',
    name: 'Crypto Technical Analysis',
    kind: 'Windows desktop app · market analysis',
    ink: 'var(--ink-crypto)',
    tagline: 'Charts, indicators and backtests on the desktop.',
    brief:
      'A Windows desktop app for technical analysis of Binance USDT-M futures, using public market data with no API key: charts, indicators, trade setups, backtesting and desktop notifications.',
    meta: [
      { k: 'Type', v: 'Personal desktop app' },
      { k: 'Status', v: 'Runs locally on Windows' },
    ],
    links: { code: 'https://github.com/emirseren100/Crypto-Technical-Analysis' },
    stack: ['Python', 'PyQt5', 'pandas', 'NumPy', 'matplotlib', 'mplfinance', 'requests', 'plyer', 'pytest'],
    stackNote: 'The project’s stack. Python isn’t part of my main learning path right now; that path is the web.',
    does:
      'The app pulls candle data from Binance’s public futures API and draws it with indicators such as moving averages, RSI, MACD, Bollinger Bands and ATR. From those it builds long or short setups with a stop-loss and three take-profit levels. It can backtest the same rules on past data, keep a paper-trading record, and send a Windows notification when a setup appears.',
    whyLabel: 'Why I built it',
    why:
      'The project explores technical analysis on the desktop: charting, indicators, backtesting and configurable trade setups, all built on public market data.',
    system: {
      caption:
        'The main modules. Market data comes in through one fetcher, indicators are computed with pandas, and the same signal logic feeds the interface, the backtester and notifications.',
      entities: [
        { id: 'fetch', label: 'data_fetcher', fields: ['public futures API', 'candles · prices'], at: [0, 0] },
        { id: 'ind', label: 'indicators', fields: ['SMA · EMA · RSI', 'MACD · BB · ATR'], at: [1, 0] },
        { id: 'signal', label: 'signal_engine', fields: ['direction', 'stop-loss', 'TP1 · TP2 · TP3'], at: [2, 0] },
        { id: 'notify', label: 'notifications', fields: ['Windows (plyer)'], at: [0, 1] },
        { id: 'ui', label: 'main_window', fields: ['PyQt5 tabs', 'charts'], at: [1, 1] },
        { id: 'backtest', label: 'backtest', fields: ['replays signals', 'on past candles'], at: [2, 1] },
      ],
      links: [
        ['fetch', 'ind', 'DataFrame'],
        ['ind', 'signal', 'scores'],
        ['signal', 'ui', 'setups'],
        ['signal', 'backtest', 'same rules'],
        ['ui', 'notify', 'alerts'],
      ],
    },
    details: [
      {
        title: 'Public data only',
        body: 'Market data comes from Binance’s public futures endpoints, so the app needs no API key and never touches an account.',
      },
      {
        title: 'TP profiles move targets, not risk',
        body: 'Normal, higher-target and conservative profiles change only the take-profit distances — 1.2R, 2.2R and 3.5R on normal. The stop-loss and the signal logic stay the same.',
      },
      {
        title: 'Tests for the maths',
        body: 'Indicator and price-action functions have pytest tests, so a broken calculation shows up as a failing test instead of a strange chart.',
      },
    ],
    learnedLabel: 'What the project explores',
    learned:
      'This project explores desktop technical-analysis workflows using public market data, including indicators, charting, backtesting and configurable trade setups.',
    limits: [
      'Not investment advice. Crypto trading carries high risk.',
      'An independent project, not affiliated with, endorsed or sponsored by Binance. The name only says where the public data comes from.',
      'Built and tested on Windows 10 and 11. The interface is in Turkish.',
    ],
  },
];

export const playgroundProject = {
  index: '&',
  name: 'Interactive Playground',
  kind: 'Experiments in motion, physics & game feel',
  ink: 'var(--ink-play)',
  tagline: 'Where the square came from.',
  brief:
    'Small experiments with physics, game mechanics and interfaces — including the engine behind the square at the top of the page.',
};

export const getProject = (slug: string) => projects.find((p) => p.slug === slug);
