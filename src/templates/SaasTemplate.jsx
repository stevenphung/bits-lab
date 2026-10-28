import { useEffect, useRef, useState } from 'react';
import './templates.css';
import Sprite from '../pixel/Sprite';
import Accordion from '../bits/Accordion';
import AgentCard from '../bits/AgentCard';
import AvatarTooltips from '../bits/AvatarTooltips';
import BentoGrid, { BentoCard } from '../bits/BentoGrid';
import ChatBubbles from '../bits/ChatBubbles';
import CipherCard from '../bits/CipherCard';
import CodeRain from '../bits/CodeRain';
import CodeShowcase from '../bits/CodeShowcase';
import CommandPalette from '../bits/CommandPalette';
import CompareSlider from '../bits/CompareSlider';
import ConnectBeams from '../bits/ConnectBeams';
import ContourLines from '../bits/ContourLines';
import DiffReveal from '../bits/DiffReveal';
import DotMap from '../bits/DotMap';
import EdgeFX from '../bits/EdgeFX';
import FeatureTabs from '../bits/FeatureTabs';
import FeedList from '../bits/FeedList';
import FlickerGrid from '../bits/FlickerGrid';
import FocusPull from '../bits/FocusPull';
import FunnelFlow from '../bits/FunnelFlow';
import GaugeMeter from '../bits/GaugeMeter';
import GlassPanel from '../bits/GlassPanel';
import InkText from '../bits/InkText';
import InteractiveGrid from '../bits/InteractiveGrid';
import LinkPeek from '../bits/LinkPeek';
import LogoOrbit from '../bits/LogoOrbit';
import Marquee from '../bits/Marquee';
import MegaMenu from '../bits/MegaMenu';
import Minimap from '../bits/Minimap';
import MorphPopover from '../bits/MorphPopover';
import MorphWords from '../bits/MorphWords';
import PixelAvatar from '../bits/PixelAvatar';
import PricingFlip from '../bits/PricingFlip';
import RangeDual from '../bits/RangeDual';
import Reveal from '../bits/Reveal';
import RollingNumber from '../bits/RollingNumber';
import ScanScope from '../bits/ScanScope';
import ScreenScroller from '../bits/ScreenScroller';
import SideRail from '../bits/SideRail';
import SketchHighlight from '../bits/SketchHighlight';
import SkeletonShimmer from '../bits/SkeletonShimmer';
import SlideTabs from '../bits/SlideTabs';
import SmartNavbar from '../bits/SmartNavbar';
import SparkChart from '../bits/SparkChart';
import SpotlightTour from '../bits/SpotlightTour';
import StatCard from '../bits/StatCard';
import StepLoader from '../bits/StepLoader';
import StickyReveal from '../bits/StickyReveal';
import StreamingText from '../bits/StreamingText';
import SuggestionChips from '../bits/SuggestionChips';
import TerminalDemo from '../bits/TerminalDemo';
import ThinkingShimmer from '../bits/ThinkingShimmer';
import Toaster, { toast } from '../bits/ToastStack';
import ToggleGroup from '../bits/ToggleGroup';
import VanishInput from '../bits/VanishInput';
import VoiceOrb from '../bits/VoiceOrb';

// Questboard: a made-up product analytics tool with an AI copilot, "Sage". Every section is
// built from Bits Lab components; the copy and data are invented.

const scrollTo = id => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

const NAV_LINKS = [
  { href: '#features', label: 'Features' },
  { href: '#sage', label: 'Sage AI' },
  { href: '#developers', label: 'Developers' },
  { href: '#pricing', label: 'Pricing' },
  { href: '#faq', label: 'FAQ' }
];

const TEAM = ['Mira Okafor', 'Jun Park', 'Sol Varga', 'Ana Ruiz', 'Theo Lind', 'Kai Mendes', 'Rue Adler'].map(name => ({
  name,
  role: 'Questboard customer',
  avatar: <PixelAvatar seed={name} size={48} decorative />
}));

const CUSTOMERS = ['Lumen Forge', 'Northwind Arcade', 'Paperkite', 'Hollow Pine', 'Brightmoss', 'Tidewater Labs', 'Copperleaf', 'Quietfox', 'Starling & Co', 'Driftwood'];
const SPRITES = ['gem', 'star', 'orb', 'coin', 'potion', 'book', 'chest', 'note', 'heart', 'sword'];

const EVENTS = [
  { title: 'Checkout completed', body: 'Team plan · Lisbon', icon: '◆', tone: '#38b764' },
  { title: 'Feature flag flipped', body: '"new-onboarding" to 50%', icon: '⚑', tone: '#41a6f6' },
  { title: 'Rage clicks spotted', body: 'Settings → Billing', icon: '!', tone: '#ef7d57' },
  { title: 'New signup', body: 'via the changelog', icon: '+', tone: '#73eff7' },
  { title: 'Error rate up 2%', body: 'iOS 19 · build 4.2.1', icon: '×', tone: '#b13e53' },
  { title: 'Survey answered', body: '"Love the new search"', icon: '♥', tone: '#ffcd75' }
];

const TREND = [42, 47, 45, 52, 58, 55, 63, 70, 68, 77, 82, 91];

const FAQ = [
  { title: 'Do I need to change my tracking code?', content: 'No. Questboard reads the events you already send to most analytics tools, and the SDK is a single script tag if you are starting fresh.' },
  { title: 'Where is my data stored?', content: 'In the region you pick at sign-up: EU, US or APAC. It never leaves that region, and you can export or delete it at any time.' },
  { title: 'What does Sage see?', content: 'Only the aggregated metrics of the workspace you ask it about. It never trains on your data, and every answer links to the charts it used.' },
  { title: 'Can I try it with my team?', content: 'Yes. The 14-day trial includes every feature and unlimited seats. No card needed.' }
];

const PLANS = [
  { id: 'free', name: 'Starter', description: 'For side projects and small games.', monthly: 0, features: ['10k tracked users', '3 dashboards', 'Community support'], cta: 'Start free' },
  { id: 'team', name: 'Team', description: 'For product teams shipping every week.', monthly: 49, yearly: 470, features: ['250k tracked users', 'Unlimited dashboards', 'Sage AI copilot', 'Feature flags'], cta: 'Start trial', featured: true, badge: 'Most picked' },
  { id: 'scale', name: 'Scale', description: 'For studios with millions of players.', monthly: 199, yearly: 1910, features: ['Unlimited users', 'SSO and audit logs', 'Data warehouse sync', 'Priority support'], cta: 'Talk to us' }
];

const CODE_FILES = [
  {
    name: 'track.ts',
    code: `import { questboard } from "@questboard/sdk";

const qb = questboard({ key: process.env.QB_KEY });

qb.track("level_complete", {
  level: 12,
  seconds: 184,
  difficulty: "hard"
});`
  },
  {
    name: 'ask.ts',
    code: `const answer = await qb.sage.ask(
  "Why did week-2 retention drop?"
);

console.log(answer.summary);
console.log(answer.charts); // links you can open`
  },
  {
    name: 'flags.ts',
    code: `if (await qb.flags.on("new-onboarding", user)) {
  showQuestTutorial();
}`
  }
];

const TERMINAL = [
  { type: 'command', text: 'npx @questboard/cli init' },
  { type: 'spinner', text: 'Finding your events', duration: 1400, done: 'Found 38 events in 4 apps' },
  { type: 'output', text: '→ Created questboard.config.ts' },
  { type: 'command', text: 'npx @questboard/cli ask "top drop-off this week"' },
  { type: 'spinner', text: 'Sage is reading your funnels', duration: 1600, done: 'Answer ready' },
  { type: 'info', text: 'Step 3 of onboarding loses 31% of players on Android.' },
  { type: 'success', text: 'Done. Open https://questboard.app/w/demo' }
];

function useTicker(ms) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), ms);
    return () => clearInterval(id);
  }, [ms]);
  return tick;
}

function Logo() {
  return (
    <span className="qb-logo">
      <Sprite name="book" size={28} />
      <span>Questboard</span>
    </span>
  );
}

function MegaPanel({ items }) {
  return (
    <div className="qb-mega">
      {items.map(([sprite, title, body]) => (
        <a key={title} href="#features" className="qb-mega-item">
          <Sprite name={sprite} size={28} />
          <span>
            <strong>{title}</strong>
            <small>{body}</small>
          </span>
        </a>
      ))}
    </div>
  );
}

function DashboardShot() {
  return (
    <div className="qb-shot">
      <div className="qb-shot-side">
        <Logo />
        {['Overview', 'Funnels', 'Retention', 'Flags', 'Sage'].map((label, i) => (
          <span key={label} className={i === 0 ? 'on' : ''}>
            {label}
          </span>
        ))}
      </div>
      <div className="qb-shot-main">
        <h3>Good morning, Mira</h3>
        <div className="qb-shot-cards">
          {[
            ['Active players', '48.2k', '+12%'],
            ['Week-2 retention', '41%', '+3 pts'],
            ['Revenue', '$86.4k', '+8%']
          ].map(([label, value, delta]) => (
            <div key={label} className="qb-shot-card">
              <small>{label}</small>
              <strong>{value}</strong>
              <em>{delta}</em>
            </div>
          ))}
        </div>
        <div className="qb-shot-chart">
          <SparkChart data={TREND} height={160} label="Active players, last 12 weeks" animate={false} />
        </div>
        {['Onboarding step 3 drops 31% on Android', 'Search usage doubled since v4.2', 'Billing page has rage clicks'].map(text => (
          <p key={text} className="qb-shot-row">
            <Sprite name="star" size={16} /> {text}
          </p>
        ))}
      </div>
    </div>
  );
}

function LiveDashboard() {
  const [page, setPage] = useState('overview');
  const [tab, setTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const tick = useTicker(3200);
  const [events, setEvents] = useState(() => EVENTS.slice(0, 3).map((e, i) => ({ ...e, id: `e${i}`, time: new Date(Date.now() - (i + 1) * 60000) })));

  useEffect(() => {
    if (!tick) return;
    const next = EVENTS[tick % EVENTS.length];
    setEvents(list => [{ ...next, id: `e${tick + 3}`, time: new Date() }, ...list].slice(0, 8));
  }, [tick]);

  const refresh = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 1400);
  };

  const sections = [
    {
      title: 'Workspace',
      items: [
        { id: 'overview', label: 'Overview', icon: <Sprite name="chest" size={18} /> },
        { id: 'funnels', label: 'Funnels', icon: <Sprite name="potion" size={18} /> },
        { id: 'live', label: 'Live events', icon: <Sprite name="orb" size={18} />, badge: events.length }
      ]
    },
    { title: 'Team', items: [{ id: 'flags', label: 'Feature flags', icon: <Sprite name="lever" size={18} /> }] }
  ];

  return (
    <div className="qb-dash" id="qb-dash">
      <SideRail sections={sections} brand={<Logo />} value={page} onValueChange={id => (setPage(id), ['overview', 'funnels', 'live'].includes(id) && setTab(id))} width={220} />
      <div className="qb-dash-main">
        <div className="qb-dash-head">
          <SlideTabs
            label="Dashboard view"
            value={tab}
            onChange={id => (setTab(id), setPage(id))}
            stretch={false}
            items={[
              { id: 'overview', label: 'Overview' },
              { id: 'funnels', label: 'Funnels' },
              { id: 'live', label: 'Live' }
            ]}
          />
          <button type="button" className="qb-btn ghost" onClick={refresh}>
            ↻ Refresh
          </button>
        </div>
        {tab === 'overview' && (
          <SkeletonShimmer loading={loading}>
            <div className="qb-stats">
              <StatCard label="Active players" value={48230} previous={43100} trend={TREND} icon={<Sprite name="heart" size={18} />} width={240} />
              <StatCard label="Revenue" value={86400} previous={80100} format="currency" trend={[60, 62, 61, 66, 70, 74, 72, 79, 84, 86]} icon={<Sprite name="coin" size={18} />} width={240} />
              <StatCard label="Crash rate" value={0.012} previous={0.018} format="percent" goodDirection="down" trend={[18, 17, 17, 15, 16, 14, 13, 12]} icon={<Sprite name="sword" size={18} />} width={240} />
            </div>
          </SkeletonShimmer>
        )}
        {tab === 'funnels' && (
          <FunnelFlow
            label="Onboarding funnel"
            stages={[
              { label: 'Opened app', value: 12840 },
              { label: 'Made a hero', value: 9120 },
              { label: 'Finished tutorial', value: 6310 },
              { label: 'First quest', value: 4870 },
              { label: 'Came back day 2', value: 3020 }
            ]}
          />
        )}
        {tab === 'live' && <FeedList items={events} label="Live events" maxHeight="320px" width={560} onSelect={item => toast.info(item.title, { description: item.body })} />}
      </div>
    </div>
  );
}

function Integrations() {
  const box = useRef(null);
  const refs = { game: useRef(null), web: useRef(null), store: useRef(null), hub: useRef(null), slack: useRef(null), warehouse: useRef(null) };
  const node = (key, sprite, label) => (
    <div ref={refs[key]} className={`qb-node qb-node-${key}`}>
      <Sprite name={sprite} size={28} />
      <span>{label}</span>
    </div>
  );
  return (
    <div className="qb-beams" ref={box}>
      <ConnectBeams
        containerRef={box}
        color="#3b5dc9"
        width={2}
        beams={[
          { from: refs.game, to: refs.hub },
          { from: refs.web, to: refs.hub, delay: 0.6 },
          { from: refs.store, to: refs.hub, delay: 1.2 },
          { from: refs.hub, to: refs.slack, delay: 0.3 },
          { from: refs.hub, to: refs.warehouse, delay: 0.9 }
        ]}
      />
      <div className="qb-beams-col">
        {node('game', 'sword', 'Game SDK')}
        {node('web', 'frame', 'Website')}
        {node('store', 'coin', 'App stores')}
      </div>
      <div className="qb-beams-col">{node('hub', 'book', 'Questboard')}</div>
      <div className="qb-beams-col">
        {node('slack', 'note', 'Team chat')}
        {node('warehouse', 'chest', 'Warehouse')}
      </div>
    </div>
  );
}

function SageDemo() {
  const [run, setRun] = useState(0);
  const [phase, setPhase] = useState('thinking');
  const [orb, setOrb] = useState('idle');
  const [question, setQuestion] = useState('Why did week-2 retention drop?');

  useEffect(() => {
    setPhase('thinking');
    const a = setTimeout(() => setPhase('tool'), 1800);
    const b = setTimeout(() => setPhase('answer'), 3600);
    return () => (clearTimeout(a), clearTimeout(b));
  }, [run]);

  const ask = text => {
    setQuestion(text);
    setRun(r => r + 1);
  };

  const messages = [
    { id: 'm1', from: 'me', author: 'Mira', avatar: <PixelAvatar seed="Mira Okafor" size={32} decorative />, text: question },
    ...(phase === 'answer' ? [{ id: `m2-${run}`, from: 'them', author: 'Sage', avatar: <Sprite name="orb" size={32} />, text: 'Most of it is Android. Step 3 of onboarding got slower in build 4.2.1.' }] : [])
  ];

  return (
    <div className="qb-sage">
      <div className="qb-sage-chat">
        <ChatBubbles messages={messages} typing={phase !== 'answer'} typingName="Sage" height={250} label="Conversation with Sage" />
        <ThinkingShimmer
          key={`t${run}`}
          thinking={phase === 'thinking'}
          steps={[
            { label: 'Read the retention chart', status: 'done' },
            { label: 'Split by platform', status: phase === 'thinking' ? 'active' : 'done' },
            { label: 'Compare builds', status: phase === 'thinking' ? 'pending' : 'done' }
          ]}
          width={520}
        />
        {phase !== 'thinking' && (
          <AgentCard
            key={`a${run}`}
            tool="query_funnel"
            args={{ funnel: 'onboarding', split: 'platform', range: 'last 14 days' }}
            status={phase === 'tool' ? 'running' : 'success'}
            logs={['Loading 1.2M events', 'Grouping by platform', 'Android step 3: 31% drop (was 18%)']}
            result="Android, build 4.2.1, step 3 takes 4.1s longer"
            width={520}
          />
        )}
        {phase === 'answer' && (
          <div className="qb-answer">
            <StreamingText key={`s${run}`} text={'**Week-2 retention fell 6 points**, almost all of it on Android.\n\nStep 3 of onboarding (choosing a hero) now takes 4.1 seconds longer in build `4.2.1`. Players who wait more than 3 seconds there are twice as likely to leave.\n\nTry rolling `new-onboarding` back to 0% for Android while you fix it.'} speed={90} />
          </div>
        )}
        <SuggestionChips align="start" suggestions={['Which levels are too hard?', 'Who are my most loyal players?', 'What did players say about v4.2?', 'Forecast next month’s revenue', 'Find rage clicks']} onPick={item => ask(typeof item === 'string' ? item : item.text)} />
      </div>
      <div className="qb-sage-side">
        <VoiceOrb state={orb} size={200} label="Sage voice mode" />
        <ToggleGroup
          label="Voice mode"
          value={orb}
          onChange={value => value && setOrb(value)}
          items={[
            { value: 'idle', label: 'Idle' },
            { value: 'listening', label: 'Listen' },
            { value: 'thinking', label: 'Think' },
            { value: 'speaking', label: 'Speak' }
          ]}
          size="sm"
        />
        <div className="qb-diff">
          <p className="qb-kicker">Sage edits your release notes</p>
          <DiffReveal before="We fixed some bugs and made the app faster." after="Onboarding is 4 seconds faster on Android, and 12 crashes are gone." fontSize={17} />
        </div>
      </div>
    </div>
  );
}

function Pricing() {
  const [range, setRange] = useState([20, 180]);
  const histogram = [2, 4, 7, 12, 18, 22, 19, 15, 11, 8, 6, 5, 3, 2, 2, 1];
  const plan = range[1] <= 10 ? 'Starter' : range[1] <= 250 ? 'Team' : 'Scale';
  return (
    <>
      <div className="qb-estimate">
        <RangeDual
          label="Monthly tracked users (thousands)"
          min={0}
          max={400}
          step={5}
          value={range}
          onValueChange={setRange}
          histogram={histogram}
          format={v => `${v}k`}
          width={460}
        />
        <p>
          You’d fit the <strong>{plan}</strong> plan.
        </p>
      </div>
      <PricingFlip plans={PLANS} onSelect={plan => toast.success(`${plan.name} plan picked`, { description: 'This is a template, so nothing was charged.' })} />
      <EdgeFX mode="energy" color="#ffcd75" radius={14} className="qb-enterprise-wrap">
        <div className="qb-enterprise">
          <div>
            <h3>Enterprise</h3>
            <p>Custom contracts, on-premise options and a dedicated success team.</p>
          </div>
          <button type="button" className="qb-btn" onClick={() => toast('We’ll be in touch', { description: 'Template demo: no message was sent.' })}>
            Contact sales
          </button>
        </div>
      </EdgeFX>
    </>
  );
}

export default function SaasTemplate() {
  const [palette, setPalette] = useState(false);
  const [tour, setTour] = useState(false);
  const [trial, setTrial] = useState(null);

  const startTrial = () => {
    setTrial(0);
    [1, 2, 3].forEach(step => setTimeout(() => setTrial(step), step * 1100));
  };

  const go = id => () => scrollTo(id);
  const groups = [
    { heading: 'Jump to', items: NAV_LINKS.map(link => ({ id: link.href, label: link.label, onSelect: go(link.href.slice(1)) })) },
    {
      heading: 'Actions',
      items: [
        { id: 'trial', label: 'Start free trial', shortcut: ['T'], onSelect: startTrial },
        { id: 'tour', label: 'Take the tour', onSelect: () => setTour(true) },
        { id: 'toast', label: 'Say hello', onSelect: () => toast('Hello from Questboard', { description: 'Opened from the command palette.' }) }
      ]
    }
  ];

  return (
    <div className="tpl qb">
      <SmartNavbar
        brand={<Logo />}
        brandHref="#top"
        links={NAV_LINKS}
        pillWidth={860}
        actions={
          <>
            <button type="button" className="qb-btn ghost" onClick={() => setPalette(true)} aria-label="Open command palette">
              ⌘K
            </button>
            <button type="button" className="qb-btn" onClick={startTrial}>
              Start free
            </button>
          </>
        }
      />

      <header className="qb-hero" id="top">
        <div className="tpl-bg">
          <FlickerGrid color="#3b5dc9" maxOpacity={0.28} squareSize={4} gap={5} />
        </div>
        <div className="qb-hero-inner tpl-wrap">
          <p className="qb-pill">
            <Sprite name="star" size={16} /> New: <InkText text="Sage AI" fill="shimmer" /> answers product questions in plain words
          </p>
          <FocusPull as="h1" text="See what your players actually do" rack="sweep" trigger="mount" className="qb-h1" />
          <p className="qb-lede">
            Questboard turns{' '}
            <span className="qb-morph">
              <MorphWords words={['clicks', 'crashes', 'reviews', 'sessions', 'surveys']} interval={2000} align="start" />
            </span>{' '}
            into your next move. One place for analytics, flags and feedback, with an AI copilot that{' '}
            <SketchHighlight type="underline" color="#ffcd75" trigger="mount" delay={900}>
              shows its working
            </SketchHighlight>
            .
          </p>
          <div className="qb-hero-actions">
            <button type="button" className="qb-btn big" onClick={startTrial}>
              Start 14-day trial
            </button>
            <button type="button" className="qb-btn big ghost" onClick={() => setTour(true)}>
              Take the tour
            </button>
          </div>
          <VanishInput
            label="Ask Sage about the demo workspace"
            placeholders={['Why did week-2 retention drop?', 'Which level do players quit on?', 'What changed in build 4.2.1?', 'Who are my most loyal players?']}
            onSubmit={() => (scrollTo('sage'), toast.info('Sage is on it', { description: 'Scroll down to watch the answer come together.' }))}
            width={520}
          />
          <div className="qb-proof">
            <AvatarTooltips people={TEAM} max={6} size={40} label="Questboard customers" />
            <span>Trusted by 2,400 product teams</span>
          </div>
        </div>
      </header>

      <div className="qb-subnav">
        <div className="tpl-wrap">
          <MegaMenu
            label="Explore Questboard"
            items={[
              {
                label: 'Product',
                content: (
                  <MegaPanel
                    items={[
                      ['potion', 'Funnels', 'See where players drop off'],
                      ['orb', 'Live events', 'Every event as it happens'],
                      ['lever', 'Feature flags', 'Ship to 1% first'],
                      ['heart', 'Surveys', 'Ask players in the moment']
                    ]}
                  />
                )
              },
              {
                label: 'Solutions',
                content: (
                  <MegaPanel
                    items={[
                      ['sword', 'Game studios', 'Levels, economies and churn'],
                      ['frame', 'Web apps', 'Sign-up to power user'],
                      ['coin', 'Subscriptions', 'Trials, upgrades and refunds']
                    ]}
                  />
                )
              },
              { label: 'Changelog', href: '#developers' },
              { label: 'Pricing', href: '#pricing' }
            ]}
          />
        </div>
      </div>

      <section className="tpl-section qb-logos" aria-label="Customers">
        <Marquee
          label="Customers"
          lanes={1}
          height={90}
          speed={30}
          items={CUSTOMERS.map((name, i) => (
            <span key={name} className="qb-customer">
              <Sprite name={SPRITES[i]} size={22} /> {name}
            </span>
          ))}
        />
      </section>

      <ScreenScroller device="laptop" scrollLength={240} intro={<h2 className="qb-h2 center">Your whole product, on one screen</h2>}>
        <DashboardShot />
      </ScreenScroller>

      <section className="tpl-section" id="features">
        <div className="tpl-wrap">
          <Reveal effect="rise">
            <p className="qb-kicker">Features</p>
            <h2 className="qb-h2">Everything a small team needs to grow</h2>
          </Reveal>
          <BentoGrid columns={3} rowHeight={220}>
            <BentoCard
              colSpan={2}
              rowSpan={2}
              title="Funnels that explain themselves"
              description="Watch players flow through each step and see exactly where they leave."
              background={
                <div className="qb-bento-fill">
                  <FunnelFlow
                    stages={[
                      { label: 'Visit', value: 9800 },
                      { label: 'Sign up', value: 4100 },
                      { label: 'Activate', value: 2600 },
                      { label: 'Pay', value: 840 }
                    ]}
                    height={260}
                  />
                </div>
              }
            />
            <BentoCard title="Private by design" description="Encrypted at rest, in your region." background={<CipherCard width={360} aspectRatio="1.2">
                  <strong>AES-256</strong>
                </CipherCard>} />
            <BentoCard title="Always on" description="99.99% uptime, watched around the clock." background={<div className="qb-bento-fill"><ScanScope mode="radar" blips={6} /></div>} />
            <BentoCard
              title="Health score"
              description="One number for how your product feels."
              background={
                <div className="qb-bento-center">
                  <GaugeMeter value={82} label="Product health" size={150} />
                </div>
              }
            />
            <BentoCard
              colSpan={2}
              rowSpan={2}
              title="Players everywhere"
              description="Live sessions by city, updated every few seconds."
              background={
                <div className="qb-bento-fill">
                  <DotMap showLabels={false} />
                </div>
              }
            />
            <BentoCard
              title="Events this month"
              description="Counted as they arrive."
              background={
                <div className="qb-bento-center qb-big-number">
                  <RollingNumber value={1284903} />
                </div>
              }
            />
          </BentoGrid>
        </div>
      </section>

      <section className="tpl-section">
        <div className="tpl-wrap">
          <h2 className="qb-h2">Built around how you work</h2>
          <FeatureTabs
            items={[
              { title: 'Find the problem', description: 'Questboard flags the step, platform or build that changed.', media: <img src="/pixel/biome-cave.png" alt="" className="tpl-pixel-img" /> },
              { title: 'Ship a fix safely', description: 'Roll the fix out to 5% with a feature flag and watch it live.', media: <img src="/pixel/biome-forest.png" alt="" className="tpl-pixel-img" /> },
              { title: 'Hear from players', description: 'A one-question survey appears right after the fixed step.', media: <img src="/pixel/biome-plains.png" alt="" className="tpl-pixel-img" /> }
            ]}
          />
        </div>
      </section>

      <section className="tpl-section">
        <div className="tpl-wrap">
          <h2 className="qb-h2">How a week with Questboard goes</h2>
          <StickyReveal
            effect="zoom"
            sectionHeight="60vh"
            sections={[
              { title: 'Monday: connect', body: 'Paste one script tag, or point Questboard at the events you already send. Dashboards fill in within minutes.', media: <img src="/pixel/biome-desert.png" alt="" className="tpl-pixel-img" /> },
              { title: 'Wednesday: ask', body: 'Ask Sage why a number moved. It answers in plain words and links every chart it used.', media: <img src="/pixel/biome-night.png" alt="" className="tpl-pixel-img" /> },
              { title: 'Friday: ship', body: 'Release behind a flag, watch the live feed, and roll back in one click if anything looks wrong.', media: <img src="/pixel/biome-snowy.png" alt="" className="tpl-pixel-img" /> }
            ]}
          />
        </div>
      </section>

      <section className="tpl-section qb-dark" id="dashboard">
        <div className="tpl-wrap">
          <p className="qb-kicker">Try it</p>
          <h2 className="qb-h2">A live dashboard, right here</h2>
          <LiveDashboard />
        </div>
      </section>

      <section className="tpl-section" id="sage">
        <div className="tpl-wrap">
          <p className="qb-kicker">Sage AI</p>
          <h2 className="qb-h2">Ask why, get an answer you can check</h2>
          <SageDemo />
        </div>
      </section>

      <section className="tpl-section qb-integrations">
        <div className="tpl-bg">
          <InteractiveGrid cellSize={32} colors={['#29366f', '#3b5dc9', '#41a6f6']} autopilot />
        </div>
        <div className="tpl-wrap qb-integrations-inner">
          <div>
            <p className="qb-kicker">Integrations</p>
            <h2 className="qb-h2">Plays well with your stack</h2>
            <p className="qb-body">Events come in from your game, website and app stores. Insights go out to team chat and your data warehouse.</p>
            <Integrations />
          </div>
          <LogoOrbit
            size={380}
            center={<Sprite name="book" size={56} />}
            logos={['gem', 'star', 'orb', 'coin', 'potion', 'note', 'chest', 'sword', 'frame'].map(name => ({ label: name, icon: <Sprite name={name} size={28} /> }))}
            label="Integrations"
          />
        </div>
      </section>

      <section className="tpl-section" id="developers">
        <div className="tpl-wrap">
          <p className="qb-kicker">Developers</p>
          <h2 className="qb-h2">Three lines to your first insight</h2>
          <p className="qb-body">
            Typed SDKs for TypeScript, Swift, Kotlin and Unity. Read the{' '}
            <LinkPeek href="#developers" preview={{ title: 'API reference', description: 'Every endpoint, with runnable examples and rate limits.', image: '/pixel/biome-void.png', site: 'docs.questboard.app' }}>
              API reference
            </LinkPeek>{' '}
            or start from the CLI.
          </p>
          <div className="qb-dev">
            <div className="qb-rain">
              <div className="tpl-bg">
                <CodeRain glyphs="hex" color="#41a6f6" density={0.7} />
              </div>
              <TerminalDemo script={TERMINAL} title="zsh — questboard" width={560} height={300} />
            </div>
            <CodeShowcase files={CODE_FILES} width={560} label="SDK examples" />
          </div>
        </div>
      </section>

      <section className="tpl-section">
        <div className="tpl-wrap qb-compare">
          <div>
            <h2 className="qb-h2">From guessing to knowing</h2>
            <p className="qb-body">Drag to compare a week of gut feelings with a week of Questboard.</p>
          </div>
          <CompareSlider
            before={<img src="/pixel/biome-underworld.png" alt="A dark, confusing cave" className="tpl-pixel-img" />}
            after={<img src="/pixel/biome-cherry.png" alt="A bright, clear meadow" className="tpl-pixel-img" />}
            beforeLabel="Guessing"
            afterLabel="Knowing"
          />
        </div>
      </section>

      <section className="tpl-section qb-dark" id="pricing">
        <div className="tpl-wrap">
          <p className="qb-kicker">Pricing</p>
          <h2 className="qb-h2">Pay for what you track</h2>
          <Pricing />
        </div>
      </section>

      <section className="tpl-section qb-faq" id="faq">
        <div className="tpl-bg">
          <ContourLines levels={12} />
        </div>
        <div className="tpl-wrap">
          <GlassPanel className="qb-faq-panel">
            <h2 className="qb-h2">Questions, answered</h2>
            <Accordion items={FAQ} width={680} />
          </GlassPanel>
        </div>
      </section>

      <footer className="qb-footer">
        <div className="tpl-wrap">
          <Logo />
          <p>A Bits Lab template. Questboard, its customers and its numbers are made up.</p>
        </div>
      </footer>

      <div className="qb-minimap" aria-hidden={false}>
        <Minimap width={64} height={240} label="Page overview" />
      </div>
      <div className="qb-feedback">
        <MorphPopover label="Feedback" side="top" panelLabel="Send feedback">
          {({ close }) => (
            <form
              className="qb-feedback-form"
              onSubmit={event => {
                event.preventDefault();
                close();
                toast.success('Thanks for the feedback!', { description: 'Template demo: nothing was sent.' });
              }}
            >
              <textarea aria-label="Your feedback" placeholder="What should Questboard do next?" rows={3} />
              <button type="submit" className="qb-btn">
                Send
              </button>
            </form>
          )}
        </MorphPopover>
      </div>

      <CommandPalette groups={groups} open={palette} onOpenChange={setPalette} recentKey={null} />
      <SpotlightTour
        open={tour}
        onClose={() => setTour(false)}
        steps={[
          { title: 'Welcome to Questboard', body: 'A 30-second look around. Use the arrows or press Esc to leave.' },
          { target: '#features', title: 'Features', body: 'Funnels, flags, surveys and live events in one place.' },
          { target: '#qb-dash', title: 'Live dashboard', body: 'Click around: switch tabs, collapse the rail, refresh the cards.' },
          { target: '#sage', title: 'Sage AI', body: 'Ask a question and watch how it gets the answer.' },
          { target: '#pricing', title: 'Pricing', body: 'Drag the range to see which plan fits.' }
        ]}
      />
      {trial !== null && (
        <StepLoader
          title="Setting up your workspace"
          current={Math.min(trial, 2)}
          status={trial >= 3 ? 'done' : 'running'}
          fixed
          steps={[{ label: 'Creating workspace' }, { label: 'Generating demo data' }, { label: 'Training Sage on the demo' }]}
          successMessage="Your trial is ready (not really: this is a template)."
          onDone={() => setTrial(null)}
          onCancel={() => setTrial(null)}
        />
      )}
      <Toaster position="bottom-right" />
    </div>
  );
}
