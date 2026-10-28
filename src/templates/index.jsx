import { Suspense, lazy } from 'react';
import Sprite from '../pixel/Sprite';

// Three full-page templates built only from Bits Lab components. Between them they use every
// component in the library (npm run check:templates). Each loads as its own chunk.

export const TEMPLATES = [
  {
    slug: 'saas',
    name: 'Questboard',
    kind: 'SaaS landing page',
    blurb: 'Product analytics with an AI copilot: hero, dashboard tour, AI demo, integrations, developer docs, pricing and FAQ.',
    sprite: 'book',
    tint: '#3b5dc9',
    load: lazy(() => import('./SaasTemplate'))
  },
  {
    slug: 'game',
    name: 'Emberfall',
    kind: 'Game page',
    blurb: 'A pixel RPG: boot screen, trailer, world map, heroes, loadout, lore, patch notes, leaderboard and an arcade corner.',
    sprite: 'sword',
    tint: '#b13e53',
    load: lazy(() => import('./GameTemplate'))
  },
  {
    slug: 'launch',
    name: 'Pocket Tavern',
    kind: 'App launch page',
    blurb: 'A mobile app launch: phone mock-up, waitlist, how it works, a playground, beta stories, press kit and sign-up.',
    sprite: 'potion',
    tint: '#38b764',
    load: lazy(() => import('./LaunchTemplate'))
  }
];

export function TemplatesIndex({ onOpen }) {
  return (
    <article className="listing tools-index">
      <div className="listing-head">
        <div>
          <h1>Templates</h1>
          <p className="row-sub">Three complete pages made only from Bits Lab components. Together they use all of them. Open one to see it full screen.</p>
        </div>
      </div>
      <div className="card-grid">
        {TEMPLATES.map(template => (
          <a key={template.slug} className="tool-card-link" href={`/templates/${template.slug}`} onClick={event => onOpen(event, `/templates/${template.slug}`)}>
            <div className="card-photo" style={{ background: template.tint }}>
              <span className="stage-badge">{template.kind}</span>
              <Sprite name={template.sprite} size={112} className="card-photo-icon" />
            </div>
            <div className="card-text">
              <p className="card-title">{template.name}</p>
              <p className="card-sub">{template.blurb}</p>
            </div>
          </a>
        ))}
      </div>
    </article>
  );
}

export function TemplateRoute({ slug, onOpen }) {
  const template = TEMPLATES.find(entry => entry.slug === slug);
  const Page = template.load;
  return (
    <div className="tpl-root">
      <nav className="tpl-bar" aria-label="Template">
        <a href="/templates" onClick={event => onOpen(event, '/templates')}>
          ◄ Bits Lab templates
        </a>
        <span>
          {template.name} · {template.kind}
        </span>
      </nav>
      <Suspense fallback={<p className="tool-loading">Loading {template.name}…</p>}>
        <Page />
      </Suspense>
    </div>
  );
}
