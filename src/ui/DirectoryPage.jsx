import { useMemo, useState } from 'react';
import { COMPONENTS } from '../meta';
import { DIRECTORY, DIRECTORY_CATEGORIES, REACTBITS_SITE } from '../lib/reactbits-directory';
import { Icon } from './icons';

// A link directory for React Bits: every component, linked to its page on reactbits.dev, plus
// the Bits Lab originals that cover the same idea. No React Bits code is shown or bundled here.

const PATHS = new Map(COMPONENTS.map(c => [c.name, `/${c.category}/${c.slug}`]));
const COVERED = DIRECTORY.filter(entry => entry.alt).length;

export default function DirectoryPage({ onOpen }) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [coveredOnly, setCoveredOnly] = useState(false);

  const groups = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const matches = entry =>
      (category === 'all' || entry.category === category) &&
      (!coveredOnly || entry.alt) &&
      (!needle || entry.name.toLowerCase().includes(needle) || entry.alt?.some(name => name.toLowerCase().includes(needle)));
    return DIRECTORY_CATEGORIES.map(group => ({ ...group, items: DIRECTORY.filter(entry => entry.category === group.slug && matches(entry)) })).filter(group => group.items.length);
  }, [query, category, coveredOnly]);
  const shown = groups.reduce((sum, group) => sum + group.items.length, 0);

  return (
    <article className="listing directory">
      <div className="listing-head">
        <div>
          <h1>React Bits</h1>
          <p className="row-sub">
            A directory of all {DIRECTORY.length} components in{' '}
            <a href={REACTBITS_SITE} target="_blank" rel="noreferrer">
              React Bits
            </a>
            , a separate library. Each name opens its page on reactbits.dev. {COVERED} of them have a Bits Lab original that covers the same idea, written from scratch in pixel style.
          </p>
        </div>
      </div>

      <div className="directory-controls">
        <form className="search-pill directory-search" role="search" onSubmit={event => event.preventDefault()}>
          <label className="search-field">
            <span className="search-label">Search React Bits</span>
            <input type="search" placeholder={`Search ${DIRECTORY.length} components`} value={query} onChange={event => setQuery(event.target.value)} />
          </label>
          <Icon name="search" size={16} />
        </form>
        <div className="chips" role="group" aria-label="Category">
          {[{ slug: 'all', name: 'All' }, ...DIRECTORY_CATEGORIES].map(group => (
            <button key={group.slug} type="button" className={`chip ${category === group.slug ? 'active' : ''}`} aria-pressed={category === group.slug} onClick={() => setCategory(group.slug)}>
              {group.name}
            </button>
          ))}
          <button type="button" className={`chip ${coveredOnly ? 'active' : ''}`} aria-pressed={coveredOnly} onClick={() => setCoveredOnly(on => !on)}>
            Has a Bits Lab take
          </button>
        </div>
      </div>

      <p className="directory-count" aria-live="polite">
        {shown === DIRECTORY.length ? `${shown} components` : `${shown} of ${DIRECTORY.length} components`}
      </p>

      {groups.map(group => (
        <section key={group.slug} className="directory-group" aria-labelledby={`dir-${group.slug}`}>
          <h2 id={`dir-${group.slug}`}>
            {group.name} <span className="count">{group.items.length}</span>
          </h2>
          <ul className="directory-list">
            {group.items.map(entry => (
              <li key={entry.slug} className="directory-item">
                <a className="directory-name" href={`${REACTBITS_SITE}/${entry.category}/${entry.slug}`} target="_blank" rel="noreferrer">
                  {entry.name}
                  <Icon name="external" size={12} />
                  <span className="sr-only"> (opens reactbits.dev)</span>
                </a>
                {entry.alt && (
                  <span className="directory-alt">
                    <span className="directory-alt-label">Bits Lab:</span>
                    {entry.alt.map(name => (
                      <a key={name} href={PATHS.get(name)} onClick={event => onOpen(event, PATHS.get(name))}>
                        {name}
                      </a>
                    ))}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </section>
      ))}
      {!shown && <p className="muted-text">No React Bits component matches “{query}”.</p>}
    </article>
  );
}
