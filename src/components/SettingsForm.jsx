'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useConfig } from '../hooks/useConfig';
import { VALID_FONTS, VALID_COLORS, SNOW_AMOUNTS, SNOW_SPEEDS } from '../lib/config';
import { datePresets, fromDateTimeLocal, toDateTimeLocal } from '../lib/dateInput';

const FONT_LABELS = { '3d': '3D' };
const nameOf = (value) => FONT_LABELS[value] ?? value.charAt(0).toUpperCase() + value.slice(1);

const styles = {
  section: { marginBottom: '1.5rem', padding: '1rem 1.25rem', border: '1px solid #333', borderRadius: '0.5rem' },
  heading: { margin: '0 0 1rem', fontSize: '1.25rem' },
  field: { display: 'block', marginBottom: '1rem' },
  label: { display: 'block', marginBottom: '0.4rem', fontWeight: 'bold' },
  hint: { margin: '0.4rem 0 0', fontSize: '0.85rem', color: '#999' },
  input: { width: '100%' },
  row: { display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', cursor: 'pointer' },
  presets: { display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.6rem' },
  preset: { padding: '0.35rem 0.75rem', fontSize: '0.85rem', backgroundColor: '#333', border: '1px solid #555' },
  pills: { display: 'flex', flexWrap: 'wrap', gap: '0.5rem' },
};

function Section({ title, children }) {
  return (
    <section style={styles.section}>
      <h2 style={styles.heading}>{title}</h2>
      {children}
    </section>
  );
}

function Field({ label, hint, children }) {
  return (
    <label style={styles.field}>
      <span style={styles.label}>{label}</span>
      {children}
      {hint && <p style={styles.hint}>{hint}</p>}
    </label>
  );
}

function Check({ name, checked, onChange, children }) {
  return (
    <label style={styles.row}>
      <input name={name} type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {children}
    </label>
  );
}

/** A row of checkboxes to pick several of `options`; at least one stays picked. */
function Picks({ name, label, options, picked, onChange }) {
  const toggle = (option, on) => {
    const next = on ? options.filter((o) => o === option || picked.includes(o)) : picked.filter((o) => o !== option);
    if (next.length > 0) onChange(next);
  };
  return (
    <fieldset style={{ ...styles.field, border: 'none', padding: 0, marginInline: 0 }}>
      <legend style={styles.label}>{label}</legend>
      <div style={styles.pills}>
        {options.map((option) => (
          <label key={option} style={{ ...styles.row, marginBottom: 0, minWidth: '6rem' }}>
            <input
              name={name}
              value={option}
              type="checkbox"
              checked={picked.includes(option)}
              onChange={(e) => toggle(option, e.target.checked)}
            />
            {nameOf(option)}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function Select({ name, value, options, onChange, ...rest }) {
  return (
    <select name={name} value={value} onChange={(e) => onChange(e.target.value)} style={styles.input} {...rest}>
      {options.map((option) => (
        <option key={option} value={option}>
          {nameOf(option)}
        </option>
      ))}
    </select>
  );
}

export default function SettingsForm() {
  const { config, loading, updateConfig, resetConfig } = useConfig();
  const [local, setLocal] = useState(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (config) setLocal(config);
  }, [config]);

  if (loading || !config || !local) {
    return <div>Loading settings...</div>;
  }

  // Change one setting, e.g. set('font', 'name', 'slick'), without touching the others.
  const set = (section, key, value) => setLocal((prev) => ({ ...prev, [section]: { ...prev[section], [key]: value } }));

  const handleSave = () => {
    updateConfig(local);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    if (confirm('Reset to default settings?')) resetConfig();
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '640px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ margin: 0 }}>Settings</h1>
        <Link
          href="/"
          style={{ padding: '0.5rem 1rem', backgroundColor: '#0080ff', color: 'white', borderRadius: '0.25rem' }}
        >
          ← Back to Countdown
        </Link>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSave();
        }}
      >
        <Section title="Countdown">
          <Field label="Counting down to">
            <input
              name="targetDate"
              type="datetime-local"
              required
              value={toDateTimeLocal(local.targetDate)}
              onChange={(e) => {
                const iso = fromDateTimeLocal(e.target.value);
                if (iso) setLocal((prev) => ({ ...prev, targetDate: iso }));
              }}
              style={styles.input}
            />
          </Field>
          <div style={{ ...styles.presets, margin: '-0.4rem 0 1rem' }}>
            {datePresets().map((preset) => (
              <button
                key={preset.label}
                type="button"
                style={styles.preset}
                onClick={() => setLocal((prev) => ({ ...prev, targetDate: preset.iso }))}
              >
                {preset.label}
              </button>
            ))}
          </div>

          <Field label="Message at midnight" hint="Shown when the countdown reaches zero.">
            <input
              name="celebrationMessage"
              type="text"
              value={local.celebrationMessage}
              onChange={(e) => setLocal((prev) => ({ ...prev, celebrationMessage: e.target.value }))}
              placeholder="🎉 Happy New Year! 🎉"
              style={styles.input}
            />
          </Field>
        </Section>

        <Section title="The numbers">
          {local.font.rotate ? (
            <Picks
              name="fontOptions"
              label="Fonts to cycle through"
              options={VALID_FONTS}
              picked={local.font.rotationOptions}
              onChange={(value) => set('font', 'rotationOptions', value)}
            />
          ) : (
            <Field label="Font">
              <Select name="font" value={local.font.name} options={VALID_FONTS} onChange={(value) => set('font', 'name', value)} />
            </Field>
          )}
          <Check name="fontRotate" checked={local.font.rotate} onChange={(value) => set('font', 'rotate', value)}>
            Change the font every few seconds
          </Check>

          {local.color.rotate ? (
            <Picks
              name="colorOptions"
              label="Colours to cycle through"
              options={VALID_COLORS}
              picked={local.color.rotationOptions}
              onChange={(value) => set('color', 'rotationOptions', value)}
            />
          ) : (
            <Field label="Colour">
              <Select name="color" value={local.color.value} options={VALID_COLORS} onChange={(value) => set('color', 'value', value)} />
            </Field>
          )}
          <Check name="colorRotate" checked={local.color.rotate} onChange={(value) => set('color', 'rotate', value)}>
            Change the colour every few seconds
          </Check>
        </Section>

        <Section title="Snow">
          <Check name="snowEnabled" checked={local.snowflakes.enabled} onChange={(value) => set('snowflakes', 'enabled', value)}>
            Show falling snow
          </Check>
          {local.snowflakes.enabled && (
            <>
              <Field label="Amount">
                <Select
                  name="snowAmount"
                  value={local.snowflakes.amount}
                  options={Object.keys(SNOW_AMOUNTS)}
                  onChange={(value) => set('snowflakes', 'amount', value)}
                />
              </Field>
              <Field label="Speed">
                <Select
                  name="snowSpeed"
                  value={local.snowflakes.speed}
                  options={Object.keys(SNOW_SPEEDS)}
                  onChange={(value) => set('snowflakes', 'speed', value)}
                />
              </Field>
            </>
          )}
        </Section>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <button type="submit" style={{ flex: 1 }}>
            {saved ? '✓ Saved!' : 'Save Settings'}
          </button>
          <button type="button" onClick={handleReset} style={{ flex: 1, backgroundColor: '#666' }}>
            Reset to Defaults
          </button>
        </div>
      </form>
    </div>
  );
}
