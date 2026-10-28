"""Light mode for Bits Lab components.

Moves each component's colour defaults out of the inline style and into CSS custom properties
on its root class, with a light palette that switches on when an ancestor (or the root itself)
has `.light` or `data-theme="light"`, or `data-theme="system"` and the OS is in light mode.
A `.dark` / `data-theme="dark"` inside a light area switches back. Colour props still win:
they are set inline, so they override the tokens.

Applies the same edits to src/bits/<Name>.jsx, src/bits/ts/<Name>.tsx and src/bits/tw/<Name>.jsx
(the Tailwind root gets the bl- class as a hook for the tokens); regenerate src/bits/tw-ts after.

  python3 scripts/theme-tokens.py [Name …]      (default: every themable component)
"""
import json, os, re, sys

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'src', 'bits')
MARK = '/* theme tokens */'

# Objects that stay dark in both themes (screens, terminals, hardware, photo viewers), and three
# overlays that set their variables through a shared object (a follow-up).
EXCLUDE = {
    'BootSequence', 'CRTPower', 'CodeShowcase', 'TerminalDemo', 'GameOver', 'Screensaver', 'DynamicIsland',
    'StoryViewer', 'Minimap', 'CipherCard', 'PressStart', 'VideoHero', 'ScreenScroller', 'Polaroids',
    'StickerBoard', 'DraftScroll', 'CompareSlider', 'ScrollTilt', 'LightboxGallery', 'ArcadeButtons',
    'JellyBlob', 'VoxelTiles', 'ParallaxCollage', 'DirectionHover',
    'CommandPalette', 'MorphDialog',
    # Text drawn on a canvas, or text that must stay light over media: a follow-up.
    'WebcamPixels', 'ScrollZoom', 'VanishInput',
}

PAPER, SUNKEN, CHIP, HOVER, LINE = '#f4f1e8', '#e2dacb', '#ebe5d8', '#e0d8c6', '#cfc4ad'
TEXT, MUTED, DIM = '#1a1c2c', '#566c86', '#8a96a3'
ACCENT, GOLD, ORANGE, LIME, GREEN, SKY = '#167f8f', '#a86a12', '#c4502a', '#2f7d22', '#2b8a4a', '#2470c2'

TEXTISH = re.compile(r'(text|label|ink|char|border|name|glint|select|highlight)$', re.I)
ON_FILL = re.compile(r'^on[A-Z]|Text$|^label$|^name$', re.I)
LINEISH = re.compile(r'(line|border|track|edge|bezel|grid|guide|period)', re.I)
KEEP = re.compile(r'(backdrop|shadow)', re.I)


def rgba(value):
    m = re.fullmatch(r'rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)', value.replace(' ', ''))
    return tuple(m.groups()) if m else None


def light(prop, value):
    """The light-mode value for a colour prop, from its dark default and its role."""
    v = value.lower()
    name = prop[:-5] if prop.endswith('Color') else prop
    if KEEP.search(name) and not v.startswith('#94'):
        return value
    special = {
        ('thinkingshimmer', 'shine'): DIM, ('inktext', 'glint'): '#ffffff', ('skeletonshimmer', 'base'): '#e3dccd',
        ('skeletonshimmer', 'shine'): PAPER, ('reveal', 'cover'): PAPER, ('sparkchart', 'tooltip'): '#ffffff',
        ('chatbubbles', 'them'): '#e3dccd', ('chatbubbles', 'picker'): CHIP, ('inventorygrid', 'hover'): '#d6dcef',
        ('tradingcard', 'back'): '#dfe3f0', ('dropzone', 'over'): '#dfe6f2', ('hotbardock', 'hover'): '#ddd4c0',
        ('smartnavbar', 'pill'): 'rgba(244,241,232,0.82)', ('funnelflow', 'particle'): '#3b5dc9',
        ('glasspanel', 'edge'): value, ('scrollzoom', 'dim'): value, ('chatbubbles', 'metext'): value,
    }
    key = (CURRENT.lower(), name.lower())
    if key in special:
        return special[key]
    if v == '#f4f4f4' or v == '#ffffff' and TEXTISH.search(name):
        return TEXT
    if v in ('#e8eaf0', '#e8e8e8'):
        return TEXT
    if v == '#1a1c2c':
        return '#f4f4f4' if re.search(r'Text$', name) else PAPER
    if v == '#0b0b14':
        if ON_FILL.search(name):
            return value
        return PAPER if re.search(r'cover', name) else SUNKEN
    if v in ('#11131c', '#11121e', '#1f2335'):
        return PAPER
    if v == '#262b44':
        return CHIP
    if v in ('#2e3552', '#3d4766', '#3a4266'):
        return HOVER
    if v == '#333c57':
        return LINE if LINEISH.search(name) else '#ddd4c0'
    if v == '#29366f':
        return '#dfe3f0'
    if v == '#566c86':
        return DIM
    if v == '#94b0c2':
        return MUTED
    if v == '#73eff7':
        return ACCENT
    if v == '#ffcd75':
        return GOLD
    if v == '#ef7d57':
        return ORANGE
    if v == '#a7f070':
        return LIME
    if v == '#38b764':
        return GREEN
    if v == '#41a6f6':
        return SKY
    c = rgba(v)
    if c:
        r, g, b, a = c
        if (r, g, b) == ('255', '255', '255'):
            return f'rgba(26,28,44,{a})'
        if (r, g, b) == ('115', '239', '247'):
            return f'rgba(22,127,143,{a})'
        if (r, g, b) == ('148', '176', '194'):
            return f'rgba(86,108,134,{a})'
    return value


CURRENT = ''


def params_span(src, name):
    # The default-exported function (its name can differ from the file's, e.g. AchievementToaster).
    m = re.search(r'export default function \w+\(', src)
    if not m:
        raise LookupError(name)
    # The parameter list ends at `}) {` (JavaScript) or `}: NameProps) {` (TypeScript).
    j = re.compile(r'\}(?:: \w+)?\) \{').search(src, m.start()).start()
    return m.start(), j


def style_objects(src):
    """(start, end, text) of every style={{ … }} object."""
    out, i = [], 0
    while (i := src.find('style={{', i)) != -1:
        k = i + len('style={')
        depth, m = 0, k
        while True:
            depth += {'{': 1, '}': -1}.get(src[m], 0)
            if depth == 0:
                break
            m += 1
        out.append((k, m + 1, src[k:m + 1]))
        i = m + 1
    return out


def plan(name):
    """What to theme in a component: [(prop, var, dark, light)], root class and style id."""
    src = open(f'{ROOT}/{name}.jsx').read()
    try:
        a, b = params_span(src, name)
    except LookupError:
        return [], None, None
    params = src[a:b]
    colors = dict(re.findall(r"\b(\w*[cC]olor)\s*=\s*'(#[0-9a-fA-F]{3,8}|rgba?\([^']*\))'", params))
    roots = [t for _, _, t in style_objects(src) if '...style' in t]
    # Some components build their variables in a `vars` object first (style={vars}).
    vars_obj = re.search(r'\n  const vars = (\{.*?\n  \});', src, re.S)
    if vars_obj:
        roots.append(vars_obj.group(1))
    root_map = {}
    for t in roots:
        for var, prop in re.findall(r"'(--[\w-]+)':\s*(\w+)\b(?![.(\[?])", t):
            if prop in colors:
                root_map.setdefault(prop, var)
    rows = []
    for prop, dark in colors.items():
        if prop not in root_map:
            continue
        uses = len(re.findall(r'\b' + prop + r'\b', src))
        mapped = sum(len(re.findall(r"'--[\w-]+':\s*" + prop + r"\b(?![.(\[?])", t)) for _, _, t in style_objects(src))
        if vars_obj:
            mapped += len(re.findall(r"'--[\w-]+':\s*" + prop + r"\b(?![.(\[?])", vars_obj.group(1)))
        if uses != 1 + mapped:
            continue  # read by JavaScript too (canvas, SVG): leave it alone
        rows.append((prop, root_map[prop], dark, light(prop, dark)))
    root = re.search(r"className=\{`(bl-[\w-]+) \$\{className\}`\}", src) or re.search(r'className="(bl-[\w-]+)" style=\{vars\}', src)
    sid = re.search(r"const STYLE_ID = '([\w-]+)';", src)
    return rows, root.group(1) if root else None, sid.group(1) if sid else None


def token_css(cls, rows):
    decl = lambda pairs: ' '.join(f'{v}: {c};' for v, c in pairs)
    dark = [(v, d) for _, v, d, _ in rows]
    lite = [(v, l) for _, v, d, l in rows if l != d]
    on = f':where(.light, [data-theme="light"]) .{cls}, .{cls}:where(.light, [data-theme="light"])'
    back = f':where(.light, [data-theme="light"]) :where(.dark, [data-theme="dark"]) .{cls}, :where(.light, [data-theme="light"]) .{cls}:where(.dark, [data-theme="dark"])'
    system = f':where([data-theme="system"]) .{cls}, .{cls}:where([data-theme="system"])'
    css = f'{MARK}\n.{cls} {{ {decl(dark)} }}\n'
    if lite:
        css += f'{on} {{ {decl(lite)} }}\n{back} {{ {decl(dark)} }}\n@media (prefers-color-scheme: light) {{ {system} {{ {decl(lite)} }} }}\n'
    return css + f'{MARK.replace("tokens", "tokens end")}\n'


def edit_logic(src, name, rows):
    a, b = params_span(src, name)
    params = src[a:b]
    for prop, var, dark, _ in rows:
        pat = re.compile(r'\b' + prop + r" = '" + re.escape(dark) + "'")
        assert len(pat.findall(params)) == 1, (name, prop)
        params = pat.sub(prop, params)
    src = src[:a] + params + src[b:]
    # Style objects other than the root: fall back to the root's token.
    objs = style_objects(src)
    for k, m, t in reversed(objs):
        if '...style' in t:
            continue
        new = t
        for prop, var, _, _ in rows:
            new = re.sub(r"('--[\w-]+':\s*)" + prop + r"\b(?![.(\[?])", lambda mo: f"{mo.group(1)}{prop} ?? 'var({var})'", new)
        if new != t:
            src = src[:k] + new + src[m:]
    return src


def add_css(src, css, style_id):
    m = re.search(r"const (CSS|STYLES) = `\n?", src)
    if m:
        if MARK in src:
            src = re.sub(re.escape(MARK) + r'.*?' + re.escape(MARK.replace('tokens', 'tokens end')) + r'\n', '', src, flags=re.S)
            m = re.search(r"const (CSS|STYLES) = `\n?", src)
        return src[:m.end()] + css + src[m.end():]
    # A Tailwind variant without injected CSS: add the injection.
    if not re.search(r'^import ', src, re.M):
        src = "import { useInsertionEffect } from 'react';\n" + src
    lines = src.split('\n')
    last = max(i for i, l in enumerate(lines) if l.startswith('import '))
    block = f"""
const STYLE_ID = '{style_id}-tw';
const CSS = `
{css}`;

function useStyles() {{
  useInsertionEffect(() => {{
    if (typeof document === 'undefined') return;
    const style = document.getElementById(STYLE_ID) ?? Object.assign(document.createElement('style'), {{ id: STYLE_ID }});
    style.textContent = CSS;
    if (!style.isConnected) document.head.appendChild(style);
  }}, []);
}}"""
    lines.insert(last + 1, block)
    src = '\n'.join(lines)
    if not re.search(r"import \{[^}]*\buseInsertionEffect\b[^}]*\} from 'react';", src):
        if re.search(r"import \{[^}]*\} from 'react';", src):
            def add_import(mo):
                # Keep the names in order, as the generated TypeScript twin sorts them.
                names = [x.strip() for x in mo.group(1).split(',') if x.strip()]
                i = next((k for k, x in enumerate(names) if x.lower() > 'useinsertioneffect'), len(names))
                names.insert(i, 'useInsertionEffect')
                return 'import { ' + ', '.join(names) + " } from 'react';"
            src = re.sub(r"import \{([^}]*)\} from 'react';", add_import, src, count=1)
        else:
            src = "import { useInsertionEffect } from 'react';\n" + src
    return src


def add_use_styles(src, name):
    if re.search(r'\n\s+useStyles\(\);', src):
        return src
    i = re.search(r'export default function \w+\(', src).start()
    j = re.compile(r'\}(?:: \w+)?\) \{\n').search(src, i).end()
    return src[:j] + '  useStyles();\n' + src[j:]


def convert(name):
    global CURRENT
    CURRENT = name
    rows, cls, sid = plan(name)
    if not rows or not cls:
        return None
    css = token_css(cls, rows)
    for path, tw in ((f'{ROOT}/{name}.jsx', False), (f'{ROOT}/ts/{name}.tsx', False), (f'{ROOT}/tw/{name}.jsx', True)):
        src = open(path).read()
        if re.search(r'\b' + rows[0][0] + r" = '", src) is None and MARK in src:
            continue  # already converted
        src = edit_logic(src, name, rows)
        src = add_css(src, css, sid)
        if tw:
            src = add_use_styles(src, name)
            # Hook class for the tokens on the Tailwind root.
            src, n = re.subn(r"className=\{`(?!" + cls + r" )([^`]*?)\$\{className\}`\}", lambda mo: f"className={{`{cls} {mo.group(1)}${{className}}`}}", src)
            if n + src.count('className={`' + cls + ' ') == 0:
                src, n = re.subn(r'className="(?!' + cls + r' )([^"]*)" style=\{vars\}', lambda mo: f'className="{cls} {mo.group(1)}" style={{vars}}', src)
            assert n + src.count('className={`' + cls + ' ') + src.count('className="' + cls + ' ') >= 1, (name, 'tw root')
        open(path, 'w').write(src)
    return rows


if __name__ == '__main__':
    if sys.argv[1:2] == ['--dry']:
        for n in sys.argv[2:] or sorted(f[:-4] for f in os.listdir(ROOT) if f.endswith('.jsx')):
            if n in EXCLUDE:
                continue
            CURRENT = n
            rows, cls, _ = plan(n)
            if rows:
                print(f"{n} ({cls}): " + ' '.join(f"{p.replace('Color', '')} {d}->{l}" for p, v, d, l in rows))
        sys.exit()
    names = sys.argv[1:] or sorted(f[:-4] for f in os.listdir(ROOT) if f.endswith('.jsx'))
    report = {}
    for n in names:
        if n in EXCLUDE:
            continue
        rows = convert(n)
        if rows:
            report[n] = [(p, v, d, l) for p, v, d, l in rows]
    print(f'themed {len(report)} components, {sum(len(r) for r in report.values())} colour tokens')
    json.dump(report, open(os.path.join(ROOT, '..', '..', 'scripts', '.theme-report.json'), 'w'), indent=1)
