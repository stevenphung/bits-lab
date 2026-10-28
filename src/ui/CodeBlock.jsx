import { useCallback, useRef, useState } from 'react';
import { Icon } from './icons';

export function useCopy() {
  const [copied, setCopied] = useState(false);
  const timer = useRef(0);

  const copy = useCallback(async text => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }, []);

  return [copied, copy];
}

export default function CodeBlock({ title, code, maxHeight }) {
  const [copied, copy] = useCopy();

  return (
    <section className="code-block">
      <header>
        <span>{title}</span>
        <button type="button" className="text-action small" onClick={() => copy(code)}>
          <Icon name={copied ? 'check' : 'copy'} size={14} />
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </header>
      <pre style={maxHeight ? { maxHeight } : undefined}>
        <code>{code}</code>
      </pre>
    </section>
  );
}
