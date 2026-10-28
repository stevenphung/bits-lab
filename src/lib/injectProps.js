// Rewrites a usage snippet so it matches the props set in the Customize panel.
// Changed props replace their existing `name=...` line, or are inserted before the closing `/>`.

function formatValue(value) {
  // JSX attribute strings have no escapes, so quotes or backslashes need the {"..."} form.
  if (typeof value === 'string' && !/["\\]/.test(value)) return `"${value}"`;
  return `{${JSON.stringify(value)}}`;
}

const escapeRegExp = text => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export function injectProps(usage, props, defaults, skip = []) {
  let result = usage;

  for (const [name, value] of Object.entries(props)) {
    if (skip.includes(name) || value === defaults[name]) continue;

    const line = value === true ? name : `${name}=${formatValue(value)}`;
    const existing = new RegExp(`^([ \\t]*)${escapeRegExp(name)}(?:=(?:"[^"\\n]*"|\\{[^\\n]*\\}))?[ \\t]*$`, 'm');

    if (existing.test(result)) {
      result = result.replace(existing, (_, indent) => `${indent}${line}`);
    } else {
      result = result.replace(/^([ \t]*)\/>/m, (_, indent) => `${indent}  ${line}\n${indent}/>`);
    }
  }

  return result;
}
