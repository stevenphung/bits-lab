import { useEffect, useState } from 'react';
import './templates.css';
import Sprite from '../pixel/Sprite';
import ArcadeButtons from '../bits/ArcadeButtons';
import AuroraBands from '../bits/AuroraBands';
import BreadcrumbTrail from '../bits/BreadcrumbTrail';
import CloudSky from '../bits/CloudSky';
import ColorDial from '../bits/ColorDial';
import Confetti, { confetti } from '../bits/Confetti';
import ContextOrb from '../bits/ContextOrb';
import CursorAttractor from '../bits/CursorAttractor';
import CutReveal from '../bits/CutReveal';
import DateRange from '../bits/DateRange';
import DeviceFrame from '../bits/DeviceFrame';
import Discard from '../bits/Discard';
import DropZone from '../bits/DropZone';
import DynamicIsland from '../bits/DynamicIsland';
import ExpandCardGrid, { ExpandCard } from '../bits/ExpandCard';
import Footprints from '../bits/Footprints';
import GravityBox from '../bits/GravityBox';
import Heatmap from '../bits/Heatmap';
import HexField from '../bits/HexField';
import InlineEdit from '../bits/InlineEdit';
import JellyBlob from '../bits/JellyBlob';
import KineticHeadline from '../bits/KineticHeadline';
import LavaLamp from '../bits/LavaLamp';
import LetterSwap from '../bits/LetterSwap';
import LevelMap from '../bits/LevelMap';
import MasonryWall from '../bits/MasonryWall';
import MobileTabBar from '../bits/MobileTabBar';
import OTPInput from '../bits/OTPInput';
import { Dialog, Dropdown, Popover, Sheet, Tooltip } from '../bits/OverlayKit';
import ParallaxCollage from '../bits/ParallaxCollage';
import PasswordMeter from '../bits/PasswordMeter';
import PinCard from '../bits/PinCard';
import PixelButton from '../bits/PixelButton';
import PixelExplode from '../bits/PixelExplode';
import PixelSpinners from '../bits/PixelSpinners';
import ProximityType from '../bits/ProximityType';
import QuestLog from '../bits/QuestLog';
import RingProgress from '../bits/RingProgress';
import ScrollTilt from '../bits/ScrollTilt';
import ScrollTypography from '../bits/ScrollTypography';
import ScrollZoom from '../bits/ScrollZoom';
import ScrubNumber from '../bits/ScrubNumber';
import SpringDrawer from '../bits/SpringDrawer';
import StepperForm from '../bits/StepperForm';
import StickerBoard from '../bits/StickerBoard';
import StoryViewer from '../bits/StoryViewer';
import SwipeActions from '../bits/SwipeActions';
import TagInput from '../bits/TagInput';
import TallyUp from '../bits/TallyUp';
import TestimonialWall from '../bits/TestimonialWall';
import { Checkbox, NotifyBell, RadioGroup, Switch } from '../bits/ToggleKit';
import TracingLine from '../bits/TracingLine';
import WebcamPixels from '../bits/WebcamPixels';
import WheelPicker from '../bits/WheelPicker';

// Pocket Tavern: a made-up mobile app that turns chores into co-op quests. Its launch date,
// beta testers and numbers are invented.

const scrollTo = id => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

const QUESTS = [
  { id: 'dishes', title: 'Slay the dish mountain', xp: 30, icon: 'sword' },
  { id: 'plants', title: 'Water the forest', xp: 15, icon: 'grass' },
  { id: 'run', title: 'Run to the next village', xp: 50, icon: 'star' },
  { id: 'tax', title: 'Face the tax dragon', xp: 120, icon: 'coin' }
];

const ISLAND = {
  idle: { width: 120, height: 34, content: <span className="pt-island-dot" /> },
  timer: {
    width: 220,
    height: 40,
    label: 'Focus timer running',
    content: (
      <span className="pt-island-row">
        <Sprite name="orb" size={18} /> Focus · 18:42
      </span>
    )
  },
  done: {
    width: 260,
    height: 70,
    radius: 26,
    label: 'Quest complete',
    content: (
      <span className="pt-island-row big">
        <Sprite name="chest" size={30} />
        <span>
          <strong>Quest complete!</strong>
          <small>+30 XP · dishes slain</small>
        </span>
      </span>
    )
  }
};

const BETA = [
  { quote: 'I have washed more dishes this month than in the last year. My party keeps me honest.', name: 'Priya', role: 'Beta tester, level 14' },
  { quote: 'The tax dragon quest made me actually file my taxes. Early.', name: 'Tomás', role: 'Beta tester, level 9' },
  { quote: 'My kids fight over who gets the laundry quest now. I don’t know what happened.', name: 'Hannah', role: 'Parent of three' },
  { quote: 'Streaks with friends beat every habit app I have tried.', name: 'Wen', role: 'Beta tester, level 22' },
  { quote: 'It’s so cute that I forget it’s a to-do list.', name: 'Laila', role: 'Beta tester, level 6' },
  { quote: 'The focus timer with the little lava lamp is my whole personality now.', name: 'Ben', role: 'Student' }
].map(entry => ({ ...entry, avatar: <Sprite name="heart" size={28} /> }));

function streakData() {
  const out = [];
  const today = new Date();
  for (let i = 0; i < 140; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const v = Math.max(0, Math.round(Math.sin(i * 0.7) * 3 + Math.cos(i * 0.23) * 2 + 3 - (i % 9 === 0 ? 4 : 0)));
    out.push({ date: d.toISOString(), value: v });
  }
  return out;
}

function PhoneApp() {
  const [view, setView] = useState('idle');
  const [tab, setTab] = useState('quests');
  const [quests, setQuests] = useState(QUESTS);

  useEffect(() => {
    const order = ['idle', 'timer', 'done'];
    let i = 0;
    const id = setInterval(() => setView(order[++i % order.length]), 3000);
    return () => clearInterval(id);
  }, []);

  const finish = id => {
    setQuests(list => list.filter(q => q.id !== id));
    setView('done');
  };

  return (
    <div className="pt-app">
      <div className="pt-app-island">
        <DynamicIsland views={ISLAND} view={view} />
      </div>
      <div className="pt-app-body">
        <p className="pt-app-hello">Good morning, Wren</p>
        <RingProgress
          size={100}
          thickness={9}
          rings={[
            { label: 'XP today', value: 140, max: 200 },
            { label: 'Quests', value: 3, max: 5 },
            { label: 'Party', value: 4, max: 4 }
          ]}
          showLegend={false}
          centerLabel="Lv 7"
        />
        <p className="pt-app-label">Today’s quests · swipe to act</p>
        <div className="pt-app-list">
          {quests.map(q => (
            <SwipeActions
              key={q.id}
              label={`Actions for ${q.title}`}
              leftActions={[{ label: 'Done', icon: '✓', color: '#38b764', onSelect: () => finish(q.id) }]}
              rightActions={[{ label: 'Later', icon: '⏰', color: '#3b5dc9', onSelect: () => setView('timer') }]}
            >
              <div className="pt-quest">
                <Sprite name={q.icon} size={22} />
                <span>{q.title}</span>
                <em>+{q.xp}</em>
              </div>
            </SwipeActions>
          ))}
          {!quests.length && (
            <button type="button" className="pt-link" onClick={() => setQuests(QUESTS)}>
              All done! Reset the demo
            </button>
          )}
        </div>
      </div>
      <MobileTabBar
        value={tab}
        onValueChange={setTab}
        label="App"
        tabs={[
          { id: 'quests', label: 'Quests', icon: <Sprite name="book" size={20} /> },
          { id: 'party', label: 'Party', icon: <Sprite name="heart" size={20} />, badge: 2 },
          { id: 'loot', label: 'Loot', icon: <Sprite name="chest" size={20} /> },
          { id: 'me', label: 'Me', icon: <Sprite name="star" size={20} /> }
        ]}
      />
    </div>
  );
}

function Playground() {
  const [shredded, setShredded] = useState(false);
  const [gone, setGone] = useState(false);
  const [exploded, setExploded] = useState(false);
  return (
    <div className="pt-play">
      <div className="pt-tile pt-tile-wide">
        <h3>Chores, in a heap</h3>
        <p className="pt-hint">Grab them, throw them, stack them.</p>
        <GravityBox height={260}>
          {['Laundry', 'Dishes', 'Inbox zero', 'Vacuum', 'Call mum', 'Groceries', 'Gym', 'Read 10 pages'].map(chore => (
            <span key={chore} className="pt-chip">
              {chore}
            </span>
          ))}
        </GravityBox>
      </div>
      <div className="pt-tile">
        <h3>Finish a quest</h3>
        <p className="pt-hint">Done things deserve a dramatic exit.</p>
        {gone ? (
          <button type="button" className="pt-link" onClick={() => (setGone(false), setShredded(false))}>
            Bring it back
          </button>
        ) : (
          <Discard discarded={shredded} effect="shred" onDiscarded={() => setGone(true)}>
            <div className="pt-note">
              <strong>Clean the fridge</strong>
              <span>Something in there is alive.</span>
            </div>
          </Discard>
        )}
        {!gone && (
          <PixelButton size="sm" onPress={() => setShredded(true)}>
            Shred it
          </PixelButton>
        )}
      </div>
      <div className="pt-tile">
        <h3>Beat procrastination</h3>
        <PixelExplode exploded={exploded} direction="center">
          <div className="pt-note boss">
            <Sprite name="potion" size={36} />
            <strong>Boss: Later</strong>
          </div>
        </PixelExplode>
        <PixelButton variant="success" size="sm" onPress={() => setExploded(e => !e)}>
          {exploded ? 'Respawn' : 'Attack'}
        </PixelButton>
      </div>
      <div className="pt-tile">
        <h3>Squish to start</h3>
        <JellyBlob onClick={() => confetti({ count: 60 })} color="#38b764">
          Start my day
        </JellyBlob>
      </div>
      <div className="pt-tile">
        <h3>Quick actions</h3>
        <p className="pt-hint">Long-press or right-click the scroll.</p>
        <ContextOrb
          label="Quest actions"
          items={[
            { label: 'Complete', icon: <Sprite name="star" size={22} />, onSelect: () => confetti({ count: 40 }) },
            { label: 'Snooze', icon: <Sprite name="orb" size={22} /> },
            { label: 'Share', icon: <Sprite name="note" size={22} /> },
            { label: 'Delete', icon: <Sprite name="sword" size={22} />, danger: true }
          ]}
        >
          <div className="pt-scroll-item">
            <Sprite name="book" size={44} />
            <span>Quest scroll</span>
          </div>
        </ContextOrb>
      </div>
      <div className="pt-tile pt-tile-wide">
        <h3>Your badge wall</h3>
        <p className="pt-hint">Drag badges around. Shift + scroll to rotate.</p>
        <StickerBoard
          height={240}
          label="Badge wall"
          stickers={[
            { id: 'b1', label: 'First quest', content: <Sprite name="star" size={64} />, x: 30, y: 30, rotate: -8, size: 80 },
            { id: 'b2', label: 'Week streak', content: <Sprite name="heart" size={64} />, x: 160, y: 70, rotate: 6, size: 80 },
            { id: 'b3', label: 'Party of four', content: <Sprite name="chest" size={64} />, x: 290, y: 24, rotate: -3, size: 80 },
            { id: 'b4', label: 'Tax dragon slain', content: <Sprite name="coin" size={64} />, x: 420, y: 90, rotate: 10, size: 80 }
          ]}
        />
      </div>
      <div className="pt-tile pt-tile-wide">
        <h3>Loot that leans in</h3>
        <CursorAttractor radius={200} strength={0.4} gap={24}>
          {['gem', 'coin', 'potion', 'star', 'heart', 'chest', 'orb'].map(name => (
            <Sprite key={name} name={name} size={48} title={name} />
          ))}
        </CursorAttractor>
      </div>
    </div>
  );
}

function SignUp() {
  const [email, setEmail] = useState('');
  const [tags, setTags] = useState(['Chores', 'Fitness']);
  const [range, setRange] = useState();
  const [joined, setJoined] = useState(false);
  const [code, setCode] = useState('idle');
  const [name, setName] = useState('The Sleepy Griffin');

  const verify = value => {
    setCode('loading');
    setTimeout(() => setCode(value === '000000' ? 'error' : 'success'), 900);
  };

  return (
    <>
      <StepperForm
        width={560}
        finishLabel="Join the waitlist"
        onComplete={() => {
          setJoined(true);
          confetti({ count: 160, spread: 90 });
        }}
        steps={[
          {
            title: 'Account',
            description: 'Your email and a password for when the app opens.',
            content: (
              <div className="pt-fields">
                <label className="pt-field">
                  <span>Email</span>
                  <input type="email" name="email" required value={email} onChange={event => setEmail(event.target.value)} placeholder="you@example.com" autoComplete="email" />
                </label>
                <PasswordMeter name="password" label="Password" width={460} />
              </div>
            )
          },
          {
            title: 'Verify',
            description: 'Enter the 6-digit code we sent (any code works in this demo, except 000000).',
            content: <OTPInput length={6} status={code} onComplete={verify} message={code === 'success' ? 'Verified!' : code === 'error' ? 'That code didn’t work.' : undefined} />,
            validate: () => (code === 'success' ? true : 'Enter a code first.')
          },
          {
            title: 'Your quests',
            description: 'What should your first quests be about?',
            content: (
              <div className="pt-fields">
                <TagInput value={tags} onValueChange={setTags} suggestions={['Chores', 'Fitness', 'Study', 'Work', 'Family', 'Money', 'Cooking', 'Garden']} label="Quest topics" width={460} />
                <RadioGroup
                  label="Your phone"
                  name="platform"
                  defaultValue="ios"
                  orientation="horizontal"
                  options={[
                    { value: 'ios', label: 'iPhone' },
                    { value: 'android', label: 'Android' }
                  ]}
                />
                <DateRange label="When can you beta test?" value={range} onValueChange={setRange} months={1} minDate={new Date()} />
              </div>
            )
          },
          {
            title: 'Your tavern',
            description: 'Name it and give it a sign.',
            content: (
              <div className="pt-fields">
                <div className="pt-field">
                  <span>Tavern name (click to edit)</span>
                  <InlineEdit value={name} onSave={setName} label="Tavern name" fontSize={20} />
                </div>
                <DropZone accept="image/*" multiple={false} maxFiles={1} maxSize={2 * 1024 * 1024} title="Drop a tavern sign" hint="PNG or JPG, up to 2 MB. Stays in your browser." width={460} />
                <Switch label="Launch-day reminder" description="One email on launch day. That’s it." defaultChecked />
                <NotifyBell label="Party invites" defaultPressed />
                <Checkbox label="I’m happy to answer one short survey" defaultChecked />
              </div>
            )
          }
        ]}
        doneContent={<p className="pt-done">You’re on the list! (This is a template: nothing was sent.)</p>}
      />
      <Dialog open={joined} onOpenChange={setJoined} title={`Welcome to ${name}!`} description="You’re number 18,421 on the waitlist.">
        {({ close }) => (
          <div className="pt-dialog">
            <p>We’ll email {email || 'you'} on launch day. Until then, keep your quest log warm.</p>
            <PixelButton onPress={close}>Huzzah</PixelButton>
          </div>
        )}
      </Dialog>
    </>
  );
}

export default function LaunchTemplate() {
  const [press, setPress] = useState(false);
  const [privacy, setPrivacy] = useState(false);
  const [goal, setGoal] = useState(5);
  const [remind, setRemind] = useState('08:00');
  const [topics, setTopics] = useState(['Chores']);
  const [tint, setTint] = useState('#38b764');
  const join = () => scrollTo('pt-join');

  return (
    <div className="tpl pt" style={{ '--pt-tint': tint }}>
      <header className="pt-nav">
        <a href="#pt-top" className="pt-brand">
          <Sprite name="potion" size={30} /> Pocket Tavern
        </a>
        <nav aria-label="Main" className="pt-links">
          <LetterSwap as="a" href="#pt-how" text="How it works" />
          <LetterSwap as="a" href="#pt-play" text="Try it" />
          <LetterSwap as="a" href="#pt-stories" text="Stories" />
        </nav>
        <Dropdown
          label="Get the app"
          trigger={<button type="button" className="pt-btn">Get the app ▾</button>}
          items={[
            { label: 'iPhone (Nov 14)', onSelect: join },
            { label: 'Android (Nov 14)', onSelect: join },
            { label: 'Remind me', onSelect: join }
          ]}
        />
      </header>

      <section className="pt-hero" id="pt-top">
        <div className="tpl-bg">
          <CloudSky pixelSize={4} coverage={0.5} speed={0.08} />
        </div>
        <div className="tpl-wrap pt-hero-inner">
          <div className="pt-hero-copy">
            <p className="pt-badge">
              Launching November 14 ·{' '}
              <Tooltip content="No ads, no premium tier, no loot boxes.">
                <button type="button" className="pt-tip">
                  free forever
                </button>
              </Tooltip>
            </p>
            <KineticHeadline as="h1" text="Chores, but make it a quest." mode="breathe" fontSize={64} textColor="#2b2233" accentColor="#38b764" className="pt-h1" />
            <CutReveal as="p" text="Pocket Tavern turns your to-do list into adventures you share with friends." className="pt-lede" />
            <div className="pt-hero-actions">
              <ArcadeButtons behavior="launch" color="#38b764" onClick={join}>
                ▲ Join the waitlist
              </ArcadeButtons>
              <Popover label="Supported phones" trigger={<button type="button" className="pt-link">Which phones?</button>}>
                <p className="pt-popover">iPhone with iOS 17 or later, and Android 11 or later. Tablets work too, they just look extra cosy.</p>
              </Popover>
            </div>
            <TallyUp value={18420} goal={25000} milestones={[5000, 10000, 20000]} caption="Adventurers on the waitlist" unit="" width={420} textColor="#2b2233" mutedColor="#6b5d78" trackColor="#e3d6c1" />
          </div>
          <DeviceFrame device="phone" interactiveTilt label="Pocket Tavern on a phone" width={300}>
            <PhoneApp />
          </DeviceFrame>
        </div>
      </section>

      <section className="tpl-section pt-statement">
        <div className="tpl-wrap">
          <ScrollTypography as="h2" text="Small tasks. Big adventure." fontSize={72} className="pt-statement-text" />
        </div>
      </section>

      <ScrollZoom src="/pixel/biome-cherry.png" alt="" heading={<h2 className="pt-h2 pt-center">Your tavern grows with you</h2>} mediaStyle={{ imageRendering: 'pixelated' }}>
        <div className="pt-zoom-copy">
          <h3>Every quest adds a little something</h3>
          <p>A lantern for your first week. A garden for your first month. A dragon on the roof if you ever do your taxes.</p>
        </div>
      </ScrollZoom>

      <section className="tpl-section pt-dark" id="pt-how">
        <div className="tpl-wrap">
          <h2 className="pt-h2">How it works</h2>
          <TracingLine>
            <article className="pt-step">
              <h3>1. Pick your quest topics</h3>
              <p>Tell the tavern what you want help with. It writes your first quests for you.</p>
              <TagInput value={topics} onValueChange={setTopics} suggestions={['Chores', 'Fitness', 'Study', 'Work', 'Family', 'Money']} label="Quest topics" width={440} />
            </article>
            <article className="pt-step">
              <h3>2. Set a daily goal</h3>
              <p>
                Drag the number. I want to finish{' '}
                <ScrubNumber value={goal} onChange={setGoal} min={1} max={20} label="Daily quest goal" unit=" quests" width={110} /> a day, with a reminder at:
              </p>
              <WheelPicker options={['07:00', '08:00', '09:00', '12:00', '18:00', '21:00']} value={remind} onChange={setRemind} label="Reminder time" />
            </article>
            <article className="pt-step">
              <h3>3. Paint the tavern sign</h3>
              <p>Pick a colour. The whole page follows along.</p>
              <ColorDial value={tint} onValueChange={setTint} size={200} label="Tavern colour" />
            </article>
            <article className="pt-step">
              <h3>4. Level up together</h3>
              <p>Your party shares one map. Clear a level and everyone moves forward.</p>
              <LevelMap
                levels={[
                  { id: 1, name: 'Join', status: 'cleared', stars: 3 },
                  { id: 2, name: 'First quest', status: 'cleared', stars: 2 },
                  { id: 3, name: 'Make a party', status: 'current' },
                  { id: 4, name: 'Week streak', status: 'locked' },
                  { id: 5, name: 'Tax dragon', status: 'locked' }
                ]}
                marker={<Sprite name="heart" size={24} />}
              />
            </article>
          </TracingLine>
        </div>
      </section>

      <section className="tpl-section pt-features">
        <div className="tpl-bg">
          <HexField size={26} />
        </div>
        <div className="tpl-wrap pt-features-inner">
          <h2 className="pt-h2">What’s inside</h2>
          <ExpandCardGrid>
            <ExpandCard id="party" eyebrow="Co-op" title="Parties of four" summary="Share quests with friends, family or flatmates." media={<img src="/pixel/biome-forest.png" alt="" className="tpl-pixel-img" />}>
              <p>Invite up to three people. Everyone sees the party’s quests, cheers each other on and splits the loot.</p>
              <QuestLog
                title="Party quest log"
                width={460}
                quests={[
                  { id: 'join', title: 'Join a party', xp: 20 },
                  { id: 'cheer', title: 'Cheer a friend', xp: 10, requires: ['join'] },
                  { id: 'raid', title: 'Finish a group quest', xp: 60, requires: ['cheer'] }
                ]}
              />
            </ExpandCard>
            <ExpandCard id="streaks" eyebrow="Habits" title="Streaks you can see" summary="A calendar that fills in as you go." media={<img src="/pixel/biome-plains.png" alt="" className="tpl-pixel-img" />}>
              <p>Every day you finish a quest lights up a square. Miss one and your party can cover for you, once a week.</p>
              <Heatmap data={streakData()} weeks={20} unit="quest" title="Quests finished" />
            </ExpandCard>
            <ExpandCard id="focus" eyebrow="Focus" title="Lava-lamp timer" summary="Twenty-five calm minutes at a time." media={<div className="pt-lava"><LavaLamp blobs={6} pixelSize={5} /></div>}>
              <p>Start a focus quest and the lamp starts to bubble. Leave the app and it cools down. Come back and it picks up where you left off.</p>
              <PixelSpinners type="hourglass" label="Focus timer running" showLabel />
            </ExpandCard>
            <ExpandCard id="offline" eyebrow="Anywhere" title="Works offline" summary="Quests sync when you’re back online." media={<img src="/pixel/biome-snowy.png" alt="" className="tpl-pixel-img" />}>
              <p>On a plane or a mountain, the tavern stays open. Everything catches up the moment you have signal.</p>
              <PixelSpinners type="dots" label="Syncing" showLabel />
            </ExpandCard>
          </ExpandCardGrid>
        </div>
      </section>

      <Footprints stamps="feet" color="#94b0c2" className="pt-footprints">
        <section className="tpl-section" id="pt-play">
          <div className="tpl-wrap">
            <h2 className="pt-h2">Try it right here</h2>
            <p className="pt-body">A few pieces of the app, working in your browser. Move the mouse and you’ll leave a trail.</p>
            <Playground />
          </div>
        </section>
      </Footprints>

      <section className="tpl-section pt-dark" id="pt-stories">
        <div className="tpl-wrap pt-stories">
          <div>
            <h2 className="pt-h2">Sneak peeks</h2>
            <p className="pt-body">Tap to skip, hold to pause.</p>
            <StoryViewer
              author="Pocket Tavern"
              avatar={<Sprite name="potion" size={28} />}
              timestamp="this week"
              slides={['cherry', 'ocean', 'jungle', 'night'].map((id, i) => ({ src: `/pixel/biome-${id}.png`, alt: '', caption: ['New tavern themes', 'Seaside quests', 'Jungle gym', 'Night owls mode'][i], style: { imageRendering: 'pixelated' } }))}
            />
          </div>
          <div className="pt-collage">
            <ParallaxCollage
              height={520}
              label="App screens"
              pieces={[
                { src: '/pixel/biome-plains.png', x: 4, y: 8, width: 38, depth: 0.2, rotate: -4, style: { imageRendering: 'pixelated' } },
                { src: '/pixel/biome-desert.png', x: 52, y: 4, width: 42, depth: 0.5, rotate: 5, style: { imageRendering: 'pixelated' } },
                { src: '/pixel/biome-ocean.png', x: 18, y: 52, width: 46, depth: 0.8, rotate: 2, style: { imageRendering: 'pixelated' } },
                { content: <span className="pt-sticker">Nov 14!</span>, x: 66, y: 66, width: 24, depth: 1.1, rotate: -10 }
              ]}
            >
              <h3 className="pt-collage-title">Made with love and pixels</h3>
            </ParallaxCollage>
          </div>
        </div>
      </section>

      <section className="tpl-section">
        <div className="tpl-wrap">
          <h2 className="pt-h2">From the beta</h2>
        </div>
        <TestimonialWall testimonials={BETA} rows={2} label="Beta tester stories" />
        <div className="tpl-wrap">
          <h2 className="pt-h2 pt-gap">As seen in</h2>
          <MasonryWall minColumnWidth={240}>
            {[
              ['The Daily Quest', '“The cosiest productivity app of the year.”', 220],
              ['Pixel Weekly', '“Finally, a to-do list with a soul.”', 160],
              ['Hearth & Home', '“My flatmates now fight over the vacuum.”', 260],
              ['Indie App Club', '“Five hearts out of five.”', 180],
              ['Byte Review', '“Shockingly good offline mode.”', 200],
              ['Cosy Gamer', '“Animal-crossing energy, but for laundry.”', 240]
            ].map(([outlet, quote, h]) => (
              <PinCard key={outlet} title={outlet.toLowerCase().replace(/[^a-z]+/g, '-')} href="#pt-stories" backgroundColor="#fffaf2" textColor="#2b2233" lineColor="#d8cbb7" accentColor="#38b764" labelColor="#f6efe3">
                <div className="pt-press" style={{ minHeight: h }}>
                  <strong>{outlet}</strong>
                  <p>{quote}</p>
                </div>
              </PinCard>
            ))}
          </MasonryWall>
        </div>
      </section>

      <section className="tpl-section pt-mirror">
        <div className="tpl-wrap pt-mirror-inner">
          <div>
            <ProximityType as="h2" text="See yourself as a hero" fontSize={56} textColor="#2b2233" accentColor="#38b764" className="pt-prox" />
            <p className="pt-body">Your avatar is drawn from your camera, in pixels, right in the browser. Nothing is uploaded.</p>
          </div>
          <div className="pt-cam">
            <WebcamPixels mode="pixels" cellSize={10} title="Turn on the pixel mirror" description="Your camera stays on this page and is never recorded." />
          </div>
        </div>
      </section>

      <section className="tpl-section pt-join" id="pt-join">
        <div className="tpl-bg">
          <AuroraBands colors={['#38b764', '#73eff7', '#a7f070']} />
        </div>
        <div className="tpl-wrap pt-join-inner">
          <h2 className="pt-h2 pt-center">Join the waitlist</h2>
          <ScrollTilt tilt={18}>
            <div className="pt-form-card">
              <SignUp />
            </div>
          </ScrollTilt>
        </div>
      </section>

      <footer className="pt-footer">
        <div className="tpl-wrap pt-footer-inner">
          <p className="pt-brand">
            <Sprite name="potion" size={26} /> Pocket Tavern
          </p>
          <div className="pt-footer-links">
            <button type="button" className="pt-link" onClick={() => setPress(true)}>
              Press kit
            </button>
            <button type="button" className="pt-link" onClick={() => setPrivacy(true)}>
              Privacy
            </button>
            <Confetti>
              <button type="button" className="pt-link">
                Click for a party
              </button>
            </Confetti>
          </div>
          <p className="pt-hint">A Bits Lab template. Pocket Tavern, its testers and its press quotes are made up.</p>
        </div>
      </footer>

      <SpringDrawer open={press} onOpenChange={setPress} title="Press kit" description="Logos, screenshots and a fact sheet.">
        <div className="pt-drawer">
          <BreadcrumbTrail
            items={[
              { label: 'Pocket Tavern', href: '#pt-top' },
              { label: 'Press', href: '#pt-stories' },
              { label: 'Kit' }
            ]}
          />
          <ul className="pt-kit">
            {['Logo pack (SVG, PNG)', 'Screenshots (12)', 'Fact sheet (PDF)', 'Founder photos'].map(item => (
              <li key={item}>
                <Sprite name="chest" size={20} /> {item}
              </li>
            ))}
          </ul>
          <p className="pt-hint">Template demo: there are no files to download.</p>
        </div>
      </SpringDrawer>
      <Sheet open={privacy} onOpenChange={setPrivacy} title="Privacy, in plain words" description="The short version.">
        <ul className="pt-kit">
          <li>We store your quests so they sync between your devices.</li>
          <li>We never sell or share your data.</li>
          <li>The camera mirror on this page never leaves your browser.</li>
        </ul>
      </Sheet>
    </div>
  );
}
