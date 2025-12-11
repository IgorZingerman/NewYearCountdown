'use client';

import { useState, useEffect } from 'react';
import { loadConfig, saveConfig } from '../lib/config';

export function useConfig() {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadedConfig = loadConfig();
    setConfig(loadedConfig);
    setLoading(false);
  }, []);

  const updateConfig = (newConfig) => {
    const updated = { ...config, ...newConfig };
    setConfig(updated);
    saveConfig(updated);
  };

  const resetConfig = () => {
    const defaultConfig = loadConfig();
    // Reset to defaults by clearing localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('countdown-config');
    }
    setConfig(defaultConfig);
  };

  return { config, loading, updateConfig, resetConfig };
}
