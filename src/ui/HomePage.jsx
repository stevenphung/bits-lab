import { useEffect, useState } from 'react';
import { CATEGORIES, COMPONENTS } from '../meta';
import Sprite from '../pixel/Sprite';
import AgentCard from '../bits/AgentCard';
import AuroraBands from '../bits/AuroraBands';
import ChatBubbles from '../bits/ChatBubbles';
import { confetti } from '../bits/Confetti';
import DiffReveal from '../bits/DiffReveal';
import FeedList from '../bits/FeedList';
import FocusPull from '../bits/FocusPull';
import HoldToConfirm from '../bits/HoldToConfirm';
import KineticHeadline from '../bits/KineticHeadline';
import LevelMap from '../bits/LevelMap';
import MarqueeLine from '../bits/MarqueeLine';
import PixelButton from '../bits/PixelButton';
import PixelSpinners from '../bits/PixelSpinners';
import PressStart from '../bits/PressStart';
import QuestDialog from '../bits/QuestDialog';
import RollingNumber from '../bits/RollingNumber';
import ShadowStack from '../bits/ShadowStack';
import SignalText from '../bits/SignalText';
import StepLoader from '../bits/StepLoader';
import StreamingText from '../bits/StreamingText';
import SuggestionChips from '../bits/SuggestionChips';
import ThinkingShimmer from '../bits/ThinkingShimmer';
import Toaster, { toast } from '../bits/ToastStack';
import VoiceOrb from '../bits/VoiceOrb';
import WarpField from '../bits/WarpField';

// The landing page. Bits Lab's mission: the foundation for agent–human interfaces, the parts
// people use to see what an agent is doing, steer it and stay in charge. Every tile links to
// its component page.

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
  };
  return (
    <button type="button" className="home-install" onClick={copy} aria-label={`Copy ${INSTALL}`}>
      <span className="home-install-prompt">$</span>
      <code>{INSTALL}</code>
      <span className="home-install-copy">{copied ? 'Copied!' : 'Copy'}</span>
    </button>
  );
}

// One full turn of the loop, scripted: ask → think → act → review → approve.
const TASKS = [
  { ask: 'Make the onboarding copy friendlier.', file: 'copy/onboarding.md', before: 'Complete the required fields to proceed with account creation.', after: 'Just a few details and you’re in. We saved your spot.' },
  { ask: 'Shorten the pricing FAQ.', file: 'pricing/faq.md', before: 'Our plans are billed on a recurring monthly or annual basis.', after: 'Pay monthly or yearly. Cancel any time.' },
  { ask: 'Fix the typos in the welcome email.', file: 'emails/welcome.md', before: 'Welcome to the teh team, we are glad your here.', after: 'Welcome to the team. We’re glad you’re here.' }
];

function AgentConsole() {
  const [run, setRun] = useState({ id: 0, task: 0 });
  const [phase, setPhase] = useState('think');
  const task = TASKS[run.task];

  useEffect(() => {
    setPhase('think');
    const timers = [setTimeout(() => setPhase('act'), 2200), setTimeout(() => setPhase('review'), 4600)];
    return () => timers.forEach(clearTimeout);
  }, [run]);

  const start = index => setRun(current => ({ id: current.id + 1, task: index }));
  const next = () => start((run.task + 1) % TASKS.length);
  const approve = () => {
    setPhase('done');
    toast.success('Change shipped', {
      description: `The agent updated ${task.file}.`,
      action: { label: 'Undo', onClick: () => toast.info('Reverted', { description: 'Back to the original copy.' }) }
    });
  };

  const reviewing = phase === 'review' || phase === 'done';
  const messages = [
    { id: `q${run.id}`, from: 'me', author: 'You', text: task.ask },
    ...(reviewing ? [{ id: `a${run.id}`, from: 'them', author: 'Agent', avatar: <Sprite name="orb" size={28} />, text: 'Here’s my edit. Review it, then hold the button to approve.' }] : [])
  ];

  return (
    <div className="home-console">
      <div className="home-console-chat">
        <ChatBubbles messages={messages} typing={!reviewing} typingName="Agent" height={240} label="Conversation with an agent" />
        <SuggestionChips align="start" suggestions={TASKS.map(t => t.ask)} onPick={item => start(TASKS.findIndex(t => t.ask === (typeof item === 'string' ? item : item.text)))} label="Give the agent a task" />
      </div>
      <div className="home-console-work" aria-live="polite">
        <ThinkingShimmer
          key={`t${run.id}`}
          thinking={phase === 'think'}
          steps={[
            { label: 'Read the request', status: 'done' },
            { label: `Find ${task.file}`, status: phase === 'think' ? 'active' : 'done' },
            { label: 'Draft a better version', status: phase === 'think' ? 'pending' : 'done' }
          ]}
          width={480}
        />
        {phase !== 'think' && <AgentCard key={`a${run.id}`} tool="edit_file" args={{ file: task.file }} status={phase === 'act' ? 'running' : 'success'} logs={[`Opened ${task.file}`, 'Rewrote 1 sentence', 'Ran the spell check']} result="1 file changed" width={480} />}
        {reviewing && (
          <div className="home-review">
            <p className="home-kicker">Review the change</p>
            <DiffReveal key={`d${run.id}`} before={task.before} after={task.after} fontSize={17} showControls={false} />
            <div className="home-review-actions">
              {phase === 'review' ? (
                <>
                  <HoldToConfirm onConfirm={approve} doneLabel="Approved">
                    Hold to approve
                  </HoldToConfirm>
                  <button type="button" className="home-mini-btn" onClick={next}>
                    Reject
                  </button>
                </>
              ) : (
                <button type="button" className="home-mini-btn" onClick={next}>
                  ↻ Run another task
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const ACTIVITY = [
  { id: 'a1', title: 'Agent opened a pull request', body: 'Friendlier onboarding copy', icon: '↑', tone: '#41a6f6' },
  { id: 'a2', title: 'You approved a change', body: 'pricing/faq.md', icon: '✓', tone: '#38b764' },
  { id: 'a3', title: 'Agent paused for input', body: 'Which tone: playful or calm?', icon: '?', tone: '#ffcd75' }
].map((item, i) => ({ ...item, time: new Date(Date.now() - (i + 1) * 4 * 60000) }));

export default function HomePage({ onOpen, go }) {
  const [step, setStep] = useState(0);
  const [replay, setReplay] = useState(0);
  const start = PATHS.get('AgentCard');

  // The small tiles cycle through their states; the streaming answer replays more slowly.
  useEffect(() => {
    const tick = setInterval(() => setStep(s => (s + 1) % 4), 1800);
    const again = setInterval(() => setReplay(r => r + 1), 9000);
    return () => (clearInterval(tick), clearInterval(again));
  }, []);

  return (
    <div className="home">
      <section className="home-hero" aria-label="Welcome">
        <div className="home-bg" aria-hidden="true">
          <WarpField speed={0.3} colors={['#f4f4f4', '#73eff7', '#ffcd75']} />
        </div>
        <div className="home-hero-inner">
          <p className="home-eyebrow">
            <Sprite name="orb" size={18} /> The foundation for agent–human interfaces
          </p>
          <ShadowStack as="h1" text="Build the interface between people and agents." mode="extrude" depth={9} fontSize="clamp(28px, 5.6vw, 68px)" faceColor="#ffcd75" colors={['#ef7d57', '#b13e53', '#5d275d']} className="home-title" />
          <SignalText as="p" text="Show the work. Ask before acting. Keep people in charge." mode="scramble" charset="blocks" trigger="mount" className="home-lede" />
          <p className="home-sub">
            {COMPONENTS.length} open-source React components for the moments that matter when software can think: streaming answers, showing progress, asking for approval and handing back control.
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
        label="Components for agent interfaces"
        items={['ChatBubbles', 'StreamingText', 'ThinkingShimmer', 'AgentCard', 'HoldToConfirm', 'DiffReveal', 'StepLoader', 'SuggestionChips', 'VoiceOrb', 'CommandPalette', 'ToastStack', 'FeedList'].map(name => (
          <a key={name} href={PATHS.get(name)} onClick={event => onOpen(event, PATHS.get(name))} className="home-marquee-link">
            {name}
          </a>
        ))}
        separator="✦"
      />

      <section className="home-section" aria-labelledby="home-loop">
        <div className="home-wrap">
          <p className="home-kicker">The loop</p>
          <h2 id="home-loop" className="home-h2">
            Ask. Think. Act. Review. Approve. Every step is a component.
          </h2>
          <p className="home-body">This console is made of seven Bits Lab components and runs on its own. Give the agent a task, watch it work, then hold to approve its change.</p>
          <AgentConsole />
        </div>
      </section>

      <section className="home-section home-quest" aria-labelledby="home-pillars">
        <div className="home-wrap">
          <p className="home-kicker">What people need from an agent</p>
          <h2 id="home-pillars" className="home-h2">
            Talk naturally, see the work, decide, and enjoy the wait.
          </h2>
          <div className="home-grid home-grid-tall">
            <Tile name="StreamingText" blurb="Talk naturally: answers that arrive word by word" wide onOpen={onOpen}>
              <div className="home-stream">
                <StreamingText key={replay} text={'**Talk naturally.** Answers stream in as they are written, with Markdown, `code` and a soft tail, so people can start reading at once.'} speed={40} />
              </div>
            </Tile>
            <Tile name="VoiceOrb" blurb="Or by voice: listening, thinking and speaking" onOpen={onOpen}>
              <VoiceOrb state={['listening', 'thinking', 'speaking', 'idle'][step]} size={150} label="Voice assistant demo" />
            </Tile>
            <Tile name="StepLoader" blurb="See the work: honest, step-by-step progress" onOpen={onOpen}>
              <StepLoader steps={[{ label: 'Reading files' }, { label: 'Planning changes' }, { label: 'Writing the patch' }]} current={Math.min(step, 2)} status={step === 3 ? 'done' : 'running'} title="Working on it" width={300} maxListHeight={160} />
            </Tile>
            <Tile name="FeedList" blurb="Keep a trail: what the agent did, and when" onOpen={onOpen}>
              <FeedList items={ACTIVITY} label="Agent activity" width={300} maxHeight="210px" />
            </Tile>
            <Tile name="QuestDialog" blurb="Decide: the agent asks before it acts" onOpen={onOpen}>
              <QuestDialog
                width={320}
                fontSize={11}
                portraitSize={52}
                loop
                lines={[
                  { speaker: 'Agent', portrait: <Sprite name="orb" size={44} />, text: 'I can delete 214 unused images. Go ahead?', choices: [{ label: 'Yes, delete them' }, { label: 'Show me first' }] },
                  { speaker: 'Agent', portrait: <Sprite name="orb" size={44} />, text: 'Got it. Nothing happens without your word.' }
                ]}
              />
            </Tile>
            <Tile name="ToastStack" blurb="Undo anything: every action can be taken back" onOpen={onOpen}>
              <button
                type="button"
                className="home-mini-btn"
                onClick={() => toast('Agent archived 12 emails', { description: 'From the “Newsletters” label.', action: { label: 'Undo', onClick: () => toast.success('Restored 12 emails') } })}
              >
                Let the agent tidy up
              </button>
            </Tile>
            <Tile name="PixelSpinners" blurb="Enjoy the wait: loading states with charm" wide onOpen={onOpen}>
              <div className="home-row">
                {['blocks', 'bar', 'dots', 'hourglass', 'orbit'].map(type => (
                  <PixelSpinners key={type} type={type} label={`${type} spinner`} />
                ))}
              </div>
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
              From idea to a shipped agent interface in four moves.
            </h2>
            <ol className="home-steps">
              <li>
                <span>
                  <strong>Pick</strong> the moments your agent needs: chat, progress, approval.
                </span>
              </li>
              <li>
                <span>
                  <strong>Tune</strong> each one on the Crafting Table until it feels right.
                </span>
              </li>
              <li>
                <span>
                  <strong>Copy</strong> the code, or <code>npm install bits-lab</code>.
                </span>
              </li>
              <li>
                <span>
                  <strong>Ship</strong> it, so people work with your agent, not around it.
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
          <KineticHeadline as="h2" text="Agents do the work. People stay in charge." mode="breathe" fontSize={52} className="home-kinetic" />
          <FocusPull as="p" text="An agent is only as trustworthy as the interface around it. Make it clear, honest, interruptible and kind." className="home-manifesto-text" />
          <ul className="home-principles">
            <li>
              <Sprite name="book" size={22} />
              <span>
                <strong>Show the work.</strong> Every step visible, nothing hidden.
              </span>
            </li>
            <li>
              <Sprite name="lever" size={22} />
              <span>
                <strong>Ask before acting.</strong> Big moves need a clear yes.
              </span>
            </li>
            <li>
              <Sprite name="heart" size={22} />
              <span>
                <strong>Let people interrupt.</strong> Pause, undo or take over at any time.
              </span>
            </li>
            <li>
              <Sprite name="star" size={22} />
              <span>
                <strong>Make it delightful.</strong> Accessible, keyboard-friendly and fun.
              </span>
            </li>
          </ul>
        </div>
      </section>

      <section className="home-final" aria-label="Get started">
        <PressStart text="Press start" startedText="Let’s build!" subtext="The interface layer for people and agents" listenGlobally={false} onStart={() => setTimeout(() => go(start), 700)} />
      </section>

      <Toaster position="bottom-right" />
    </div>
  );
}
