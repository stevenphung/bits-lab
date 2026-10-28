import { useMemo, useState } from 'react';
import { CATEGORIES, COMPONENTS } from '../meta';
import Sprite from '../pixel/Sprite';
import AchievementToaster, { achievement } from '../bits/AchievementToast';
import AuroraBands from '../bits/AuroraBands';
import { confetti } from '../bits/Confetti';
import FocusPull from '../bits/FocusPull';
import HealthBar from '../bits/HealthBar';
import Heatmap from '../bits/Heatmap';
import HoldToConfirm from '../bits/HoldToConfirm';
import InventoryGrid from '../bits/InventoryGrid';
import JellyBlob from '../bits/JellyBlob';
import KineticHeadline from '../bits/KineticHeadline';
import LevelMap from '../bits/LevelMap';
import MarqueeLine from '../bits/MarqueeLine';
import PixelButton from '../bits/PixelButton';
import PixelLoader from '../bits/PixelLoader';
import PressStart from '../bits/PressStart';
import QuestDialog from '../bits/QuestDialog';
import QuestLog from '../bits/QuestLog';
import RatingPips from '../bits/RatingPips';
import RollingNumber from '../bits/RollingNumber';
import ScoreTicker from '../bits/ScoreTicker';
import ShadowStack from '../bits/ShadowStack';
import SignalText from '../bits/SignalText';
import TallyUp from '../bits/TallyUp';
import WarpField from '../bits/WarpField';

// The landing page. Bits Lab's story: game feel for real products. Game design solved
// feedback, progress and reward long ago; these components bring those patterns to everyday
// software. Every tile links to its component page.

const PATHS = new Map(COMPONENTS.map(c => [c.name, `/${c.category}/${c.slug}`]));
const INSTALL = 'npm install bits-lab';

function Tile({ name, pattern, blurb, wide, onOpen, children }) {
  const path = PATHS.get(name);
  return (
    <article className={`home-tile ${wide ? 'wide' : ''}`}>
      <div className="home-tile-stage">
        {pattern && <span className="home-tile-pattern">{pattern}</span>}
        {children}
      </div>
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

// A made-up app's onboarding, played as a quest: each finished task pays XP, unlocks the
// next one, lights up the level map and pops an achievement.
const QUESTS = [
  { id: 'profile', short: 'Profile', title: 'Create your profile', description: 'Add a name and a photo.', xp: 50 },
  { id: 'project', short: 'Project', title: 'Start your first project', description: 'Pick a template or start blank.', xp: 100, requires: ['profile'] },
  { id: 'invite', short: 'Invite', title: 'Invite a teammate', description: 'Work is better with a party.', xp: 150, requires: ['project'] },
  { id: 'ship', short: 'Publish', title: 'Publish something', description: 'Share it with the world.', xp: 200, requires: ['invite'] }
];
const GOAL = QUESTS.reduce((sum, q) => sum + q.xp, 0);
const TIERS = ['bronze', 'silver', 'gold', 'diamond'];

function OnboardingQuest() {
  const [done, setDone] = useState([]);
  // TallyUp counts from `start`, so each change climbs from the previous total.
  const [xpFrom, setXpFrom] = useState(0);
  const xpOf = list => QUESTS.filter(q => list.includes(q.id)).reduce((sum, q) => sum + q.xp, 0);
  const xp = xpOf(done);
  const change = next => {
    setXpFrom(xp);
    setDone(next);
  };
  const levels = QUESTS.map((q, i) => ({
    id: q.id,
    name: q.short,
    status: done.includes(q.id) ? 'cleared' : i === done.length ? 'current' : 'locked',
    stars: done.includes(q.id) ? 3 : 0
  }));

  const onQuestComplete = quest => {
    const index = QUESTS.findIndex(q => q.id === quest.id);
    achievement({ title: quest.title, description: `+${quest.xp} XP`, xp: quest.xp, tier: TIERS[index] });
    if (index === QUESTS.length - 1) confetti({ count: 140, spread: 100 });
  };

  return (
    <div className="home-quest-demo">
      <div className="home-quest-log">
        <QuestLog
          title="Welcome to Plotline"
          quests={QUESTS}
          completed={done}
          onCompletedChange={change}
          onQuestComplete={onQuestComplete}
          finishedMessage="Onboarding complete. You’re a natural."
          width={460}
        />
      </div>
      <div className="home-quest-side">
        <TallyUp value={xp} start={xpFrom} goal={GOAL} milestones={[150, 300]} trigger="mount" duration={900} caption="XP to level 2" unit="xp" width={420} />
        <HealthBar value={Math.round((done.length / QUESTS.length) * 100)} label="Setup" segments={8} />
        <LevelMap levels={levels} marker={<Sprite name="heart" size={22} />} minSpacing={110} />
      </div>
    </div>
  );
}

const BADGES = [
  { id: 'star', name: 'First week', icon: <Sprite name="star" size={34} />, rarity: 'rare' },
  { id: 'heart', name: 'Helpful reply', icon: <Sprite name="heart" size={34} />, count: 3 },
  { id: 'gem', name: 'Power user', icon: <Sprite name="gem" size={34} />, rarity: 'legendary' },
  null,
  { id: 'coin', name: 'Referral', icon: <Sprite name="coin" size={34} />, count: 12 },
  null,
  { id: 'book', name: 'Read the docs', icon: <Sprite name="book" size={34} /> },
  null
];

function streakData() {
  const out = [];
  const today = new Date();
  for (let i = 0; i < 120; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    out.push({ date: d.toISOString(), value: Math.max(0, Math.round(Math.sin(i * 0.6) * 3 + Math.cos(i * 0.21) * 2 + 3 - (i % 11 === 0 ? 5 : 0))) });
  }
  return out;
}

export default function HomePage({ onOpen, go }) {
  const [score, setScore] = useState(1200);
  const [combo, setCombo] = useState(1);
  const streaks = useMemo(streakData, []);
  const start = PATHS.get('QuestLog');

  return (
    <div className="home">
      <section className="home-hero" aria-label="Welcome">
        <div className="home-bg" aria-hidden="true">
          <WarpField speed={0.3} colors={['#f4f4f4', '#73eff7', '#ffcd75']} />
        </div>
        <div className="home-hero-inner">
          <p className="home-eyebrow">
            <Sprite name="gem" size={18} /> Game feel for real products
          </p>
          <ShadowStack as="h1" text="Make your app feel like a game people want to play." mode="extrude" depth={9} fontSize="clamp(26px, 5.2vw, 64px)" faceColor="#ffcd75" colors={['#ef7d57', '#b13e53', '#5d275d']} className="home-title" />
          <SignalText as="p" text="Quests. Combos. Achievements. Every click feels good." mode="scramble" charset="blocks" trigger="mount" className="home-lede" />
          <p className="home-sub">
            Games solved feedback, progress and reward decades ago. Bits Lab brings those tricks to everyday software: {COMPONENTS.length} open-source React components where onboarding becomes a quest, milestones become achievements and risky actions burn a fuse.
          </p>
          <div className="home-cta">
            <PixelButton size="lg" onPress={() => go(start)}>
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
        label="Game-feel components"
        items={['QuestLog', 'AchievementToast', 'LevelMap', 'HealthBar', 'ScoreTicker', 'TallyUp', 'HoldToConfirm', 'RatingPips', 'PixelLoader', 'QuestDialog', 'InventoryGrid', 'PressStart'].map(name => (
          <a key={name} href={PATHS.get(name)} onClick={event => onOpen(event, PATHS.get(name))} className="home-marquee-link">
            {name}
          </a>
        ))}
        separator="✦"
      />

      <section className="home-section" aria-labelledby="home-demo">
        <div className="home-wrap">
          <p className="home-kicker">Play the demo</p>
          <h2 id="home-demo" className="home-h2">
            Onboarding nobody skips: it’s a quest.
          </h2>
          <p className="home-body">This is a made-up app’s setup checklist, built from five Bits Lab components. Tick off a task: it pays XP, unlocks the next one, moves you along the map and pops an achievement.</p>
          <OnboardingQuest />
        </div>
      </section>

      <section className="home-section home-quest" aria-labelledby="home-patterns">
        <div className="home-wrap">
          <p className="home-kicker">Game patterns, product moments</p>
          <h2 id="home-patterns" className="home-h2">
            The tricks that keep players coming back, ready for your product.
          </h2>
          <div className="home-grid home-grid-tall">
            <Tile name="AchievementToast" pattern="Reward" blurb="Celebrate milestones people actually reach" onOpen={onOpen}>
              <button type="button" className="home-mini-btn" onClick={() => achievement({ title: 'First export', description: 'You shared your first report.', xp: 25, tier: 'silver', icon: <Sprite name="chest" size={28} /> })}>
                Export a report
              </button>
            </Tile>
            <Tile name="ScoreTicker" pattern="Feedback" blurb="Make every action count, visibly" onOpen={onOpen}>
              <div className="home-col">
                <ScoreTicker value={score} combo={combo} digits={6} size={28} label="POINTS" />
                <button
                  type="button"
                  className="home-mini-btn"
                  onClick={() => {
                    setScore(s => s + 100 * combo);
                    setCombo(c => Math.min(c + 1, 5));
                  }}
                >
                  Answer a ticket
                </button>
              </div>
            </Tile>
            <Tile name="HoldToConfirm" pattern="Caution" blurb="Risky actions burn a fuse, not your data" onOpen={onOpen}>
              <HoldToConfirm doneLabel="Workspace deleted (not really)">Hold to delete workspace</HoldToConfirm>
            </Tile>
            <Tile name="Heatmap" pattern="Streaks" blurb="Show the habit people are building" wide onOpen={onOpen}>
              <Heatmap data={streaks} weeks={18} unit="session" title="Your writing streak" />
            </Tile>
            <Tile name="RatingPips" pattern="Ratings" blurb="Heart containers for feedback" onOpen={onOpen}>
              <div className="home-col">
                <p className="home-tile-q">How was your delivery?</p>
                <RatingPips defaultValue={4} label="Rate your delivery" />
              </div>
            </Tile>
            <Tile name="QuestDialog" pattern="Guidance" blurb="A friendly guide instead of a manual" onOpen={onOpen}>
              <QuestDialog
                width={320}
                fontSize={11}
                portraitSize={52}
                loop
                lines={[
                  { speaker: 'Guide', portrait: <Sprite name="book" size={44} />, text: 'New here? Let me show you the three buttons that matter.', choices: [{ label: 'Show me' }, { label: 'I’ll explore' }] },
                  { speaker: 'Guide', portrait: <Sprite name="book" size={44} />, text: 'Great. You can always find me in the help menu.' }
                ]}
              />
            </Tile>
            <Tile name="PixelLoader" pattern="Waiting" blurb="Loading screens with tips, not dead air" wide onOpen={onOpen}>
              <PixelLoader label="Importing your contacts" tips={['Tip: drag a contact onto a project to add them.', 'Tip: press / to search from anywhere.', 'Tip: you can undo any change for 30 days.']} simulateDuration={7000} loop width={420} />
            </Tile>
            <Tile name="InventoryGrid" pattern="Collections" blurb="Badges and items people love to collect" onOpen={onOpen}>
              <InventoryGrid items={BADGES} columns={4} slotSize={52} label="Badge collection" />
            </Tile>
            <Tile name="JellyBlob" pattern="Juice" blurb="Buttons with bounce, so clicks feel good" wide onOpen={onOpen}>
              <JellyBlob onClick={event => confetti({ origin: event?.currentTarget, count: 40 })} color="#38b764">
                Save changes
              </JellyBlob>
            </Tile>
          </div>
          <p className="home-more">
            <a href={start} onClick={event => onOpen(event, start)}>
              Browse all {COMPONENTS.length} components ►
            </a>
          </p>
        </div>
      </section>

      <section className="home-section" aria-labelledby="home-quest">
        <div className="home-wrap home-quest-inner">
          <div>
            <p className="home-kicker">Your quest</p>
            <h2 id="home-quest" className="home-h2">
              Add game feel to your product in four moves.
            </h2>
            <ol className="home-steps">
              <li>
                <span>
                  <strong>Pick</strong> a moment that feels flat: onboarding, saving, waiting.
                </span>
              </li>
              <li>
                <span>
                  <strong>Tune</strong> a component on the Crafting Table until it feels right.
                </span>
              </li>
              <li>
                <span>
                  <strong>Copy</strong> the code, or <code>npm install bits-lab</code>.
                </span>
              </li>
              <li>
                <span>
                  <strong>Ship</strong> it, and watch people stick around.
                </span>
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
          />
        </div>
      </section>

      <section className="home-manifesto" aria-label="Why Bits Lab">
        <div className="home-bg" aria-hidden="true">
          <AuroraBands />
        </div>
        <div className="home-wrap home-manifesto-inner">
          <KineticHeadline as="h2" text="Software should feel this good." mode="breathe" fontSize={56} className="home-kinetic" />
          <FocusPull as="p" text="People don’t remember features. They remember how your product made them feel. Give them progress, feedback and a reason to come back." className="home-manifesto-text" />
          <ul className="home-principles">
            <li>
              <Sprite name="star" size={22} />
              <span>
                <strong>Every action answers back.</strong> Clicks, saves and sends all get a response.
              </span>
            </li>
            <li>
              <Sprite name="heart" size={22} />
              <span>
                <strong>Progress you can see.</strong> Bars, maps and streaks show how far people have come.
              </span>
            </li>
            <li>
              <Sprite name="chest" size={22} />
              <span>
                <strong>Rewards that mean something.</strong> Celebrate real milestones, never empty clicks.
              </span>
            </li>
            <li>
              <Sprite name="lever" size={22} />
              <span>
                <strong>Fun for everyone.</strong> Keyboard-friendly, screen-reader friendly, and calm with reduced motion.
              </span>
            </li>
          </ul>
        </div>
      </section>

      <section className="home-final" aria-label="Get started">
        <PressStart text="Press start" startedText="Let’s play!" subtext={`${COMPONENTS.length} components are waiting`} listenGlobally={false} onStart={() => setTimeout(() => go(start), 700)} />
      </section>

      <AchievementToaster position="bottom-right" />
    </div>
  );
}
