import { AlertTriangle, Loader2 } from 'lucide-react';
import styles from './DeleteConfirmModal.module.css';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  itemName: string;
  onClose: () => void;
  onConfirm: () => void;
  loading?: boolean;
}

export default function DeleteConfirmModal({ 
  isOpen, 
  itemName, 
  onClose, 
  onConfirm, 
  loading = false 
}: DeleteConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
        <div className={styles.iconWrapper}>
          <AlertTriangle size={32} />
        </div>
        
        <div className={styles.header}>
          <h2>Confirm Deletion</h2>
          <p>
            Are you sure you want to delete <span className={styles.itemName}>"{itemName}"</span>? 
            This action cannot be undone.
          </p>
        </div>

        <div className={styles.footer}>
          <button 
            className={styles.deleteBtn} 
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? <Loader2 size={18} className={styles.spinner} /> : 'DELETE ITEM'}
          </button>
          <button 
            className={styles.cancelBtn} 
            onClick={onClose}
            disabled={loading}
          >
            NEVERMIND, KEEP IT
          </button>
        </div>
      </div>
    </div>
  );
}
