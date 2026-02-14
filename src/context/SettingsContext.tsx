import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

/**
 * Interface definition for application-wide store settings
 */
interface StoreSettings {
  /** Name of the store displayed in the UI */
  store_name: string;
  /** Tax rate percentage (e.g. 8.25 for 8.25%) */
  tax_rate: number;
  /** Threshold for "Low Stock" warnings */
  low_stock_threshold: number;
  /** Currency code (e.g. USD, EUR) */
  currency: string;
  /** Currency symbol (e.g. $, €) */
  currency_symbol: string;
}

/**
 * Context state shape
 */
interface SettingsContextType {
  settings: StoreSettings;
  loading: boolean;
  /** Function to manually refresh settings from the database */
  refreshSettings: () => Promise<void>;
}

const defaultSettings: StoreSettings = {
  store_name: "KEN'S GARAGE",
  tax_rate: 8.25,
  low_stock_threshold: 10,
  currency: "USD",
  currency_symbol: "$"
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

/**
 * SettingsProvider Component
 * 
 * Fetches and provides store configuration from Supabase to the rest of the app.
 * Handles loading states and provides a refresh mechanism.
 */
export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<StoreSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  /**
   * Helper to get currency symbol from code
   */
  const getSymbol = (currency: string) => {
    switch (currency) {
      case 'EUR': return '€';
      case 'GBP': return '£';
      case 'PHP': return '₱';
      default: return '$';
    }
  };

  /**
   * Main fetch function
   * Reads from 'store_settings' table where id=1
   */
  const fetchSettings = async () => {
    if (!supabase) return;
    try {
      const { data, error } = await supabase
        .from('store_settings')
        .select('*')
        .eq('id', 1)
        .single();

      if (error) {
        console.warn('Settings not found, using defaults.');
        return;
      }

      if (data) {
        setSettings({
          store_name: data.store_name ?? defaultSettings.store_name,
          tax_rate: data.tax_rate !== null && data.tax_rate !== undefined ? Number(data.tax_rate) : defaultSettings.tax_rate,
          low_stock_threshold: data.low_stock_threshold ?? defaultSettings.low_stock_threshold,
          currency: data.currency ?? defaultSettings.currency,
          currency_symbol: getSymbol(data.currency || 'USD')
        });
      }
    } catch (err) {
      console.error('Error in SettingsProvider:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, loading, refreshSettings: fetchSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};

/**
 * Custom hook to consume settings
 * Throws error if used outside of SettingsProvider
 */
export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
