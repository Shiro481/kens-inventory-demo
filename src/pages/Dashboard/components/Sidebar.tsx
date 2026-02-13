import { LayoutDashboard, BarChart3, Package, ShoppingCart, History, Users, Wrench, Settings, Home, LogOut } from 'lucide-react';
import styles from './Sidebar.module.css';
import { useSettings } from '../../../context/SettingsContext';
import { useState } from 'react';

export type DashboardView = 'overview' | 'analytics' | 'inventory' | 'pos' | 'sales' | 'suppliers' | 'work-orders' | 'settings';

interface SidebarProps {
  activeView: DashboardView;
  onViewChange: (view: DashboardView) => void;
  onGoToHome?: () => void;
  onLogout?: () => void;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Sidebar component - Navigation sidebar for dashboard with menu items and logout functionality
 * @param activeView - Currently active dashboard view
 * @param onViewChange - Callback function to change the active view
 * @param onGoToHome - Callback function to navigate to home page
 * @param onLogout - Callback function to handle user logout
 * @param isOpen - Whether the sidebar is open (mobile)
 * @param onClose - Callback function to close the sidebar
 */
export default function Sidebar({ activeView, onViewChange, onGoToHome, onLogout, isOpen, onClose }: SidebarProps) {
  const { settings } = useSettings();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  /**
   * Handle view change and close mobile menu
   * @param view - The new dashboard view to switch to
   */
  const handleViewChange = (view: DashboardView) => {
    onViewChange(view);
    onClose(); // Close menu on mobile after selection
  };

  /**
   * Handle logout click - show confirmation dialog
   */
  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  /**
   * Confirm logout action and execute logout
   */
  const confirmLogout = () => {
    if (onLogout) {
      onLogout();
      onClose();
    }
    setShowLogoutConfirm(false);
  };

  /**
   * Cancel logout action and hide confirmation dialog
   */
  const cancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  
  return (
    <>
      {/* Mobile Menu Toggle */}
      <button 
        className={styles.mobileMenuToggle}
        onClick={onClose}
        aria-label="Toggle menu"
      >
        <div className={styles.hamburger}></div>
        <div className={styles.hamburger}></div>
        <div className={styles.hamburger}></div>
      </button>

      {/* Overlay for mobile only */}
      <div 
        className={`${styles.overlay} ${isOpen ? styles.overlayVisible : ''}`} 
        onClick={onClose}
      />
      
      <aside className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : ''}`}>
        {/* Header / Logo Area */}
        <div className={styles.sidebarHeader}>
          <div className={styles.logo} onClick={onGoToHome} style={{ cursor: onGoToHome ? 'pointer' : 'default' }}>
            <img src="/kenslogo.jpg" alt="Kens Garage" className={styles.logoImage} />
            <span className={styles.logoText}>{settings.store_name || "Kens Garage"}</span>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>
            <Home size={24} />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className={styles.nav}>
          <div className={styles.navSection}>
            <div className={styles.sectionTitle}>Main</div>
            
            <button 
              className={`${styles.navItem} ${activeView === 'overview' ? styles.active : ''}`}
              onClick={() => handleViewChange('overview')}
            >
              <LayoutDashboard size={20} />
              <span>Overview</span>
            </button>
            
            <button 
              className={`${styles.navItem} ${activeView === 'analytics' ? styles.active : ''}`}
              onClick={() => handleViewChange('analytics')}
            >
              <BarChart3 size={20} />
              <span>Analytics</span>
            </button>
          </div>
          
          <div className={styles.navSection}>
            <div className={styles.sectionTitle}>Operations</div>
            
            <button 
              className={`${styles.navItem} ${activeView === 'work-orders' ? styles.activeWorkOrders : ''}`}
              onClick={() => handleViewChange('work-orders')}
            >
              <Wrench size={20} />
              <span>Work Orders</span>
            </button>
            
            <button 
              className={`${styles.navItem} ${activeView === 'inventory' ? styles.active : ''}`}
              onClick={() => handleViewChange('inventory')}
            >
              <Package size={20} />
              <span>Inventory</span>
            </button>
            
            <button 
              className={`${styles.navItem} ${activeView === 'pos' ? styles.active : ''}`}
              onClick={() => handleViewChange('pos')}
            >
              <ShoppingCart size={20} />
              <span>Point of Sale</span>
            </button>
            
            <button 
              className={`${styles.navItem} ${activeView === 'sales' ? styles.active : ''}`}
              onClick={() => handleViewChange('sales')}
            >
              <History size={20} />
              <span>Sales History</span>
            </button>
            
            <button 
              className={`${styles.navItem} ${activeView === 'suppliers' ? styles.active : ''}`}
              onClick={() => handleViewChange('suppliers')}
            >
              <Users size={20} />
              <span>Suppliers</span>
            </button>
            
            <button 
              className={`${styles.navItem} ${activeView === 'settings' ? styles.active : ''}`}
              onClick={() => handleViewChange('settings')}
            >
              <Settings size={20} />
              <span>Settings</span>
            </button>
          </div>
          
          <div className={styles.navSection}>
            <button 
              className={styles.navItem}
              onClick={() => {
                if (onGoToHome) onGoToHome();
                onClose();
              }}
            >
              <Home size={20} />
              <span>Home</span>
            </button>
          </div>
        </nav>
      
        {/* User Profile Footer */}
        <div className={styles.footer}>
          <div className={styles.userSection}>
            <div className={styles.userInfo}>
              <div className={styles.userName}>{settings.store_name || "Ken's Garage"}</div>
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
              <Home size={24} />
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
