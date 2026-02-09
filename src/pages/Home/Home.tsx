import { ChevronRight, Database, RefreshCw, ShieldCheck } from 'lucide-react';
import styles from './Home.module.css';

interface HomeProps {
  onAccessDashboard: () => void;
}

export default function Home({ onAccessDashboard }: HomeProps) {
  return (
    <div className={styles.container}>
      {/* Background Overlay */}
      <div className={styles.overlay}></div>
      
      {/* Navigation / Header */}
      <nav className={styles.nav}>
        <div className={styles.logo}>
          <img src="../src/assets/kenslogo.jpg" alt="KEN'S GARAGE" className={styles.logoImage} />
          <div className={styles.logoText}>
            <span className={styles.brandName}>KEN'S GARAGE</span>
            <span className={styles.version}>SYSTEM V2.0</span>
          </div>
        </div>
        <div className={styles.statusIndicator}>
          <span className={styles.pulseDot}></span>
          <span className={styles.statusText}>SYSTEM ONLINE</span>
          <span className={styles.est}>EST. 2024</span>
        </div>
      </nav>

      {/* Hero Section */}
      <main className={styles.hero}>
        <h1 className={styles.title}>
          PRECISION<br />
          <span className={styles.highlight}>PERFORMANCE</span><br />
          PERFECTION
        </h1>
        
        <p className={styles.description}>
          Next-generation inventory management and point of sale<br />
          system designed for automotive excellence. Streamline<br />
          your workflow with military-grade precision.
        </p>

        <div className={styles.ctaGroup}>
          <button className={styles.primaryBtn} onClick={onAccessDashboard}>
            ACCESS DASHBOARD <ChevronRight size={20} />
          </button>
          <button className={styles.secondaryBtn}>
            DOCUMENTATION
          </button>
        </div>
      </main>

      {/* Footer Features */}
      <footer className={styles.footer}>
        <div className={styles.feature}>
          <ShieldCheck className={styles.featureIcon} size={24} />
          <div className={styles.featureContent}>
            <h3>SECURE DATABASE</h3>
            <p>Enterprise-grade security for all inventory and transaction data.</p>
          </div>
        </div>
        
        <div className={styles.feature}>
          <RefreshCw className={styles.featureIcon} size={24} />
          <div className={styles.featureContent}>
            <h3>REAL-TIME SYNC</h3>
            <p>Instant updates across POS and inventory management systems.</p>
          </div>
        </div>

        <div className={styles.feature}>
          <Database className={styles.featureIcon} size={24} />
          <div className={styles.featureContent}>
            <h3>AUTO-BACKUP</h3>
            <p>Daily automated backups ensure your business data is never lost.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
