import { useEffect, useMemo, useRef, useState } from 'react';
import { CATEGORIES } from './meta';
import { CATALOG } from './catalog';
import ComponentPage from './ui/ComponentPage';
import HomePage from './ui/HomePage';
import { Icon } from './ui/icons';
import Sprite from './pixel/Sprite';

// Pages that moved: the first three originals were replaced by new designs (roadmap, Wave 4).
const MOVED = {
  '/text-animations/blur-text': '/text-animations/focus-pull',
  '/text-animations/count-up': '/data/tally-up',
  '/backgrounds/dot-grid': '/backgrounds/peg-board'
};

const REPO_URL = 'https://github.com/stevenphung/bits-lab';
const categoryNameFor = item => CATEGORIES.find(category => category.slug === item.category)?.name;

function usePathname() {
  const [pathname, setPathname] = useState(window.location.pathname);

  useEffect(() => {
    const onPop = () => setPathname(window.location.pathname);
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const navigate = to => {
    window.history.pushState(null, '', to);
    setPathname(to);
    window.scrollTo(0, 0);
  };

  return [pathname, navigate];
}

export default function App() {
  const [pathname, navigate] = usePathname();
  const [query, setQuery] = useState('');
  const searchRef = useRef(null);
  const item = CATALOG.find(entry => entry.path === pathname);
  const isHome = pathname === '/';
  const lastItem = useRef(CATALOG[0]);
  if (item) lastItem.current = item;

  useEffect(() => {
    if (item || isHome) return;
    const moved = MOVED[pathname];
    // Unknown addresses go home; pages that moved go to their new address.
    window.history.replaceState(null, '', moved ?? '/');
    // Let the router pick up the new address (replaceState doesn't fire popstate by itself).
    window.dispatchEvent(new PopStateEvent('popstate'));
  }, [item, isHome, pathname]);

  const current = item ?? lastItem.current;

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return CATALOG.filter(entry => !needle || entry.name.toLowerCase().includes(needle));
  }, [query]);

  const onLink = (event, to) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
    event.preventDefault();
    navigate(to);
  };

  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar-row">
          <a className="brand" href="/" onClick={event => onLink(event, '/')}>
            <Sprite name="gem" size={32} className="brand-mark" />
            <span>bits lab</span>
          </a>

          <nav className="tabs" aria-label="Categories">
            <button type="button" className={`tab ${isHome ? 'active' : ''}`} aria-pressed={isHome} onClick={() => navigate('/')}>
              <Sprite name="star" size={26} />
              <span>Home</span>
            </button>
            <button type="button" className={`tab ${isHome ? '' : 'active'}`} aria-pressed={!isHome} onClick={() => isHome && navigate(current.path)}>
              <Sprite name="gem" size={26} />
              <span>Components</span>
            </button>
          </nav>

          <div className="topbar-actions">
            <span className="hud" title={`${CATALOG.length} components collected`}>
              {[0, 1, 2].map(index => (
                <Sprite key={index} name="heart" size={20} />
              ))}
              <span className="hud-count">×{CATALOG.length}</span>
            </span>
            <a className="text-button" href="/r/registry.json" target="_blank" rel="noreferrer">
              Registry
            </a>
            <a className="round-button" href={REPO_URL} target="_blank" rel="noreferrer" aria-label="Bits Lab on GitHub">
              <Icon name="external" size={16} />
            </a>
          </div>
        </div>
      </header>

      {isHome ? (
        <main className="home-main">
          <HomePage onOpen={onLink} go={navigate} />
        </main>
      ) : (
        <div className="shell">
          <aside className="sidebar">
            <form className="search-pill" role="search" onSubmit={event => event.preventDefault()}>
              <label className="search-field">
                <span className="search-label">Search the inventory</span>
                <input ref={searchRef} type="search" placeholder={`Search ${CATALOG.length} components`} value={query} onChange={event => setQuery(event.target.value)} />
              </label>
              <button type="submit" className="search-go" aria-label="Search" onClick={() => searchRef.current?.focus()}>
                <Icon name="search" size={16} />
              </button>
            </form>
            <nav>
              <div className="library">
                <p className="library-title">Bits Lab</p>
                {CATEGORIES.map(category => ({ ...category, items: filtered.filter(entry => entry.category === category.slug) }))
                  .filter(group => group.items.length)
                  .map(group => (
                    <div key={group.slug} className="nav-group">
                      <p>
                        {group.name} <span className="count">{group.items.length}</span>
                      </p>
                      {group.items.map(entry => (
                        <a key={entry.path} href={entry.path} className={entry === current ? 'active' : ''} onClick={event => onLink(event, entry.path)}>
                          {entry.name}
                        </a>
                      ))}
                    </div>
                  ))}
              </div>
              {!filtered.length && <p className="muted-text">Nothing in your inventory matches “{query}”.</p>}
            </nav>
          </aside>
          <main>
            <ComponentPage key={current.path} item={current} categoryName={categoryNameFor(current)} />
          </main>
        </div>
      )}
    </div>
  );
}
