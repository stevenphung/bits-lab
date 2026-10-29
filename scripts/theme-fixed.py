"""Light mode for components whose colours live in their CSS rather than in colour props.

scripts/theme-tokens.py handles components whose colours arrive as props. These ones keep their
colours in the stylesheet (often as `var(--bl-…, fallback)` so they can be restyled with CSS),
so instead of tokens they get a block of light overrides appended to their CSS: the same rules
with light values, under `.light` / `data-theme="light"` (and `data-theme="system"` in OS light
mode), with a nested `.dark` switching back. Custom properties set by the user still win, since
only the fallbacks change. The Tailwind variants get the same block plus hook classes on the
elements it targets; the block is unlayered, so it beats Tailwind's utilities.

  python3 scripts/theme-fixed.py [Name …]      (then regenerate src/bits/tw-ts)
"""
import os, re, sys

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'src', 'bits')
MARK, END = '/* light overrides */', '/* light overrides end */'
L = ':where(.light, [data-theme="light"])'
D = ':where(.dark, [data-theme="dark"])'
S = ':where([data-theme="system"])'

# Each rule: (class, suffix, {property: (dark, light)}). Hooks: (old, new, count) for the Tailwind file.
SPEC = {
    'ToggleKit': {
        'rules': [
            ('.bl-tk', '', {
                '--tk-accent': ('var(--bl-tk-accent, #73eff7)', 'var(--bl-tk-accent, #167f8f)'),
                '--tk-ink': ('var(--bl-tk-ink, #f4f4f4)', 'var(--bl-tk-ink, #1a1c2c)'),
                '--tk-muted': ('var(--bl-tk-muted, #94b0c2)', 'var(--bl-tk-muted, #566c86)'),
                '--tk-track': ('var(--bl-tk-track, #333c57)', 'var(--bl-tk-track, #cfc4ad)'),
                '--tk-on-ink': ('var(--bl-tk-on-ink, #1a1c2c)', 'var(--bl-tk-on-ink, #f4f1e8)'),
            }),
            ('.bl-tk-group', ' legend', {'color': ('var(--bl-tk-muted, #94b0c2)', 'var(--bl-tk-muted, #566c86)')}),
        ],
        'hooks': [('className={`group/tk ', 'className={`bl-tk group/tk ', 3), ('className={`group/bell ', 'className={`bl-tk group/bell ', 1), ('className={`group/tkg ', 'className={`bl-tk-group group/tkg ', 1)],
    },
    'OverlayKit': {
        'rules': [
            ('.bl-ok-layer', '', {
                '--ok-bg': ('var(--bl-ok-bg, #1a1c2c)', 'var(--bl-ok-bg, #f4f1e8)'),
                '--ok-ink': ('var(--bl-ok-ink, #f4f4f4)', 'var(--bl-ok-ink, #1a1c2c)'),
                '--ok-muted': ('var(--bl-ok-muted, #94b0c2)', 'var(--bl-ok-muted, #566c86)'),
                '--ok-line': ('var(--bl-ok-line, rgba(255,255,255,0.12))', 'var(--bl-ok-line, rgba(26,28,44,0.14))'),
                '--ok-accent': ('var(--bl-ok-accent, #73eff7)', 'var(--bl-ok-accent, #167f8f)'),
                '--ok-hover': ('var(--bl-ok-hover, rgba(255,255,255,0.07))', 'var(--bl-ok-hover, rgba(26,28,44,0.07))'),
            }),
            ('.bl-ok-tooltip', '', {
                'background': ('var(--bl-ok-tooltip-bg, #f4f4f4)', 'var(--bl-ok-tooltip-bg, #1a1c2c)'),
                'color': ('var(--bl-ok-tooltip-ink, #1a1c2c)', 'var(--bl-ok-tooltip-ink, #f4f4f4)'),
            }),
            ('.bl-ok-item', '[data-danger]', {'color': ('var(--bl-ok-danger, #ef7d57)', 'var(--bl-ok-danger, #c4502a)')}),
        ],
        'hooks': [('className="[--ok-bg:', 'className="bl-ok-layer [--ok-bg:', 4), ('role="tooltip" className={`', 'role="tooltip" className={`bl-ok-tooltip ', 1), ('data-[danger]:text-[var(--bl-ok-danger,#ef7d57)]', 'bl-ok-item data-[danger]:text-[var(--bl-ok-danger,#ef7d57)]', 1)],
    },
    'AchievementToast': {
        'rules': [
            ('.bl-ach', '', {'background': ('#1a1c2c', '#f4f1e8'), 'color': ('#f4f4f4', '#1a1c2c')}),
            ('.bl-ach__icon', '', {'background': ('#0b0b14', '#e2dacb')}),
            ('.bl-ach__label', '', {'color': ('var(--bl-tier)', 'color-mix(in srgb, var(--bl-tier) 55%, #1a1c2c)')}),
            ('.bl-ach__desc', '', {'color': ('#94b0c2', '#566c86')}),
            ('.bl-ach__close', '', {'color': ('#94b0c2', '#566c86')}),
            ('.bl-ach__close', ':hover', {'color': ('#f4f4f4', '#1a1c2c')}),
            ('.bl-ach__close', ':focus-visible', {'color': ('#f4f4f4', '#1a1c2c')}),
        ],
        'hooks': [
            ('className="group/ach ', 'className="bl-ach group/ach ', 1),
            ('className="relative grid size-14 place-items-center bg-[#0b0b14]', 'className="bl-ach__icon relative grid size-14 place-items-center bg-[#0b0b14]', 1),
            ('className="m-0 mb-1.5 text-[8px]', 'className="bl-ach__label m-0 mb-1.5 text-[8px]', 1),
            ('className="mt-1.5 mb-0 [font:14px', 'className="bl-ach__desc mt-1.5 mb-0 [font:14px', 1),
            ('className="absolute top-1 right-1 size-[22px]', 'className="bl-ach__close absolute top-1 right-1 size-[22px]', 1),
        ],
    },
}


def block(rules):
    out = [MARK]
    for cls, suffix, props in rules:
        dark = ' '.join(f'{p}: {d};' for p, (d, _) in props.items())
        lite = ' '.join(f'{p}: {l};' for p, (_, l) in props.items())
        out.append(f'{L} {cls}{suffix}, {cls}{L}{suffix} {{ {lite} }}')
        out.append(f'{L} {D} {cls}{suffix}, {L} {cls}{D}{suffix} {{ {dark} }}')
        out.append(f'@media (prefers-color-scheme: light) {{ {S} {cls}{suffix}, {cls}{S}{suffix} {{ {lite} }} }}')
    out.append(END)
    return '\n'.join(out) + '\n'


def apply(path, css, hooks=()):
    src = open(path).read()
    src = re.sub(re.escape(MARK) + r'.*?' + re.escape(END) + r'\n', '', src, flags=re.S)
    m = re.search(r"const (CSS|STYLES) = `\n?(.*?)`;", src, re.S)
    assert m, (path, 'no CSS')
    end = m.end(2)
    src = src[:end] + ('' if src[end - 1] == '\n' else '\n') + css + src[end:]
    for old, new, count in hooks:
        if new in src:
            continue
        assert src.count(old) == count, (path, old, src.count(old))
        src = src.replace(old, new)
    open(path, 'w').write(src)


if __name__ == '__main__':
    for name in sys.argv[1:] or SPEC:
        spec = SPEC[name]
        css = block(spec['rules'])
        apply(f'{ROOT}/{name}.jsx', css)
        apply(f'{ROOT}/ts/{name}.tsx', css)
        apply(f'{ROOT}/tw/{name}.jsx', css, spec['hooks'])
        print('light overrides:', name)
