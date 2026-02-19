import { Tag, X } from 'lucide-react';
import styles from '../EditItemModal.module.css';

interface TagManagerProps {
  tags: string[];
  tagInput: string;
  onTagInputChange: (val: string) => void;
  onAddTag: (e: React.KeyboardEvent) => void;
  onRemoveTag: (tag: string) => void;
}

export default function TagManager({ tags, tagInput, onTagInputChange, onAddTag, onRemoveTag }: TagManagerProps) {
  return (
    <div className={`${styles.formGroup} ${styles.fullWidth}`}>
      <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <Tag size={14} /> Tags (Press Enter or comma to add)
      </label>
      <input 
        className={styles.formInput} 
        type="text" 
        value={tagInput}
        onChange={(e) => onTagInputChange(e.target.value)}
        onKeyDown={onAddTag}
        placeholder="e.g. promo, seasonal, hot-item" 
      />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
        {tags.map(tag => (
          <span 
            key={tag} 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '4px',
              background: '#1a1a1a',
              border: '1px solid #333',
              padding: '2px 8px',
              borderRadius: '4px',
              fontSize: '11px',
              color: '#00ff9d'
            }}
          >
            {tag}
            <X 
              size={10} 
              style={{ cursor: 'pointer' }} 
              onClick={() => onRemoveTag(tag)}
            />
          </span>
        ))}
      </div>
    </div>
  );
}
