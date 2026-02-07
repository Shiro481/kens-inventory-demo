import { LayoutGrid, Package, Users, Settings } from 'lucide-react';
import styles from './Sidebar.module.css';

interface SidebarProps {
  activeView: 'overview' | 'inventory';
  onViewChange: (view: 'overview' | 'inventory') => void;
}

export default function Sidebar({ activeView, onViewChange }: SidebarProps) {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>
        <div className={styles.logoIcon}>K</div>
        <span className={styles.logoText}>KENS GARAGE</span>
      </div>

      <nav className={styles.nav}>
        <button 
          className={`${styles.navItem} ${activeView === 'overview' ? styles.active : ''}`}
          onClick={() => onViewChange('overview')}
        >
          <LayoutGrid size={20} />
          <span>OVERVIEW</span>
        </button>
        <button 
          className={`${styles.navItem} ${activeView === 'inventory' ? styles.active : ''}`}
          onClick={() => onViewChange('inventory')}
        >
          <Package size={20} />
          <span>INVENTORY</span>
        </button>
        <button className={styles.navItem}>
          <Users size={20} />
          <span>SUPPLIERS</span>
        </button>
        <button className={styles.navItem}>
          <Settings size={20} />
          <span>SETTINGS</span>
        </button>
      </nav>

      <div className={styles.footer}>
        <div className={styles.userAvatar}>K</div>
        <div className={styles.userInfo}>
          <div className={styles.userName}>KEN'S GARAGE</div>
          <div className={styles.userRole}>Owner</div>
        </div>
      </div>
    </aside>
  );
}
