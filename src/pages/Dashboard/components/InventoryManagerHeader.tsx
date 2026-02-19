import { Plus } from 'lucide-react';
import styles from '../Dashboard.module.css';

interface InventoryManagerHeaderProps {
  onAddItem: () => void;
  onAddVariant: () => void;
}

export default function InventoryManagerHeader({ onAddItem, onAddVariant }: InventoryManagerHeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.title}>
        <h1>Dashboard</h1>
        <p>Welcome back, Ken. Here's what's happening efficiently.</p>
      </div>
      <div className={styles.buttonGroup} style={{ display: 'flex', gap: '8px' }}>
        <button 
          className={styles.addButton} 
          onClick={onAddVariant}
          style={{ backgroundColor: 'transparent', border: '1px solid #333', color: '#888' }}
        >
          <Plus size={16} />
          Add Variant
        </button>
        <button className={styles.addButton} onClick={onAddItem}>
          <Plus size={18} />
          Add New Item
        </button>
      </div>
    </header>
  );
}
