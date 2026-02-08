import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface StoreSettings {
  store_name: string;
  tax_rate: number;
  low_stock_threshold: number;
  currency: string;
  currency_symbol: string;
}

interface SettingsContextType {
  settings: StoreSettings;
  loading: boolean;
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

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<StoreSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  const getSymbol = (currency: string) => {
    switch (currency) {
      case 'EUR': return '€';
      case 'GBP': return '£';
      case 'PHP': return '₱';
      default: return '$';
    }
  };

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

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
