import { useState, useEffect } from 'react';
import { Save, Store, Calculator, User, Loader2 } from 'lucide-react';
import styles from './Settings.module.css';
import { supabase } from '../../../lib/supabase';
import { useSettings as useGlobalSettings } from '../../../context/SettingsContext';

interface StoreSettings {
  store_name: string;
  tax_rate: number;
  low_stock_threshold: number;
  currency: string;
}

/**
 * Settings component - Application settings management interface
 * Allows configuration of store settings, tax rates, and user preferences
 */
export default function Settings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [user, setUser] = useState<any>(null);
  
  const [settings, setSettings] = useState<StoreSettings>({
    store_name: "KEN'S GARAGE",
    tax_rate: 8.25,
    low_stock_threshold: 10,
    currency: "USD"
  });
  
  const [taxRateInput, setTaxRateInput] = useState('8.25');
  const [minQuantityInput, setMinQuantityInput] = useState('10');

  useEffect(() => {
    fetchSettings();
    fetchUser();
  }, []);

  /**
   * Fetch current authenticated user data from Supabase
   * Updates user state with authentication information
   */
  async function fetchUser() {
    if (!supabase) return;
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
  }

  /**
   * Fetch store settings from Supabase database
   * Updates settings state with current configuration
   */
  async function fetchSettings() {
    if (!supabase) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('store_settings')
        .select('*')
        .eq('id', 1)
        .single();
      
      if (error) throw error;
      if (data) {
        setSettings({
          store_name: data.store_name,
          tax_rate: Number(data.tax_rate),
          low_stock_threshold: data.low_stock_threshold,
          currency: data.currency
        });
        setTaxRateInput(String(data.tax_rate));
        setMinQuantityInput(String(data.low_stock_threshold));
      }
    } catch (err: any) {
      console.error('Error fetching settings:', err.message);
    } finally {
      setLoading(false);
    }
  }

  const { refreshSettings } = useGlobalSettings();

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    
    setSaving(true);
    setSuccess(false);
    
    try {
      const { error } = await supabase
        .from('store_settings')
        .upsert({
          id: 1,
          store_name: settings.store_name,
          tax_rate: settings.tax_rate,
          low_stock_threshold: settings.low_stock_threshold,
          currency: settings.currency,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      
      console.log('[Settings] Database updated, refreshing global context...');
      await refreshSettings();
      
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      console.error('[Settings] Save error:', err);
      alert('Error saving settings: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
          <Loader2 className={styles.spinner} size={40} color="#444" />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.title}>
          <h1>SETTINGS</h1>
          <p>CONFIGURE SYSTEM PARAMETERS & PREFERENCES</p>
        </div>
      </header>

      <div className={styles.settingsGrid}>
        {/* Store Profile */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <Store className={styles.iconWrapper} size={20} />
            <h2>STORE IDENTITY</h2>
          </div>
          
          <form className={styles.form} onSubmit={handleSave}>
            <div className={styles.formGroup}>
              <label>Business Name</label>
              <input 
                type="text" 
                className={styles.formInput}
                value={settings.store_name}
                onChange={e => setSettings({...settings, store_name: e.target.value})}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label>Default Currency</label>
              <select 
                className={styles.formInput}
                value={settings.currency}
                onChange={e => setSettings({...settings, currency: e.target.value})}
              >
                <option value="USD">USD - US Dollar ($)</option>
                <option value="EUR">EUR - Euro (€)</option>
                <option value="GBP">GBP - Pound Sterling (£)</option>
                <option value="PHP">PHP - Philippine Peso (₱)</option>
              </select>
            </div>

            <button type="submit" className={styles.saveBtn} disabled={saving}>
              {saving ? <Loader2 className={styles.spinner} size={18} /> : <Save size={18} />}
              {saving ? 'SAVING...' : 'SAVE CHANGES'}
            </button>
            {success && <span className={styles.successMsg}>Store profile updated successfully.</span>}
          </form>
        </section>

        {/* Sales & Calculations */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <Calculator className={styles.iconWrapper} size={20} />
            <h2>SALES & TAXATION</h2>
          </div>

          <form className={styles.form} onSubmit={handleSave}>
            <div className={styles.formGroup}>
              <label>Standard Tax Rate (%)</label>
              <div className={styles.inputWithSuffix}>
                <input 
                  type="number" 
                  step="0.01"
                  className={styles.formInput}
                  style={{ width: '100%' }}
                  value={taxRateInput}
                  onChange={e => {
                    let value = e.target.value;
                    // Remove leading zero when typing a number greater than zero
                    if (value.length > 1 && value.startsWith('0') && !value.startsWith('0.')) {
                      value = value.slice(1);
                    }
                    setTaxRateInput(value);
                    setSettings({...settings, tax_rate: value === '' ? 0 : Number(value)});
                  }}
                  required
                />
                <span className={styles.suffix}>%</span>
              </div>
            </div>

            <div className={styles.formGroup}>
              <label>Inventory Low Stock Warning</label>
              <div className={styles.inputWithSuffix}>
                <input 
                  type="number" 
                  className={styles.formInput}
                  style={{ width: '100%' }}
                  value={minQuantityInput}
                  onChange={e => {
                    let value = e.target.value;
                    // Remove leading zero when typing a number greater than zero
                    if (value.length > 1 && value.startsWith('0') && !value.startsWith('0.')) {
                      value = value.slice(1);
                    }
                    setMinQuantityInput(value);
                    setSettings({...settings, low_stock_threshold: value === '' ? 0 : Number(value)});
                  }}
                  required
                />
                <span className={styles.suffix}>PCS</span>
              </div>
              <p style={{ fontSize: '10px', color: '#444', marginTop: '4px', fontStyle: 'italic' }}>
                Global default for items without specific thresholds.
              </p>
            </div>

            <button type="submit" className={styles.saveBtn} disabled={saving}>
              {saving ? <Loader2 className={styles.spinner} size={18} /> : <Save size={18} />}
              {saving ? 'SAVING...' : 'SAVE PARAMETERS'}
            </button>
            {success && <span className={styles.successMsg}>Parameters updated successfully.</span>}
          </form>
        </section>

        {/* User Account */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <User className={styles.iconWrapper} size={20} />
            <h2>USER PROFILE</h2>
          </div>

          <div className={styles.userCard}>
            <div className={styles.avatar}>
              {user?.email?.charAt(0).toUpperCase()}
            </div>
            <div className={styles.userInfo}>
              <div className={styles.userEmail}>{user?.email}</div>
              <div className={styles.userRole}>SYSTEM ADMINISTRATOR</div>
            </div>
          </div>

          <div className={styles.formGroup} style={{ marginTop: '20px' }}>
            <label>Authentication Status</label>
            <input 
              type="text" 
              className={styles.formInput} 
              value="SECURE SESSION ACTIVE" 
              disabled 
            />
          </div>
          
          <p style={{ fontSize: '11px', color: '#333', textAlign: 'center' }}>
            To change password or security settings, please contact the system proprietor.
          </p>
        </section>
      </div>
    </div>
  );
}
