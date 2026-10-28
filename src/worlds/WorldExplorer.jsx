import { useEffect, useMemo, useRef, useState } from 'react';
import Sprite from '../pixel/Sprite';
import { achievement } from '../bits/AchievementToast';
import AuroraBands from '../bits/AuroraBands';
import CloudSky from '../bits/CloudSky';
import CodeRain from '../bits/CodeRain';
import ContourLines from '../bits/ContourLines';
import DitherField from '../bits/DitherField';
import FocusPull from '../bits/FocusPull';
import HealthBar from '../bits/HealthBar';
import InkText from '../bits/InkText';
import KineticHeadline from '../bits/KineticHeadline';
import LavaLamp from '../bits/LavaLamp';
import LightShafts from '../bits/LightShafts';
import MeteorShower from '../bits/MeteorShower';
import PixelType from '../bits/PixelType';
import QuestDialog from '../bits/QuestDialog';
import RatingPips from '../bits/RatingPips';
import RetroHorizon from '../bits/RetroHorizon';
import RingProgress from '../bits/RingProgress';
import ShadowStack from '../bits/ShadowStack';
import SignalText from '../bits/SignalText';
import TradingCard from '../bits/TradingCard';
import WarpField from '../bits/WarpField';
import { generateWorld, worldCode } from './generate';
import { newSeed } from './rng';

// Endless worlds: every seed grows a world from Bits Lab components. Warp jumps to a new
// seed; the seed lives in the URL (?world=…) so any world can be shared and rebuilt exactly.

const PARTS = { AuroraBands, CloudSky, CodeRain, ContourLines, DitherField, FocusPull, InkText, KineticHeadline, LavaLamp, LightShafts, MeteorShower, PixelType, RetroHorizon, ShadowStack, SignalText, WarpField };
const TIER = { common: 'bronze', rare: 'silver', epic: 'gold', legendary: 'diamond' };
const STORE = 'bitslab-worlds';

const readDiscovered = () => {
  try {
    return JSON.parse(localStorage.getItem(STORE)) ?? [];
  } catch {
    return [];
  }
};

const urlSeed = () => new URLSearchParams(window.location.search).get('world');

export default function WorldExplorer() {
  const [seed, setSeed] = useState(() => urlSeed() ?? newSeed());
  const [warping, setWarping] = useState(false);
  const [discovered, setDiscovered] = useState(readDiscovered);
  const [copied, setCopied] = useState('');
  const timer = useRef(0);
  const world = useMemo(() => generateWorld(seed), [seed]);
  const p = world.palette;

  // Log each world the first time it is seen.
  useEffect(() => {
    setDiscovered(list => {
      if (list.includes(seed)) return list;
      const next = [...list, seed].slice(-500);
      try {
        localStorage.setItem(STORE, JSON.stringify(next));
      } catch {
        // Storage can be unavailable (private mode); the count just won't persist.
      }
      return next;
    });
  }, [seed]);

  useEffect(() => () => clearTimeout(timer.current), []);

  // A shared link (?world=…) lands on the world itself.
  useEffect(() => {
    if (urlSeed()) document.getElementById('worlds')?.scrollIntoView();
  }, []);

  const warp = () => {
    if (warping) return;
    const next = newSeed();
    const arrive = () => {
      setSeed(next);
      setWarping(false);
      const url = new URL(window.location.href);
      url.searchParams.set('world', next);
      window.history.replaceState(null, '', url);
      const found = generateWorld(next);
      achievement({ title: `Discovered ${found.name}`, description: `${found.epithet.charAt(0).toUpperCase()}${found.epithet.slice(1)} · ${found.rarity}`, xp: { common: 10, rare: 25, epic: 50, legendary: 100 }[found.rarity], tier: TIER[found.rarity], icon: <Sprite name="gem" size={28} /> });
    };
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return arrive();
    setWarping(true);
    timer.current = setTimeout(arrive, 1300);
  };

  const copy = async (what, text) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Clipboard can be blocked; nothing else to do.
    }
    setCopied(what);
    setTimeout(() => setCopied(''), 1600);
  };

  const Background = PARTS[world.background.component];
  const Title = PARTS[world.title.component];

  return (
    <div className="world-explorer" style={{ '--w-ink': p.ink, '--w-accent': p.accent, '--w-accent2': p.accent2, '--w-panel': p.panel, '--w-dim': p.dim, '--w-sky': p.skyTop }}>
      <div className="world" key={seed} aria-label={`World ${world.name}, ${world.epithet}`} role="region">
        <div className="world-bg" aria-hidden="true">
          <Background {...world.background.props} />
        </div>
        <div className="world-layout">
          <header className="world-head">
            <p className="world-seed">
              <Sprite name="gem" size={14} /> World {seed} · {world.rarity}
            </p>
            <div className="world-title">
              <Title {...world.title.props} />
            </div>
            <p className="world-epithet">{world.epithet}</p>
            <p className="world-desc">{world.description}</p>
          </header>
          <div className="world-panels">
            <div className="world-card">
              <TradingCard {...world.card} accentColor={p.accent} back={<p className="world-card-back">{world.description}</p>} width={210} />
            </div>
            <div className="world-panel world-survey">
              <p className="world-panel-title">Survey</p>
              <RingProgress
                size={130}
                thickness={9}
                textColor={p.ink}
                rings={[
                  { label: 'Flora', value: world.survey.flora, color: p.accent },
                  { label: 'Fauna', value: world.survey.fauna, color: p.accent2 },
                  { label: 'Minerals', value: world.survey.minerals, color: p.accent3 }
                ]}
              />
              <div className="world-readout">
                <span>Habitability</span>
                <RatingPips value={world.survey.habitability} readOnly icon="heart" size={20} fullColor="#b13e53" label="Habitability" />
              </div>
              <HealthBar value={world.survey.hazard} label="HAZARD" segments={10} color="#ef7d57" height={14} />
            </div>
            <div className="world-guide">
              <QuestDialog
                width={340}
                fontSize={11}
                portraitSize={48}
                minLines={3}
                lines={[
                  { speaker: world.guide.speaker, portrait: <Sprite name={world.guide.portrait} size={40} />, text: world.guide.lines[0] },
                  { speaker: world.guide.speaker, portrait: <Sprite name={world.guide.portrait} size={40} />, text: world.guide.lines[1], choices: [{ label: 'Warp onward', value: 'warp' }, { label: 'Stay a while', value: 'stay' }] },
                  { speaker: world.guide.speaker, portrait: <Sprite name={world.guide.portrait} size={40} />, text: world.guide.lines[2] }
                ]}
                onChoice={value => value === 'warp' && warp()}
              />
            </div>
          </div>
        </div>
        {warping && (
          <div className="world-warp" aria-live="polite">
            <WarpField speed={2.4} colors={['#f4f4f4', p.accent, p.accent2]} backgroundColor="#0b0b14" />
            <p>Jumping to hyperspace…</p>
          </div>
        )}
      </div>
      <div className="world-bar">
        <button type="button" className="world-warp-btn" onClick={warp} disabled={warping}>
          ► Warp to a new world
        </button>
        <button type="button" className="home-mini-btn" onClick={() => copy('code', worldCode(world))}>
          {copied === 'code' ? 'Copied!' : 'Copy world code'}
        </button>
        <button type="button" className="home-mini-btn" onClick={() => copy('link', `${window.location.origin}/?world=${seed}`)}>
          {copied === 'link' ? 'Link copied!' : 'Share link'}
        </button>
        <span className="world-count">
          <Sprite name="star" size={16} /> {discovered.length} {discovered.length === 1 ? 'world' : 'worlds'} discovered
        </span>
      </div>
    </div>
  );
}
