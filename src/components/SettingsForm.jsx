'use client';

import { useState, useEffect } from 'react';
import { useConfig } from '../hooks/useConfig';
import { VALID_FONTS } from '../lib/config';
import Link from 'next/link';

const COLOR_OPTIONS = ['cyan', 'magenta', 'yellow', 'blue', 'green', 'red', 'white', 'gray'];

export default function SettingsForm() {
  const { config, loading, updateConfig, resetConfig } = useConfig();
  const [localConfig, setLocalConfig] = useState(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (config) {
      setLocalConfig({ ...config });
    }
  }, [config]);

  if (loading || !config || !localConfig) {
    return <div>Loading settings...</div>;
  }

  const handleSave = () => {
    updateConfig(localConfig);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    if (confirm('Reset to default settings?')) {
      resetConfig();
      setLocalConfig({ ...config });
    }
  };

  const updateNested = (path, value) => {
    const keys = path.split('.');
    const newConfig = { ...localConfig };
    let current = newConfig;
    
    for (let i = 0; i < keys.length - 1; i++) {
      current[keys[i]] = { ...current[keys[i]] };
      current = current[keys[i]];
    }
    
    current[keys[keys.length - 1]] = value;
    setLocalConfig(newConfig);
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto', minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>Settings</h1>
        <Link href="/" style={{ padding: '0.5rem 1rem', backgroundColor: '#0080ff', color: 'white', borderRadius: '0.25rem', textDecoration: 'none' }}>
          ← Back to Countdown
        </Link>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
        {/* Target Date & Time */}
        <div style={{ marginBottom: '2rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
            Target Date & Time
          </label>
          
          {/* Display current value */}
          {localConfig.targetDate && (
            <div style={{ 
              marginBottom: '0.75rem', 
              padding: '0.75rem', 
              backgroundColor: '#1a1a1a', 
              borderRadius: '0.25rem',
              fontSize: '0.9rem',
              color: '#ccc'
            }}>
              Current: {(() => {
                const date = new Date(localConfig.targetDate);
                return date.toLocaleString('en-US', { 
                  weekday: 'long',
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: true
                });
              })()}
            </div>
          )}
          
          {/* Date and Time inputs */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#ccc' }}>
                Date
              </label>
              <input
                type="date"
                value={localConfig.targetDate ? (() => {
                  // Convert UTC date to local date for display
                  const date = new Date(localConfig.targetDate);
                  const year = date.getUTCFullYear();
                  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
                  const day = String(date.getUTCDate()).padStart(2, '0');
                  return `${year}-${month}-${day}`;
                })() : ''}
                onChange={(e) => {
                  if (e.target.value) {
                    const currentDate = localConfig.targetDate ? new Date(localConfig.targetDate) : new Date();
                    const [year, month, day] = e.target.value.split('-');
                    // Create date in LOCAL time, preserving current LOCAL time
                    const localDate = new Date(
                      parseInt(year),
                      parseInt(month) - 1,
                      parseInt(day),
                      currentDate.getHours(),
                      currentDate.getMinutes(),
                      currentDate.getSeconds()
                    );
                    // Convert to UTC for storage
                    updateNested('targetDate', localDate.toISOString());
                  }
                }}
                style={{ width: '100%', padding: '0.5rem', fontSize: '1rem' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#ccc' }}>
                Time
              </label>
              <input
                type="time"
                value={localConfig.targetDate ? (() => {
                  // Convert UTC time to local time for display
                  const date = new Date(localConfig.targetDate);
                  const hours = date.getHours().toString().padStart(2, '0');
                  const minutes = date.getMinutes().toString().padStart(2, '0');
                  return `${hours}:${minutes}`;
                })() : ''}
                onChange={(e) => {
                  if (e.target.value) {
                    const currentDate = localConfig.targetDate ? new Date(localConfig.targetDate) : new Date();
                    const [hours, minutes] = e.target.value.split(':');
                    // Create date in LOCAL time, preserving current LOCAL date
                    const localDate = new Date(
                      currentDate.getFullYear(),
                      currentDate.getMonth(),
                      currentDate.getDate(),
                      parseInt(hours),
                      parseInt(minutes),
                      0
                    );
                    // Convert to UTC for storage
                    updateNested('targetDate', localDate.toISOString());
                  }
                }}
                style={{ width: '100%', padding: '0.5rem', fontSize: '1rem' }}
              />
            </div>
          </div>
          
          {/* Quick presets */}
          <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => {
                const now = new Date();
                const newDate = new Date(
                  now.getFullYear(),
                  now.getMonth(),
                  now.getDate(),
                  now.getHours() + 1,
                  0,
                  0
                );
                updateNested('targetDate', newDate.toISOString());
              }}
              style={{ 
                padding: '0.4rem 0.8rem', 
                fontSize: '0.85rem', 
                backgroundColor: '#333', 
                color: '#fff', 
                border: '1px solid #555',
                borderRadius: '0.25rem',
                cursor: 'pointer'
              }}
            >
              +1 Hour
            </button>
            <button
              type="button"
              onClick={() => {
                const now = new Date();
                const newDate = new Date(
                  now.getFullYear(),
                  now.getMonth(),
                  now.getDate() + 1,
                  0,
                  0,
                  0
                );
                updateNested('targetDate', newDate.toISOString());
              }}
              style={{ 
                padding: '0.4rem 0.8rem', 
                fontSize: '0.85rem', 
                backgroundColor: '#333', 
                color: '#fff', 
                border: '1px solid #555',
                borderRadius: '0.25rem',
                cursor: 'pointer'
              }}
            >
              Tomorrow Midnight
            </button>
            <button
              type="button"
              onClick={() => {
                const now = new Date();
                const newDate = new Date(
                  now.getFullYear() + 1,
                  0,
                  1,
                  0,
                  0,
                  0
                );
                updateNested('targetDate', newDate.toISOString());
              }}
              style={{ 
                padding: '0.4rem 0.8rem', 
                fontSize: '0.85rem', 
                backgroundColor: '#333', 
                color: '#fff', 
                border: '1px solid #555',
                borderRadius: '0.25rem',
                cursor: 'pointer'
              }}
            >
              Next New Year
            </button>
          </div>
        </div>

        {/* Celebration Message */}
        <div style={{ marginBottom: '2rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
            Celebration Message
          </label>
          <input
            type="text"
            value={localConfig.celebrationMessage || '🎉 Happy New Year! 🎉'}
            onChange={(e) => updateNested('celebrationMessage', e.target.value)}
            placeholder="Enter your festive message"
            style={{ width: '100%', padding: '0.5rem', fontSize: '1rem' }}
          />
          <p style={{ fontSize: '0.875rem', color: '#999', marginTop: '0.5rem' }}>
            This message will display when the countdown reaches zero
          </p>
        </div>

        {/* Font Settings */}
        <div style={{ marginBottom: '2rem', padding: '1rem', border: '1px solid #333', borderRadius: '0.5rem' }}>
          <h2 style={{ marginBottom: '1rem' }}>Font Settings</h2>
          
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>
              Font Name
            </label>
            <select
              value={localConfig.font?.name || 'huge'}
              onChange={(e) => updateNested('font.name', e.target.value)}
              style={{ width: '100%', padding: '0.5rem' }}
            >
              {VALID_FONTS.map(font => (
                <option key={font} value={font}>{font}</option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                type="checkbox"
                checked={localConfig.font?.rotate || false}
                onChange={(e) => updateNested('font.rotate', e.target.checked)}
              />
              Enable Font Rotation
            </label>
          </div>

          {localConfig.font?.rotate && (
            <>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>
                  Rotation Frequency (seconds)
                </label>
                <input
                  type="number"
                  min="1"
                  value={localConfig.font?.frequency || 5}
                  onChange={(e) => updateNested('font.frequency', Number(e.target.value))}
                  style={{ width: '100%', padding: '0.5rem' }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>
                  Rotation Options (comma-separated)
                </label>
                <input
                  type="text"
                  value={localConfig.font?.rotationOptions?.join(', ') || ''}
                  onChange={(e) => {
                    const fonts = e.target.value.split(',').map(f => f.trim()).filter(f => VALID_FONTS.includes(f));
                    updateNested('font.rotationOptions', fonts);
                  }}
                  placeholder="huge, slick, tiny"
                  style={{ width: '100%', padding: '0.5rem' }}
                />
              </div>
            </>
          )}
        </div>

        {/* Color Settings */}
        <div style={{ marginBottom: '2rem', padding: '1rem', border: '1px solid #333', borderRadius: '0.5rem' }}>
          <h2 style={{ marginBottom: '1rem' }}>Color Settings</h2>
          
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>
              Color Value
            </label>
            <select
              value={localConfig.color?.value || 'cyan'}
              onChange={(e) => updateNested('color.value', e.target.value)}
              style={{ width: '100%', padding: '0.5rem' }}
            >
              {COLOR_OPTIONS.map(color => (
                <option key={color} value={color}>{color}</option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                type="checkbox"
                checked={localConfig.color?.rotate || false}
                onChange={(e) => updateNested('color.rotate', e.target.checked)}
              />
              Enable Color Rotation
            </label>
          </div>

          {localConfig.color?.rotate && (
            <>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>
                  Rotation Frequency (seconds)
                </label>
                <input
                  type="number"
                  min="1"
                  value={localConfig.color?.frequency || 5}
                  onChange={(e) => updateNested('color.frequency', Number(e.target.value))}
                  style={{ width: '100%', padding: '0.5rem' }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>
                  Rotation Options (comma-separated)
                </label>
                <input
                  type="text"
                  value={localConfig.color?.rotationOptions?.join(', ') || ''}
                  onChange={(e) => {
                    const colors = e.target.value.split(',').map(c => c.trim()).filter(c => COLOR_OPTIONS.includes(c));
                    updateNested('color.rotationOptions', colors);
                  }}
                  placeholder="cyan, magenta, yellow"
                  style={{ width: '100%', padding: '0.5rem' }}
                />
              </div>
            </>
          )}
        </div>

        {/* Snowflake Settings */}
        <div style={{ marginBottom: '2rem', padding: '1rem', border: '1px solid #333', borderRadius: '0.5rem' }}>
          <h2 style={{ marginBottom: '1rem' }}>Snowflake Settings</h2>
          
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                type="checkbox"
                checked={localConfig.snowflakes?.enabled || false}
                onChange={(e) => updateNested('snowflakes.enabled', e.target.checked)}
              />
              Enable Snowflakes
            </label>
          </div>

          {localConfig.snowflakes?.enabled && (
            <>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>
                  Count (1-200)
                </label>
                <input
                  type="number"
                  min="1"
                  max="200"
                  value={localConfig.snowflakes?.count || 40}
                  onChange={(e) => updateNested('snowflakes.count', Math.min(200, Math.max(1, Number(e.target.value))))}
                  style={{ width: '100%', padding: '0.5rem' }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>
                  Speed (milliseconds)
                </label>
                <input
                  type="number"
                  min="50"
                  value={localConfig.snowflakes?.speed || 4500}
                  onChange={(e) => updateNested('snowflakes.speed', Number(e.target.value))}
                  style={{ width: '100%', padding: '0.5rem' }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>
                  Snowflake Color
                </label>
                <select
                  value={localConfig.snowflakes?.color?.value || 'white'}
                  onChange={(e) => updateNested('snowflakes.color.value', e.target.value)}
                  style={{ width: '100%', padding: '0.5rem' }}
                >
                  {COLOR_OPTIONS.map(color => (
                    <option key={color} value={color}>{color}</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="checkbox"
                    checked={localConfig.snowflakes?.color?.rotate || false}
                    onChange={(e) => updateNested('snowflakes.color.rotate', e.target.checked)}
                  />
                  Enable Snowflake Color Rotation
                </label>
              </div>

              {localConfig.snowflakes?.color?.rotate && (
                <>
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>
                      Color Rotation Frequency (seconds)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={localConfig.snowflakes?.color?.frequency || 3}
                      onChange={(e) => updateNested('snowflakes.color.frequency', Number(e.target.value))}
                      style={{ width: '100%', padding: '0.5rem' }}
                    />
                  </div>

                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>
                      Color Rotation Options (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={localConfig.snowflakes?.color?.rotationOptions?.join(', ') || ''}
                      onChange={(e) => {
                        const colors = e.target.value.split(',').map(c => c.trim()).filter(c => COLOR_OPTIONS.includes(c));
                        updateNested('snowflakes.color.rotationOptions', colors);
                      }}
                      placeholder="cyan, blue, white"
                      style={{ width: '100%', padding: '0.5rem' }}
                    />
                  </div>
                </>
              )}
            </>
          )}
        </div>

        {/* Action Buttons */}
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
