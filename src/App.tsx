import { lazy, Suspense, useEffect } from 'react';
import { Curtain } from './components/Curtain';
import { Nav } from './components/nav/Nav';
import { getProject } from './content/projects';
import { matchWork, RouterProvider, useRouter } from './lib/router';
import Home from './pages/Home';

const loadCaseStudy = () => import('./pages/CaseStudy');
const CaseStudy = lazy(loadCaseStudy);
const NotFound = lazy(() => import('./pages/NotFound'));

function Routes() {
  const { path } = useRouter();
  if (path === '/' || path === '/index.html') return <Home />;
  const slug = matchWork(path);
  const project = slug ? getProject(slug) : undefined;
  return (
    <Suspense fallback={<div style={{ minHeight: '100svh' }} />}>
      {project ? <CaseStudy key={project.slug} project={project} /> : <NotFound />}
    </Suspense>
  );
}

export function App() {
  // Fetch the case-study chunk while the browser is idle, so the curtain never lifts on an empty page.
  useEffect(() => {
    const idle = window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 1500));
    idle(() => void loadCaseStudy());
  }, []);

  return (
    <RouterProvider>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <Nav />
      <main id="main" tabIndex={-1}>
        <Routes />
      </main>
      <Curtain />
      <div className="grain" aria-hidden="true" />
    </RouterProvider>
  );
}
