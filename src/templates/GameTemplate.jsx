import { useEffect, useRef, useState } from 'react';
import './templates.css';
import Sprite from '../pixel/Sprite';
import { demoParallaxLayers, demoSpriteSheet, SHEET_ANIMATIONS } from '../pixel/demoArt';
import { pixelVideoUrl } from '../pixel/media';
import AchievementToaster, { achievement } from '../bits/AchievementToast';
import BarRace from '../bits/BarRace';
import BootSequence from '../bits/BootSequence';
import CardDeck from '../bits/CardDeck';
import ChangelogTimeline from '../bits/ChangelogTimeline';
import ChapterProgress from '../bits/ChapterProgress';
import ChiptuneKit, { ChiptuneProvider, MuteToggle, playChip } from '../bits/ChiptuneKit';
import Coverflow from '../bits/Coverflow';
import CRTPower from '../bits/CRTPower';
import DirectionHover from '../bits/DirectionHover';
import DitherField from '../bits/DitherField';
import DotGlobe from '../bits/DotGlobe';
import ElasticString from '../bits/ElasticString';
import FocusGrid from '../bits/FocusGrid';
import GameOver from '../bits/GameOver';
import GrainFX from '../bits/GrainFX';
import HealthBar from '../bits/HealthBar';
import HoldToConfirm from '../bits/HoldToConfirm';
import HorizontalTrack from '../bits/HorizontalTrack';
import HotbarDock from '../bits/HotbarDock';
import InventoryGrid from '../bits/InventoryGrid';
import LightboxGallery from '../bits/LightboxGallery';
import LightShafts from '../bits/LightShafts';
import MarqueeLine from '../bits/MarqueeLine';
import MeteorShower from '../bits/MeteorShower';
import MorphDialog from '../bits/MorphDialog';
import OverlayMenu from '../bits/OverlayMenu';
import PegBoard from '../bits/PegBoard';
import PixelLoader from '../bits/PixelLoader';
import PixelParallax from '../bits/PixelParallax';
import PixelType from '../bits/PixelType';
import PointerKit from '../bits/PointerKit';
import Polaroids from '../bits/Polaroids';
import PressStart from '../bits/PressStart';
import QuestDialog from '../bits/QuestDialog';
import RatingPips from '../bits/RatingPips';
import RetroHorizon from '../bits/RetroHorizon';
import ScoreTicker from '../bits/ScoreTicker';
import Screensaver from '../bits/Screensaver';
import ShadowStack from '../bits/ShadowStack';
import SignalText from '../bits/SignalText';
import Spoiler from '../bits/Spoiler';
import SpriteAnimator from '../bits/SpriteAnimator';
import TextOnPath from '../bits/TextOnPath';
import TradingCard from '../bits/TradingCard';
import VideoHero from '../bits/VideoHero';
import VoxelTiles from '../bits/VoxelTiles';
import WarpField from '../bits/WarpField';
import WobbleCard from '../bits/WobbleCard';

// Emberfall: a made-up pixel RPG. Its world, heroes, guilds and patch notes are invented.

const MENU = [
  { label: 'Trailer', href: '#ef-trailer', meta: '01:42' },
  { label: 'The world', href: '#ef-world', meta: '12 biomes' },
  { label: 'Heroes', href: '#ef-heroes', meta: '4 classes' },
  { label: 'Lore', href: '#ef-lore', meta: '3 chapters' },
  { label: 'Patch notes', href: '#ef-patch', meta: 'v0.9' },
  { label: 'Arcade', href: '#ef-arcade', meta: 'Play' }
];

const HEROES = [
  { name: 'Ash Warden', image: '/pixel/sprite-sword.png', rarity: 'legendary', stats: [{ label: 'ATK', value: 9 }, { label: 'DEF', value: 7 }, { label: 'SPD', value: 4 }], hp: 92, hearts: 5, role: 'Holds the line with a burning blade.' },
  { name: 'Hedge Witch', image: '/pixel/sprite-potion.png', rarity: 'epic', stats: [{ label: 'ATK', value: 6 }, { label: 'DEF', value: 4 }, { label: 'SPD', value: 7 }], hp: 64, hearts: 3.5, role: 'Brews storms in a teacup.' },
  { name: 'Lamplighter', image: '/pixel/sprite-orb.png', rarity: 'rare', stats: [{ label: 'ATK', value: 5 }, { label: 'DEF', value: 5 }, { label: 'SPD', value: 8 }], hp: 71, hearts: 4, role: 'Lights the dark roads, and anything on them.' },
  { name: 'Coin Knight', image: '/pixel/sprite-coin.png', rarity: 'uncommon', stats: [{ label: 'ATK', value: 7 }, { label: 'DEF', value: 8 }, { label: 'SPD', value: 3 }], hp: 85, hearts: 4.5, role: 'Can be bribed, but never twice.' }
];

const BIOMES = [
  ['plains', 'Ember Plains', 'Where every adventure starts, and most of them end.'],
  ['forest', 'Gloamwood', 'The trees remember everyone who passed.'],
  ['desert', 'Saltglass Dunes', 'Hot by day, singing by night.'],
  ['snowy', 'Frostspire', 'The quietest place in the realm. Too quiet.'],
  ['underworld', 'The Undercroft', 'Home of the Hollow Crown.'],
  ['void', 'Drift Isles', 'Islands that float, and sometimes leave.']
];

const INVENTORY = [
  { id: 'blade', name: 'Ember blade', icon: <Sprite name="sword" size={40} />, rarity: 'epic' },
  { id: 'potion', name: 'Red tonic', icon: <Sprite name="potion" size={40} />, count: 5 },
  { id: 'coins', name: 'Crown coins', icon: <Sprite name="coin" size={40} />, count: 48 },
  null,
  { id: 'gem', name: 'Heartstone', icon: <Sprite name="gem" size={40} />, rarity: 'legendary' },
  { id: 'book', name: 'Old map', icon: <Sprite name="book" size={40} /> },
  { id: 'pick', name: 'Pickaxe', icon: <Sprite name="pickaxe" size={40} />, rarity: 'uncommon' },
  null,
  { id: 'chest', name: 'Locked chest', icon: <Sprite name="chest" size={40} /> },
  { id: 'orb', name: 'Lamp orb', icon: <Sprite name="orb" size={40} />, rarity: 'rare' },
  null,
  null
];

const HOTBAR = [
  { id: 'coin', label: 'Coin', icon: <Sprite name="coin" size={30} />, count: 48 },
  { id: 'heart', label: 'Heart', icon: <Sprite name="heart" size={30} />, count: 3 },
  { id: 'gem', label: 'Gem', icon: <Sprite name="gem" size={30} /> },
  { id: 'orb', label: 'Orb', icon: <Sprite name="orb" size={30} /> },
  { id: 'chest', label: 'Chest', icon: <Sprite name="chest" size={30} /> }
];

const INNKEEPER = [
  { speaker: 'Marta, innkeeper', portrait: <Sprite name="bench" size={64} />, text: 'Another traveller! The roads have been dark since the Hollow Crown woke.' },
  { speaker: 'Marta, innkeeper', portrait: <Sprite name="bench" size={64} />, text: 'They say a lamplighter went north and never came back. Will you look for her?', choices: [{ label: 'I’ll find her.', value: 'yes' }, { label: 'What’s in it for me?', value: 'gold' }] },
  { speaker: 'Marta, innkeeper', portrait: <Sprite name="bench" size={64} />, text: 'Then take this lamp. It burns brighter near the ones who are lost.' }
];

const PATCHES = [
  { date: 'Oct 2026', title: 'v0.9: The Undercroft', tag: 'Major', body: 'A whole new biome under the plains, 14 new enemies and the first look at the Hollow Crown.', media: <img src="/pixel/biome-underworld.png" alt="" className="tpl-pixel-img" /> },
  { date: 'Sep 2026', title: 'v0.8: Co-op camps', tag: 'Feature', body: 'Up to four players can share a camp, cook together and split loot fairly (mostly).' },
  { date: 'Aug 2026', title: 'v0.7.2: Balance pass', tag: 'Fix', body: 'The Coin Knight can no longer be bribed with zero coins. Frostspire wolves are 20% less hungry.' },
  { date: 'Jul 2026', title: 'v0.7: Drift Isles', tag: 'Major', body: 'Floating islands, a glider and a very rude seagull.', media: <img src="/pixel/biome-void.png" alt="" className="tpl-pixel-img" /> }
];

const GUILDS = [
  { name: 'Ashen Oath', values: [120, 340, 610, 880, 1240, 1510] },
  { name: 'Lantern Club', values: [200, 380, 560, 920, 1100, 1660] },
  { name: 'Moss & Steel', values: [90, 260, 540, 700, 1010, 1290] },
  { name: 'Night Shift', values: [150, 300, 420, 650, 980, 1180] },
  { name: 'Saltglass Co.', values: [60, 180, 390, 610, 760, 990] }
];

// Narrow screens get a smaller pixel title and a shorter tagline (the scramble can't wrap).
function useNarrow() {
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const query = window.matchMedia('(max-width: 640px)');
    const update = () => setNarrow(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  return narrow;
}

function useVideoUrl() {
  const [url, setUrl] = useState();
  useEffect(() => {
    let live = true;
    pixelVideoUrl().then(value => live && setUrl(value));
    return () => (live = false);
  }, []);
  return url;
}

function Arcade() {
  const [step, setStep] = useState('boot');
  const [run, setRun] = useState(0);
  return (
    <CRTPower height={420} radius={20}>
      <div className="ef-crt">
        {step === 'boot' && (
          <BootSequence
            key={run}
            header={['EMBERFALL BIOS v0.9', 'Ember Engine (c) 2026']}
            lines={[{ text: 'Checking lanterns', status: 'OK' }, { text: 'Loading biomes', count: 12, unit: 'biomes' }, { text: 'Waking the Hollow Crown', status: 'WARN' }, 'All systems go.']}
            onComplete={() => setStep('press')}
            minHeight={380}
          />
        )}
        {step === 'press' && <PressStart text="Press start" startedText="Loading demo…" subtext="© 2026 Emberfall · a Bits Lab template" listenGlobally={false} onStart={() => setTimeout(() => setStep('load'), 600)} />}
        {step === 'load' && (
          <div className="ef-crt-load">
            <PixelLoader label="Loading the demo" tips={['Tip: tonics heal more if you drink them sitting down.', 'Tip: the Coin Knight remembers every bribe.', 'Tip: hold ⇧ to sprint, and to look busy.']} simulateDuration={4500} loop={false} onComplete={() => setStep('done')} width={420} />
          </div>
        )}
        {step === 'done' && (
          <div className="ef-crt-load">
            <p className="ef-pixel">Demo ready!</p>
            <button
              type="button"
              className="ef-btn"
              onClick={() => {
                setRun(r => r + 1);
                setStep('boot');
              }}
            >
              ↺ Boot again
            </button>
          </div>
        )}
      </div>
    </CRTPower>
  );
}

function Loadout() {
  const [items, setItems] = useState(INVENTORY);
  const [slot, setSlot] = useState('coin');
  const anim = Object.fromEntries(Object.entries(SHEET_ANIMATIONS).map(([name, a]) => [name, { row: a.row, frames: a.frames, fps: a.fps }]));
  return (
    <div className="ef-loadout">
      <div>
        <InventoryGrid items={items} onChange={setItems} columns={4} slotSize={64} label="Backpack" />
        <p className="ef-hint">Drag items between slots. Drop matching items to stack them.</p>
      </div>
      <div className="ef-loadout-side">
        <div className="ef-sprite">
          <SpriteAnimator src={demoSpriteSheet()} animations={anim} animation={slot} scale={8} label={`${slot} animation`} />
        </div>
        <HotbarDock
          items={HOTBAR}
          value={slot}
          onChange={id => {
            setSlot(id);
            playChip('select');
          }}
          label="Hotbar"
        />
        <p className="ef-hint">Press 1–5 or scroll over the hotbar.</p>
      </div>
    </div>
  );
}

function Leaderboard() {
  const [score, setScore] = useState(12400);
  const [rating, setRating] = useState(0);
  const [over, setOver] = useState(0);
  return (
    <div className="ef-leader">
      <BarRace title="Guild renown" subtitle="Season 3, week by week" series={GUILDS} steps={['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6']} loop width={620} />
      <div className="ef-leader-side">
        <ScoreTicker value={score} highScore={48200} combo={score > 14000 ? 2 : 1} />
        <button
          type="button"
          className="ef-btn"
          onClick={() => {
            setScore(s => s + 600);
            playChip('coin');
          }}
        >
          + Defeat a slime
        </button>
        <div className="ef-rate">
          <p className="ef-hint">Rate the demo</p>
          <RatingPips value={rating} onChange={value => (setRating(value), value === 5 && achievement({ title: 'Kind words', description: 'Gave the demo five hearts.', xp: 25, tier: 'gold' }))} label="Rate the demo" />
        </div>
      </div>
      <div className="ef-gameover">
        <GameOver
          key={over}
          title="YOU FELL"
          subtitle="The Undercroft claims another hero."
          stats={[
            { label: 'Slimes', value: 42 },
            { label: 'Coins', value: 318 },
            { label: 'Steps', value: 9120 }
          ]}
          onContinue={() => setOver(n => n + 1)}
          onQuit={() => setOver(n => n + 1)}
          onTimeout={() => setOver(n => n + 1)}
          minHeight={380}
        />
      </div>
    </div>
  );
}

function Lore() {
  const article = useRef(null);
  return (
    <section className="tpl-section ef-lore" id="ef-lore">
      <div className="tpl-bg">
        <LightShafts mode="rays" count={6} colors={['#ffcd75', '#ef7d57']} />
      </div>
      <div className="tpl-wrap ef-lore-wrap">
        <div className="ef-lore-ring" aria-hidden="true">
          <TextOnPath text="THE HOLLOW CROWN · THE HOLLOW CROWN · " path="circle" fontSize={26} speed={18} label="The Hollow Crown" />
        </div>
        <div className="ef-chapters">
          <ChapterProgress target={article} selector="h3" offset={24} label="Lore chapters" />
        </div>
        <article ref={article} className="ef-article">
          <h2 className="ef-h2">The lore</h2>
          <h3>I. The lamps go out</h3>
          <p>For three hundred years the lamplighters kept the roads of Emberfall bright. Then, on the longest night, every lamp in the realm went out at once, and something under the plains opened its eyes.</p>
          <p>Nobody saw the Hollow Crown rise. They only noticed that the dark had started to listen.</p>
          <h3>II. The guilds</h3>
          <p>The old kingdoms fell first. What was left gathered into guilds: the Ashen Oath, who fight; the Lantern Club, who search; and the merchants of Saltglass, who sell to both.</p>
          <p>Each guild keeps one ember from the last lamp. Together, people say, they could light it again.</p>
          <h3>III. The last lamp</h3>
          <p>You arrive at the Lantern Inn with nothing but a borrowed sword and a rumour. How it ends is up to you, unless you want to know now.</p>
          <div>
            <Spoiler label="Spoiler: the ending">The lamplighter you are looking for is the Hollow Crown. She put the lamps out to keep something worse asleep.</Spoiler>
          </div>
        </article>
      </div>
    </section>
  );
}

export default function GameTemplate() {
  const video = useVideoUrl();
  const narrow = useNarrow();
  const [hero, setHero] = useState(0);
  const [boost, setBoost] = useState(false);
  const pick = HEROES[hero];

  useEffect(() => {
    const t = setTimeout(() => achievement({ title: 'Welcome, traveller', description: 'Found the Emberfall page.', xp: 10, icon: <Sprite name="star" size={28} />, tier: 'bronze' }), 2500);
    return () => clearTimeout(t);
  }, []);

  return (
    <ChiptuneProvider defaultMuted>
      <PointerKit mode={['sparks']} color="#ffcd75" className="tpl ef">
        <header className="ef-top">
          <a href="#ef-top" className="ef-logo">
            <Sprite name="sword" size={28} />
            EMBERFALL
          </a>
          <div className="ef-top-actions">
            <MuteToggle />
            <OverlayMenu items={MENU} label="Game menu" footer={<p className="ef-hint">Out now in early access · PC · Mac · Deck</p>} />
          </div>
        </header>

        <GrainFX effects={['grain']} amount={0.12} className="ef-hero-grain">
          <section className="ef-hero" id="ef-top">
            <div className="tpl-bg">
              <RetroHorizon horizon={0.66} skyBottom="#5d275d" sunTop="#ef7d57" sunBottom="#7a2338" />
            </div>
            <div className="ef-hero-inner">
              <PixelType key={narrow ? 's' : 'l'} text="EMBERFALL" effect="assemble" pixelSize={narrow ? 3 : 7} trigger="mount" colors={['#f4f4f4', '#ffcd75', '#ffcd75']} className="ef-title" />
              <ShadowStack text="The Hollow Crown" as="h1" mode="extrude" depth={8} fontSize={40} colors={['#b13e53', '#5d275d']} className="ef-sub" />
              <SignalText key={narrow ? 's' : 'l'} text={narrow ? 'Relight the last lamp.' : 'Relight the last lamp. Or burn the world trying.'} mode="scramble" charset="blocks" trigger="mount" className="ef-tagline" />
              <div className="ef-hero-actions">
                <a href="#ef-trailer" className="ef-btn big">
                  ► Watch trailer
                </a>
                <button type="button" className="ef-btn big ghost" onClick={() => achievement({ title: 'Wishlisted!', description: 'Template demo: nothing was saved.', xp: 50, tier: 'diamond', icon: <Sprite name="heart" size={28} /> })}>
                  ♥ Wishlist
                </button>
              </div>
            </div>
          </section>
        </GrainFX>

        <MarqueeLine items={['Early access out now', 'v0.9: The Undercroft is live', 'Co-op camps for up to 4 players', 'Season 3 leaderboard resets Friday', 'New hero: the Lamplighter']} label="News" separator="✦" />

        <section className="tpl-section" id="ef-trailer">
          <div className="tpl-wrap ef-trailer">
            <div>
              <h2 className="ef-h2">Insert coin</h2>
              <p className="ef-body">Boot the demo cabinet, or watch the trailer. Both are made of pixels and good intentions.</p>
              <Arcade />
            </div>
            <VideoHero src={video} poster="/pixel/biome-night.png" title="Emberfall: launch trailer" meta="1:42 · made in pixels" width={520} />
          </div>
        </section>

        <section className="ef-parallax" id="ef-world">
          <PixelParallax layers={demoParallaxLayers()} dayNight cycleDuration={30} height={420} label="Emberfall at dawn, day and night">
            <div className="ef-parallax-text">
              <h2 className="ef-h2">A world that keeps time</h2>
              <p>Day turns to night every 30 minutes. Some things only come out after dark.</p>
            </div>
          </PixelParallax>
        </section>

        <section className="tpl-section">
          <div className="tpl-wrap ef-world">
            <div>
              <h2 className="ef-h2">Every island is new</h2>
              <p className="ef-body">Each run grows a fresh island. Click a tile to see what lives there.</p>
              <VoxelTiles size={12} seed={7} onTileSelect={tile => achievement({ title: `Scouted the ${tile.biome}`, description: `Height ${tile.h}`, xp: 5, tier: 'silver', duration: 2500 })} label="Generated island" />
            </div>
            <div>
              <h2 className="ef-h2">12,400 players online</h2>
              <p className="ef-body">Realms in every timezone, so someone is always awake to help.</p>
              <DotGlobe size={420} label="Players around the world" />
            </div>
          </div>
        </section>

        <HorizontalTrack itemWidth={420} header={<h2 className="ef-h2 ef-track-head">Twelve biomes, six shown</h2>} label="Biomes">
          {BIOMES.map(([id, name, line]) => (
            <figure key={id} className="ef-biome">
              <img src={`/pixel/biome-${id}.png`} alt="" className="tpl-pixel-img" />
              <figcaption>
                <strong>{name}</strong>
                <span>{line}</span>
              </figcaption>
            </figure>
          ))}
        </HorizontalTrack>

        <section className="tpl-section ef-heroes" id="ef-heroes">
          <div className="tpl-bg">
            <DitherField pattern="noise" palette={['#1a1c2c', '#2a0d14', '#5d275d']} pointer={false} />
          </div>
          <div className="tpl-wrap">
            <h2 className="ef-h2">Choose your hero</h2>
            <Coverflow index={hero} onChange={setHero} itemWidth={250} height={400} label="Heroes">
              {HEROES.map(h => (
                <TradingCard key={h.name} name={h.name} image={h.image} rarity={h.rarity} stats={h.stats} back={<p className="ef-card-back">{h.role}</p>} />
              ))}
            </Coverflow>
            <div className="ef-hero-stats">
              <div>
                <p className="ef-pixel">{pick.name}</p>
                <p className="ef-hint">{pick.role}</p>
              </div>
              <HealthBar value={pick.hp} label="HP" />
              <RatingPips value={pick.hearts} readOnly label={`${pick.name} difficulty`} />
            </div>
          </div>
        </section>

        <section className="tpl-section">
          <div className="tpl-wrap ef-factions">
            <div>
              <h2 className="ef-h2">The guilds</h2>
              <div className="ef-guilds">
                {[
                  ['Ashen Oath', 'sword', 'Fighters who swore to hold the plains.', 'The Oath meets at dawn on the old battlefield. New members bring a blade, and leave their name.'],
                  ['Lantern Club', 'orb', 'Searchers who map the dark.', 'Every member carries a lamp that burns blue near danger. Their maps are the only ones that are right.'],
                  ['Saltglass Co.', 'coin', 'Merchants who sell to everyone.', 'Prices change with the weather, the moon and how much they like you.']
                ].map(([name, sprite, short, long]) => (
                  <MorphDialog
                    key={name}
                    title={name}
                    media={<img src={`/pixel/sprite-${sprite}.png`} alt="" className="tpl-pixel-img ef-guild-img" />}
                    card={
                      <div className="ef-guild-card">
                        <strong>{name}</strong>
                        <span>{short}</span>
                      </div>
                    }
                    cardMediaHeight={120}
                  >
                    <p>{long}</p>
                  </MorphDialog>
                ))}
              </div>
            </div>
            <div className="ef-fate">
              <h2 className="ef-h2">Draw a fate</h2>
              <p className="ef-body">Swipe away the top card to see what the night holds.</p>
              <CardDeck width={240} height={320} label="Fate cards">
                {[
                  ['star', 'The Star', 'Your next chest is full.'],
                  ['heart', 'The Hearth', 'Rest heals twice as much tonight.'],
                  ['potion', 'The Brew', 'Tonics are half price at Saltglass.'],
                  ['book', 'The Map', 'A hidden road appears near you.'],
                  ['chest', 'The Mimic', 'Do not open the next chest.']
                ].map(([sprite, title, line]) => (
                  <div key={title} className="ef-fate-card">
                    <Sprite name={sprite} size={72} />
                    <strong>{title}</strong>
                    <span>{line}</span>
                  </div>
                ))}
              </CardDeck>
            </div>
          </div>
        </section>

        <section className="tpl-section ef-dark">
          <div className="tpl-wrap">
            <h2 className="ef-h2">Pack for the road</h2>
            <Loadout />
          </div>
        </section>

        <section className="tpl-section">
          <div className="tpl-wrap ef-inn">
            <h2 className="ef-h2">Meet the innkeeper</h2>
            <QuestDialog lines={INNKEEPER} onChoice={value => achievement(value === 'yes' ? { title: 'Quest accepted', description: 'Find the lamplighter.', xp: 100, tier: 'gold' } : { title: 'Haggler', description: 'Asked about the reward first.', xp: 20, tier: 'silver' })} />
          </div>
        </section>

        <Lore />

        <section className="tpl-section">
          <div className="tpl-wrap">
            <h2 className="ef-h2">Screenshots</h2>
            <LightboxGallery images={['plains', 'forest', 'desert', 'snowy', 'jungle', 'mesa', 'cave', 'cherry'].map(id => ({ src: `/pixel/biome-${id}.png`, alt: `The ${id} biome`, caption: `In-game: ${id}` }))} thumbSize={180} imageStyle={{ imageRendering: 'pixelated' }} label="Screenshots" />
            <h2 className="ef-h2 ef-gap">What you’ll do</h2>
            <FocusGrid minWidth={240} label="Features">
              {[
                ['sword', 'Fight', 'Fast, crunchy combat with parries and dodges.'],
                ['pickaxe', 'Dig', 'Every wall can come down, if you are patient.'],
                ['potion', 'Brew', '80 recipes, some of them safe.'],
                ['bench', 'Camp', 'Cook, rest and swap stories with friends.']
              ].map(([sprite, title, line]) => (
                <DirectionHover key={title} overlay={<p className="ef-overlay">{line}</p>}>
                  <div className="ef-feature">
                    <Sprite name={sprite} size={64} />
                    <strong>{title}</strong>
                  </div>
                </DirectionHover>
              ))}
            </FocusGrid>
            <h2 className="ef-h2 ef-gap">Photo mode</h2>
            <Polaroids photos={['night', 'ocean', 'jungle', 'cherry', 'mesa'].map(id => ({ src: `/pixel/biome-${id}.png`, alt: '', caption: id }))} height={420} label="Photo mode shots" />
          </div>
        </section>

        <section className="tpl-section ef-dark" id="ef-patch">
          <div className="tpl-wrap">
            <h2 className="ef-h2">Patch notes</h2>
            <ChangelogTimeline entries={PATCHES} width={820} label="Patch notes" />
          </div>
        </section>

        <section className="tpl-section">
          <div className="tpl-wrap">
            <h2 className="ef-h2">Leaderboard</h2>
            <Leaderboard />
          </div>
        </section>

        <section className="tpl-section ef-arcade" id="ef-arcade">
          <div className="tpl-wrap">
            <h2 className="ef-h2">Arcade corner</h2>
            <p className="ef-body">Small toys from the game, for when you should be working.</p>
            <div className="ef-arcade-grid">
              <div className="ef-tile">
                <p className="ef-pixel">Soundboard</p>
                <ChiptuneKit columns={3} />
              </div>
              <div className="ef-tile">
                <p className="ef-pixel">Harp of the inn</p>
                <ElasticString strings={5} height={200} colors={['#ffcd75', '#ef7d57', '#b13e53', '#73eff7', '#a7f070']} onPluck={() => playChip('blip')} />
              </div>
              <div className="ef-tile ef-tile-dark">
                <p className="ef-pixel">Hyperdrive</p>
                <div className="ef-warp" onPointerDown={() => setBoost(true)} onPointerUp={() => setBoost(false)}>
                  <WarpField holdToBoost colors={['#f4f4f4', '#ffcd75', '#ef7d57']} />
                  <span className="ef-warp-hint">{boost ? 'Boosting!' : 'Hold to boost'}</span>
                </div>
              </div>
              <div className="ef-tile ef-tile-dark">
                <p className="ef-pixel">Idle screen</p>
                <Screensaver logo="EMBERFALL" height={200} />
              </div>
              <div className="ef-tile ef-tile-dark">
                <p className="ef-pixel">Peg board</p>
                <div className="ef-peg">
                  <PegBoard imprint="EMBER" pegSize={8} />
                </div>
              </div>
              <WobbleCard className="ef-wobble" width={320}>
                <p className="ef-pixel">Jelly card</p>
                <p className="ef-hint">Poke it. It wobbles. That’s the whole game.</p>
              </WobbleCard>
              <div className="ef-tile">
                <p className="ef-pixel">Danger zone</p>
                <p className="ef-hint">Hold to delete your save file (it’s pretend).</p>
                <HoldToConfirm doneLabel="Save deleted" onConfirm={() => achievement({ title: 'Fresh start', description: 'Deleted a save file. Bold.', xp: 1, tier: 'bronze' })}>
                  Hold to delete save
                </HoldToConfirm>
              </div>
            </div>
          </div>
        </section>

        <footer className="ef-footer">
          <div className="tpl-bg">
            <MeteorShower rate={3} />
          </div>
          <div className="tpl-wrap ef-footer-inner">
            <p className="ef-logo">
              <Sprite name="sword" size={28} />
              EMBERFALL
            </p>
            <p>A Bits Lab template. Emberfall, its guilds and its players are made up.</p>
          </div>
        </footer>

        <AchievementToaster position="bottom-right" />
      </PointerKit>
    </ChiptuneProvider>
  );
}
