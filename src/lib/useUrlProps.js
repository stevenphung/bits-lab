import { useCallback, useMemo, useState } from 'react';

// Same idea as React Bits' useComponentProps: every prop lives in the query string,
// parsed by the type of its default, and only non-default values are written.

const isHex = value => typeof value === 'string' && /^#[0-9a-fA-F]{3,8}$/.test(value);

function parse(raw, fallback) {
  if (raw === null) return fallback;
  if (typeof fallback === 'number') {
    const n = Number(raw);
    return Number.isFinite(n) ? n : fallback;
  }
  if (typeof fallback === 'boolean') return raw === 'true';
  if (isHex(fallback)) return `#${raw.replace(/^#/, '')}`;
  return raw;
}

const serialize = value => (isHex(value) ? value.slice(1) : String(value));

function readProps(defaults) {
  const params = new URLSearchParams(window.location.search);
  return Object.fromEntries(Object.entries(defaults).map(([key, value]) => [key, parse(params.get(key), value)]));
}

function writeProps(props, defaults) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(props)) {
    if (value !== defaults[key]) params.set(key, serialize(value));
  }
  const query = params.toString();
  window.history.replaceState(null, '', `${window.location.pathname}${query ? `?${query}` : ''}`);
}

export function useUrlProps(defaults) {
  const [props, setProps] = useState(() => readProps(defaults));

  const update = useCallback(
    (name, value) => {
      setProps(prev => {
        const next = { ...prev, [name]: value };
        writeProps(next, defaults);
        return next;
      });
    },
    [defaults]
  );

  const reset = useCallback(() => {
    writeProps(defaults, defaults);
    setProps(defaults);
  }, [defaults]);

  const hasChanges = useMemo(() => Object.keys(defaults).some(key => props[key] !== defaults[key]), [props, defaults]);

  return { props, update, reset, hasChanges };
}
