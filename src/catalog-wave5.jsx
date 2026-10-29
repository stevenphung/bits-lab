import { useState } from 'react';
import Sprite from './pixel/Sprite';
import CharacterSheet from './bits/CharacterSheet';
import ReactionCombo from './bits/ReactionCombo';
import BountyBoard from './bits/BountyBoard';
import SideQuests from './bits/SideQuests';
import LevelUpStats from './bits/LevelUpStats';
import LootFilter from './bits/LootFilter';
import ReplyActions from './bits/ReplyActions';
import DraftScroll from './bits/DraftScroll';
import ThreadTrail from './bits/ThreadTrail';
import AdvisorCard from './bits/AdvisorCard';
import characterSheetSource from './bits/CharacterSheet.jsx?raw';
import reactionComboSource from './bits/ReactionCombo.jsx?raw';
import bountyBoardSource from './bits/BountyBoard.jsx?raw';
import sideQuestsSource from './bits/SideQuests.jsx?raw';
import levelUpStatsSource from './bits/LevelUpStats.jsx?raw';
import lootFilterSource from './bits/LootFilter.jsx?raw';
import replyActionsSource from './bits/ReplyActions.jsx?raw';
import draftScrollSource from './bits/DraftScroll.jsx?raw';
import threadTrailSource from './bits/ThreadTrail.jsx?raw';
import advisorCardSource from './bits/AdvisorCard.jsx?raw';

// Demo config for Wave 5, Phase B: product moments with game feel.

const slider = (name, label, min, max, step) => ({ name, type: 'slider', label, min, max, step });
const color = (name, label) => ({ name, type: 'color', label });
const toggle = (name, label) => ({ name, type: 'switch', label });

const DECISIONS = [
  { id: 'refund', title: 'Refund order #4821?', detail: 'The parcel arrived two days late. Amount: €34.', reward: '+10 trust' },
  { id: 'deploy', title: 'Ship the new onboarding on Friday?', detail: 'All checks pass. 3 reviewers approved.', reward: '+50 XP' },
  { id: 'invite', title: 'Let Mira into the design workspace?', detail: 'She asked for edit access.', acceptLabel: 'Let in', declineLabel: 'Not yet' }
];

const QUESTS = [
  { id: 'shortcut', title: 'Learn the shortcut', body: 'Press / to search from anywhere.', action: 'Try it', xp: 10, icon: <Sprite name="book" size={20} /> },
  { id: 'theme', title: 'Pick a theme', body: 'Make the workspace feel like yours.', action: 'Open themes', xp: 15, icon: <Sprite name="potion" size={20} /> },
  { id: 'invite', title: 'Invite a teammate', body: 'Projects go faster with a party.', action: 'Invite', xp: 30, icon: <Sprite name="heart" size={20} /> },
  { id: 'mobile', title: 'Get the mobile app', body: 'Check quests on the go.', action: 'Get app', xp: 20, icon: <Sprite name="gem" size={20} /> }
];

const FILTERS = [
  { id: 'type', label: 'Type', options: [{ value: 'weapon', label: 'Weapons', count: 42 }, { value: 'armor', label: 'Armour', count: 31 }, { value: 'potion', label: 'Potions', count: 18 }] },
  { id: 'rarity', label: 'Rarity', options: ['common', 'rare', 'epic', 'legendary'].map(r => ({ value: r, label: r.charAt(0).toUpperCase() + r.slice(1), rarity: r, count: { common: 64, rare: 22, epic: 7, legendary: 2 }[r] })) },
  { id: 'status', label: 'Status', options: [{ value: 'equipped', label: 'Equipped' }, { value: 'new', label: 'New' }] }
];

function SheetDemo(props) {
  const [xp, setXp] = useState(180);
  return (
    <div style={{ display: 'grid', gap: 12, justifyItems: 'center' }}>
      <CharacterSheet
        {...props}
        name="Mira Okafor"
        title="Product designer"
        avatar={<Sprite name="heart" size={36} />}
        level={7}
        xp={xp}
        xpMax={300}
        setup={{ done: 3, total: 5, label: 'Profile setup', next: 'Add a profile photo', onContinue: () => setXp(x => Math.min(300, x + 40)) }}
        stats={[
          { label: 'Quests', value: 42 },
          { label: 'Streak', value: '9d' },
          { label: 'Badges', value: 6 }
        ]}
        actions={[{ label: 'Profile' }, { label: 'Settings' }, { label: 'Keyboard shortcuts' }, { label: 'Sign out', danger: true }]}
      />
      <button type="button" className="secondary-button" onClick={() => setXp(x => (x + 40) % 340)}>
        +40 XP
      </button>
    </div>
  );
}

function BountyDemo(props) {
  const [run, setRun] = useState(0);
  return (
    <div style={{ display: 'grid', gap: 12, justifyItems: 'center' }}>
      <BountyBoard key={run} {...props} items={DECISIONS} />
      <button type="button" className="secondary-button" onClick={() => setRun(r => r + 1)}>
        Pin them back up
      </button>
    </div>
  );
}

function QuestsDemo(props) {
  const [run, setRun] = useState(0);
  return (
    <div style={{ display: 'grid', gap: 12, width: '100%', maxWidth: 760 }}>
      <SideQuests key={run} {...props} quests={QUESTS} defaultDone={['shortcut']} />
      <button type="button" className="secondary-button" style={{ justifySelf: 'center' }} onClick={() => setRun(r => r + 1)}>
        Reset quests
      </button>
    </div>
  );
}

function StatsDemo(props) {
  const [run, setRun] = useState(0);
  return (
    <div style={{ display: 'grid', gap: 12, justifyItems: 'center' }}>
      <LevelUpStats
        key={run}
        {...props}
        stats={[
          { label: 'Revenue', from: 48200, to: 53900, format: 'currency' },
          { label: 'Active users', from: 3120, to: 3480 },
          { label: 'Churn', from: 0.041, to: 0.032, format: 'percent', goodDirection: 'down' },
          { label: 'Support tickets', from: 212, to: 238, goodDirection: 'down' }
        ]}
      />
      <button type="button" className="secondary-button" onClick={() => setRun(r => r + 1)}>
        Replay
      </button>
    </div>
  );
}

function ReplyDemo(props) {
  return (
    <div style={{ display: 'grid', gap: 10, maxWidth: 520, padding: 16, background: 'var(--demo-bg, #11121e)', boxShadow: 'inset 0 0 0 2px var(--demo-line, #333c57)' }}>
      <p style={{ margin: 0, lineHeight: 1.55 }}>The quickest route to the Frost Peaks is the northern pass. Pack a warm cloak and two torches; the caves get dark after the second bridge.</p>
      <ReplyActions {...props} text="The quickest route to the Frost Peaks is the northern pass." />
    </div>
  );
}

function DraftDemo(props) {
  const [run, setRun] = useState(0);
  return (
    <div style={{ display: 'grid', gap: 12, justifyItems: 'center' }}>
      <DraftScroll
        key={run}
        {...props}
        recipients={[
          { id: 'ana', name: 'Ana Ruiz', email: 'ana@guild.example' },
          { id: 'theo', name: 'Theo Lind', email: 'theo@guild.example' }
        ]}
        subject="Your order is on its way"
        drafts={{
          Friendly: 'Hi Ana!\n\nGood news: your order left the workshop this morning and should reach you by Thursday. Thanks for your patience with the delay.\n\nCheers,\nThe Guild',
          Formal: 'Dear Ms Ruiz,\n\nYour order was dispatched this morning and is expected to arrive on Thursday. Please accept our apologies for the delay.\n\nKind regards,\nThe Guild',
          Brief: 'Hi Ana, your order shipped today and arrives Thursday. Sorry for the wait!'
        }}
        attachments={[{ name: 'receipt.pdf', size: '84 KB' }]}
      />
      <button type="button" className="secondary-button" onClick={() => setRun(r => r + 1)}>
        New draft
      </button>
    </div>
  );
}

function ThreadDemo(props) {
  return (
    <ThreadTrail
      {...props}
      comment={{ id: 'c1', author: 'Scout', agent: true, avatar: <Sprite name="orb" size={24} />, time: '2 min ago', text: 'I tidied the release notes and flagged two broken links for @Mira.', details: ['Read 14 commits since v2.3', 'Grouped changes into Features and Fixes', 'Checked 38 links, 2 were broken'] }}
      replies={[{ id: 'r1', author: 'Mira Okafor', time: '1 min ago', text: 'Thanks! @Scout can you fix the links too?' }]}
      you={{ name: 'You' }}
    />
  );
}

function AdvisorDemo(props) {
  const [run, setRun] = useState(0);
  return (
    <div style={{ display: 'grid', gap: 12, justifyItems: 'center' }}>
      <AdvisorCard
        key={run}
        {...props}
        advisor="Planner suggests"
        icon={<Sprite name="star" size={18} />}
        suggestion={{ id: 'thu', title: 'Move the launch to Thursday', body: 'Two of five reviewers are away on Friday, and Thursday traffic is 18% higher.', confidence: 0.82 }}
        alternatives={[
          { id: 'fri', title: 'Keep Friday', body: 'Ship as planned with three reviewers on call.', confidence: 0.55 },
          { id: 'mon', title: 'Wait until Monday', body: 'Everyone is back, but the campaign starts late.', confidence: 0.31 }
        ]}
        onDismiss={() => setRun(r => r + 1)}
      />
    </div>
  );
}

export const WAVE5_DEMOS = {
  'character-sheet': {
    source: characterSheetSource,
    defaults: { blocks: 16, width: 320, fillColor: '#38b764', accentColor: '#73eff7', goldColor: '#ffcd75' },
    controls: [slider('blocks', 'Bar blocks', 8, 24, 1), slider('width', 'Width', 260, 420, 10), color('fillColor', 'XP colour'), color('accentColor', 'Accent'), color('goldColor', 'Level badge')],
    docs: [
      ['name / title / avatar', 'ReactNode / string', '"Player One" / "Adventurer" / -', 'Who is signed in: an avatar node or an image URL.'],
      ['level / xp / xpMax', 'number', '1 / 0 / 100', 'The level badge and the XP bar.'],
      ['setup', '{ done, total, label?, next?, onContinue? }', '-', 'Profile setup progress, with an optional next quest and Continue button.'],
      ['stats / actions', '{ label, value }[] / { label, icon?, onSelect?, danger? }[]', '[] / []', 'Stat chips, and the account actions as a menu.'],
      ['blocks / width / colours', 'number / string', '16 / 320', 'Bar resolution, width, and backgroundColor, fillColor, accentColor, goldColor, dangerColor and more.'],
      ['Accessibility', '-', '-', 'A labelled section; the bars are progressbars with values; actions are real buttons. Reduced motion: bars appear full.']
    ],
    usage: `import CharacterSheet from "./CharacterSheet";

<CharacterSheet
  name={user.name}
  title={user.role}
  avatar={user.avatarUrl}
  level={user.level}
  xp={user.xp}
  xpMax={300}
  setup={{ done: 3, total: 5, next: "Add a profile photo", onContinue: openSetup }}
  actions={[{ label: "Settings", onSelect: openSettings }, { label: "Sign out", danger: true, onSelect: signOut }]}
/>`,
    render: props => <SheetDemo {...props} />
  },

  'reaction-combo': {
    source: reactionComboSource,
    defaults: { comboWindow: 900, showCombo: true, accentColor: '#73eff7', goldColor: '#ffcd75' },
    controls: [slider('comboWindow', 'Combo window (ms)', 300, 2000, 100), toggle('showCombo', 'Show combos'), color('accentColor', 'Accent'), color('goldColor', 'Combo colour')],
    docs: [
      ['reactions', '{ id, label, icon, count?, toggle?, tone? }[]', 'like, comment, repost, share', 'Each reaction. count is everyone else’s total; being on adds one. toggle: false makes it an action.'],
      ['active / defaultActive / onReact', 'string[] / string[] / (id, on) => void', '- / [] / -', 'Which reactions are on.'],
      ['comboWindow / showCombo', 'number / boolean', '900 / true', 'How quickly reactions must follow each other to build a combo.'],
      ['label / colours', 'string', '"Reactions"', 'Group name, and backgroundColor, accentColor, goldColor and more.'],
      ['Accessibility', '-', '-', 'Toggle buttons with aria-pressed and counts in their names; changes are announced. Reduced motion: no pops or combo burst.']
    ],
    usage: `import ReactionCombo from "./ReactionCombo";

<ReactionCombo onReact={(id, on) => save(id, on)} />`,
    render: props => <ReactionCombo {...props} />
  },

  'bounty-board': {
    source: bountyBoardSource,
    defaults: { foldDelay: 700, width: 380, acceptColor: '#38b764', declineColor: '#b13e53' },
    controls: [slider('foldDelay', 'Fold after (ms)', 200, 2000, 100), slider('width', 'Width', 300, 480, 10), color('acceptColor', 'Accept'), color('declineColor', 'Decline')],
    docs: [
      ['items', '{ id, title, detail?, reward?, acceptLabel?, declineLabel? }[]', '[]', 'Open decisions, each with two answers.'],
      ['onDecide', '(id, "accept" | "decline") => void', '-', 'Called when one is answered.'],
      ['title / acceptLabel / declineLabel / emptyMessage', 'string', '"Open decisions" / "Accept" / "Decline" / "Board cleared…"', 'Text.'],
      ['foldDelay / width / colours', 'number / string', '700 / 380', 'How long the stamp shows before the card folds away, the width, and colours.'],
      ['Accessibility', '-', '-', 'Real buttons; the answer is announced and focus moves to the next card. Reduced motion: no stamp slam or fold.']
    ],
    usage: `import BountyBoard from "./BountyBoard";

<BountyBoard items={decisions} onDecide={(id, answer) => resolve(id, answer)} />`,
    render: props => <BountyDemo {...props} />
  },

  'side-quests': {
    source: sideQuestsSource,
    defaults: { minWidth: 220, accentColor: '#73eff7', doneColor: '#38b764' },
    controls: [slider('minWidth', 'Card min width', 160, 320, 10), color('accentColor', 'Button'), color('doneColor', 'Done stamp')],
    docs: [
      ['quests', '{ id, title, body?, action?, xp?, icon?, onSelect? }[]', '[]', 'Short tips, each with one action.'],
      ['done / defaultDone / onDoneChange', 'string[] / string[] / (ids, quest) => void', '- / [] / -', 'Which quests are done.'],
      ['title / doneLabel / minWidth', 'string / string / number', '"Side quests" / "Done" / 220', 'Header, done button text and grid track width.'],
      ['Accessibility', '-', '-', 'Cards with real buttons; the score is a live region. Reduced motion: no stamp or XP float.']
    ],
    usage: `import SideQuests from "./SideQuests";

<SideQuests quests={tips} onDoneChange={ids => saveDone(ids)} />`,
    render: props => <QuestsDemo {...props} />
  },

  'level-up-stats': {
    source: levelUpStatsSource,
    defaults: { duration: 900, width: 380, goodColor: '#a7f070', badColor: '#ef7d57' },
    controls: [slider('duration', 'Count time (ms)', 200, 2400, 100), slider('width', 'Width', 300, 480, 10), color('goodColor', 'Good change'), color('badColor', 'Bad change')],
    docs: [
      ['stats', '{ label, from, to, format?, goodDirection? }[]', '[]', 'Each stat’s old and new value. format: "number", "percent", "currency", "compact" or a function. goodDirection: "up", "down" or "neutral".'],
      ['title / period / banner', 'string', '"Level up" / "since last week" / "LEVEL UP!"', 'Header text, and the banner shown when most changes are good (empty to hide).'],
      ['duration / trigger / locale / currency', 'number / "view" | "mount" / string / string', '900 / "view" / - / "USD"', 'Count timing and number formatting.'],
      ['Accessibility', '-', '-', 'Real text; each change says whether it is good or worse. Reduced motion: final values at once.']
    ],
    usage: `import LevelUpStats from "./LevelUpStats";

<LevelUpStats stats={[{ label: "Revenue", from: 48200, to: 53900, format: "currency" }, { label: "Churn", from: 0.041, to: 0.032, format: "percent", goodDirection: "down" }]} />`,
    render: props => <StatsDemo {...props} />
  },

  'loot-filter': {
    source: lootFilterSource,
    defaults: { width: 320, accentColor: '#73eff7' },
    controls: [slider('width', 'Width', 260, 420, 10), color('accentColor', 'Accent')],
    docs: [
      ['groups', '{ id, label, options: { value, label, count?, rarity?, color? }[] }[]', '[]', 'Filter groups. rarity (common…legendary) or color tints an option.'],
      ['value / defaultValue / onChange', 'Record<groupId, value[]>', '- / {} / -', 'The picked options per group.'],
      ['defaultOpen', 'string[]', 'all groups', 'Which groups start open.'],
      ['title / clearLabel / emptyLabel', 'string', '"Filters" / "Clear all" / "No filters yet"', 'Text.'],
      ['Accessibility', '-', '-', 'Native checkboxes, disclosure buttons for groups, removable chips with labels; changes are announced.']
    ],
    usage: `import LootFilter from "./LootFilter";

<LootFilter groups={filterGroups} value={filters} onChange={setFilters} />`,
    render: props => <LootFilter {...props} groups={FILTERS} defaultValue={{ rarity: ['epic', 'legendary'] }} />
  },

  'reply-actions': {
    source: replyActionsSource,
    defaults: { regenerateTime: 1200, accentColor: '#73eff7', okColor: '#a7f070' },
    controls: [slider('regenerateTime', 'Regenerate spin (ms)', 300, 3000, 100), color('accentColor', 'Accent'), color('okColor', 'Copied tick')],
    docs: [
      ['text / onCopy', 'string / () => void', '-', 'What Copy puts on the clipboard, and a callback.'],
      ['onRegenerate', '() => void | Promise', '-', 'Called on regenerate; the spin lasts until it resolves (at least regenerateTime).'],
      ['versions / version (+ defaults) / onVersionChange', 'number', '1', 'How many versions exist and which is shown; a switcher appears from 2.'],
      ['feedback / defaultFeedback / onFeedback', '"up" | "down" | null', 'null', 'Thumbs up and down.'],
      ['Accessibility', '-', '-', 'A toolbar of labelled buttons; thumbs are toggle buttons; every result is announced. Reduced motion: no spin.']
    ],
    usage: `import ReplyActions from "./ReplyActions";

<ReplyActions text={reply.text} onRegenerate={regenerate} onFeedback={vote => rate(reply.id, vote)} />`,
    render: props => <ReplyDemo {...props} />
  },

  'draft-scroll': {
    source: draftScrollSource,
    defaults: { width: 460, paperColor: '#f4e4c1', waxColor: '#b13e53', sendColor: '#3b5dc9' },
    controls: [slider('width', 'Width', 340, 560, 10), color('paperColor', 'Paper'), color('waxColor', 'Wax seal'), color('sendColor', 'Send button')],
    docs: [
      ['recipients / defaultRecipient', '{ id, name, email? }[] / string', '[] / first', 'Who it goes to.'],
      ['subject / drafts / defaultTone', 'string / Record<tone, string> / string', '"" / {} / first tone', 'The subject, and one draft body per tone (e.g. Friendly, Formal, Brief).'],
      ['attachments', '{ name, size?, id? }[]', '[]', 'Removable attachments.'],
      ['onSend / onDiscard', '({ to, subject, body, tone, attachments }) => void / () => void', '-', 'What happens on send or discard.'],
      ['author / labels / colours', 'string', '"Drafted by your agent"', 'The byline, button text and paper, wax and button colours.'],
      ['Accessibility', '-', '-', 'A form with labelled fields; tones are toggle buttons; the outcome is announced. Reduced motion: no seal slam.']
    ],
    usage: `import DraftScroll from "./DraftScroll";

<DraftScroll
  recipients={[{ id: "ana", name: "Ana Ruiz" }]}
  subject="Your order is on its way"
  drafts={{ Friendly: friendlyText, Formal: formalText }}
  onSend={draft => sendEmail(draft)}
/>`,
    render: props => <DraftDemo {...props} />
  },

  'thread-trail': {
    source: threadTrailSource,
    defaults: { width: 520, accentColor: '#73eff7' },
    controls: [slider('width', 'Width', 360, 640, 10), color('accentColor', 'Accent')],
    docs: [
      ['comment', '{ id, author, text, avatar?, time?, agent?, details? }', '-', 'The first comment. agent marks an agent; details are the folded steps behind it.'],
      ['replies', 'same shape[]', '[]', 'Replies below it; new ones are added as you reply.'],
      ['you / onReply', '{ name, avatar? } / (text) => void', '{ name: "You" } / -', 'Who is replying, and a callback.'],
      ['placeholder / replyLabel / detailsLabel / agentBadge', 'string', '"Reply…" / "Reply" / "What I did" / "AGENT"', 'Text.'],
      ['Accessibility', '-', '-', 'Articles with authors and times; details is a disclosure button; new replies are announced.']
    ],
    usage: `import ThreadTrail from "./ThreadTrail";

<ThreadTrail comment={agentComment} replies={replies} onReply={text => postReply(text)} />`,
    render: props => <ThreadDemo {...props} />
  },

  'advisor-card': {
    source: advisorCardSource,
    defaults: { undoWindow: 5000, width: 400, accentColor: '#73eff7' },
    controls: [slider('undoWindow', 'Undo window (ms)', 1000, 10000, 500), slider('width', 'Width', 320, 480, 10), color('accentColor', 'Accent')],
    docs: [
      ['suggestion / alternatives', '{ id, title, body?, confidence? }  / same[]', '- / []', 'The main suggestion and the options to switch to. confidence is 0–1.'],
      ['advisor / icon', 'string / ReactNode', '"Suggestion" / -', 'Who is suggesting.'],
      ['onAccept / onUndo / onCommit / onDismiss', '(option) => void', '-', 'Accept starts the undo window; onCommit fires when it ends.'],
      ['undoWindow / labels / colours', 'number / string', '5000', 'Grace period in ms, button text, and high/mid/low confidence colours.'],
      ['Accessibility', '-', '-', 'Options are a radio group; confidence is spelled out; accept, undo and final are announced.']
    ],
    usage: `import AdvisorCard from "./AdvisorCard";

<AdvisorCard
  suggestion={{ id: "thu", title: "Move the launch to Thursday", confidence: 0.82 }}
  alternatives={[{ id: "fri", title: "Keep Friday", confidence: 0.55 }]}
  onCommit={option => applyPlan(option.id)}
/>`,
    render: props => <AdvisorDemo {...props} />
  }
};
