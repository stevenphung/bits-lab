import { useRef, useState } from 'react';
import { Attachment01Icon, Download04Icon, Globe02Icon, Rocket01Icon, Settings02Icon } from '@hugeicons/core-free-icons';
import Sprite from '../pixel/Sprite';

// Hand-built preview setups for React Bits components whose demos need things a usage snippet
// can't carry as data: JSX content, refs to surrounding elements, or controlled state.
//   props:    extra props (JSX allowed)
//   children: replaces the children read from the usage snippet (null for none)
//   render:   (Component, props, children) => element, for refs and state
//   wrap:     (element) => element, for siblings the component targets

const biome = id => `/pixel/biome-${id}.png`;

function Picture({ id, alt = '' }) {
  return <img src={biome(id)} alt={alt} className="rb-picture" draggable={false} />;
}

// Renders the component inside a container it gets a ref to.
function RefStage({ Comp, props, refProp, children, className = '' }) {
  const ref = useRef(null);
  return (
    <div ref={ref} className={`rb-ref-stage ${className}`}>
      <Comp {...props} {...{ [refProp]: ref }} />
      {children}
    </div>
  );
}

// Holds the value of a controlled component.
function Stateful({ Comp, props, valueProp, initial, changeProp = 'onChange' }) {
  const [value, setValue] = useState(initial);
  return <Comp {...props} {...{ [valueProp]: value, [changeProp]: setValue }} />;
}

function LaserFlowDemo({ Comp, props }) {
  const surfaceRef = useRef(null);
  return (
    <div className="rb-ref-stage rb-fill">
      <Comp {...props} surfaceRef={surfaceRef} />
      <div ref={surfaceRef} className="rb-laser-surface">
        <Picture id="night" alt="A night biome" />
      </div>
    </div>
  );
}

const LOOT = [
  { id: 1, name: 'Rotten flesh', size: '12 items' },
  { id: 2, name: 'Broken sword', size: '1 item' },
  { id: 3, name: 'Soggy map', size: '3 items' }
];

function ShredderDemo({ Comp, props }) {
  const [items, setItems] = useState(LOOT);
  return (
    <Comp
      {...props}
      items={items}
      renderItem={item => (
        <div className="rb-shred-row">
          <span>{item.name}</span>
          <span>{item.size}</span>
        </div>
      )}
      onShred={item => setItems(prev => prev.filter(entry => entry.id !== item.id))}
      onReorder={setItems}
    />
  );
}

const noop = () => {};

export const DEMOS = {
  BranchedMenu: {
    props: {
      items: [
        {
          label: 'Survival guide',
          children: [
            { value: 'wood', label: 'Gather wood', icon: Download04Icon },
            { value: 'tools', label: 'Craft tools', icon: Settings02Icon },
            { value: 'explore', label: 'Explore', icon: Rocket01Icon }
          ]
        },
        { label: 'Biomes', children: [{ value: 'plains', label: 'Plains' }, { value: 'caves', label: 'Caves' }] }
      ],
      defaultActive: 'tools'
    }
  },
  BubbleMenu: {
    props: {
      logo: (
        <span className="rb-logo">
          <Sprite name="gem" size={28} /> Bits
        </span>
      )
    }
  },
  ClickSpark: {
    children: (
      <div className="rb-click-area">
        <Sprite name="star" size={40} />
        <span>Click anywhere</span>
      </div>
    )
  },
  CardNav: { props: { logo: '/favicon.svg', logoAlt: 'Bits Lab' } },
  Crosshair: {
    render: (Comp, props) => (
      <RefStage Comp={Comp} props={props} refProp="containerRef" className="rb-tall">
        <a href="#treasure" className="rb-demo-link" onClick={event => event.preventDefault()}>
          <Sprite name="chest" size={32} /> Hover the treasure
        </a>
      </RefStage>
    )
  },
  Dock: {
    props: {
      items: [
        { icon: <Sprite name="chest" size={30} />, label: 'Inventory', active: true, onClick: noop },
        { icon: <Sprite name="pickaxe" size={30} />, label: 'Tools', onClick: noop },
        { icon: <Sprite name="book" size={30} />, label: 'Recipes', badge: 3, onClick: noop },
        { icon: <Sprite name="note" size={30} />, label: 'Music', active: true, onClick: noop },
        { icon: <Sprite name="frame" size={30} />, label: 'Map', onClick: noop },
        { icon: <Sprite name="lever" size={30} />, label: 'Settings', onClick: noop }
      ]
    }
  },
  ElasticSlider: { props: { leftIcon: <Sprite name="heart" size={22} />, rightIcon: <Sprite name="star" size={22} /> } },
  FlipCard: {
    props: {
      front: <Picture id="forest" alt="Forest biome" />,
      back: (
        <div className="rb-card-back">
          <h3>Forest biome</h3>
          <p>Discovered on day 3 · 12 oak trees</p>
        </div>
      )
    }
  },
  GlassIcons: {
    props: {
      items: [
        { icon: <Sprite name="chest" size={40} />, color: 'blue', label: 'Inventory' },
        { icon: <Sprite name="book" size={40} />, color: 'purple', label: 'Recipes' },
        { icon: <Sprite name="heart" size={40} />, color: 'red', label: 'Health' },
        { icon: <Sprite name="orb" size={40} />, color: 'indigo', label: 'XP' },
        { icon: <Sprite name="coin" size={40} />, color: 'orange', label: 'Gold' },
        { icon: <Sprite name="gem" size={40} />, color: 'green', label: 'Gems' }
      ]
    }
  },
  GridMotion: {
    props: {
      items: ['plains', 'forest', 'Dig', 'desert', 'snowy', 'Build', 'ocean', 'jungle', 'Explore', 'mesa', 'night', 'cherry'].map(entry =>
        /^[a-z]/.test(entry) ? biome(entry) : entry
      )
    }
  },
  LaserFlow: { render: (Comp, props) => <LaserFlowDemo Comp={Comp} props={props} /> },
  LogoLoop: {
    props: {
      logos: [
        ['gem', 'Diamond'],
        ['heart', 'Health'],
        ['coin', 'Gold'],
        ['potion', 'Potion'],
        ['sword', 'Sword'],
        ['orb', 'XP']
      ].map(([sprite, title]) => ({
        node: (
          <span className="rb-logo-word">
            <Sprite name={sprite} size={32} /> {title}
          </span>
        ),
        title
      }))
    }
  },
  // The pixel gem is an SVG, so MetallicPaint traces it as a vector logo.
  MetallicPaint: { props: { imageSrc: '/favicon.svg' } },
  // Noise is a grain overlay; it needs a picture underneath to show.
  Noise: {
    wrap: element => (
      <div className="rb-ref-stage rb-fill">
        <Picture id="cherry" alt="Blossom hills" />
        {element}
      </div>
    )
  },
  OrbitImages: { props: { centerContent: <h2 className="rb-orbit-title">Biomes</h2> } },
  PillNav: { props: { logo: '/favicon.svg', logoAlt: 'Bits Lab' } },
  PixelSwap: { props: { firstContent: <Picture id="plains" alt="Day" />, secondContent: <Picture id="night" alt="Night" /> } },
  PixelTransition: { props: { firstContent: <Picture id="snowy" alt="Snowy peaks" />, secondContent: <Picture id="underworld" alt="Underworld" /> } },
  PromptBar: {
    props: {
      sources: [
        { key: 'files', name: 'Inventory files', description: 'Upload from this device', icon: Attachment01Icon, attach: true },
        { key: 'map', name: 'World map', description: 'Search every biome', icon: Globe02Icon }
      ]
    }
  },
  RefineFrame: { children: <Picture id="mesa" alt="Mesa biome" /> },
  Shredder: { render: (Comp, props) => <ShredderDemo Comp={Comp} props={props} /> },
  SloshGauge: { render: (Comp, props) => <Stateful Comp={Comp} props={props} valueProp="value" initial={60} /> },
  SquishSwitch: { render: (Comp, props) => <Stateful Comp={Comp} props={props} valueProp="checked" initial={false} /> },
  Stack: { props: { cards: ['plains', 'desert', 'snowy', 'cherry'].map(id => <Picture key={id} id={id} />) } },
  StickerPeel: { props: { imageSrc: '/pixel/sprite-gem.png' } },
  SwipeRow: {
    props: {
      actions: [
        { id: 'drop', label: 'Drop', icon: <Sprite name="sword" size={22} /> },
        { id: 'stash', label: 'Stash', icon: <Sprite name="chest" size={22} />, dismiss: true }
      ]
    },
    children: <span>Rotten loot ×12</span>
  },
  TargetCursor: {
    wrap: element => (
      <>
        {element}
        <div className="rb-target-demo">
          <button type="button" className="cursor-target">
            <Sprite name="chest" size={32} /> Open chest
          </button>
          <div className="cursor-target">
            <Sprite name="pickaxe" size={32} /> Mine ore
          </div>
        </div>
      </>
    )
  },
  TearTicket: {
    props: {
      stub: (
        <div className="rb-ticket-stub">
          <h3>Admit one</h3>
          <p>Dungeon tour · Level 3</p>
          <span>No. 000042</span>
        </div>
      )
    },
    children: <span>Treasure Vault</span>
  },
  TiltedCard: { props: { backContent: <p className="rb-card-back">Treasure map · day 12</p> }, children: null },
  VariableProximity: {
    render: (Comp, props) => <RefStage Comp={Comp} props={props} refProp="containerRef" />
  }
};
