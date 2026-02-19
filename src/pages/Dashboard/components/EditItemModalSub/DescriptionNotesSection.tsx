import styles from '../EditItemModal.module.css';
import type { InventoryItem } from '../../../../types/inventory';

interface DescriptionNotesSectionProps {
  editingItem: InventoryItem;
  onInputChange: (field: string, value: any) => void;
}

export default function DescriptionNotesSection({ editingItem, onInputChange }: DescriptionNotesSectionProps) {
  return (
    <>
      <div className={`${styles.formGroup} ${styles.fullWidth}`}>
        <label>Description</label>
        <textarea 
          className={styles.formInput} 
          rows={3} 
          value={editingItem.description || ''} 
          onChange={(e) => onInputChange('description', e.target.value)} 
          placeholder="Detailed product description..." 
          style={{ resize: 'vertical' }} 
        />
      </div>
      <div className={`${styles.formGroup} ${styles.fullWidth}`}>
        <label>Internal Notes</label>
        <textarea 
          className={styles.formInput} 
          rows={2} 
          value={editingItem.notes || ''} 
          onChange={(e) => onInputChange('notes', e.target.value)} 
          placeholder="Private notes..." 
          style={{ resize: 'vertical', border: '1px dashed #333' }} 
        />
      </div>
    </>
  );
}
