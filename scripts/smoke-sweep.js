// Dev-only smoke test. In the browser console on the running dev server:
//   const { sweep } = await import('/scripts/smoke-sweep.js'); await sweep(0, 40);
// Clicks through React Bits pages in the sidebar and reports previews that hit the error boundary,
// log console errors, throw, stay empty or never finish loading.
const errors = [];

if (!window.__smokeHooked) {
  window.__smokeHooked = true;
  const original = console.error.bind(console);
  console.error = (...args) => {
    errors.push(args.map(arg => arg?.message ?? String(arg)).join(' ').slice(0, 300));
    original(...args);
  };
  window.addEventListener('error', event => errors.push(`uncaught: ${event.message}`));
  window.addEventListener('unhandledrejection', event => errors.push(`rejection: ${event.reason?.message ?? event.reason}`));
}

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

export function links() {
  return [...document.querySelectorAll('.sidebar nav a')]
    .map(link => link.getAttribute('href'))
    .filter(href => href.startsWith('/reactbits/'));
}

export async function sweep(from = 0, to = Infinity, wait = 1300) {
  const problems = [];
  const hrefs = links().slice(from, to);

  for (const href of hrefs) {
    errors.length = 0;
    document.querySelector(`.sidebar nav a[href="${href}"]`).click();
    await sleep(wait);

    const inner = document.querySelector('.lab-stage-inner');
    const boundary = document.querySelector('.preview-error');
    const flags = [];
    if (inner && !inner.querySelector('*') && !inner.textContent.trim()) flags.push('EMPTY');
    if (document.querySelector('.preview-loading')) flags.push('LOADING');
    const logged = [...new Set(errors)].filter(text => !/\[vite\]|React DevTools/.test(text));

    if (boundary || logged.length || flags.length) {
      problems.push({
        slug: href.split('/').pop(),
        boundary: boundary?.innerText.split('\n')[1],
        errors: logged.slice(0, 2),
        flags: flags.join(' ')
      });
    }
  }

  return { checked: hrefs.length, of: links().length, problems };
}
