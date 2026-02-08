import { LayoutGrid, Package, Users, Settings, LogOut, ShoppingBag, History, Home as HomeIcon, TrendingUp } from 'lucide-react';
import styles from './Sidebar.module.css';

export type DashboardView = 'overview' | 'analytics' | 'inventory' | 'pos' | 'sales' | 'suppliers' | 'settings';

interface SidebarProps {
  activeView: DashboardView;
  onViewChange: (view: DashboardView) => void;
  onGoToHome?: () => void;
  onLogout?: () => void;
}

export default function Sidebar({ activeView, onViewChange, onGoToHome, onLogout }: SidebarProps) {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo} onClick={onGoToHome} style={{ cursor: onGoToHome ? 'pointer' : 'default' }}>
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
          className={`${styles.navItem} ${activeView === 'analytics' ? styles.active : ''}`}
          onClick={() => onViewChange('analytics')}
        >
          <TrendingUp size={20} />
          <span>ANALYTICS</span>
        </button>
        <button 
          className={`${styles.navItem} ${activeView === 'pos' ? styles.active : ''}`}
          onClick={() => onViewChange('pos')}
        >
          <ShoppingBag size={20} />
          <span>POINT OF SALE</span>
        </button>
        <button 
          className={`${styles.navItem} ${activeView === 'sales' ? styles.active : ''}`}
          onClick={() => onViewChange('sales')}
        >
          <History size={20} />
          <span>SALES HISTORY</span>
        </button>
        <button 
          className={`${styles.navItem} ${activeView === 'inventory' ? styles.active : ''}`}
          onClick={() => onViewChange('inventory')}
        >
          <Package size={20} />
          <span>INVENTORY</span>
        </button>
        <button 
          className={`${styles.navItem} ${activeView === 'suppliers' ? styles.active : ''}`}
          onClick={() => onViewChange('suppliers')}
        >
          <Users size={20} />
          <span>SUPPLIERS</span>
        </button>
        <button 
          className={`${styles.navItem} ${activeView === 'settings' ? styles.active : ''}`}
          onClick={() => onViewChange('settings')}
        >
          <Settings size={20} />
          <span>SETTINGS</span>
        </button>
        
        <div style={{ margin: '20px 0', borderTop: '1px solid #1a1a1a' }}></div>

        <button 
          className={styles.navItem}
          onClick={onGoToHome}
        >
          <HomeIcon size={20} />
          <span>HOME</span>
        </button>
      </nav>

      <div className={styles.footer}>
        <div className={styles.userSection}>
          <div className={styles.userAvatar}>K</div>
          <div className={styles.userInfo}>
            <div className={styles.userName}>KEN'S GARAGE</div>
            <div className={styles.userRole}>Owner</div>
          </div>
          {onLogout && (
            <button className={styles.logoutBtn} onClick={onLogout} title="Log Out">
              <LogOut size={18} />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
