import { AlertTriangle, Loader2 } from 'lucide-react';
import styles from './DeleteConfirmModal.module.css';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  itemName: string;
  onClose: () => void;
  onConfirm: () => void;
  loading?: boolean;
  hasVariants?: boolean;
}

/**
 * DeleteConfirmModal component - Confirmation modal for deleting inventory items
 * @param isOpen - Whether the modal is open
 * @param itemName - Name of the item to be deleted
 * @param onClose - Callback function to close the modal
 * @param onConfirm - Callback function to confirm deletion
 * @param loading - Whether the delete operation is in progress
 * @param hasVariants - Whether the item has variants (shows additional warning)
 */
export default function DeleteConfirmModal({ 
  isOpen, 
  itemName, 
  onClose, 
  onConfirm, 
  loading = false,
  hasVariants = false
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
          {hasVariants && (
            <div style={{ marginTop: '12px', padding: '10px', background: 'rgba(255, 80, 80, 0.1)', border: '1px solid rgba(255, 80, 80, 0.3)', borderRadius: '6px' }}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', color: '#ff5555' }}>
                    <AlertTriangle size={16} />
                    <span style={{ fontWeight: 'bold', fontSize: '12px' }}>DELETING PARENT ITEM</span>
                </div>
                <p style={{ fontSize: '12px', color: '#ccc', margin: '4px 0 0 0', lineHeight: '1.4' }}>
                    This item has variants. Deleting it will <span style={{ color: '#fff' }}>permanently remove ALL associated variants</span> from the database.
                </p>
            </div>
          )}
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
