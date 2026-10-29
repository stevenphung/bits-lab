import { useEffect, useMemo, useState } from 'react';
import { useUrlProps } from '../lib/useUrlProps';
import { injectProps } from '../lib/injectProps';
import { PACKAGE_MANAGERS, cliCommand, manualCommand } from '../lib/cli';
import Controls from './Controls';
import CodeBlock, { useCopy } from './CodeBlock';
import { Icon } from './icons';
import Sprite from '../pixel/Sprite';

function Chips({ options, value, onChange, label }) {
  return (
    <div className="chips" role="radiogroup" aria-label={label}>
      {options.map(([key, text]) => (
        <button
          key={key}
          type="button"
          role="radio"
          aria-checked={value === key}
          className={`chip ${value === key ? 'active' : ''}`}
          onClick={() => onChange(key)}
        >
          {text}
        </button>
      ))}
    </div>
  );
}

// JS or TS, and CSS or Tailwind, for the install command and source, remembered across pages
// (per browser).
function useStoredChoice(key, values) {
  const [value, setValue] = useState(() => {
    try {
      const saved = localStorage.getItem(key);
      return values.includes(saved) ? saved : values[0];
    } catch {
      return values[0];
    }
  });
  const update = next => {
    setValue(next);
    try {
      localStorage.setItem(key, next);
    } catch {
      // Storage can be unavailable (private mode); the choice just won't stick.
    }
  };
  return [value, update];
}

// The registry entry and source for the chosen language and styling, falling back to what
// exists for this item (Tailwind variants are still being added).
function pickVariant(item, lang, styling) {
  const ts = lang === 'ts' && item.loadTsSources;
  if (styling === 'tw' && item.loadTwSources) {
    if (!ts) return { registryUrl: item.twRegistryUrl, load: item.loadTwSources };
    if (item.loadTwTsSources) return { registryUrl: item.twTsRegistryUrl, load: item.loadTwTsSources };
  }
  if (ts) return { registryUrl: item.tsRegistryUrl, load: item.loadTsSources };
  return { registryUrl: item.registryUrl, load: item.loadSources };
}

function Install({ item, lang, onLangChange, styling, onStylingChange }) {
  const [mode, setMode] = useState('cli');
  const [manager, setManager] = useState('npm');
  const manual = manualCommand(manager, item.dependencies);
  const { registryUrl } = pickVariant(item, lang, styling);
  const command =
    mode === 'cli' ? cliCommand(manager, registryUrl) : manual ?? '# No dependencies — copy the source below.';

  return (
    <div className="install">
      <div className="install-options">
        {item.loadTsSources && (
          <Chips label="Language" options={[['js', 'JavaScript'], ['ts', 'TypeScript']]} value={lang} onChange={onLangChange} />
        )}
        {item.loadTwSources && (
          <Chips label="Styling" options={[['css', 'CSS'], ['tw', 'Tailwind']]} value={styling} onChange={onStylingChange} />
        )}
        <Chips label="Install method" options={[['cli', 'CLI'], ['manual', 'Manual']]} value={mode} onChange={setMode} />
        <Chips
          label="Package manager"
          options={PACKAGE_MANAGERS.map(value => [value, value])}
          value={manager}
          onChange={setManager}
        />
      </div>
      <CodeBlock title="Install" code={command} />
      {styling === 'tw' && item.loadTwSources && <p className="muted-text">The Tailwind version needs Tailwind CSS v4 in your project.</p>}
    </div>
  );
}

function PropTable({ docs }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Prop</th>
            <th>Type</th>
            <th>Default</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          {docs.map(([name, type, fallback, description]) => (
            <tr key={name}>
              <td>
                <code className="prop-name">{name}</code>
              </td>
              <td>
                <code className="muted">{type}</code>
              </td>
              <td>
                <code className="muted">{fallback}</code>
              </td>
              <td>{description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Sources({ item, lang, styling }) {
  const [files, setFiles] = useState(null);

  useEffect(() => {
    let live = true;
    pickVariant(item, lang, styling)
      .load()
      .then(result => live && setFiles(result));
    return () => {
      live = false;
    };
  }, [item, lang, styling]);

  if (!files) return <p className="muted-text">Loading source…</p>;
  return files.map(({ file, code }) => <CodeBlock key={file} title={file} code={code} maxHeight={520} />);
}

// The "Hosted by" row of a listing: who made it and under what terms.
function MakerRow() {
  return (
    <div className="maker-row">
      <span className="avatar avatar-brand" aria-hidden="true">
        <Sprite name="gem" size={36} />
      </span>
      <div>
        <p className="row-title">Bits Lab original</p>
        <p className="row-sub">Zero dependencies. Installable from this app's own registry.</p>
      </div>
    </div>
  );
}

// In the light preview, colour props still at their demo defaults are left out, so the
// component's own light palette shows; colours you changed in Customize still win.
function withoutDefaultColors(props, defaults = {}) {
  return Object.fromEntries(Object.entries(props).filter(([name, value]) => !(/Colors?$/.test(name) && value === defaults[name])));
}

function plural(count, word) {
  return `${count} ${word}${count === 1 ? '' : 's'}`;
}

export default function ComponentPage({ item, categoryName }) {
  const [replayKey, setReplayKey] = useState(0);
  const { props, update, reset, hasChanges } = useUrlProps(item.defaults);
  const [linkCopied, copyLink] = useCopy();
  const [usageCopied, copyUsage] = useCopy();
  const [lang, setLang] = useStoredChoice('bitslab-code-lang', ['js', 'ts']);
  const [styling, setStyling] = useStoredChoice('bitslab-code-styling', ['css', 'tw']);
  const [theme, setTheme] = useStoredChoice('bitslab-preview-theme', ['dark', 'light']);

  const usage = useMemo(() => injectProps(item.usage, props, item.defaults, item.demoOnly), [item, props]);
  const replay = () => setReplayKey(key => key + 1);

  // Changing a prop replays the animation by re-keying the preview.
  const change = (name, value) => {
    update(name, value);
    replay();
  };

  const resetAll = () => {
    reset();
    replay();
  };

  const deps = item.dependencies.length ? item.dependencies.join(', ') : 'no dependencies';

  return (
    <article className="listing">
      <div className="listing-head">
        <h1>{item.name}</h1>
        <div className="head-actions">
          <button type="button" className="text-action" onClick={() => copyLink(window.location.href)}>
            <Icon name={linkCopied ? 'check' : 'share'} size={16} />
            <span>{linkCopied ? 'Link copied' : 'Share'}</span>
          </button>
          <a className="text-action" href={`/docs/${item.name}.md`} target="_blank" rel="noreferrer" title="This component's docs as Markdown, for AI coding tools">
            <Icon name="external" size={16} />
            <span>Docs for AI</span>
          </a>
          {hasChanges && (
            <button type="button" className="text-action" onClick={resetAll}>
              <Icon name="reset" size={16} />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* The stage is the themed ancestor: components pick their light palette from data-theme. */}
      <div className={`lab-stage ${item.fullBleed ? 'lab-stage-bleed' : ''}`} data-theme={theme}>
        <span className="stage-badge">Bits Lab original</span>
        <button type="button" className="stage-theme" aria-pressed={theme === 'light'} onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} title="Preview in light or dark mode">
          {theme === 'light' ? '☾ Dark' : '☀ Light'}
        </button>
        <button type="button" className="replay" onClick={replay} title="Replay the animation">
          <Icon name="replay" size={14} />
          Respawn
        </button>
        <div key={replayKey} className="lab-stage-inner">
          {item.render(theme === 'light' ? withoutDefaultColors(props, item.defaults) : props)}
        </div>
      </div>

      <div className="listing-body">
        <div className="listing-main">
          <section className="section overview">
            <h2 className="section-title">
              {categoryName} · Bits Lab
            </h2>
            <p className="row-sub">
              {plural(item.controls.length, 'setting')} · {plural(item.docs.length, 'prop')} · {deps}
            </p>
          </section>

          <section className="section">
            <MakerRow />
          </section>

          <section className="section">
            <p className="description">{item.description}</p>
          </section>

          <section className="section" id="code">
            <h2 className="section-title">Loot: install &amp; code</h2>
            <div className="code-stack">
              <Install item={item} lang={lang} onLangChange={setLang} styling={styling} onStylingChange={setStyling} />
              <CodeBlock title="Usage" code={usage} />
              <Sources item={item} lang={lang} styling={styling} />
            </div>
          </section>

          <section className="section" id="props">
            <h2 className="section-title">Recipe: props</h2>
            <PropTable docs={item.docs} />
          </section>
        </div>

        <aside className="booking">
          <div className="booking-card">
            <div className="booking-head">
              <h2>Crafting table</h2>
              <span className="row-sub">{plural(item.controls.length, 'setting')}</span>
            </div>
            <Controls controls={item.controls} props={props} onChange={change} />
            <button type="button" className="cta" onClick={() => copyUsage(usage)}>
              {usageCopied ? 'Crafted! Copied' : 'Craft & copy usage'}
            </button>
            <p className="booking-note">Every tweak rewrites the snippet, and the URL saves your world.</p>
          </div>
          {hasChanges && (
            <button type="button" className="text-link" onClick={resetAll}>
              <Icon name="reset" size={14} />
              Reset to defaults
            </button>
          )}
        </aside>
      </div>
    </article>
  );
}
