import { useState, useEffect } from 'react';
import { Search, Plus, Mail, Phone, MapPin, User, Loader2 } from 'lucide-react';
import styles from './Suppliers.module.css';
import { supabase } from '../../../lib/supabase';
import type { Supplier } from '../../../types/inventory';

/**
 * Suppliers component - Supplier management interface
 * Displays and manages supplier information with search capabilities
 */
export default function Suppliers() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchSuppliers();
  }, []);

  /**
   * Fetch suppliers data from Supabase database
   * Updates suppliers state and handles loading/error states
   */
  async function fetchSuppliers() {
    if (!supabase) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .order('name', { ascending: true });
      
      if (error) throw error;
      setSuppliers(data || []);
    } catch (err: any) {
      console.error('Error fetching suppliers:', err.message);
    } finally {
      setLoading(false);
    }
  }

  /**
   * Filter suppliers based on search query
   * Searches in name, category, and contact person fields
   */
  const filteredSuppliers = suppliers.filter(s => 
    (s.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.category || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.contact_person || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.title}>
          <h1>SUPPLIERS</h1>
          <p>MANAGE YOUR AUTOMOTIVE PARTS NETWORK</p>
        </div>
        <button className={styles.addButton}>
          <Plus size={18} />
          ADD SUPPLIER
        </button>
      </header>

      <div className={styles.toolbar}>
        <div className={styles.searchWrapper}>
          <Search className={styles.searchIcon} size={18} />
          <input 
            type="text" 
            placeholder="SEARCH SUPPLIERS OR CATEGORIES..." 
            className={styles.searchInput}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className={styles.loadingWrapper}>
          <Loader2 className={styles.spinner} size={32} />
        </div>
      ) : (
        <div className={styles.supplierGrid}>
          {filteredSuppliers.map(supplier => (
            <div key={supplier.id} className={styles.supplierCard}>
              <div className={styles.cardHeader}>
                <div className={styles.categoryTag}>{supplier.category || 'GENERAL'}</div>
                <h3 className={styles.supplierName}>{supplier.name}</h3>
              </div>

              <div className={styles.contactInfo}>
                <div className={styles.infoItem}>
                  <User className={styles.infoIcon} size={16} />
                  <span className={styles.contactPerson}>{supplier.contact_person || 'No Contact'}</span>
                </div>
                <div className={styles.infoItem}>
                  <Mail className={styles.infoIcon} size={16} />
                  <span>{supplier.email || 'N/A'}</span>
                </div>
                <div className={styles.infoItem}>
                  <Phone className={styles.infoIcon} size={16} />
                  <span>{supplier.phone || 'N/A'}</span>
                </div>
                <div className={styles.infoItem}>
                  <MapPin className={styles.infoIcon} size={16} />
                  <span>{supplier.address || 'N/A'}</span>
                </div>
              </div>

              <div className={styles.cardActions}>
                <button className={styles.actionBtn}>
                   EDIT
                </button>
                <button className={`${styles.actionBtn} ${styles.deleteBtn}`}>
                   REMOVE
                </button>
              </div>
            </div>
          ))}
          {filteredSuppliers.length === 0 && !loading && (
            <div style={{ color: '#333', textAlign: 'center', gridColumn: '1/-1', padding: '40px', fontWeight: 900, letterSpacing: '2px' }}>
              NO SUPPLIERS FOUND
            </div>
          )}
        </div>
      )}
    </div>
  );
}
