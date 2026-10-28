import { useEffect, useMemo, useRef, useState } from 'react';
import { CATEGORIES } from './meta';
import { CATALOG } from './catalog';
import { REACTBITS_CATEGORIES, REACTBITS_ITEMS } from './lib/reactbits';
import ComponentPage from './ui/ComponentPage';
import DirectoryPage from './ui/DirectoryPage';
import { Icon } from './ui/icons';
import Sprite from './pixel/Sprite';
import { TOOLS, ToolRoute, ToolsIndex } from './tools';
import { TEMPLATES, TemplateRoute, TemplatesIndex } from './templates';

const LIBRARIES = [
  { key: 'lab', title: 'Bits Lab', categories: CATEGORIES, items: CATALOG },
  { key: 'reactbits', title: 'React Bits', categories: REACTBITS_CATEGORIES, items: REACTBITS_ITEMS }
];

const ALL_ITEMS = LIBRARIES.flatMap(library => library.items);

// Pages that moved: the first three originals were replaced by new designs (roadmap, Wave 4).
const MOVED = {
  '/text-animations/blur-text': '/text-animations/focus-pull',
  '/text-animations/count-up': '/data/tally-up',
  '/backgrounds/dot-grid': '/backgrounds/peg-board'
};

// Header tabs, like Airbnb's All / Homes / Experiences: one for the original components,
// one per React Bits category.
// Each tab gets a pixel sprite, like an inventory slot.
const CATEGORY_SPRITES = {
  'text-animations': 'book',
  animations: 'star',
  components: 'bench',
  backgrounds: 'grass',
  micro: 'lever'
};

const TABS = [
  { key: 'all', label: 'All', sprite: 'chest', match: () => true },
  { key: 'lab', label: 'Bits Lab', sprite: 'gem', match: item => item.origin === 'lab' },
  ...REACTBITS_CATEGORIES.map(category => ({
    key: category.slug,
    label: category.name,
    sprite: CATEGORY_SPRITES[category.slug] ?? 'orb',
    match: item => item.origin === 'reactbits' && item.category === category.slug
  }))
];

const categoryNameFor = item => {
  const library = LIBRARIES.find(entry => entry.key === item.origin);
  return library.categories.find(category => category.slug === item.category)?.name;
};

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
  const [tab, setTab] = useState('all');
  const searchRef = useRef(null);
  const item = ALL_ITEMS.find(entry => entry.path === pathname);
  const [, section, toolSlug] = pathname.split('/');
  const isTools = section === 'tools' && TOOLS.length > 0 && (!toolSlug || TOOLS.some(tool => tool.slug === toolSlug));
  const isDirectory = pathname === '/react-bits';
  const isTemplates = section === 'templates' && (!toolSlug || TEMPLATES.some(template => template.slug === toolSlug));
  const isPage = isTools || isDirectory || isTemplates;
  const lastItem = useRef(CATALOG[0]);
  if (item) lastItem.current = item;

  useEffect(() => {
    if (item || isPage) return;
    const moved = MOVED[pathname];
    window.history.replaceState(null, '', moved ?? CATALOG[0].path);
    // Let the router pick up the new address (replaceState doesn't fire popstate by itself).
    if (moved) window.dispatchEvent(new PopStateEvent('popstate'));
  }, [item, isPage, pathname]);

  const current = item ?? lastItem.current;
  const activeTab = TABS.find(entry => entry.key === tab);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return ALL_ITEMS.filter(entry => activeTab.match(entry) && (!needle || entry.name.toLowerCase().includes(needle)));
  }, [query, activeTab]);

  const onLink = (event, to) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
    event.preventDefault();
    navigate(to);
  };

  // A template is a whole page of its own, without the library's header and sidebar.
  if (isTemplates && toolSlug) return <TemplateRoute key={toolSlug} slug={toolSlug} onOpen={onLink} />;

  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar-row">
          <a className="brand" href="/" onClick={event => onLink(event, CATALOG[0].path)}>
            <Sprite name="gem" size={32} className="brand-mark" />
            <span>bits lab</span>
          </a>

          <nav className="tabs" aria-label="Categories">
            {TABS.map(entry => (
              <button
                key={entry.key}
                type="button"
                className={`tab ${!isPage && tab === entry.key ? 'active' : ''}`}
                aria-pressed={!isPage && tab === entry.key}
                onClick={() => {
                  setTab(entry.key);
                  if (isPage) navigate(current.path);
                }}
              >
                <Sprite name={entry.sprite} size={26} />
                <span>{entry.label}</span>
              </button>
            ))}
            <span className="tab-divider" aria-hidden="true" />
            <button type="button" className={`tab ${isTemplates ? 'active' : ''}`} aria-pressed={isTemplates} onClick={() => navigate('/templates')}>
              <Sprite name="frame" size={26} />
              <span>Templates</span>
            </button>
            <button type="button" className={`tab ${isDirectory ? 'active' : ''}`} aria-pressed={isDirectory} onClick={() => navigate('/react-bits')}>
              <Sprite name="note" size={26} />
              <span>React Bits</span>
            </button>
            {TOOLS.length > 0 && (
              <>
                <button type="button" className={`tab ${isTools ? 'active' : ''}`} aria-pressed={isTools} onClick={() => navigate('/tools')}>
                  <Sprite name="pickaxe" size={26} />
                  <span>Tools</span>
                </button>
              </>
            )}
          </nav>

          <div className="topbar-actions">
            <span className="hud" title={`${ALL_ITEMS.length} components collected`}>
              {[0, 1, 2].map(index => (
                <Sprite key={index} name="heart" size={20} />
              ))}
              <span className="hud-count">×{ALL_ITEMS.length}</span>
            </span>
            <a className="text-button" href="/r/registry.json" target="_blank" rel="noreferrer">
              Registry
            </a>
            <a className="round-button" href={isDirectory ? 'https://reactbits.dev' : (current.originalUrl ?? '/r/registry.json')} target="_blank" rel="noreferrer" aria-label="Open original">
              <Icon name="external" size={16} />
            </a>
          </div>
        </div>
      </header>

      {isTemplates ? (
        <main className="tools-main">
          <TemplatesIndex onOpen={onLink} />
        </main>
      ) : isDirectory ? (
        <main className="tools-main">
          <DirectoryPage onOpen={onLink} />
        </main>
      ) : isTools ? (
        <main className="tools-main">
          {toolSlug ? <ToolRoute key={toolSlug} slug={toolSlug} /> : <ToolsIndex onOpen={onLink} />}
        </main>
      ) : (
        <div className="shell">
          <aside className="sidebar">
            <form className="search-pill" role="search" onSubmit={event => event.preventDefault()}>
              <label className="search-field">
                <span className="search-label">Search the inventory</span>
                <input ref={searchRef} type="search" placeholder={`Search ${filtered.length} in ${activeTab.label}`} value={query} onChange={event => setQuery(event.target.value)} />
              </label>
              <button type="submit" className="search-go" aria-label="Search" onClick={() => searchRef.current?.focus()}>
                <Icon name="search" size={16} />
              </button>
            </form>
            <nav>
              {LIBRARIES.map(library => {
                const groups = library.categories
                  .map(category => ({
                    ...category,
                    items: filtered.filter(entry => entry.origin === library.key && entry.category === category.slug)
                  }))
                  .filter(group => group.items.length);
                if (!groups.length) return null;
                return (
                  <div key={library.key} className="library">
                    <p className="library-title">{library.title}</p>
                    {groups.map(group => (
                      <div key={group.slug} className="nav-group">
                        <p>
                          {group.name} <span className="count">{group.items.length}</span>
                        </p>
                        {group.items.map(entry => (
                          <a
                            key={entry.path}
                            href={entry.path}
                            className={entry === current ? 'active' : ''}
                            onClick={event => onLink(event, entry.path)}
                          >
                            {entry.name}
                          </a>
                        ))}
                      </div>
                    ))}
                  </div>
                );
              })}
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
