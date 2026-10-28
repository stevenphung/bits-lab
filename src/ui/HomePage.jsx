import { useState } from 'react';
import { CATEGORIES, COMPONENTS } from '../meta';
import Sprite from '../pixel/Sprite';
import AchievementToaster, { achievement } from '../bits/AchievementToast';
import AuroraBands from '../bits/AuroraBands';
import CardDeck from '../bits/CardDeck';
import { confetti } from '../bits/Confetti';
import FocusPull from '../bits/FocusPull';
import HealthBar from '../bits/HealthBar';
import HoldToConfirm from '../bits/HoldToConfirm';
import KineticHeadline from '../bits/KineticHeadline';
import LevelMap from '../bits/LevelMap';
import MarqueeLine from '../bits/MarqueeLine';
import PixelButton from '../bits/PixelButton';
import PixelSpinners from '../bits/PixelSpinners';
import PressStart from '../bits/PressStart';
import QuestDialog from '../bits/QuestDialog';
import RatingPips from '../bits/RatingPips';
import RetroHorizon from '../bits/RetroHorizon';
import RollingNumber from '../bits/RollingNumber';
import ScoreTicker from '../bits/ScoreTicker';
import ShadowStack from '../bits/ShadowStack';
import SignalText from '../bits/SignalText';
import TradingCard from '../bits/TradingCard';
import VoxelTiles from '../bits/VoxelTiles';
import WarpField from '../bits/WarpField';

// The landing page: a pep talk in pixels, built from a handful of the best components, with
// every tile linking to its component page.

const PATHS = new Map(COMPONENTS.map(c => [c.name, `/${c.category}/${c.slug}`]));
const INSTALL = 'npm install bits-lab';

function Tile({ name, blurb, wide, tall, onOpen, children }) {
  const path = PATHS.get(name);
  return (
    <article className={`home-tile ${wide ? 'wide' : ''} ${tall ? 'tall' : ''}`}>
      <div className="home-tile-stage">{children}</div>
      <a className="home-tile-foot" href={path} onClick={event => onOpen(event, path)}>
        <span>
          <strong>{name}</strong>
          <small>{blurb}</small>
        </span>
        <span className="home-tile-go" aria-hidden="true">
          ►
        </span>
      </a>
    </article>
  );
}

function InstallChip() {
  const [copied, setCopied] = useState(false);
  const copy = async event => {
    try {
      await navigator.clipboard.writeText(INSTALL);
    } catch {
      // Clipboard can be blocked (insecure origin, permissions); the command is on screen anyway.
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
    confetti({ origin: event.currentTarget, count: 50, spread: 70 });
    achievement({ title: 'First step', description: 'Copied the install command. The rest is play.', xp: 50, tier: 'gold', icon: <Sprite name="star" size={28} /> });
  };
  return (
    <button type="button" className="home-install" onClick={copy} aria-label={`Copy ${INSTALL}`}>
      <span className="home-install-prompt">$</span>
      <code>{INSTALL}</code>
      <span className="home-install-copy">{copied ? 'Copied!' : 'Copy'}</span>
    </button>
  );
}

export default function HomePage({ onOpen, go }) {
  const [score, setScore] = useState(0);
  const first = PATHS.get(COMPONENTS[0].name);
  const browse = event => onOpen(event, first);

  return (
    <div className="home">
      <section className="home-hero" aria-label="Welcome">
        <div className="home-bg" aria-hidden="true">
          <WarpField speed={0.3} colors={['#f4f4f4', '#73eff7', '#ffcd75']} />
        </div>
        <div className="home-hero-inner">
          <p className="home-eyebrow">
            <Sprite name="gem" size={18} /> {COMPONENTS.length} original components · free and open source
          </p>
          <ShadowStack as="h1" text="Build something worth playing." mode="extrude" depth={9} fontSize="clamp(30px, 6.4vw, 76px)" faceColor="#ffcd75" colors={['#ef7d57', '#b13e53', '#5d275d']} className="home-title" />
          <SignalText as="p" text="Small pieces. Big feelings. Ship the web you wish existed." mode="scramble" charset="blocks" trigger="mount" className="home-lede" />
          <div className="home-cta">
            <PixelButton size="lg" onPress={() => go(first)}>
              ► Press start
            </PixelButton>
            <InstallChip />
          </div>
          <p className="home-hint">Hold anywhere, or the space bar, to hit hyperspeed.</p>
        </div>
      </section>

      <section className="home-stats" aria-label="Bits Lab in numbers">
        {[
          [COMPONENTS.length, 'original components'],
          [CATEGORIES.length, 'categories'],
          [4, 'versions of each: JS, TS, CSS, Tailwind'],
          [0, 'dependencies to install']
        ].map(([value, label]) => (
          <div key={label} className="home-stat">
            <RollingNumber value={value} className="home-stat-value" />
            <span>{label}</span>
          </div>
        ))}
      </section>

      <MarqueeLine
        label="Some of the components"
        items={['FocusPull', 'QuestDialog', 'HoldToConfirm', 'TradingCard', 'VoxelTiles', 'AuroraBands', 'CardDeck', 'RetroHorizon', 'ScoreTicker', 'PixelSpinners', 'RatingPips', 'KineticHeadline'].map(name => (
          <a key={name} href={PATHS.get(name)} onClick={event => onOpen(event, PATHS.get(name))} className="home-marquee-link">
            {name}
          </a>
        ))}
        separator="✦"
      />

      <section className="home-section" aria-labelledby="home-levels">
        <div className="home-wrap">
          <p className="home-kicker">Level select</p>
          <h2 id="home-levels" className="home-h2">
            Every one of these is alive. Go on, poke them.
          </h2>
          <div className="home-grid">
            <Tile name="QuestDialog" blurb="Typewriter RPG dialogue with choices" wide onOpen={onOpen}>
              <QuestDialog width={560} />
            </Tile>
            <Tile name="HoldToConfirm" blurb="A fuse that burns while you hold" onOpen={onOpen}>
              <HoldToConfirm doneLabel="Boss defeated!" onConfirm={() => setScore(s => s + 1000)}>
                Hold to attack
              </HoldToConfirm>
            </Tile>
            <Tile name="ScoreTicker" blurb="Arcade score with combos and popups" onOpen={onOpen}>
              <div className="home-col">
                <ScoreTicker value={score} digits={6} size={30} />
                <button type="button" className="home-mini-btn" onClick={() => setScore(s => s + 250)}>
                  + 250
                </button>
              </div>
            </Tile>
            <Tile name="TradingCard" blurb="Holographic cards that tilt and flip" tall onOpen={onOpen}>
              <TradingCard name="Ember Knight" image="/pixel/sprite-sword.png" rarity="legendary" stats={[{ label: 'ATK', value: 9 }, { label: 'DEF', value: 7 }, { label: 'SPD', value: 5 }]} back={<p className="home-card-back">Never gives up. Neither should you.</p>} width={210} />
            </Tile>
            <Tile name="VoxelTiles" blurb="A generated island you can inspect" wide onOpen={onOpen}>
              <VoxelTiles size={10} seed={11} tileSize={20} heightUnit={6} label="A small voxel island" />
            </Tile>
            <Tile name="CardDeck" blurb="Swipe through a hand of cards" tall onOpen={onOpen}>
              <CardDeck width={190} height={250} label="Motivation cards">
                {[
                  ['star', 'Start small', 'One component today.'],
                  ['heart', 'Make it kind', 'Accessible by default.'],
                  ['gem', 'Polish one thing', 'Details are the delight.'],
                  ['chest', 'Ship it', 'Done beats perfect.']
                ].map(([sprite, title, line]) => (
                  <div key={title} className="home-deck-card">
                    <Sprite name={sprite} size={56} />
                    <strong>{title}</strong>
                    <span>{line}</span>
                  </div>
                ))}
              </CardDeck>
            </Tile>
            <Tile name="RatingPips" blurb="Heart containers for ratings or health" onOpen={onOpen}>
              <div className="home-col">
                <RatingPips defaultValue={3.5} label="How excited are you?" />
                <HealthBar value={82} label="HP" segments={10} />
              </div>
            </Tile>
            <Tile name="PixelSpinners" blurb="Loading states, stepped like old hardware" onOpen={onOpen}>
              <div className="home-row">
                {['blocks', 'bar', 'dots', 'hourglass', 'orbit'].map(type => (
                  <PixelSpinners key={type} type={type} label={`${type} spinner`} />
                ))}
              </div>
            </Tile>
            <Tile name="RetroHorizon" blurb="A synthwave horizon for your hero" wide onOpen={onOpen}>
              <div className="home-fill">
                <RetroHorizon />
              </div>
            </Tile>
          </div>
          <p className="home-more">
            <a href={first} onClick={browse}>
              Browse all {COMPONENTS.length} components ►
            </a>
          </p>
        </div>
      </section>

      <section className="home-section home-quest" aria-labelledby="home-quest">
        <div className="home-wrap home-quest-inner">
          <div>
            <p className="home-kicker">Your quest</p>
            <h2 id="home-quest" className="home-h2">
              From idea to shipped in four moves.
            </h2>
            <ol className="home-steps">
              <li>
                <strong>Pick</strong> a component that makes you smile.
              </li>
              <li>
                <strong>Tune</strong> it on the Crafting Table until it feels right.
              </li>
              <li>
                <strong>Copy</strong> the code, or <code>npm install bits-lab</code>.
              </li>
              <li>
                <strong>Ship</strong> it, and watch someone grin.
              </li>
            </ol>
          </div>
          <LevelMap
            levels={[
              { id: 1, name: 'Pick', status: 'cleared', stars: 3 },
              { id: 2, name: 'Tune', status: 'cleared', stars: 2 },
              { id: 3, name: 'Copy', status: 'current' },
              { id: 4, name: 'Ship', status: 'locked' }
            ]}
            marker={<Sprite name="heart" size={24} />}
            onSelect={(_, index) => index === 2 && achievement({ title: 'Ready to copy', description: 'Pick any component and grab its code.', xp: 25, tier: 'silver' })}
          />
        </div>
      </section>

      <section className="home-manifesto" aria-label="Why Bits Lab">
        <div className="home-bg" aria-hidden="true">
          <AuroraBands />
        </div>
        <div className="home-wrap home-manifesto-inner">
          <KineticHeadline as="h2" text="Make the web fun again." mode="breathe" fontSize={64} className="home-kinetic" />
          <FocusPull as="p" text="You don’t need a big team to build something delightful. You need one good idea, a few good parts, and the nerve to ship." className="home-manifesto-text" />
          <p className="home-manifesto-note">
            Every component is original, keyboard-friendly, respects reduced motion and is MIT licensed. Take them, change them, make them yours.
          </p>
        </div>
      </section>

      <section className="home-final" aria-label="Get started">
        <PressStart text="Press start" startedText="Let’s build!" subtext={`${COMPONENTS.length} components are waiting`} listenGlobally={false} onStart={() => setTimeout(() => go(first), 700)} />
      </section>

      <AchievementToaster position="bottom-right" />
    </div>
  );
}
