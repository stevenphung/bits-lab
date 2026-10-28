import { useEffect, useState } from 'react';
import SignalText from './bits/SignalText';
import InkText from './bits/InkText';
import PixelType from './bits/PixelType';
import ProximityType from './bits/ProximityType';
import ShadowStack from './bits/ShadowStack';
import MarqueeLine from './bits/MarqueeLine';
import signalTextSource from './bits/SignalText.jsx?raw';
import inkTextSource from './bits/InkText.jsx?raw';
import pixelTypeSource from './bits/PixelType.jsx?raw';
import proximityTypeSource from './bits/ProximityType.jsx?raw';
import shadowStackSource from './bits/ShadowStack.jsx?raw';
import marqueeLineSource from './bits/MarqueeLine.jsx?raw';
import PointerKit from './bits/PointerKit';
import Footprints from './bits/Footprints';
import EdgeFX from './bits/EdgeFX';
import Reveal from './bits/Reveal';
import Marquee from './bits/Marquee';
import GrainFX from './bits/GrainFX';
import pointerKitSource from './bits/PointerKit.jsx?raw';
import footprintsSource from './bits/Footprints.jsx?raw';
import edgeFXSource from './bits/EdgeFX.jsx?raw';
import revealSource from './bits/Reveal.jsx?raw';
import marqueeSource from './bits/Marquee.jsx?raw';
import grainFXSource from './bits/GrainFX.jsx?raw';
import AuroraBands from './bits/AuroraBands';
import WarpField from './bits/WarpField';
import LightShafts from './bits/LightShafts';
import LavaLamp from './bits/LavaLamp';
import CodeRain from './bits/CodeRain';
import DitherField from './bits/DitherField';
import ContourLines from './bits/ContourLines';
import ScanScope from './bits/ScanScope';
import auroraBandsSource from './bits/AuroraBands.jsx?raw';
import warpFieldSource from './bits/WarpField.jsx?raw';
import lightShaftsSource from './bits/LightShafts.jsx?raw';
import lavaLampSource from './bits/LavaLamp.jsx?raw';
import codeRainSource from './bits/CodeRain.jsx?raw';
import ditherFieldSource from './bits/DitherField.jsx?raw';
import contourLinesSource from './bits/ContourLines.jsx?raw';
import scanScopeSource from './bits/ScanScope.jsx?raw';
import CardDeck from './bits/CardDeck';
import Coverflow from './bits/Coverflow';
import MasonryWall from './bits/MasonryWall';
import FeedList from './bits/FeedList';
import HotbarDock from './bits/HotbarDock';
import OverlayMenu from './bits/OverlayMenu';
import TradingCard from './bits/TradingCard';
import GlassPanel from './bits/GlassPanel';
import WheelPicker from './bits/WheelPicker';
import cardDeckSource from './bits/CardDeck.jsx?raw';
import coverflowSource from './bits/Coverflow.jsx?raw';
import masonryWallSource from './bits/MasonryWall.jsx?raw';
import feedListSource from './bits/FeedList.jsx?raw';
import hotbarDockSource from './bits/HotbarDock.jsx?raw';
import overlayMenuSource from './bits/OverlayMenu.jsx?raw';
import tradingCardSource from './bits/TradingCard.jsx?raw';
import glassPanelSource from './bits/GlassPanel.jsx?raw';
import wheelPickerSource from './bits/WheelPicker.jsx?raw';
import HoldToConfirm from './bits/HoldToConfirm';
import SwipeActions from './bits/SwipeActions';
import Discard from './bits/Discard';
import RatingPips from './bits/RatingPips';
import ScrubNumber from './bits/ScrubNumber';
import PixelSpinners from './bits/PixelSpinners';
import ArcadeButtons from './bits/ArcadeButtons';
import holdToConfirmSource from './bits/HoldToConfirm.jsx?raw';
import swipeActionsSource from './bits/SwipeActions.jsx?raw';
import discardSource from './bits/Discard.jsx?raw';
import ratingPipsSource from './bits/RatingPips.jsx?raw';
import scrubNumberSource from './bits/ScrubNumber.jsx?raw';
import pixelSpinnersSource from './bits/PixelSpinners.jsx?raw';
import arcadeButtonsSource from './bits/ArcadeButtons.jsx?raw';

const slider = (name, label, min, max, step) => ({ name, type: 'slider', label, min, max, step });
const color = (name, label) => ({ name, type: 'color', label });
const toggle = (name, label) => ({ name, type: 'switch', label });
const select = (name, label, options) => ({ name, type: 'select', label, options });
const text = (name, label) => ({ name, type: 'text', label });

const PIXEL_FONT = '"Pixelify Sans", system-ui, sans-serif';
const TITLE_FONT = '"Press Start 2P", ui-monospace, monospace';
const FLEX_FONT = '"Roboto Flex", system-ui, sans-serif';
const stack = { display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 22, justifyItems: 'center', width: '100%', padding: '40px 16px', boxSizing: 'border-box', textAlign: 'center' };
const hint = { margin: 0, color: '#94b0c2', font: `14px/1.4 ${PIXEL_FONT}` };
const sprite = (name, size = 24) => <img src={`/pixel/sprite-${name}.png`} alt="" width={size} height={size} style={{ imageRendering: 'pixelated', display: 'block' }} />;

// ---------- SignalText ----------

const SIGNAL_LINES = { scramble: 'Decrypting save file', flap: 'Gate 4  Now boarding', glitch: 'Signal lost' };

function SignalDemo(props) {
  const line = props.text || SIGNAL_LINES[props.mode];
  return (
    <div style={stack}>
      <SignalText key={`${props.mode}-${props.trigger}-${props.charset}`} {...props} text={line} as="h2" style={{ font: `clamp(18px, 3.4vw, 34px)/1.4 ${TITLE_FONT}`, maxWidth: 780 }} />
      <p style={hint}>{props.trigger === 'hover' ? 'Hover the line to run it again.' : props.trigger === 'loop' ? 'It repeats on its own.' : 'Change the mode to replay it.'}</p>
    </div>
  );
}

// ---------- InkText ----------

function InkDemo(props) {
  return (
    <div style={stack}>
      <InkText {...props} as="h2" image="/pixel/biome-cherry.png" style={{ font: `clamp(30px, 7vw, 76px)/1.1 ${TITLE_FONT}`, margin: 0 }}>
        {props.fill === 'outline' ? 'HOVER ME' : 'INSERT COIN'}
      </InkText>
      <p style={{ ...hint, maxWidth: 560 }}>
        Fills are plain text you can select. In a sentence it works too: you found the <InkText fill={props.fill} colors={props.colors} stepped={props.stepped} speed={props.speed} image="/pixel/biome-cherry.png" style={{ fontWeight: 700 }}>legendary sword</InkText>.
      </p>
    </div>
  );
}

// ---------- PixelType ----------

function PixelTypeDemo(props) {
  return (
    <div style={{ ...stack, maxWidth: 900, margin: '0 auto' }}>
      <PixelType key={`${props.text}-${props.effect}-${props.pixelSize}-${props.rows}`} {...props} />
      <p style={hint}>{props.effect === 'crumble' ? 'The word holds, crumbles, and builds itself again.' : 'Move the pointer through the blocks to scatter them.'}</p>
    </div>
  );
}

// ---------- ProximityType ----------

function ProximityDemo({ pixelFont, ...props }) {
  return (
    <div style={{ ...stack, maxWidth: 900, margin: '0 auto' }}>
      <ProximityType {...props} as="h2" text={props.text} fontFamily={pixelFont ? PIXEL_FONT : FLEX_FONT} minWeight={pixelFont ? 400 : props.minWeight} maxWeight={pixelFont ? 700 : props.maxWeight} />
      <p style={hint}>Move the pointer along the line. On a phone, drag across it.</p>
    </div>
  );
}

// ---------- ShadowStack ----------

function StackDemo(props) {
  return (
    <div style={{ ...stack, padding: '56px 16px' }}>
      <ShadowStack key={props.mode} {...props} text={props.text} style={{ margin: 0 }} />
      <p style={hint}>{props.follow ? 'Move the pointer around: the depth falls away from it. Press the title to squash it.' : 'Press the title to squash it like a key.'}</p>
    </div>
  );
}

// ---------- MarqueeLine ----------

const NEWS = [
  <>{sprite('star', 18)} Season 3 is live</>,
  <>{sprite('gem', 18)} Double gems this weekend</>,
  <>{sprite('chest', 18)} New biome: Cherry Grove</>,
  <>{sprite('heart', 18)} 1,000,000 players!</>,
  <>{sprite('sword', 18)} Patch 3.1.2 notes</>
];

function MarqueeDemo(props) {
  return (
    <div style={{ ...stack, gap: 16, justifyItems: 'stretch', maxWidth: 980, margin: '0 auto' }}>
      <MarqueeLine {...props} items={NEWS} fontFamily={PIXEL_FONT} style={{ borderRadius: 12 }} />
      <MarqueeLine {...props} items={['FAST', 'PIXEL', 'FUN', 'FREE']} direction={props.direction === 'left' ? 'right' : 'left'} separator="★" fontFamily={TITLE_FONT} fontSize={props.fontSize * 1.2} backgroundColor="#b13e53" accentColor="#ffcd75" showPause={false} style={{ borderRadius: 12 }} />
      <p style={hint}>Scroll the page: the lines surge, lean and reverse with you. Drag one to scrub it.</p>
    </div>
  );
}

// ---------- Phase 2 helpers ----------

const panel = { width: '100%', boxSizing: 'border-box', borderRadius: 16, background: '#1a1c2c', boxShadow: 'inset 0 0 0 2px #333c57' };
const pixelBtn = { padding: '10px 16px', border: 0, borderRadius: 8, background: '#333c57', color: '#f4f4f4', font: `15px ${PIXEL_FONT}`, cursor: 'pointer' };
const BIOMES = ['plains', 'forest', 'desert', 'snowy', 'cherry', 'ocean', 'cave', 'mesa'];
const card = (title, body, biome) => (
  <div style={{ display: 'grid', gap: 10, padding: 18, color: '#f4f4f4', font: `15px/1.45 ${PIXEL_FONT}`, textAlign: 'left' }}>
    {biome && <img src={`/pixel/biome-${biome}.png`} alt="" style={{ width: '100%', aspectRatio: '16 / 9', objectFit: 'cover', borderRadius: 8, imageRendering: 'pixelated' }} />}
    <strong style={{ font: `12px ${TITLE_FONT}`, color: '#ffcd75' }}>{title}</strong>
    <span style={{ color: '#94b0c2' }}>{body}</span>
  </div>
);

// ---------- PointerKit ----------

function PointerDemo({ modes, ...props }) {
  return (
    <div style={{ ...stack, maxWidth: 820, margin: '0 auto' }}>
      <PointerKit key={modes} {...props} mode={modes.split('+')} style={{ ...panel, height: 360, display: 'grid', placeItems: 'center', alignContent: 'center', gap: 16 }}>
        <span style={{ font: `14px ${TITLE_FONT}`, color: '#f4f4f4' }}>MOVE · CLICK · HOVER</span>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center' }}>
          <button type="button" style={pixelBtn}>New game</button>
          <button type="button" style={pixelBtn}>Continue</button>
          <a href="#options" onClick={e => e.preventDefault()} style={{ ...pixelBtn, textDecoration: 'none' }}>Options</a>
        </div>
      </PointerKit>
      <p style={hint}>Combine looks with the Modes picker. Target snaps brackets onto the buttons.</p>
    </div>
  );
}

// ---------- Footprints ----------

function FootprintsDemo({ useSprites, ...props }) {
  return (
    <div style={{ ...stack, maxWidth: 820, margin: '0 auto' }}>
      <Footprints key={String(useSprites)} {...props} stamps={useSprites ? ['/pixel/sprite-coin.png', '/pixel/sprite-gem.png', '/pixel/sprite-star.png'] : 'feet'} style={{ ...panel, height: 380, background: '#38b764', backgroundImage: 'url(/pixel/biome-plains.png)', backgroundSize: 'cover', imageRendering: 'pixelated' }}>
        <span style={{ position: 'absolute', left: 16, top: 14, font: `11px ${TITLE_FONT}`, color: '#1a1c2c', background: '#ffcd75', padding: '6px 8px' }}>WALK ACROSS THE PLAINS</span>
      </Footprints>
      <p style={hint}>{useSprites ? 'Loot stamps cycle as you move.' : 'Footprints alternate left and right and turn to follow you.'}</p>
    </div>
  );
}

// ---------- EdgeFX ----------

function EdgeDemo(props) {
  return (
    <div style={{ ...stack, maxWidth: 900, margin: '0 auto' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20, width: '100%' }}>
        {[['Forest temple', 'A quiet ruin full of moss.', 'forest'], ['Desert vault', 'Sand-sealed for a thousand years.', 'desert'], ['Snow keep', 'Bring a warm coat.', 'snowy']].map(([t, b, bio]) => (
          <EdgeFX key={t} {...props}>
            {card(t, b, bio)}
          </EdgeFX>
        ))}
      </div>
      <p style={hint}>{props.mode === 'glow' ? 'Move the pointer near the cards: the closest edge lights up.' : props.active === 'hover' ? 'Hover a card to light its edge.' : 'Edges run on their own.'}</p>
    </div>
  );
}

// ---------- Reveal ----------

function RevealDemo({ replay, ...props }) {
  return (
    <div style={{ ...stack, maxWidth: 820, margin: '0 auto' }}>
      <Reveal key={`${props.effect}-${props.cascade}-${replay}`} {...props} coverColor="#0b0b14" style={{ ...panel, padding: 22, display: 'grid', gap: 14 }}>
        {props.cascade
          ? ['Chapter 1: The first torch', 'Chapter 2: Into the caves', 'Chapter 3: The gem of light'].map(t => <div key={t} style={{ padding: 14, borderRadius: 10, background: '#262b44', color: '#f4f4f4', font: `16px ${PIXEL_FONT}`, textAlign: 'left' }}>{t}</div>)
          : card('Cherry Grove', 'Pink canopies, calm rivers and the best sunsets in the world.', 'cherry')}
      </Reveal>
      <p style={hint}>Change the effect (or toggle Replay) to watch it again.</p>
    </div>
  );
}

// ---------- Marquee ----------

const WALL = BIOMES.map(b => (
  <div key={b} style={{ width: 180, borderRadius: 12, overflow: 'hidden', background: '#262b44', boxShadow: '0 0 0 2px #333c57' }}>
    <img src={`/pixel/biome-${b}.png`} alt="" style={{ display: 'block', width: '100%', aspectRatio: '16 / 10', objectFit: 'cover', imageRendering: 'pixelated' }} />
    <div style={{ padding: '8px 10px', color: '#f4f4f4', font: `14px ${PIXEL_FONT}`, textTransform: 'capitalize' }}>{b}</div>
  </div>
));

function MarqueeDemo2(props) {
  return (
    <div style={{ ...stack, maxWidth: 980, margin: '0 auto', justifyItems: 'stretch' }}>
      <Marquee key={`${props.vertical}-${props.lanes}`} {...props} items={WALL} label="Biomes" />
      <p style={hint}>Hover a card: its lane slows and the card steps forward.</p>
    </div>
  );
}

// ---------- GrainFX ----------

function GrainDemo({ grain, dither, halftone, scanlines, blurEdge: edge, ...props }) {
  const effects = [grain && 'grain', dither && 'dither', halftone && 'halftone', scanlines && 'scanlines', edge !== 'off' && 'blur'].filter(Boolean);
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <img src="/pixel/biome-cherry.png" alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', imageRendering: 'pixelated' }} />
      <GrainFX {...props} effects={effects} blurEdge={edge === 'off' ? 'bottom' : edge} />
      <div style={{ position: 'absolute', left: 24, bottom: 24, color: '#f4f4f4', font: `18px ${TITLE_FONT}`, textShadow: '0 2px 0 #1a1c2c' }}>CHERRY GROVE</div>
    </div>
  );
}

// ---------- Phase 3: backgrounds ----------

// A background with a title laid over it; the overlay never takes the pointer.
const Scene = ({ children, title, sub }) => (
  <div style={{ position: 'relative', width: '100%', height: '100%' }}>
    {children}
    {title && (
      <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', alignContent: 'center', gap: 10, padding: 16, pointerEvents: 'none', textAlign: 'center', color: '#f4f4f4', textShadow: '0 2px 0 #0b0b14' }}>
        <span style={{ font: `clamp(16px, 3vw, 26px)/1.4 ${TITLE_FONT}` }}>{title}</span>
        {sub && <span style={{ font: `15px ${PIXEL_FONT}`, color: '#94b0c2' }}>{sub}</span>}
      </div>
    )}
  </div>
);

const bg = (Component, title, sub) => props => (
  <Scene title={title} sub={sub}>
    <Component {...props} />
  </Scene>
);



// ---------- Phase 4: UI components ----------

const biomeCard = (b, i) => (
  <div key={b} style={{ display: 'grid', gridTemplateRows: '1fr auto', height: '100%', background: '#262b44', borderRadius: 'inherit', overflow: 'hidden' }}>
    <img src={`/pixel/biome-${b}.png`} alt="" draggable={false} style={{ width: '100%', height: '100%', objectFit: 'cover', imageRendering: 'pixelated' }} />
    <div style={{ padding: '10px 14px', color: '#f4f4f4', font: `16px ${PIXEL_FONT}`, textTransform: 'capitalize', textAlign: 'left' }}>
      {b} <span style={{ color: '#94b0c2', fontSize: 13 }}>· level {i + 1}</span>
    </div>
  </div>
);

function DeckDemo(props) {
  return (
    <div style={stack}>
      <CardDeck {...props} label="Biomes">
        {BIOMES.slice(0, 6).map(biomeCard)}
      </CardDeck>
      <p style={hint}>Drag the top card off the pile, or use the arrows.</p>
    </div>
  );
}

function CoverDemo(props) {
  return (
    <div style={{ ...stack, maxWidth: 1000, margin: '0 auto' }}>
      <Coverflow {...props} defaultIndex={3} label="Biomes">
        {BIOMES.map((b, i) => (
          <div key={b} style={{ aspectRatio: '3 / 4', borderRadius: 14, overflow: 'hidden', boxShadow: '0 0 0 2px #333c57' }}>
            {biomeCard(b, i)}
          </div>
        ))}
      </Coverflow>
      <p style={hint}>Drag, scroll sideways, click a side item, or focus it and use the arrow keys.</p>
    </div>
  );
}

const NOTES = [
  ['Torch', 'Lights a radius of 14 blocks.', 'star', 60],
  ['Ender gem', 'Teleports you a short way when thrown. Handle with care: it hums.', 'gem', 120],
  ['Old map', 'Shows the nearest village.', 'book', 40],
  ['Healing potion', 'Restores four hearts over five seconds. Tastes of cherries.', 'potion', 100],
  ['Iron sword', 'Reliable.', 'sword', 20],
  ['Treasure chest', 'Found under the desert well. Contents: mostly sand, one emerald.', 'chest', 140],
  ['Lucky coin', 'Lands on heads more often than it should.', 'coin', 60],
  ['Heart crystal', 'Adds a heart container.', 'heart', 80]
];

function MasonryDemo({ shuffle, ...props }) {
  const [order, setOrder] = useState(NOTES.map((_, i) => i));
  const [extra, setExtra] = useState(0);
  return (
    <div style={{ ...stack, maxWidth: 1000, margin: '0 auto', justifyItems: 'stretch' }}>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
        <button type="button" style={pixelBtn} onClick={() => setOrder(o => [...o].sort(() => Math.random() - 0.5))}>Shuffle</button>
        <button type="button" style={pixelBtn} onClick={() => setExtra(e => e + 1)}>Add a note</button>
        <button type="button" style={pixelBtn} onClick={() => setExtra(e => Math.max(0, e - 1))}>Remove one</button>
      </div>
      <MasonryWall {...props}>
        {[...order.map(i => ({ i, k: `n${i}` })), ...Array.from({ length: extra }, (_, j) => ({ i: j % NOTES.length, k: `x${j}` }))].map(({ i, k }) => {
          const [title, body, icon, pad] = NOTES[i];
          return (
            <div key={k} style={{ display: 'grid', gap: 8, padding: 16, paddingBottom: 16 + pad / 4, borderRadius: 12, background: '#262b44', boxShadow: 'inset 0 0 0 2px #333c57', color: '#f4f4f4', font: `15px/1.45 ${PIXEL_FONT}`, textAlign: 'left' }}>
              {sprite(icon, 28)}
              <strong style={{ font: `11px ${TITLE_FONT}`, color: '#ffcd75' }}>{title}</strong>
              <span style={{ color: '#94b0c2' }}>{body}</span>
            </div>
          );
        })}
      </MasonryWall>
    </div>
  );
}

const EVENTS = [
  { title: 'Pip found a diamond', body: 'Deep caves, layer 11', icon: sprite('gem', 18), tone: '#73eff7' },
  { title: 'Night is falling', body: 'Mobs spawn in 30 s', icon: sprite('star', 18), tone: '#ffcd75' },
  { title: 'Ada joined the world', icon: sprite('heart', 18), tone: '#ef7d57' },
  { title: 'Quest complete: Build a shelter', body: '+100 XP', icon: sprite('book', 18), tone: '#a7f070' },
  { title: 'Chest unlocked', body: '3 coins, 1 potion', icon: sprite('chest', 18), tone: '#ffcd75' }
];

function FeedDemo({ live, selectable, ...props }) {
  const [items, setItems] = useState(() => EVENTS.slice(0, 3).map((e, i) => ({ ...e, id: `e${i}`, time: Date.now() - (i + 1) * 7 * 60000 })));
  const [picked, setPicked] = useState('');
  useEffect(() => {
    if (!live) return undefined;
    let n = 3;
    const id = setInterval(() => {
      const e = EVENTS[n % EVENTS.length];
      setItems(list => [{ ...e, id: `e${n}`, time: Date.now() }, ...list].slice(0, 6));
      n += 1;
    }, 2600);
    return () => clearInterval(id);
  }, [live]);
  return (
    <div style={{ ...stack, maxWidth: 560, margin: '0 auto' }}>
      <FeedList {...props} items={items} label="World activity" fontFamily={PIXEL_FONT} onSelect={selectable ? item => setPicked(item.title) : undefined} />
      <p style={hint}>{picked ? `Opened: ${picked}` : selectable ? 'Focus the feed and use the arrow keys, then Enter.' : 'New events arrive every few seconds.'}</p>
    </div>
  );
}

const HOTBAR = [
  ['sword', 'Iron sword'], ['pickaxe', 'Pickaxe', 1], ['potion', 'Healing potion', 3], ['gem', 'Gems', 12], ['coin', 'Coins', 64], ['book', 'Map'], ['star', 'Torch', 32], ['chest', 'Chest'], ['heart', 'Heart crystal']
].map(([icon, label, count]) => ({ id: icon, label, count, icon: <img src={`/pixel/sprite-${icon}.png`} alt="" /> }));

function HotbarDemo(props) {
  const [held, setHeld] = useState('sword');
  return (
    <div style={{ ...stack, padding: '72px 16px 40px' }}>
      <HotbarDock {...props} items={HOTBAR} value={held} onChange={setHeld} fontFamily={PIXEL_FONT} />
      <p style={hint}>Holding: {HOTBAR.find(h => h.id === held)?.label}. Press 1–9, scroll over the bar, or click.</p>
    </div>
  );
}

function MenuDemo(props) {
  return (
    <div style={{ ...stack, padding: '56px 16px' }}>
      <OverlayMenu
        {...props}
        fontFamily={PIXEL_FONT}
        items={[
          { label: 'Play', meta: 'Season 3' },
          { label: 'Worlds', meta: '12 biomes' },
          { label: 'Quests' },
          { label: 'Shop', meta: 'New skins' },
          { label: 'Settings' }
        ]}
        footer={<span>© Bits Lab · Made with pixels</span>}
      />
      <p style={hint}>Open the menu. Escape closes it.</p>
    </div>
  );
}

const CARDS = [
  { name: 'Slime', image: '/pixel/biome-forest.png', rarity: 'common', stats: [{ label: 'HP', value: 12 }, { label: 'ATK', value: 2 }, { label: 'SPD', value: 3 }] },
  { name: 'Ember Knight', image: '/pixel/biome-mesa.png', rarity: 'epic', stats: [{ label: 'HP', value: 48 }, { label: 'ATK', value: 9 }, { label: 'SPD', value: 5 }] },
  { name: 'Void Dragon', image: '/pixel/biome-void.png', rarity: 'legendary', stats: [{ label: 'HP', value: 99 }, { label: 'ATK', value: 15 }, { label: 'SPD', value: 8 }] }
];

function CardsDemo({ flippable, ...props }) {
  return (
    <div style={{ ...stack, maxWidth: 900, margin: '0 auto' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 28, justifyContent: 'center' }}>
        {CARDS.map(c => (
          <TradingCard key={c.name} {...props} {...c} fontFamily={PIXEL_FONT} back={flippable ? <span style={{ display: 'grid', gap: 8, justifyItems: 'center', font: `11px ${TITLE_FONT}`, color: '#ffcd75' }}>{sprite('gem', 48)}BITS LAB</span> : undefined} />
        ))}
      </div>
      <p style={hint}>Tilt the cards with the pointer{flippable ? '; click one to flip it' : ''}.</p>
    </div>
  );
}

function GlassDemo(props) {
  return (
    <div style={{ position: 'relative', display: 'grid', placeItems: 'center', width: '100%', height: '100%', minHeight: 380, padding: 24, boxSizing: 'border-box', background: 'url(/pixel/biome-cherry.png) center / cover', imageRendering: 'pixelated' }}>
      <GlassPanel {...props} style={{ maxWidth: 420 }}>
        <div style={{ display: 'grid', gap: 10, font: `16px/1.5 ${PIXEL_FONT}`, textAlign: 'left' }}>
          <strong style={{ font: `13px ${TITLE_FONT}`, color: '#ffcd75' }}>CHERRY GROVE</strong>
          <span>Pink canopies, calm rivers and the best sunsets in the world. Bring a fishing rod.</span>
          <span style={{ color: '#94b0c2', fontSize: 14 }}>Level 4 · 12 quests</span>
        </div>
      </GlassPanel>
    </div>
  );
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function WheelDemo(props) {
  const [month, setMonth] = useState('October');
  const [day, setDay] = useState(28);
  const [year, setYear] = useState(2026);
  return (
    <div style={{ ...stack, padding: '48px 16px' }}>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
        <WheelPicker {...props} label="Month" options={MONTHS} value={month} onChange={setMonth} width={150} fontFamily={PIXEL_FONT} />
        <WheelPicker {...props} label="Day" options={Array.from({ length: 31 }, (_, i) => i + 1)} value={day} onChange={setDay} width={80} fontFamily={PIXEL_FONT} />
        <WheelPicker {...props} label="Year" options={Array.from({ length: 11 }, (_, i) => 2020 + i)} value={year} onChange={setYear} width={100} fontFamily={PIXEL_FONT} />
      </div>
      <p style={hint}>
        {month} {day}, {year}. Flick a wheel, scroll it, or focus it and use the arrow keys.
      </p>
    </div>
  );
}

// ---------- Phase 5: micro-interactions ----------

function HoldDemo(props) {
  const [worlds, setWorlds] = useState(3);
  return (
    <div style={stack}>
      <HoldToConfirm {...props} fontFamily={PIXEL_FONT} doneLabel="World deleted" onConfirm={() => setWorlds(w => Math.max(0, w - 1))}>
        Hold to delete world
      </HoldToConfirm>
      <p style={hint}>{worlds} saved world{worlds === 1 ? '' : 's'}. Let go early and the fuse rewinds. Space and Enter work too.</p>
    </div>
  );
}

const MAIL = [
  ['The blacksmith', 'Your sword is ready for pickup.'],
  ['Village council', 'Meeting moved to sunset.'],
  ['Pip', 'Found a cave full of gems!!'],
  ['Shop', 'Double gems this weekend.']
];

function SwipeDemo(props) {
  const [rows, setRows] = useState(MAIL.map(([from, text], i) => ({ id: i, from, text })));
  const [log, setLog] = useState('');
  const remove = id => setTimeout(() => setRows(r => r.filter(x => x.id !== id)), 460);
  return (
    <div style={{ ...stack, maxWidth: 520, margin: '0 auto', justifyItems: 'stretch' }}>
      {rows.map(row => (
        <SwipeActions
          key={row.id}
          {...props}
          fontFamily={PIXEL_FONT}
          leftActions={[{ label: 'Read', icon: '✓', color: '#38b764', onSelect: () => setLog(`Marked “${row.from}” as read`) }]}
          rightActions={[
            { label: 'Delete', icon: '✕', color: '#b13e53', onSelect: () => { setLog(`Deleted “${row.from}”`); remove(row.id); } },
            { label: 'Later', icon: '◷', color: '#3b5dc9', onSelect: () => setLog(`Snoozed “${row.from}”`) }
          ]}
        >
          <div style={{ display: 'grid', gap: 2, padding: '12px 16px', textAlign: 'left' }}>
            <strong style={{ fontSize: 15 }}>{row.from}</strong>
            <span style={{ color: '#94b0c2', fontSize: 14 }}>{row.text}</span>
          </div>
        </SwipeActions>
      ))}
      {!rows.length && <button type="button" style={pixelBtn} onClick={() => setRows(MAIL.map(([from, text], i) => ({ id: i + Date.now(), from, text })))}>Refill the inbox</button>}
      <p style={hint}>{log || 'Swipe a message left or right. Keyboard: Tab to the ⋯ button on a row.'}</p>
    </div>
  );
}

function DiscardDemo(props) {
  const [gone, setGone] = useState(false);
  const [round, setRound] = useState(0);
  return (
    <div style={stack}>
      <div style={{ minHeight: 230, display: 'grid', placeItems: 'center' }}>
        {round >= 0 && (
          <Discard key={round} {...props} discarded={gone} onDiscarded={() => setTimeout(() => { setGone(false); setRound(r => r + 1); }, 500)}>
            <div style={{ width: 260, padding: 18, borderRadius: 10, background: '#f4f4f4', color: '#1a1c2c', font: `15px/1.5 ${PIXEL_FONT}`, textAlign: 'left', boxShadow: '0 10px 24px -12px rgba(0,0,0,0.8)' }}>
              <strong style={{ font: `11px ${TITLE_FONT}`, color: '#b13e53' }}>TOP SECRET</strong>
              <p style={{ margin: '10px 0 0' }}>The diamonds are under the third oak from the river. Burn after reading.</p>
            </div>
          </Discard>
        )}
      </div>
      <button type="button" style={pixelBtn} disabled={gone} onClick={() => setGone(true)}>
        {props.effect === 'tear' ? 'Tear it up' : props.effect === 'crumple' ? 'Crumple it' : 'Shred it'}
      </button>
    </div>
  );
}

function PipsDemo(props) {
  const [rating, setRating] = useState(3.5);
  return (
    <div style={{ ...stack, gap: 26 }}>
      <div style={{ display: 'grid', gap: 8, justifyItems: 'center' }}>
        <span style={hint}>Rate this world</span>
        <RatingPips {...props} label="Rate this world" value={rating} onChange={setRating} />
        <span style={hint}>{rating} of {props.max}</span>
      </div>
      <div style={{ display: 'grid', gap: 8, justifyItems: 'center' }}>
        <span style={hint}>Read-only health</span>
        <RatingPips {...props} label="Health" readOnly value={2.5} size={20} />
      </div>
    </div>
  );
}

function ScrubDemo(props) {
  const [w, setW] = useState(320);
  const [h, setH] = useState(180);
  const [r, setR] = useState(12);
  const [o, setO] = useState(0.9);
  return (
    <div style={{ ...stack, gap: 22 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center' }}>
        <ScrubNumber {...props} label="Width" handle="W" value={w} onChange={setW} min={40} max={600} unit="px" fontFamily={PIXEL_FONT} />
        <ScrubNumber {...props} label="Height" handle="H" value={h} onChange={setH} min={40} max={400} unit="px" fontFamily={PIXEL_FONT} />
        <ScrubNumber {...props} label="Corner radius" handle="R" value={r} onChange={setR} min={0} max={80} fontFamily={PIXEL_FONT} />
        <ScrubNumber {...props} label="Opacity" handle="α" value={o} onChange={setO} min={0} max={1} step={0.01} pixelsPerStep={2} fontFamily={PIXEL_FONT} />
      </div>
      <div style={{ width: Math.min(w, 600), height: h, borderRadius: r, opacity: o, background: 'url(/pixel/biome-plains.png) center / cover', imageRendering: 'pixelated', boxShadow: '0 0 0 2px #333c57' }} />
      <p style={hint}>Drag a letter sideways. Shift for big steps, Alt for fine ones.</p>
    </div>
  );
}

function SpinnersDemo(props) {
  return (
    <div style={{ ...stack, gap: 26 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 40, justifyContent: 'center', alignItems: 'end' }}>
        {['blocks', 'bar', 'dots', 'hourglass', 'orbit'].map(type => (
          <PixelSpinners key={type} {...props} type={type} label={type} showLabel fontFamily={PIXEL_FONT} />
        ))}
      </div>
    </div>
  );
}

function ArcadeDemo(props) {
  const [log, setLog] = useState('');
  return (
    <div style={{ ...stack, padding: '72px 16px' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 28, justifyContent: 'center' }}>
        <ArcadeButtons {...props} behavior="launch" fontFamily={PIXEL_FONT} onClick={() => setLog('Launched!')}>
          🚀 Launch
        </ArcadeButtons>
        <ArcadeButtons {...props} behavior="dodge" color="#3b5dc9" fontFamily={PIXEL_FONT} onClick={() => setLog('You caught it.')}>
          Catch me
        </ArcadeButtons>
        <ArcadeButtons {...props} behavior="sling" color="#38b764" fontFamily={PIXEL_FONT} onClick={() => setLog('Slung!')}>
          Pull &amp; let go
        </ArcadeButtons>
      </div>
      <p style={hint}>{log || 'Each button has its own trick. All three work from the keyboard too.'}</p>
    </div>
  );
}

// ---------- Entries ----------

export const WAVE4_DEMOS = {
  'signal-text': {
    source: signalTextSource,
    defaults: { text: '', mode: 'scramble', charset: 'blocks', trigger: 'view', duration: 1200, interval: 3200, noiseColor: '#73eff7', textColor: '#f4f4f4' },
    controls: [text('text', 'Text (blank = per mode)'), select('mode', 'Mode', ['scramble', 'flap', 'glitch']), select('charset', 'Noise (scramble)', ['blocks', 'alpha', 'digits']), select('trigger', 'Trigger', ['view', 'mount', 'hover', 'loop']), slider('duration', 'Duration (ms)', 300, 4000, 100), slider('interval', 'Loop interval (ms)', 1000, 8000, 200), color('noiseColor', 'Noise colour'), color('textColor', 'Text colour')],
    docs: [
      ['text / as', 'string / element', '"" / "p"', 'The line; screen readers get it once as plain text.'],
      ['mode', '"scramble" | "flap" | "glitch"', '"scramble"', 'Noise that locks in left to right, a split-flap board, or colour-split tearing bursts.'],
      ['charset', '"blocks" | "alpha" | "digits" | string', '"blocks"', 'The noise scramble draws from (flap always uses its own drum).'],
      ['trigger / interval', '"view" | "mount" | "hover" | "loop" / number', '"view" / 3200', 'When it runs; loop repeats (or bursts, for glitch) every interval ms.'],
      ['duration', 'number (ms)', '1200', 'How long scramble or flap takes to settle.'],
      ['noiseColor / splitColors / cellColor / cellGap', 'string / [string, string] / string / number', 'cyan / orange, blue / slate / 4', 'Noise letters, the two glitch copies, and the flap tiles.'],
      ['onSettled', '() => void', '-', 'Called when the text has landed.'],
      ['Accessibility', '-', '-', 'Visual letters are aria-hidden. Reduced motion: settled text, no glitching.']
    ],
    usage: `import SignalText from "./SignalText";

<SignalText as="h2" text="Decrypting save file" mode="scramble" />`,
    render: props => <SignalDemo {...props} />
  },

  'ink-text': {
    source: inkTextSource,
    defaults: { fill: 'gradient', stepped: true, speed: 3, strokeWidth: 1.5, baseColor: '#94b0c2', glintColor: '#f4f4f4' },
    controls: [select('fill', 'Fill', ['shimmer', 'gradient', 'outline', 'image']), toggle('stepped', 'Pixel bands (gradient)'), slider('speed', 'Cycle (s)', 0.5, 12, 0.5), slider('strokeWidth', 'Outline (px)', 0.5, 4, 0.5), color('baseColor', 'Base / outline'), color('glintColor', 'Shimmer light')],
    docs: [
      ['text / children / as', 'string / ReactNode / element', '- / - / "span"', 'The text; works inline inside a sentence.'],
      ['fill', '"shimmer" | "gradient" | "outline" | "image"', '"shimmer"', 'A sweeping glint, flowing colours, a hollow stroke that floods on hover, or a panning picture.'],
      ['colors / stepped', 'string[] / boolean', 'pixel rainbow / true', 'Gradient colours; stepped turns them into hard 8-bit bands.'],
      ['baseColor / glintColor / strokeWidth', 'string / string / number', 'grey / white / 1.5', 'Shimmer base and light; outline colour and width.'],
      ['image / pixelated', 'string / boolean', '- / true', 'Picture for the image fill, scaled up crisply.'],
      ['filled / speed', 'boolean / number (s)', 'false / 3', 'Keep the outline flooded; length of one shimmer, flow or pan cycle.'],
      ['Accessibility', '-', '-', 'Plain, selectable text. Reduced motion: every fill holds still.']
    ],
    usage: `import InkText from "./InkText";

<h1>
  You found the <InkText fill="gradient">legendary sword</InkText>
</h1>`,
    render: props => <InkDemo {...props} />
  },

  'pixel-type': {
    source: pixelTypeSource,
    defaults: { text: 'PIXEL', effect: 'assemble', pixelSize: 6, gap: 1, rows: 12, repel: 70, stiffness: 90, damping: 11, hold: 2400, trigger: 'view' },
    controls: [text('text', 'Text'), select('effect', 'Effect', ['assemble', 'crumble']), slider('pixelSize', 'Block size', 2, 14, 1), slider('gap', 'Gap', 0, 4, 1), slider('rows', 'Rows (detail)', 8, 24, 1), slider('repel', 'Pointer scatter (px)', 0, 200, 5), slider('stiffness', 'Spring', 20, 300, 5), slider('damping', 'Damping', 2, 30, 1), slider('hold', 'Crumble after (ms)', 500, 6000, 100)],
    docs: [
      ['text / font / rows', 'string / CSS font family / number', '"PIXEL" / Press Start 2P / 12', 'What to draw, and how many pixel rows tall the text is rasterised.'],
      ['effect', '"assemble" | "crumble"', '"assemble"', 'Fly in once, or hold, crumble under gravity and rebuild on a loop.'],
      ['pixelSize / gap / align', 'number / number / "center" | "start" | "end"', '6 / 1 / "center"', 'Block size and spacing; the canvas fills the width and sizes its own height.'],
      ['repel / stiffness / damping', 'number', '70 / 90 / 11', 'How far the pointer scatters blocks, and the spring that brings them home.'],
      ['colors / hold / trigger', 'string[] / number / "view" | "mount"', 'gold → red / 2400 / "view"', 'Top-to-bottom colour bands, crumble timing, and when it starts.'],
      ['Accessibility', '-', '-', 'A canvas with role="img" named by the text. Pauses off-screen. Reduced motion: the word, still.']
    ],
    usage: `import PixelType from "./PixelType";

<PixelType text="GAME ON" effect="crumble" />`,
    render: props => <PixelTypeDemo {...props} />
  },

  'proximity-type': {
    source: proximityTypeSource,
    defaults: { text: 'Bend the type with your cursor', radius: 160, falloff: 'smooth', minWeight: 200, maxWeight: 950, minWidth: 80, maxWidth: 140, lift: 6, tint: 0.7, ease: 0.2, fontSize: 64, accentColor: '#73eff7', pixelFont: false },
    controls: [text('text', 'Text'), slider('radius', 'Reach (px)', 40, 400, 10), select('falloff', 'Falloff', ['smooth', 'linear', 'sharp']), slider('minWeight', 'Resting weight', 100, 500, 50), slider('maxWeight', 'Near weight', 500, 1000, 50), slider('minWidth', 'Resting width (%)', 25, 100, 5), slider('maxWidth', 'Near width (%)', 100, 151, 1), slider('lift', 'Lift (px)', 0, 24, 1), slider('tint', 'Accent tint', 0, 1, 0.05), slider('ease', 'Follow speed', 0.05, 1, 0.05), slider('fontSize', 'Font size', 24, 120, 2), color('accentColor', 'Accent'), toggle('pixelFont', 'Pixel font (400–700)')],
    docs: [
      ['text / as', 'string / element', '"" / "p"', 'The line; letters of a word never split across lines.'],
      ['radius / falloff', 'number / "smooth" | "linear" | "sharp"', '160 / "smooth"', 'How far the pointer reaches, and how quickly the effect fades with distance.'],
      ['minWeight / maxWeight / minWidth / maxWidth', 'number', '300 / 900 / 100 / 100', 'Variable-font ranges; width needs a wdth axis (e.g. Roboto Flex).'],
      ['lift / tint / accentColor', 'number / number / string', '0 / 0 / cyan', 'Raise near letters, and shift them toward the accent.'],
      ['ease', 'number 0–1', '0.2', 'How quickly letters follow (1 is instant).'],
      ['Accessibility', '-', '-', 'Plain text. Listens only while on screen. Reduced motion: still letters.']
    ],
    usage: `import ProximityType from "./ProximityType";

<ProximityType as="h1" text="Bend the type with your cursor" maxWidth={140} />`,
    render: props => <ProximityDemo {...props} />
  },

  'shadow-stack': {
    source: shadowStackSource,
    defaults: { text: 'GAME ON', mode: 'extrude', depth: 12, angle: 45, step: 1, echoes: 4, spacing: 7, follow: true, press: true, faceColor: '#ffcd75', fontSize: 64 },
    controls: [text('text', 'Text'), select('mode', 'Mode', ['extrude', 'echo']), slider('depth', 'Depth (px)', 2, 40, 1), slider('angle', 'Angle (°)', 0, 345, 15), slider('step', 'Layer step (px)', 1, 4, 1), slider('echoes', 'Echoes', 1, 8, 1), slider('spacing', 'Echo spacing (px)', 2, 20, 1), toggle('follow', 'Follow the pointer'), toggle('press', 'Press to squash'), color('faceColor', 'Face'), slider('fontSize', 'Font size', 20, 120, 2)],
    docs: [
      ['text / as', 'string / element', '"" / "h2"', 'The title.'],
      ['mode', '"extrude" | "echo"', '"extrude"', 'A solid stair-stepped block, or spaced fading copies that breathe.'],
      ['depth / angle / step', 'number', '10 / 45 / 1', 'Extrude depth in px, direction (0 = right, 90 = down) and px per layer.'],
      ['echoes / spacing', 'number', '4 / 6', 'Echo copies and the gap between them.'],
      ['follow / press', 'boolean', 'false / true', 'Depth falls away from the pointer (snapped to 15°); pressing squashes it like a key.'],
      ['faceColor / colors / fontFamily / fontSize', 'string / string[] / string / number', 'gold / orange → ink / Press Start 2P / 56', 'Face colour, and the colours the depth steps through from front to back.'],
      ['Accessibility', '-', '-', 'Plain text; the stack is text-shadow. Reduced motion: no transitions or breathing.']
    ],
    usage: `import ShadowStack from "./ShadowStack";

<ShadowStack as="h1" text="GAME ON" depth={12} follow />`,
    render: props => <StackDemo {...props} />
  },

  'marquee-line': {
    source: marqueeLineSource,
    defaults: { speed: 60, direction: 'left', boost: 6, skew: 8, pauseOnHover: true, draggable: true, showPause: true, gap: 28, fontSize: 20, accentColor: '#ffcd75' },
    controls: [slider('speed', 'Cruise (px/s)', 10, 300, 5), select('direction', 'Direction', ['left', 'right']), slider('boost', 'Scroll boost (×)', 0, 15, 0.5), slider('skew', 'Lean (°)', 0, 25, 1), toggle('pauseOnHover', 'Pause on hover'), toggle('draggable', 'Drag to scrub'), toggle('showPause', 'Pause button'), slider('gap', 'Gap', 8, 80, 2), slider('fontSize', 'Font size', 12, 48, 1), color('accentColor', 'Separator')],
    docs: [
      ['items / separator', 'ReactNode[] / ReactNode', '[] / "✦"', 'What scrolls, and what sits between items.'],
      ['speed / direction', 'number (px/s) / "left" | "right"', '60 / "left"', 'Cruising speed and direction.'],
      ['boost / skew', 'number', '6 / 8', 'Scroll surge (up to boost× cruising speed; scrolling up can reverse it) and the lean at full surge.'],
      ['pauseOnHover / draggable / showPause', 'boolean', 'true', 'Hover pauses, drag scrubs, and a pause button (motion over 5 s needs one).'],
      ['label / gap / fade / padding / fontSize', 'string / number', '"Announcements" / 28 / 48 / 14 / 22', 'List name for screen readers, spacing and edge fade.'],
      ['Accessibility', '-', '-', 'Screen readers get the items once as a list; the moving copy is hidden. Pause button. Reduced motion: still.']
    ],
    usage: `import MarqueeLine from "./MarqueeLine";

<MarqueeLine items={["Season 3 is live", "Double gems this weekend"]} />`,
    render: props => <MarqueeDemo {...props} />
  },

  'pointer-kit': {
    source: pointerKitSource,
    defaults: { modes: 'trail+sparks+target', hideCursor: false, pixelSize: 6, trailLength: 24, smoothing: 0.18, color: '#73eff7', accentColor: '#ffcd75' },
    controls: [select('modes', 'Modes', ['trail+sparks+target', 'trail', 'crosshair+target', 'blob+sparks', 'crosshair', 'sparks']), toggle('hideCursor', 'Hide system cursor'), slider('pixelSize', 'Pixel size', 2, 12, 1), slider('trailLength', 'Trail length', 4, 60, 1), slider('smoothing', 'Blob follow', 0.05, 1, 0.01), color('color', 'Colour'), color('accentColor', 'Accent')],
    docs: [
      ['children / global', 'ReactNode / boolean', '- / false', 'The area it covers; global covers the whole window instead.'],
      ['mode', 'string | ("trail" | "crosshair" | "target" | "sparks" | "blob")[]', '["trail", "sparks"]', 'One look or several together.'],
      ['targets', 'CSS selector', 'links, buttons, inputs, [data-pointer-target]', 'What the target brackets snap to.'],
      ['hideCursor / pixelSize / trailLength / smoothing / sparkCount', 'boolean / number', 'false / 6 / 24 / 0.18 / 14', 'Hide the system pointer; sizes, trail length, blob lag and sparks per click.'],
      ['color / accentColor', 'string', 'cyan / gold', 'The two colours everything is drawn in.'],
      ['Accessibility', '-', '-', 'One canvas that never takes clicks. Touch-only devices get sparks only. Reduced motion: crosshair and target without easing; no trail, blob or sparks.']
    ],
    usage: `import PointerKit from "./PointerKit";

<PointerKit mode={["trail", "target"]}>
  <Menu />
</PointerKit>`,
    render: props => <PointerDemo {...props} />
  },

  footprints: {
    source: footprintsSource,
    defaults: { useSprites: false, stride: 34, size: 22, life: 1600, spread: 9, color: '#5d275d' },
    controls: [toggle('useSprites', 'Loot stamps instead of feet'), slider('stride', 'Stride (px)', 12, 120, 2), slider('size', 'Stamp size', 10, 60, 1), slider('life', 'Lifetime (ms)', 300, 5000, 100), slider('spread', 'Feet apart (px)', 0, 24, 1), color('color', 'Footprint colour')],
    docs: [
      ['children', 'ReactNode', '-', 'The area to walk across.'],
      ['stamps', '"feet" | string[]', '"feet"', 'Built-in pixel footprints, or image URLs cycled in order.'],
      ['stride / spread / jitter', 'number', '34 / 9 / 8', 'Distance between stamps, how far apart feet sit, and random tilt (degrees) for images.'],
      ['size / life / max', 'number', '22 / 1600 / 60', 'Stamp width in px, lifetime in ms, and the most on screen at once.'],
      ['color', 'string', 'grey-blue', 'Footprint colour.'],
      ['Accessibility', '-', '-', 'Decorative canvas that never takes clicks. Reduced motion: no pop, prints just fade.']
    ],
    usage: `import Footprints from "./Footprints";

<Footprints>
  <Map />
</Footprints>`,
    render: props => <FootprintsDemo {...props} />
  },

  'edge-fx': {
    source: edgeFXSource,
    defaults: { mode: 'energy', active: 'always', width: 3, radius: 14, dash: 12, speed: 0.8, reach: 160, color: '#73eff7', secondColor: '#41a6f6' },
    controls: [select('mode', 'Edge', ['ants', 'energy', 'glow', 'glare']), select('active', 'Show', ['always', 'hover']), slider('width', 'Edge width', 1, 8, 1), slider('radius', 'Corner radius', 0, 30, 1), slider('dash', 'Dash (ants)', 4, 30, 1), slider('speed', 'Speed', 0.2, 3, 0.1), slider('reach', 'Glow reach (px)', 40, 400, 10), color('color', 'Colour'), color('secondColor', 'Second colour')],
    docs: [
      ['children', 'ReactNode', '-', 'The card inside the frame.'],
      ['mode', '"ants" | "energy" | "glow" | "glare"', '"ants"', 'Marching pixel dashes, a stepped band circling the frame, a light that follows the pointer, or a flash across the surface.'],
      ['active', '"always" | "hover"', '"always"', 'Hover also lights it on keyboard focus inside the card.'],
      ['width / radius / dash / speed / reach', 'number', '3 / 14 / 12 / 0.8 / 160', 'Edge thickness, corners, dash length, cycle speed and glow reach.'],
      ['color / secondColor / lineColor / backgroundColor / glareColor', 'string', 'cyan / blue / slate / ink / white wash', 'Edge colours, the resting edge and the card surface.'],
      ['Accessibility', '-', '-', 'Content untouched; the edge is decoration. Reduced motion: the edge holds still.']
    ],
    usage: `import EdgeFX from "./EdgeFX";

<EdgeFX mode="energy">
  <Card />
</EdgeFX>`,
    render: props => <EdgeDemo {...props} />
  },

  reveal: {
    source: revealSource,
    defaults: { effect: 'blocks', cascade: false, duration: 600, stagger: 90, distance: 24, steps: 8, replay: false },
    controls: [select('effect', 'Effect', ['blocks', 'rise', 'fade', 'zoom', 'wipe']), toggle('cascade', 'Cascade children'), slider('duration', 'Duration (ms)', 150, 2000, 50), slider('stagger', 'Stagger (ms)', 0, 400, 10), slider('distance', 'Rise distance (px)', 0, 80, 2), slider('steps', 'Wipe steps', 1, 24, 1), toggle('replay', 'Replay')],
    docs: [
      ['children / as', 'ReactNode / element', '- / "div"', 'What to reveal.'],
      ['effect', '"fade" | "rise" | "zoom" | "wipe" | "blocks"', '"rise"', 'The entrance; blocks dissolves a grid of cover blocks in a scattered order.'],
      ['cascade / stagger', 'boolean / number', 'false / 90', 'Reveal each direct child in turn.'],
      ['trigger / once / threshold', '"view" | "mount" / boolean / number', '"view" / true / 0.2', 'When it runs, and whether it hides again when scrolled away.'],
      ['duration / delay / distance / steps', 'number', '600 / 0 / 24 / 8', 'Timing, rise distance and how many steps the wipe takes.'],
      ['blocks / coverColor / onReveal', '[cols, rows] / string / () => void', '[8, 5] / ink / -', 'The block grid, its colour (match the background), and a callback.'],
      ['Accessibility', '-', '-', 'Content is in the page from the start. Reduced motion: shown at once.']
    ],
    usage: `import Reveal from "./Reveal";

<Reveal effect="rise" cascade>
  <Feature />
  <Feature />
</Reveal>`,
    render: props => <RevealDemo {...props} />
  },

  marquee: {
    source: marqueeSource,
    defaults: { lanes: 2, vertical: false, speed: 40, variance: 0.3, alternate: true, slow: 0.15, dim: 0.45, gap: 16, height: 420 },
    controls: [slider('lanes', 'Lanes', 1, 4, 1), toggle('vertical', 'Vertical'), slider('speed', 'Speed (px/s)', 5, 160, 5), slider('variance', 'Lane speed variance', 0, 1, 0.05), toggle('alternate', 'Alternate directions'), slider('slow', 'Hovered lane speed', 0, 1, 0.05), slider('dim', 'Dim others', 0.1, 1, 0.05), slider('gap', 'Gap', 4, 40, 2), slider('height', 'Height (vertical)', 240, 640, 10)],
    docs: [
      ['items', 'ReactNode[]', '[]', 'Logos or cards, dealt round-robin into lanes.'],
      ['lanes / vertical', 'number / boolean', '2 / false', 'How many lanes, running across or up and down.'],
      ['speed / variance / alternate', 'number / number / boolean', '40 / 0.3 / true', 'px per second, how much lane speeds differ, and whether neighbours run opposite ways.'],
      ['slow / dim', 'number 0–1', '0.15 / 0.45', 'Speed of a hovered lane (0 stops it) and how far other items in it dim.'],
      ['gap / fade / height', 'number', '16 / 56 / 420', 'Spacing, edge fade, and the height of a vertical wall.'],
      ['showPause / label', 'boolean / string', 'true / "Featured"', 'Pause button; the list name for screen readers.'],
      ['Accessibility', '-', '-', 'Items read once as a list; moving copies are hidden. Pause button. Reduced motion: still.']
    ],
    usage: `import Marquee from "./Marquee";

<Marquee lanes={3} items={logos} />`,
    render: props => <MarqueeDemo2 {...props} />
  },

  'grain-fx': {
    source: grainFXSource,
    defaults: { grain: true, dither: false, halftone: true, scanlines: false, blurEdge: 'bottom', amount: 0.35, cell: 2, fps: 12, density: 0.5, dotSize: 2.5, dotPitch: 8, blur: 10, blurSize: 45 },
    controls: [toggle('grain', 'Grain'), toggle('dither', 'Dither'), toggle('halftone', 'Halftone'), toggle('scanlines', 'Scanlines'), select('blurEdge', 'Edge blur', ['bottom', 'top', 'off']), slider('amount', 'Strength', 0.05, 1, 0.05), slider('cell', 'Grain / dither cell (px)', 1, 6, 1), slider('fps', 'Grain fps', 1, 30, 1), slider('density', 'Dither density', 0.05, 0.95, 0.05), slider('dotSize', 'Dot size', 0.5, 6, 0.5), slider('dotPitch', 'Dot spacing', 4, 24, 1), slider('blur', 'Blur (px)', 1, 30, 1), slider('blurSize', 'Blur reach (%)', 10, 100, 5)],
    docs: [
      ['children', 'ReactNode', '-', 'What to texture; without children it covers its parent.'],
      ['effects', 'string | ("grain" | "dither" | "halftone" | "scanlines" | "blur")[]', '["grain"]', 'Stack any number.'],
      ['amount / cell / fps / blend', 'number / number / number / CSS blend mode', '0.35 / 2 / 12 / "overlay"', 'Strength, pixel size of grain and dither, grain refresh rate and how it mixes.'],
      ['color / density', 'string / number 0–1', 'ink / 0.5', 'Ink for dither, halftone and scanlines; how dense the dither is.'],
      ['dotSize / dotPitch / fadeFrom', 'number / number / "top" | "bottom" | "left" | "right"', '2.5 / 8 / "top"', 'Halftone dots and the edge they fade from.'],
      ['blur / blurEdge / blurSize', 'number / "top" | "bottom" | "left" | "right" / number', '10 / "bottom" / 45', 'Edge blur strength, which edge, and how far in it reaches (%).'],
      ['Accessibility', '-', '-', 'Decorative; never takes the pointer. Grain pauses off-screen; reduced motion: still grain.']
    ],
    usage: `import GrainFX from "./GrainFX";

<GrainFX effects={["grain", "halftone"]}>
  <Hero />
</GrainFX>`,
    fullBleed: true,
    render: props => <GrainDemo {...props} />
  },

  'aurora-bands': {
    source: auroraBandsSource,
    defaults: { ribbons: 3, speed: 1, bands: 5, height: 0.38, pixelSize: 4, stars: 70 },
    controls: [slider('ribbons', 'Curtains', 1, 6, 1), slider('speed', 'Speed', 0, 4, 0.1), slider('bands', 'Light bands', 2, 12, 1), slider('height', 'Curtain height', 0.1, 0.8, 0.02), slider('pixelSize', 'Pixel size', 1, 10, 1), slider('stars', 'Stars', 0, 300, 10)],
    docs: [
      ['colors', 'string[]', 'green, cyan, red', 'One colour per curtain (cycled).'],
      ['ribbons / height / bands', 'number', '3 / 0.38 / 5', 'How many curtains, how tall (share of the sky) and how many flat light steps.'],
      ['speed / pixelSize / stars', 'number', '1 / 4 / 70', 'Ripple speed, pixel chunkiness and the star count.'],
      ['skyTop / skyBottom', 'string', 'ink / navy', 'The sky gradient.'],
      ['Layout', '-', '-', 'Fills its parent; decorative. Pauses off-screen; reduced motion: one still frame.']
    ],
    usage: `import AuroraBands from "./AuroraBands";

<div style={{ position: "relative", height: 420 }}>
  <AuroraBands />
</div>`,
    fullBleed: true,
    render: bg(AuroraBands, 'NORTHERN LIGHTS')
  },

  'warp-field': {
    source: warpFieldSource,
    defaults: { stars: 380, speed: 0.35, boost: 6, holdToBoost: true, lean: 0.12, pixelSize: 2 },
    controls: [slider('stars', 'Stars', 50, 1200, 10), slider('speed', 'Cruise speed', 0.05, 2, 0.05), slider('boost', 'Hyperspace boost (×)', 1, 15, 0.5), toggle('holdToBoost', 'Hold to boost'), slider('lean', 'Lean toward pointer', 0, 0.4, 0.01), slider('pixelSize', 'Pixel size', 1, 6, 1)],
    docs: [
      ['stars / speed', 'number', '380 / 0.35', 'How many stars and the cruising speed.'],
      ['boost / holdToBoost', 'number / boolean', '6 / true', 'Hold the pointer down (or Space when focused) for hyperspace.'],
      ['lean', 'number', '0.12', 'How far the vanishing point leans toward the pointer.'],
      ['pixelSize / colors / backgroundColor', 'number / string[] / string', '2 / white, cyan, gold / ink', 'Streak chunkiness and colours.'],
      ['Layout', '-', '-', 'Fills its parent; decorative. Pauses off-screen; reduced motion: still stars.']
    ],
    usage: `import WarpField from "./WarpField";

<div style={{ position: "relative", height: 420 }}>
  <WarpField />
</div>`,
    fullBleed: true,
    render: bg(WarpField, 'HOLD TO JUMP', 'Press and hold anywhere on the stars.')
  },

  'light-shafts': {
    source: lightShaftsSource,
    defaults: { mode: 'rays', count: 7, speed: 1, originX: 0.5, spread: 70, interval: 3500, pixelSize: 3 },
    controls: [select('mode', 'Mode', ['rays', 'beams', 'lightning']), slider('count', 'Rays / pillars', 1, 16, 1), slider('speed', 'Speed', 0, 4, 0.1), slider('originX', 'Light source (x)', 0, 1, 0.05), slider('spread', 'Ray spread (°)', 10, 160, 5), slider('interval', 'Lightning every (ms)', 800, 9000, 100), slider('pixelSize', 'Pixel size', 1, 8, 1)],
    docs: [
      ['mode', '"rays" | "beams" | "lightning"', '"rays"', 'Swaying rays from a light source, flickering pillars from the floor, or forked bolts with a flash.'],
      ['count / spread / originX / originY', 'number', '7 / 70 / 0.5 / -0.05', 'Rays or pillars, the fan angle, and where the light comes from (share of the area).'],
      ['speed / interval', 'number', '1 / 3500', 'Sway speed, and roughly how often lightning strikes (ms).'],
      ['pixelSize / colors / backgroundColor', 'number / [string, string] / string', '3 / gold, white / navy', 'Pixel chunkiness and colours.'],
      ['Layout', '-', '-', 'Fills its parent; decorative. Pauses off-screen; reduced motion: a still frame, never flashes.']
    ],
    usage: `import LightShafts from "./LightShafts";

<div style={{ position: "relative", height: 420 }}>
  <LightShafts mode="rays" />
</div>`,
    fullBleed: true,
    render: bg(LightShafts, 'THE SUNKEN TEMPLE')
  },

  'lava-lamp': {
    source: lavaLampSource,
    defaults: { blobs: 7, speed: 1, size: 1, pointer: true, pixelSize: 5, topColor: '#ffcd75', bottomColor: '#b13e53' },
    controls: [slider('blobs', 'Blobs', 1, 14, 1), slider('speed', 'Speed', 0, 5, 0.1), slider('size', 'Blob size', 0.4, 2, 0.05), toggle('pointer', 'Pointer is a blob'), slider('pixelSize', 'Pixel size', 2, 12, 1), color('topColor', 'Wax (top)'), color('bottomColor', 'Wax (bottom)')],
    docs: [
      ['blobs / size / speed', 'number', '7 / 1 / 1', 'How many blobs, how big, and how fast they rise and sink.'],
      ['pointer', 'boolean', 'true', 'The pointer becomes a blob you can push through the wax.'],
      ['topColor / bottomColor / rimColor', 'string', 'gold / red / white', 'Wax colour from top to bottom, and the lighter rim.'],
      ['backgroundTop / backgroundBottom / pixelSize', 'string / string / number', 'navy / ink / 5', 'The lamp glass and pixel chunkiness.'],
      ['Layout', '-', '-', 'Fills its parent; decorative. Pauses off-screen; reduced motion: one still frame.']
    ],
    usage: `import LavaLamp from "./LavaLamp";

<div style={{ position: "relative", height: 420 }}>
  <LavaLamp />
</div>`,
    fullBleed: true,
    render: bg(LavaLamp)
  },

  'code-rain': {
    source: codeRainSource,
    defaults: { glyphs: 'hex', fontSize: 14, speed: 1, density: 0.8, tail: 1.2, glitch: 0.004, color: '#38b764', headColor: '#f4f4f4' },
    controls: [select('glyphs', 'Glyphs', ['hex', 'binary', 'blocks', 'arrows']), slider('fontSize', 'Glyph size', 8, 32, 1), slider('speed', 'Speed', 0.1, 4, 0.1), slider('density', 'Density', 0.1, 1, 0.05), slider('tail', 'Tail (s)', 0.2, 4, 0.1), slider('glitch', 'Glitches', 0, 0.05, 0.001), color('color', 'Tail'), color('headColor', 'Head')],
    docs: [
      ['glyphs', '"hex" | "binary" | "blocks" | "arrows" | string', '"hex"', 'A preset set of glyphs, or your own characters.'],
      ['fontSize / fontFamily', 'number / string', '14 / Press Start 2P', 'Glyph size (also the column width) and font.'],
      ['speed / density / tail', 'number', '1 / 0.8 / 1.2', 'Fall speed, share of active columns, and how many seconds a tail lingers.'],
      ['glitch / hotRadius', 'number', '0.004 / 120', 'Chance of glyph flips and glitch rows; columns near the pointer run hot.'],
      ['headColor / color / hotColor / backgroundColor', 'string', 'white / green / gold / ink', 'Colours.'],
      ['Layout', '-', '-', 'Fills its parent; decorative. Pauses off-screen; reduced motion: a still screen of glyphs.']
    ],
    usage: `import CodeRain from "./CodeRain";

<div style={{ position: "relative", height: 420 }}>
  <CodeRain glyphs="binary" />
</div>`,
    fullBleed: true,
    render: bg(CodeRain, 'SYSTEM ONLINE')
  },

  'dither-field': {
    source: ditherFieldSource,
    defaults: { pattern: 'noise', scale: 1, speed: 1, pixelSize: 3, pointer: true },
    controls: [select('pattern', 'Pattern', ['noise', 'waves', 'radial']), slider('scale', 'Scale', 0.3, 4, 0.1), slider('speed', 'Speed', 0, 5, 0.1), slider('pixelSize', 'Pixel size', 1, 10, 1), toggle('pointer', 'Pointer glow')],
    docs: [
      ['pattern', '"noise" | "waves" | "radial"', '"noise"', 'What moves underneath: drifting clouds, rolling waves or a pulsing ring.'],
      ['palette', 'string[]', 'ink → plum → red → orange → gold', 'Two or more colours, darkest first; the dither blends between neighbours.'],
      ['scale / speed / pixelSize', 'number', '1 / 1 / 3', 'Pattern size, motion speed and pixel chunkiness.'],
      ['pointer', 'boolean', 'true', 'The pointer adds a warm spot.'],
      ['Layout', '-', '-', 'Fills its parent; decorative. Pauses off-screen; reduced motion: one still frame.']
    ],
    usage: `import DitherField from "./DitherField";

<div style={{ position: "relative", height: 420 }}>
  <DitherField palette={["#1a1c2c", "#29366f", "#41a6f6", "#73eff7"]} />
</div>`,
    fullBleed: true,
    render: bg(DitherField, 'SUNSET.EXE')
  },

  'contour-lines': {
    source: contourLinesSource,
    defaults: { levels: 14, major: 5, scale: 1, speed: 1, pixelSize: 2, tint: true, pointer: true, lineColor: '#73eff7' },
    controls: [slider('levels', 'Contours', 4, 40, 1), slider('major', 'Index line every', 2, 10, 1), slider('scale', 'Terrain scale', 0.3, 4, 0.1), slider('speed', 'Drift', 0, 5, 0.1), slider('pixelSize', 'Pixel size', 1, 6, 1), toggle('tint', 'Tint the bands'), toggle('pointer', 'Pointer raises a hill'), color('lineColor', 'Lines')],
    docs: [
      ['levels / major', 'number', '14 / 5', 'How many contours, and how often a brighter index line appears.'],
      ['scale / speed / pixelSize', 'number', '1 / 1 / 2', 'Terrain size, how fast it drifts and pixel chunkiness.'],
      ['tint / bandColors', 'boolean / string[]', 'true / ink, navy', 'Alternate the colour between contours, like an atlas.'],
      ['pointer', 'boolean', 'true', 'The pointer raises a hill, so rings gather around it.'],
      ['lineColor / majorColor', 'string', 'cyan / white', 'Contour and index-line colours.'],
      ['Layout', '-', '-', 'Fills its parent; decorative. Pauses off-screen; reduced motion: one still frame.']
    ],
    usage: `import ContourLines from "./ContourLines";

<div style={{ position: "relative", height: 420 }}>
  <ContourLines />
</div>`,
    fullBleed: true,
    render: bg(ContourLines, 'EXPEDITION MAP')
  },

  'scan-scope': {
    source: scanScopeSource,
    defaults: { mode: 'radar', blips: 9, period: 4, trail: 0.22, rings: 4, gridSize: 28, pixelSize: 2, color: '#38b764', blipColor: '#ffcd75' },
    controls: [select('mode', 'Mode', ['radar', 'line']), slider('blips', 'Blips', 0, 30, 1), slider('period', 'Sweep (s)', 1, 12, 0.5), slider('trail', 'Trail', 0.05, 0.6, 0.01), slider('rings', 'Range rings', 0, 8, 1), slider('gridSize', 'Grid size', 12, 80, 2), slider('pixelSize', 'Pixel size', 1, 6, 1), color('color', 'Beam'), color('blipColor', 'Blips')],
    docs: [
      ['mode', '"radar" | "line"', '"radar"', 'A rotating sweep over range rings, or a bar scanning down.'],
      ['blips', 'number | { x, y }[]', '9', 'A count to scatter, or positions in 0…1 of the area.'],
      ['period / trail', 'number', '4 / 0.22', 'Seconds per sweep, and the length of its fading wake.'],
      ['rings / gridSize / pixelSize', 'number', '4 / 28 / 2', 'Range rings (radar), grid spacing and pixel chunkiness.'],
      ['color / blipColor / gridColor / backgroundColor', 'string', 'green / gold / navy / ink', 'Colours.'],
      ['Layout', '-', '-', 'Fills its parent; decorative. Pauses off-screen; reduced motion: grid with every blip lit, no beam.']
    ],
    usage: `import ScanScope from "./ScanScope";

<div style={{ position: "relative", height: 420 }}>
  <ScanScope blips={[{ x: 0.3, y: 0.4 }, { x: 0.7, y: 0.6 }]} />
</div>`,
    fullBleed: true,
    render: bg(ScanScope)
  },

  'card-deck': {
    source: cardDeckSource,
    defaults: { width: 280, height: 380, visible: 4, offset: 6, fan: 2.5, threshold: 0.3, loop: true },
    controls: [slider('width', 'Width', 180, 400, 10), slider('height', 'Height', 220, 520, 10), slider('visible', 'Cards in the pile', 1, 8, 1), slider('offset', 'Pile offset (px)', 0, 16, 1), slider('fan', 'Fan (°)', 0, 8, 0.5), slider('threshold', 'Throw distance', 0.1, 0.8, 0.05), toggle('loop', 'Loop')],
    docs: [
      ['children', 'ReactNode[]', '-', 'The cards, top first.'],
      ['width / height / radius', 'number', '280 / 380 / 16', 'Card size and corners.'],
      ['visible / offset / fan', 'number', '4 / 6 / 2.5', 'Cards shown in the pile, how far each sits down-right, and how much they fan.'],
      ['threshold / loop / onChange', 'number / boolean / (index) => void', '0.3 / true / -', 'How far to drag (share of width) before the card flies; wrap around at the ends.'],
      ['Accessibility', '-', '-', 'The pile is a focusable group naming the top card; Left/Right and the buttons deal; only the top card is reachable. Reduced motion: no flight.']
    ],
    usage: `import CardDeck from "./CardDeck";

<CardDeck>
  <Card />
  <Card />
</CardDeck>`,
    render: props => <DeckDemo {...props} />
  },

  coverflow: {
    source: coverflowSource,
    defaults: { itemWidth: 220, height: 340, spacing: 0.55, angle: 55, depth: 120 },
    controls: [slider('itemWidth', 'Item width', 120, 360, 10), slider('height', 'Height', 200, 520, 10), slider('spacing', 'Spacing', 0.25, 1.2, 0.05), slider('angle', 'Turn (°)', 0, 80, 1), slider('depth', 'Depth (px)', 0, 400, 10)],
    docs: [
      ['children', 'ReactNode[]', '-', 'The items.'],
      ['index / defaultIndex / onChange', 'number / number / (index) => void', '- / 0 / -', 'Controlled or not.'],
      ['itemWidth / height / spacing', 'number', '220 / 320 / 0.55', 'Item size, stage height and overlap.'],
      ['angle / depth / range', 'number', '55 / 120 / 4', 'How far side items turn and step back, and how many render each side.'],
      ['Accessibility', '-', '-', 'A focusable carousel group; arrows, Home/End and buttons; the count is announced; side items are inert. Reduced motion: a flat slide.']
    ],
    usage: `import Coverflow from "./Coverflow";

<Coverflow defaultIndex={2}>
  {albums.map(a => <Cover key={a.id} {...a} />)}
</Coverflow>`,
    render: props => <CoverDemo {...props} />
  },

  'masonry-wall': {
    source: masonryWallSource,
    defaults: { minColumnWidth: 220, maxColumns: 6, gap: 16, duration: 450 },
    controls: [slider('minColumnWidth', 'Min column width', 120, 400, 10), slider('maxColumns', 'Max columns', 1, 8, 1), slider('gap', 'Gap', 0, 40, 2), slider('duration', 'Glide (ms)', 0, 1200, 50)],
    docs: [
      ['children', 'ReactNode[] (with keys)', '-', 'Items of any height; keys let them glide when the list changes.'],
      ['minColumnWidth / maxColumns / gap', 'number', '220 / 6 / 16', 'Columns are as many as fit at this width, up to the maximum.'],
      ['duration', 'number (ms)', '450', 'How long items take to glide to a new place.'],
      ['Accessibility', '-', '-', 'Reading and tab order follow the order you pass in. Reduced motion: no glide or pop.']
    ],
    usage: `import MasonryWall from "./MasonryWall";

<MasonryWall minColumnWidth={240}>
  {notes.map(n => <Note key={n.id} {...n} />)}
</MasonryWall>`,
    render: props => <MasonryDemo {...props} />
  },

  'feed-list': {
    source: feedListSource,
    defaults: { live: true, selectable: true, max: 50, maxHeight: 420, accentColor: '#73eff7' },
    controls: [toggle('live', 'Live events'), toggle('selectable', 'Selectable'), slider('maxHeight', 'Max height', 200, 640, 10), color('accentColor', 'Accent')],
    docs: [
      ['items', '{ id, title, body?, icon?, time?, tone? }[]', '[]', 'Newest first. New ids slide in; missing ids fold away.'],
      ['onSelect', '(item) => void', '-', 'Makes the feed a listbox: arrows, Home/End and Enter.'],
      ['max / emptyLabel / locale', 'number / string / string', '50 / "Nothing yet." / -', 'How many to show, the empty message and the relative-time language.'],
      ['width / maxHeight / colours', 'number / string', '480 / 420', 'Size, plus backgroundColor, hoverColor, chipColor, accentColor, flashColor.'],
      ['Accessibility', '-', '-', 'A list (or listbox); new items are announced; times are <time> elements. Reduced motion: no slides.']
    ],
    usage: `import FeedList from "./FeedList";

<FeedList items={events} onSelect={event => open(event)} />`,
    render: props => <FeedDemo {...props} />
  },

  'hotbar-dock': {
    source: hotbarDockSource,
    defaults: { magnify: 1.5, range: 110, hotkeys: true, wheel: true, slotSize: 52, gap: 6, selectColor: '#f4f4f4' },
    controls: [slider('magnify', 'Magnify', 1, 2.5, 0.05), slider('range', 'Magnify range (px)', 40, 300, 10), toggle('hotkeys', 'Number keys'), toggle('wheel', 'Scroll to cycle'), slider('slotSize', 'Slot size', 32, 80, 2), slider('gap', 'Gap', 0, 16, 1), color('selectColor', 'Selected frame')],
    docs: [
      ['items', '{ id, label, icon, count? }[]', '[]', 'Slots, left to right; count shows a stack number.'],
      ['value / defaultValue / onChange', 'id / id / (id, item) => void', 'first', 'The selected slot.'],
      ['magnify / range', 'number', '1.5 / 110', 'How big the slot under the pointer grows, and how far the swell reaches.'],
      ['hotkeys / wheel', 'boolean', 'true / true', 'Number keys 1–9 (not while typing) and scrolling over the bar.'],
      ['slotSize / gap / colours', 'number / string', '52 / 6', 'Slot size, spacing and the pixel palette.'],
      ['Accessibility', '-', '-', 'A toolbar of toggle buttons with one tab stop; arrows move along; each names its item, count and key.']
    ],
    usage: `import HotbarDock from "./HotbarDock";

<HotbarDock items={tools} value={tool} onChange={setTool} />`,
    render: props => <HotbarDemo {...props} />
  },

  'overlay-menu': {
    source: overlayMenuSource,
    defaults: { numbered: true, fontSize: 44, accentColor: '#ffcd75' },
    controls: [toggle('numbered', 'Numbered'), slider('fontSize', 'Link size', 20, 72, 2), color('accentColor', 'Hover colour')],
    docs: [
      ['items', '{ label, href?, meta?, onSelect? }[]', '[]', 'Big links (or buttons) with an optional note at the side.'],
      ['footer', 'ReactNode', '-', 'Anything under the links.'],
      ['open / defaultOpen / onOpenChange / onNavigate', 'boolean / boolean / (open) => void / (item, event) => void', '- / false / - / -', 'Controlled or not; called when a link is chosen.'],
      ['numbered / fontSize / label', 'boolean / number / string', 'true / 44 / "Menu"', 'Number the links, their maximum size, and the accessible name.'],
      ['Accessibility', '-', '-', 'A modal dialog with focus kept inside, Escape to close, focus back to the button, page scroll locked. Reduced motion: no wipe.']
    ],
    usage: `import OverlayMenu from "./OverlayMenu";

<OverlayMenu items={[{ label: "Play", href: "/play" }, { label: "Shop", href: "/shop" }]} />`,
    render: props => <MenuDemo {...props} />
  },

  'trading-card': {
    source: tradingCardSource,
    defaults: { tilt: 14, width: 220, flippable: true },
    controls: [slider('tilt', 'Tilt (°)', 0, 30, 1), slider('width', 'Width', 160, 320, 10), toggle('flippable', 'Has a back (flips)')],
    docs: [
      ['name / image / imageAlt', 'string', '-', 'The card face.'],
      ['rarity', '"common" | "rare" | "epic" | "legendary"', '"rare"', 'Frame colour and how strong the holo foil is (common has none).'],
      ['stats', '{ label, value }[]', '[]', 'Little stat boxes along the bottom.'],
      ['back / flipped / onFlip', 'ReactNode / boolean / (flipped) => void', '-', 'With a back, the card is a button that flips.'],
      ['tilt / width / frameColor', 'number / number / string', '14 / 240 / by rarity', 'Tilt toward the pointer, size and a custom frame.'],
      ['Accessibility', '-', '-', 'Name, rarity and stats are text; a flippable card is a toggle button. Reduced motion: flat, no foil drift.']
    ],
    usage: `import TradingCard from "./TradingCard";

<TradingCard name="Void Dragon" image="/dragon.png" rarity="legendary" stats={[{ label: "HP", value: 99 }]} />`,
    render: props => <CardsDemo {...props} />
  },

  'glass-panel': {
    source: glassPanelSource,
    defaults: { blur: 14, saturation: 1.5, pixel: false, sheen: true, padding: 24, radius: 18 },
    controls: [slider('blur', 'Blur (px)', 0, 40, 1), slider('saturation', 'Saturation', 1, 2.5, 0.05), toggle('pixel', 'Pixel dither'), toggle('sheen', 'Pointer sheen'), slider('padding', 'Padding', 8, 48, 2), slider('radius', 'Corner radius', 0, 40, 1)],
    docs: [
      ['children / as', 'ReactNode / element', '- / "div"', 'The content on the glass.'],
      ['blur / saturation / tint', 'number / number / string', '14 / 1.5 / navy wash', 'How frosted, how much colour shows through, and the glass tint.'],
      ['pixel', 'boolean', 'false', 'An 8-bit dither over the frost.'],
      ['sheen / sheenColor / sheenSize', 'boolean / string / number', 'true / white wash / 260', 'A soft light that follows the pointer.'],
      ['fallbackTint / edgeColor / lineColor', 'string', 'near-opaque ink / white / faint white', 'Used where backdrop blur is unsupported, and the lit edges.'],
      ['Accessibility', '-', '-', 'Content is untouched; the fallback keeps text readable. Reduced motion: no sheen movement.']
    ],
    usage: `import GlassPanel from "./GlassPanel";

<GlassPanel blur={16}>
  <h2>Cherry Grove</h2>
</GlassPanel>`,
    fullBleed: true,
    render: props => <GlassDemo {...props} />
  },

  'wheel-picker': {
    source: wheelPickerSource,
    defaults: { visible: 5, rowHeight: 40, fontSize: 18, accentColor: '#73eff7' },
    controls: [slider('visible', 'Rows shown', 3, 9, 2), slider('rowHeight', 'Row height', 28, 64, 2), slider('fontSize', 'Font size', 12, 28, 1), color('accentColor', 'Focus ring')],
    docs: [
      ['options', '(string | number | { value, label })[]', '[]', 'The choices.'],
      ['value / defaultValue / onChange', 'value / value / (value, option) => void', 'first', 'Controlled or not.'],
      ['visible / rowHeight / width', 'number', '5 / 40 / 140', 'Rows shown (odd works best), row height and width.'],
      ['label / fontSize / colours', 'string / number / string', '"Pick an option" / 18', 'The accessible name, text size and palette.'],
      ['Accessibility', '-', '-', 'A spin button: arrows, Page Up/Down, Home/End; the current option is its value text. Reduced motion: snaps without coasting.']
    ],
    usage: `import WheelPicker from "./WheelPicker";

<WheelPicker label="Month" options={months} value={month} onChange={setMonth} />`,
    render: props => <WheelDemo {...props} />
  },

  'hold-to-confirm': {
    source: holdToConfirmSource,
    defaults: { duration: 1200, rewind: 2.5, resetAfter: 1600, width: 240, fillColor: '#b13e53', fuseColor: '#ef7d57' },
    controls: [slider('duration', 'Hold time (ms)', 300, 4000, 100), slider('rewind', 'Rewind speed (×)', 0.5, 6, 0.5), slider('resetAfter', 'Done shows for (ms)', 500, 4000, 100), slider('width', 'Min width', 140, 360, 10), color('fillColor', 'Fill'), color('fuseColor', 'Fuse')],
    docs: [
      ['children / doneLabel', 'ReactNode', '"Hold to delete" / "Done"', 'The label while waiting, and after confirming.'],
      ['onConfirm', '() => void', '-', 'Called once the fuse burns all the way.'],
      ['duration / rewind / resetAfter', 'number', '1200 / 2.5 / 1600', 'Hold time in ms, how many times faster it rewinds, and how long the done state shows.'],
      ['disabled / width / height / radius', 'boolean / number', 'false / 200 / 52 / 10', 'Size and state.'],
      ['backgroundColor / fillColor / fuseColor / sparkColor', 'string', 'slate / red / orange / gold', 'Colours.'],
      ['Accessibility', '-', '-', 'A real button; hold Space or Enter too. Says how to use it and announces when done. A quick tap never confirms. Reduced motion: no spark or flash.']
    ],
    usage: `import HoldToConfirm from "./HoldToConfirm";

<HoldToConfirm onConfirm={deleteWorld}>Hold to delete</HoldToConfirm>`,
    render: props => <HoldDemo {...props} />
  },

  'swipe-actions': {
    source: swipeActionsSource,
    defaults: { fullSwipe: true, actionWidth: 76, radius: 12 },
    controls: [toggle('fullSwipe', 'Full swipe fires'), slider('actionWidth', 'Action width', 56, 120, 2), slider('radius', 'Corner radius', 0, 24, 1)],
    docs: [
      ['children', 'ReactNode', '-', 'The row content.'],
      ['leftActions / rightActions', '{ label, icon?, color?, onSelect }[]', '[]', 'Revealed by swiping right and left; the first on each side fires on a full swipe.'],
      ['fullSwipe', 'boolean', 'true', 'Swiping past 60% fires the first action and slides the row away.'],
      ['actionWidth / label / radius', 'number / string / number', '76 / "Actions" / 12', 'Action button width, the menu name and corners.'],
      ['Accessibility', '-', '-', 'Every action is also a plain button in the row\'s ⋯ menu, for keyboard and screen readers. Reduced motion: no slide.']
    ],
    usage: `import SwipeActions from "./SwipeActions";

<SwipeActions rightActions={[{ label: "Delete", color: "#b13e53", onSelect: remove }]}>
  <Message />
</SwipeActions>`,
    render: props => <SwipeDemo {...props} />
  },

  discard: {
    source: discardSource,
    defaults: { effect: 'shred', strips: 8, duration: 900 },
    controls: [select('effect', 'Effect', ['shred', 'crumple', 'tear']), slider('strips', 'Shred strips', 3, 20, 1), slider('duration', 'Duration (ms)', 300, 2000, 50)],
    docs: [
      ['children', 'ReactNode', '-', 'The thing to throw away.'],
      ['discarded / onDiscarded', 'boolean / () => void', 'false / -', 'Set discarded to play the effect; remove the content in onDiscarded.'],
      ['effect', '"shred" | "crumple" | "tear"', '"shred"', 'Falling strips, a balled-up toss, or torn in two.'],
      ['strips / duration', 'number', '8 / 900', 'Shredder strips and the effect length.'],
      ['Accessibility', '-', '-', 'The effect copies are hidden from screen readers. Reduced motion: a quick fade.']
    ],
    usage: `import Discard from "./Discard";

<Discard discarded={deleting} effect="shred" onDiscarded={() => remove(note.id)}>
  <Note />
</Discard>`,
    render: props => <DiscardDemo {...props} />
  },

  'rating-pips': {
    source: ratingPipsSource,
    defaults: { icon: 'heart', max: 5, allowHalf: true, clearable: true, size: 28, fullColor: '#b13e53' },
    controls: [select('icon', 'Icon', ['heart', 'star', 'gem']), slider('max', 'Pips', 3, 10, 1), toggle('allowHalf', 'Half pips'), toggle('clearable', 'Click again to clear'), slider('size', 'Size', 16, 48, 2), color('fullColor', 'Full colour')],
    docs: [
      ['value / defaultValue / onChange', 'number / number / (value) => void', '- / 0 / -', 'Controlled or not.'],
      ['max / allowHalf / clearable', 'number / boolean / boolean', '5 / true / true', 'How many pips, whether halves count, and whether clicking the current value clears it.'],
      ['readOnly', 'boolean', 'false', 'A picture of the value (e.g. health) instead of an input.'],
      ['icon / size / gap', '"heart" | "star" | "gem" / number / number', '"heart" / 28 / 4', 'Pixel icon and sizing.'],
      ['fullColor / emptyColor / previewColor', 'string', 'red / slate / orange', 'Filled, empty and hover-preview colours.'],
      ['Accessibility', '-', '-', 'A slider (arrows, Home/End) saying "3.5 of 5"; read-only is an image with that label. Reduced motion: no pop.']
    ],
    usage: `import RatingPips from "./RatingPips";

<RatingPips label="Rating" value={rating} onChange={setRating} />`,
    render: props => <PipsDemo {...props} />
  },

  'scrub-number': {
    source: scrubNumberSource,
    defaults: { pixelsPerStep: 4, width: 64, accentColor: '#73eff7' },
    controls: [slider('pixelsPerStep', 'Pixels per step', 1, 16, 1), slider('width', 'Field width', 40, 120, 2), color('accentColor', 'Accent')],
    docs: [
      ['value / defaultValue / onChange', 'number / number / (value) => void', '- / 0 / -', 'Controlled or not.'],
      ['min / max / step', 'number', '-∞ / ∞ / 1', 'Range and step; decimals follow the step.'],
      ['pixelsPerStep', 'number', '4', 'Drag distance per step; Shift ×10, Alt ×0.1.'],
      ['label / handle / unit', 'string / ReactNode / string', '"Value" / label / ""', 'The accessible name, what the drag handle shows (e.g. "W"), and a unit after the field.'],
      ['width / colours', 'number / string', '64', 'Field width and the palette.'],
      ['Accessibility', '-', '-', 'A labelled text input with spin-button semantics: type, or use Up/Down (Shift/Alt to scale).']
    ],
    usage: `import ScrubNumber from "./ScrubNumber";

<ScrubNumber label="Width" handle="W" value={width} onChange={setWidth} unit="px" />`,
    render: props => <ScrubDemo {...props} />
  },

  'pixel-spinners': {
    source: pixelSpinnersSource,
    defaults: { cell: 6, gap: 2, speed: 1.2, color: '#73eff7', dimColor: '#333c57' },
    controls: [slider('cell', 'Pixel size', 2, 14, 1), slider('gap', 'Gap', 0, 6, 1), slider('speed', 'Cycle (s)', 0.3, 4, 0.1), color('color', 'Lit'), color('dimColor', 'Dim')],
    docs: [
      ['type', '"blocks" | "bar" | "dots" | "hourglass" | "orbit"', '"blocks"', 'Which loader.'],
      ['label / showLabel', 'string / boolean', '"Loading" / false', 'Announced to screen readers; shown under the loader if showLabel.'],
      ['cell / gap / speed', 'number', '6 / 2 / 1.2', 'Pixel size, spacing and seconds per cycle.'],
      ['color / dimColor / mutedColor', 'string', 'cyan / slate / grey', 'Lit and unlit pixels, and the label.'],
      ['Accessibility', '-', '-', 'role="status" with a label. Pure CSS. Reduced motion: a slow glow instead of motion.']
    ],
    usage: `import PixelSpinners from "./PixelSpinners";

<PixelSpinners type="hourglass" label="Saving world" />`,
    render: props => <SpinnersDemo {...props} />
  },

  'arcade-buttons': {
    source: arcadeButtonsSource,
    defaults: { maxDodges: 5, dodgeRadius: 70, pull: 90 },
    controls: [slider('maxDodges', 'Dodges before giving in', 1, 20, 1), slider('dodgeRadius', 'Dodge distance (px)', 20, 200, 5), slider('pull', 'Sling pull (px)', 40, 200, 5)],
    docs: [
      ['behavior', '"launch" | "dodge" | "sling"', '"launch"', 'Blast off and drop back in; hop away from the pointer a few times; or stretch and snap like a slingshot.'],
      ['children / onClick / disabled', 'ReactNode / (event?) => void / boolean', '-', 'Launch calls onClick at lift-off; sling on a far enough release.'],
      ['maxDodges / dodgeRadius', 'number', '5 / 70', 'How many times it dodges, and how close the pointer gets first.'],
      ['pull', 'number', '90', 'How far the sling stretches (and must be pulled to fire).'],
      ['color / textColor / smokeColor / accentColor', 'string', 'red / white / grey / cyan', 'Colours.'],
      ['Accessibility', '-', '-', 'Real buttons: keyboard presses always work, dodging only reacts to a mouse. Reduced motion: plain buttons.']
    ],
    usage: `import ArcadeButtons from "./ArcadeButtons";

<ArcadeButtons behavior="launch" onClick={start}>Launch</ArcadeButtons>`,
    render: props => <ArcadeDemo {...props} />
  }
};
