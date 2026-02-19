import { Box, Layers } from 'lucide-react';
import styles from './ModeSelection.module.css';

interface ModeSelectionProps {
  hasVariants: boolean;
  onModeChange: (hasVariants: boolean) => void;
  disabled?: boolean;
}

export default function ModeSelection({ hasVariants, onModeChange, disabled }: ModeSelectionProps) {
  return (
    <div className={styles.modeSelection}>
      <button 
        type="button"
        className={`${styles.modeBtn} ${!hasVariants ? styles.modeBtnActive : ''}`}
        onClick={() => !disabled && onModeChange(false)}
        disabled={disabled}
      >
        <Box className={styles.modeIcon} size={24} />
        <span className={styles.modeLabel}>Single Product</span>
        <span className={styles.modeDesc}>Standalone item</span>
      </button>

      <button 
        type="button"
        className={`${styles.modeBtn} ${hasVariants ? styles.modeBtnActive : ''}`}
        onClick={() => !disabled && onModeChange(true)}
        disabled={disabled}
      >
        <Layers className={styles.modeIcon} size={24} />
        <span className={styles.modeLabel}>Product Family</span>
        <span className={styles.modeDesc}>Parent of multiple sizes/types</span>
      </button>
    </div>
  );
}
