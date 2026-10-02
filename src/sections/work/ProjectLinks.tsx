import type { Project } from '../../content/projects';

/** Repository and live demo, opened in a new tab. */
export function ProjectLinks({ links }: { links: Project['links'] }) {
  return (
    <>
      <a href={links.code} target="_blank" rel="noreferrer" className="u-link hit">
        Code <span aria-hidden="true">↗</span>
      </a>
      {links.live ? (
        <>
          {' · '}
          <a href={links.live} target="_blank" rel="noreferrer" className="u-link hit">
            Live demo <span aria-hidden="true">↗</span>
          </a>
        </>
      ) : null}
    </>
  );
}
