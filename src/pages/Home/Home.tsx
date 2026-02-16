import { useEffect, useState } from 'react';
import { ArrowRight, ShieldCheck, Zap, Database } from 'lucide-react';
import styles from './Home.module.css';

interface HomeProps {
  onAccessDashboard: () => void;
}

export default function Home({ onAccessDashboard }: HomeProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className={styles.container}>
      {/* Background Image with Overlay */}
      <div className={styles.backgroundContainer}>
        <div className={styles.backgroundOverlay} />
        <div className={styles.backgroundGradient} />
        <img 
          src="https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?q=80&w=2672&auto=format&fit=crop"
          alt="Garage Background" 
          className={styles.backgroundImage}
        />
      </div>

      {/* Grid Pattern Overlay */}
      <div className={styles.gridPattern} />

      {/* Main Content */}
      <div className={styles.content}>
        {/* Header - Slides down and fades in */}
        <header className={`${styles.header} ${mounted ? styles.headerMounted : ''}`}>
          <div className={styles.logoSection}>
            <img src="/kenslogo.jpg" alt="Logo" className={styles.logoImage} />
            <div className={styles.logoText}>
              <span className={styles.brandName}>Ken's Garage</span>
              <span className={styles.version}>System v2.0</span>
            </div>
          </div>
          <div className={styles.statusIndicator}>
            <span className={styles.statusDot} />
            <span>System Online</span>
            <span>Est. 2024</span>
          </div>
        </header>

        {/* Hero Section */}
        <main className={styles.hero}>
          {/* Title - Slides up, delay 300ms */}
          <div className={`${styles.titleContainer} ${mounted ? styles.titleMounted : ''}`}>
            <h1 className={styles.title}>
              KENS <br />
              <span className={styles.highlight} data-text="TRADING">TRADING</span> <br />
            </h1>
          </div>
          
          {/* Subtitle - Slides up, delay 500ms */}
          <p className={`${styles.description} ${mounted ? styles.descriptionMounted : ''}`}>
            Next-generation inventory management and point of sale system designed for automotive excellence. Streamline your workflow with military-grade precision.
          </p>

          {/* Buttons - Slide up, delay 700ms */}
          <div className={`${styles.ctaGroup} ${mounted ? styles.ctaMounted : ''}`}>
            <button 
              onClick={onAccessDashboard}
              className={styles.primaryBtn}
            >
              <span className={styles.btnContent}>
                Access Dashboard
                <ArrowRight className={styles.btnIcon} />
              </span>
              <div className={styles.btnBorder} />
            </button>
            
            <button className={styles.secondaryBtn}>
              Documentation
            </button>
          </div>
        </main>

        {/* Footer / Stats - Slides up, delay 1000ms */}
        <footer className={`${styles.footer} ${mounted ? styles.footerMounted : ''}`}>
          <div className={styles.feature}>
            <div className={styles.featureHeader}>
              <ShieldCheck className={styles.featureIcon} />
              <span className={styles.featureTitle}>Secure Database</span>
            </div>
            <p className={styles.featureDescription}>Enterprise-grade security for all inventory and transaction data.</p>
          </div>
          
          <div className={styles.feature}>
            <div className={styles.featureHeader}>
              <Zap className={styles.featureIcon} />
              <span className={styles.featureTitle}>Real-time Sync</span>
            </div>
            <p className={styles.featureDescription}>Instant updates across POS and inventory management systems.</p>
          </div>

          <div className={styles.feature}>
            <div className={styles.featureHeader}>
              <Database className={styles.featureIcon} />
              <span className={styles.featureTitle}>Auto-Backup</span>
            </div>
            <p className={styles.featureDescription}>Daily automated backups ensure your business data is never lost.</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
