import { LayoutGrid, Package, Users, Settings, LogOut, ShoppingBag, History, Home as HomeIcon, TrendingUp, X } from 'lucide-react';
import styles from './Sidebar.module.css';
import { useSettings } from '../../../context/SettingsContext';
import { useState } from 'react';

export type DashboardView = 'overview' | 'analytics' | 'inventory' | 'pos' | 'sales' | 'suppliers' | 'settings';

interface SidebarProps {
  activeView: DashboardView;
  onViewChange: (view: DashboardView) => void;
  onGoToHome?: () => void;
  onLogout?: () => void;
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ activeView, onViewChange, onGoToHome, onLogout, isOpen, onClose }: SidebarProps) {
  const { settings } = useSettings();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  
  const handleViewChange = (view: DashboardView) => {
    onViewChange(view);
    onClose(); // Close menu on mobile after selection
  };

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    if (onLogout) {
      onLogout();
      onClose();
    }
    setShowLogoutConfirm(false);
  };

  const cancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  return (
    <>
      {/* Overlay for mobile only */}
      <div 
        className={`${styles.overlay} ${isOpen ? styles.overlayVisible : ''}`} 
        onClick={onClose}
      />
      
      <aside className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : ''}`}>
        <div className={styles.sidebarHeader}>
          <div className={styles.logo} onClick={onGoToHome} style={{ cursor: onGoToHome ? 'pointer' : 'default' }}>
            <img src="/src/assets/kenslogo.jpg" alt="KEN'S GARAGE" className={styles.logoImage} />
            <span className={styles.logoText}>{settings.store_name}</span>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <nav className={styles.nav}>
          <button 
            className={`${styles.navItem} ${activeView === 'overview' ? styles.active : ''}`}
            onClick={() => handleViewChange('overview')}
          >
            <LayoutGrid size={20} />
            <span>OVERVIEW</span>
          </button>
          <button 
            className={`${styles.navItem} ${activeView === 'analytics' ? styles.active : ''}`}
            onClick={() => handleViewChange('analytics')}
          >
            <TrendingUp size={20} />
            <span>ANALYTICS</span>
          </button>
          <button 
            className={`${styles.navItem} ${activeView === 'pos' ? styles.active : ''}`}
            onClick={() => handleViewChange('pos')}
          >
            <ShoppingBag size={20} />
            <span>POINT OF SALE</span>
          </button>
          <button 
            className={`${styles.navItem} ${activeView === 'sales' ? styles.active : ''}`}
            onClick={() => handleViewChange('sales')}
          >
            <History size={20} />
            <span>SALES HISTORY</span>
          </button>
          <button 
            className={`${styles.navItem} ${activeView === 'inventory' ? styles.active : ''}`}
            onClick={() => handleViewChange('inventory')}
          >
            <Package size={20} />
            <span>INVENTORY</span>
          </button>
          <button 
            className={`${styles.navItem} ${activeView === 'suppliers' ? styles.active : ''}`}
            onClick={() => handleViewChange('suppliers')}
          >
            <Users size={20} />
            <span>SUPPLIERS</span>
          </button>
          <button 
            className={`${styles.navItem} ${activeView === 'settings' ? styles.active : ''}`}
            onClick={() => handleViewChange('settings')}
          >
            <Settings size={20} />
            <span>SETTINGS</span>
          </button>
          
          <div style={{ margin: '20px 0', borderTop: '1px solid var(--border-dim)' }}></div>

          <button 
            className={styles.navItem}
            onClick={() => {
              if (onGoToHome) onGoToHome();
              onClose();
            }}
          >
            <HomeIcon size={20} />
            <span>HOME</span>
          </button>
        </nav>

        <div className={styles.footer}>
          <div className={styles.userSection}>
            <div className={styles.userInfo}>
              <div className={styles.userName}>KEN'S GARAGE</div>
              <div className={styles.userRole}>Owner</div>
            </div>
            {onLogout && (
              <button className={styles.logoutBtn} onClick={handleLogoutClick} title="Log Out">
                <LogOut size={18} />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className={styles.logoutModalOverlay}>
          <div className={styles.logoutModal}>
            <div className={styles.logoutModalHeader}>
              <LogOut size={24} />
              <h3>Confirm Logout</h3>
            </div>
            <div className={styles.logoutModalContent}>
              <p>Are you sure you want to log out?</p>
              <p className={styles.logoutModalSubtext}>Any unsaved changes will be lost.</p>
            </div>
            <div className={styles.logoutModalActions}>
              <button 
                className={styles.cancelBtn}
                onClick={cancelLogout}
              >
                Cancel
              </button>
              <button 
                className={styles.confirmBtn}
                onClick={confirmLogout}
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
