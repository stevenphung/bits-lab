// Booking-card fields: each control sits in a cell of one bordered group with a tiny uppercase
// label, like Airbnb's CHECK-IN / CHECKOUT / GUESTS box.
const optionLabel = option => (option === '' ? 'none' : option === ' ' ? 'space' : option);

const formatNumber = value => (Number.isInteger(value) ? value : Number(value.toFixed(3)));

// Labels can be prop names: "mouseInteraction" reads better as "mouse interaction".
const humanize = label => label.replace(/([a-z0-9])([A-Z])/g, '$1 $2');

function Field({ label, value, children, inline }) {
  return (
    <div className={`field ${inline ? 'field-inline' : ''}`}>
      <div className="field-head">
        <span className="field-label">{humanize(label)}</span>
        {value !== undefined && <span className="field-value">{value}</span>}
      </div>
      {children}
    </div>
  );
}

function Control({ control, value, onChange }) {
  const { type, label, name } = control;

  if (type === 'slider') {
    const fill = ((value - control.min) / (control.max - control.min || 1)) * 100;
    return (
      <Field label={label} value={formatNumber(value)}>
        <input
          type="range"
          className="range"
          aria-label={label}
          min={control.min}
          max={control.max}
          step={control.step}
          value={value}
          style={{ '--fill': `${Math.min(100, Math.max(0, fill))}%` }}
          onChange={event => onChange(name, Number(event.target.value))}
        />
      </Field>
    );
  }

  if (type === 'select') {
    return (
      <Field label={label}>
        <div className="chips" role="radiogroup" aria-label={label}>
          {control.options.map(option => (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={value === option}
              className={`chip ${value === option ? 'active' : ''}`}
              onClick={() => onChange(name, option)}
            >
              {optionLabel(option)}
            </button>
          ))}
        </div>
      </Field>
    );
  }

  if (type === 'switch') {
    return (
      <Field label={label} inline>
        <input
          type="checkbox"
          role="switch"
          className="toggle"
          aria-label={label}
          checked={value}
          onChange={event => onChange(name, event.target.checked)}
        />
      </Field>
    );
  }

  if (type === 'color') {
    return (
      <Field label={label} inline>
        <span className="swatch-field">
          <code>{value}</code>
          <input
            type="color"
            className="swatch"
            aria-label={label}
            value={value}
            onChange={event => onChange(name, event.target.value)}
          />
        </span>
      </Field>
    );
  }

  return (
    <Field label={label}>
      <input
        type="text"
        className="bare-input"
        aria-label={label}
        value={value}
        onChange={event => onChange(name, event.target.value)}
      />
    </Field>
  );
}

export default function Controls({ controls, props, onChange }) {
  return (
    <div className="field-group">
      {controls.map(control => (
        <Control key={control.name} control={control} value={props[control.name]} onChange={onChange} />
      ))}
    </div>
  );
}
