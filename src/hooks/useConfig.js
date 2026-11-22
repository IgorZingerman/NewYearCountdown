'use client';

import { useState, useEffect } from 'react';
import { loadConfig, saveConfig, DEFAULT_CONFIG } from '../lib/config';

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
    // Clear localStorage first to remove any stored config
    if (typeof window !== 'undefined') {
      localStorage.removeItem('countdown-config');
    }
    // Use DEFAULT_CONFIG directly to ensure true defaults are loaded
    setConfig(DEFAULT_CONFIG);
  };

  return { config, loading, updateConfig, resetConfig };
}
