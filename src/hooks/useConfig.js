'use client';

import { useState, useEffect } from 'react';
import { loadConfig, saveConfig, createDefaultConfig } from '../lib/config';

export function useConfig() {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadedConfig = loadConfig();
    setConfig(loadedConfig);
    setLoading(false);
  }, []);

  const updateConfig = (newConfig) => {
    // Show exactly what was saved (checked and completed), not what was typed.
    setConfig(saveConfig({ ...config, ...newConfig }));
  };

  const resetConfig = () => {
    // Clear localStorage first to remove any stored config
    if (typeof window !== 'undefined') {
      localStorage.removeItem('countdown-config');
    }
    setConfig(createDefaultConfig());
  };

  return { config, loading, updateConfig, resetConfig };
}
