import { useEffect } from 'react';
import { site } from '../content/site';
import { Link } from '../lib/router';
import styles from './NotFound.module.css';

export default function NotFound() {
  useEffect(() => {
    document.title = `Out of bounds — ${site.name}`;
  }, []);
  return (
    <section data-theme="dark" data-chapter="lost" className={styles.page}>
      <div className="wrap">
        <p className="label">404</p>
        <h1 className={styles.title}>
          Out of
          <br />
          bounds<span className={styles.unit} aria-hidden="true" />
        </h1>
        <p className={styles.text}>This page doesn’t exist. The rest of the level does.</p>
        <Link to="/" className={`u-link ${styles.link}`}>
          Respawn at the start →
        </Link>
      </div>
    </section>
  );
}
