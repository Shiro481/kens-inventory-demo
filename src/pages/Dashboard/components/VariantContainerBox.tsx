
import React from 'react';
import { useCategoryMetadata } from '../../../hooks/useCategoryMetadata';
import styles from './Pos.module.css';
import type { InventoryItem } from '../../../types/inventory';

interface VariantContainerBoxProps {
  item: InventoryItem;
  loading: boolean;
  onClick: (item: InventoryItem) => void;
  animationStyle?: React.CSSProperties;
}

export default function VariantContainerBox({ 
  item, 
  loading, 
  onClick, 
  animationStyle 
}: VariantContainerBoxProps) {
  const { config } = useCategoryMetadata(item.category);

  return (
    <div 
      className={`${styles.variantContainerBox} ${loading ? styles.loading : ''}`}
      onClick={() => !loading && onClick(item)}
      style={animationStyle}
    >
      <div className={styles.containerLabel}>
        {config.variantDimensions?.filter(d => d.active).map(d => d.label).join(' / ').toUpperCase() || config.variantTypeLabel.toUpperCase()}
      </div>
      {item.brand && <div className={styles.brand}>{item.brand}</div>}
      <div className={styles.containerName}>{item.name}</div>
      <div className={styles.containerFooter}>
        Select {config.variantDimensions?.filter(d => d.active).map(d => d.label).join(' / ') || config.variantTypeLabel}
      </div>
    </div>
  );
}
