import { useMemo, useState } from 'react';
import { analyzeFollows, normalizeUsernames } from '../lib/recreations';
import { Frame } from './Frame';
import styles from './FollowClarityVisual.module.css';

/**
 * Sample export contents. The handles are invented and end in ".demo" so none of them points at
 * a real account. Followers contains messy entries on purpose: the real parser has to cope with them.
 */
const RAW_FOLLOWERS = [
  '@Ada.demo', 'bora.demo', 'cem.demo', 'deniz.demo', 'ela.demo', 'firat.demo', 'gizem.demo',
  'ilke.demo', ' kerem.demo', 'lale.demo', 'BORA.demo', 'nil.demo',
];
const RAW_FOLLOWING = [
  'ada.demo', 'bora.demo', 'cem.demo', 'deniz.demo', 'hakan.demo', 'jale.demo', 'kerem.demo',
  'mert.demo', 'nil.demo', 'oya.demo', 'pelin.demo', 'gizem.demo',
];

const TABS = [
  { id: 'notBack', label: 'Not following me back' },
  { id: 'iDont', label: 'I don’t follow back' },
  { id: 'mutuals', label: 'Mutuals' },
] as const;
type Tab = (typeof TABS)[number]['id'];

export function FollowClarityVisual({ large = false }: { large?: boolean }) {
  const [tab, setTab] = useState<Tab>('notBack');
  const [query, setQuery] = useState('');
  const [asc, setAsc] = useState(true);

  const data = useMemo(() => {
    const followers = normalizeUsernames(RAW_FOLLOWERS);
    const following = normalizeUsernames(RAW_FOLLOWING);
    const result = analyzeFollows(followers, following);
    return {
      followers,
      following,
      removed: RAW_FOLLOWERS.length + RAW_FOLLOWING.length - followers.length - following.length,
      lists: {
        notBack: result.notFollowingBack,
        iDont: result.iDontFollowBack,
        mutuals: result.mutuals,
      } satisfies Record<Tab, string[]>,
    };
  }, []);

  const users = data.lists[tab]
    .filter((u) => u.includes(query.trim().toLowerCase()))
    .sort((a, b) => (asc ? a.localeCompare(b) : b.localeCompare(a)));

  return (
    <Frame
      app="Follow Clarity"
      context="followers_1.json · following.json · sample"
      right={<span className={styles.local}>local only</span>}
      label="Follow Clarity re-creation: a sample Instagram export compared in the browser, with tabs for accounts that don’t follow back, accounts you don’t follow back, and mutuals."
      className={`${styles.frame} ${large ? styles.large : ''}`}
    >
      <div className={styles.source}>
        <p className={styles.privacy}>Read in this tab. Nothing is uploaded, and no login is needed.</p>
        <dl className={styles.counts}>
          <div>
            <dt>Followers</dt>
            <dd>{data.followers.length}</dd>
          </div>
          <div>
            <dt>Following</dt>
            <dd>{data.following.length}</dd>
          </div>
          <div>
            <dt>Duplicates removed</dt>
            <dd>{data.removed}</dd>
          </div>
        </dl>
      </div>

      <div className={styles.tabs} role="group" aria-label="Results">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            aria-pressed={tab === t.id}
            className={styles.tab}
            onClick={() => setTab(t.id)}
          >
            {t.label}
            <span>{data.lists[t.id].length}</span>
          </button>
        ))}
      </div>

      <div className={styles.panel}>
        <div className={styles.controls}>
          <label className={styles.search}>
            <span className={styles.sr}>Search usernames</span>
            <input type="search" placeholder="Search usernames…" value={query} onChange={(e) => setQuery(e.target.value)} />
          </label>
          <button type="button" className={`hit ${styles.sort}`} onClick={() => setAsc((v) => !v)}>
            {asc ? 'A–Z' : 'Z–A'}
            <span className={styles.sr}>, change sort order</span>
          </button>
        </div>
        <ul className={styles.list}>
          {users.length === 0 ? <li className={styles.empty}>No usernames match.</li> : null}
          {users.map((u) => (
            <li key={u}>
              <span className={styles.avatar} aria-hidden="true">
                {u[0]}
              </span>
              {u}
            </li>
          ))}
        </ul>
      </div>
    </Frame>
  );
}
