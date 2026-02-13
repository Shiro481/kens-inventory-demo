import { useState } from 'react';
import { Package, Edit, Trash2, Eye, EyeOff, Zap, Info, ChevronDown, ChevronUp } from 'lucide-react';
import styles from './InventoryTable.module.css';
import { useSettings } from '../../../context/SettingsContext';
import type { InventoryItem } from '../../../types/inventory';

interface InventoryTableProps {
  items: InventoryItem[];
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
}

// Extended interface for automotive lights with additional specifications
interface AutomotiveLight extends InventoryItem {
  brand?: string;
  bulb_type?: string;
  voltage?: number;
  wattage?: number;
  color_temperature?: number;
  lumens?: number;
  beam_type?: string;
  barcode?: string;
  cost_price?: number;
  supplier?: string;
  image_url?: string;
  specifications?: Record<string, any>;
}

/**
 * Enhanced InventoryTable component - Displays automotive lights with full technical specifications
 * @param items - Array of inventory items to display
 * @param onEdit - Callback function to handle edit action for an item
 * @param onDelete - Callback function to handle delete action for an item
 */
export default function EnhancedInventoryTable({ items, onEdit, onDelete }: InventoryTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [showSpecs, setShowSpecs] = useState<Set<number>>(new Set());

  const toggleRowExpansion = (id: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const toggleSpecsVisibility = (id: number) => {
    const newSpecs = new Set(showSpecs);
    if (newSpecs.has(id)) {
      newSpecs.delete(id);
    } else {
      newSpecs.add(id);
    }
    setShowSpecs(newSpecs);
  };

  const formatCurrency = (amount: number) => {
    const { settings } = useSettings();
    return `${settings.currency_symbol}${amount.toFixed(2)}`;
  };

  const getStockStatusColor = (status: string) => {
    switch (status) {
      case 'In Stock': return styles.inStock;
      case 'Low Stock': return styles.lowStock;
      case 'Out of Stock': return styles.outStock;
      default: return '';
    }
  };

  const getBeamTypeColor = (beamType?: string) => {
    switch (beamType?.toLowerCase()) {
      case 'high': return '#ef4444';
      case 'low': return '#3b82f6';
      case 'fog': return '#f59e0b';
      case 'high/low': return '#8b5cf6';
      default: return '#6b7280';
    }
  };

  return (
    <>
      {/* Enhanced Table Header */}
      <div className={styles.enhancedTableHeader}>
        <span style={{ flex: '2' }}>Product Details</span>
        <span style={{ flex: '1' }}>Technical Specs</span>
        <span style={{ flex: '1' }}>Pricing</span>
        <span style={{ flex: '1' }}>Stock</span>
        <span style={{ flex: '1' }}>Status</span>
        <span style={{ flex: '0.5' }}>Actions</span>
      </div>

      {items.map((item) => {
        const light = item as AutomotiveLight;
        const { settings } = useSettings();
        const qty = light.stock ?? light.quantity ?? 0;
        const minQty = light.minQuantity ?? light.min_qty ?? settings.low_stock_threshold;
        const isExpanded = expandedRows.has(light.id);
        const showTechnicalSpecs = showSpecs.has(light.id);
        
        // Calculate stock status
        const getStockStatus = () => {
          if (qty === 0) return 'Out of Stock';
          return qty < minQty ? 'Low Stock' : 'In Stock';
        };
        const stockStatus = getStockStatus();
        
        // Calculate profit margin
        const profitMargin = light.cost_price && light.price 
          ? ((light.price - light.cost_price) / light.cost_price * 100).toFixed(1)
          : null;

        return (
          <div key={light.id} className={styles.enhancedRow}>
            {/* Main Product Row */}
            <div className={styles.mainProductRow}>
              {/* Product Details Column */}
              <div style={{ flex: '2' }} className={styles.productColumn}>
                <div className={styles.productHeader}>
                  <div className={styles.productInfo}>
                    <div className={styles.iconBox}>
                      {light.image_url ? (
                        <img src={light.image_url} alt={light.name} className={styles.productImage} />
                      ) : (
                        <Package size={20} />
                      )}
                    </div>
                    <div className={styles.productDetails}>
                      <div className={styles.productNameRow}>
                        <span className={styles.productName}>{light.name}</span>
                        {light.brand && (
                          <span className={styles.brandBadge}>{light.brand}</span>
                        )}
                      </div>
                      <div className={styles.productMeta}>
                        {light.sku && (
                          <span className={styles.skuLabel}>SKU: {light.sku}</span>
                        )}
                        {light.barcode && (
                          <span className={styles.barcodeLabel}>Barcode: {light.barcode}</span>
                        )}
                      </div>
                      {light.category && (
                        <div className={styles.categoryLabel}>{light.category}</div>
                      )}
                    </div>
                  </div>
                  <button
                    className={styles.expandButton}
                    onClick={() => toggleRowExpansion(light.id)}
                  >
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                </div>
              </div>

              {/* Technical Specs Column */}
              <div style={{ flex: '1' }} className={styles.specsColumn}>
                <div className={styles.specsSummary}>
                  {light.bulb_type && (
                    <div className={styles.specItem}>
                      <span className={styles.specLabel}>Bulb:</span>
                      <span className={styles.specValue}>{light.bulb_type}</span>
                    </div>
                  )}
                  {light.beam_type && (
                    <div className={styles.specItem}>
                      <span className={styles.specLabel}>Beam:</span>
                      <span 
                        className={styles.beamTypeBadge}
                        style={{ backgroundColor: getBeamTypeColor(light.beam_type) }}
                      >
                        {light.beam_type}
                      </span>
                    </div>
                  )}
                  <button
                    className={styles.viewSpecsButton}
                    onClick={() => toggleSpecsVisibility(light.id)}
                  >
                    {showTechnicalSpecs ? <EyeOff size={14} /> : <Eye size={14} />}
                    {showTechnicalSpecs ? 'Hide' : 'Specs'}
                  </button>
                </div>
              </div>

              {/* Pricing Column */}
              <div style={{ flex: '1' }} className={styles.pricingColumn}>
                <div className={styles.pricingInfo}>
                  <div className={styles.priceRow}>
                    <span className={styles.priceLabel}>Sell:</span>
                    <span className={styles.sellingPrice}>{formatCurrency(light.price || 0)}</span>
                  </div>
                  {light.cost_price && (
                    <div className={styles.priceRow}>
                      <span className={styles.costLabel}>Cost:</span>
                      <span className={styles.costPrice}>{formatCurrency(light.cost_price)}</span>
                    </div>
                  )}
                  {profitMargin && (
                    <div className={styles.profitMargin}>
                      <span className={profitMargin.startsWith('-') ? styles.negativeMargin : styles.positiveMargin}>
                        {profitMargin.startsWith('-') ? '' : '+'}{profitMargin}%
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Stock Column */}
              <div style={{ flex: '1' }} className={styles.stockColumn}>
                <div className={styles.stockInfo}>
                  <div className={styles.stockQuantity}>
                    <span className={styles.stockNumber}>{qty}</span>
                    <span className={styles.stockLabel}>units</span>
                  </div>
                  <div className={styles.stockThreshold}>
                    Min: {minQty}
                  </div>
                  {qty <= minQty && (
                    <div className={styles.reorderAlert}>
                      <Info size={12} />
                      Reorder
                    </div>
                  )}
                </div>
              </div>

              {/* Status Column */}
              <div style={{ flex: '1' }} className={styles.statusColumn}>
                <span className={`${styles.statusBadge} ${getStockStatusColor(stockStatus)}`}>
                  {stockStatus}
                </span>
                {light.supplier && (
                  <div className={styles.supplierInfo}>
                    <span className={styles.supplierLabel}>{light.supplier}</span>
                  </div>
                )}
              </div>

              {/* Actions Column */}
              <div style={{ flex: '0.5' }} className={styles.actionsColumn}>
                <div className={styles.actionButtons}>
                  <button 
                    className={styles.actionBtn} 
                    onClick={() => onEdit(light.id)}
                    title="Edit Item"
                  >
                    <Edit size={16} />
                  </button>
                  <button 
                    className={`${styles.actionBtn} ${styles.deleteBtn}`} 
                    onClick={() => onDelete(light.id)}
                    title="Delete Item"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>

            {/* Expanded Details Section */}
            {isExpanded && (
              <div className={styles.expandedDetails}>
                <div className={styles.detailsGrid}>
                  {/* Technical Specifications */}
                  {showTechnicalSpecs && (
                    <div className={styles.technicalSpecs}>
                      <h4 className={styles.sectionTitle}>
                        <Zap size={16} />
                        Technical Specifications
                      </h4>
                      <div className={styles.specsGrid}>
                        {light.voltage && (
                          <div className={styles.specDetail}>
                            <span className={styles.specDetailLabel}>Voltage:</span>
                            <span className={styles.specDetailValue}>{light.voltage}V</span>
                          </div>
                        )}
                        {light.wattage && (
                          <div className={styles.specDetail}>
                            <span className={styles.specDetailLabel}>Wattage:</span>
                            <span className={styles.specDetailValue}>{light.wattage}W</span>
                          </div>
                        )}
                        {light.color_temperature && (
                          <div className={styles.specDetail}>
                            <span className={styles.specDetailLabel}>Color Temp:</span>
                            <span className={styles.specDetailValue}>{light.color_temperature}K</span>
                          </div>
                        )}
                        {light.lumens && (
                          <div className={styles.specDetail}>
                            <span className={styles.specDetailLabel}>Lumens:</span>
                            <span className={styles.specDetailValue}>{light.lumens}</span>
                          </div>
                        )}
                      </div>
                      {light.specifications && Object.keys(light.specifications).length > 0 && (
                        <div className={styles.additionalSpecs}>
                          <h5>Additional Specifications:</h5>
                          {Object.entries(light.specifications).map(([key, value]) => (
                            <div key={key} className={styles.specDetail}>
                              <span className={styles.specDetailLabel}>{key}:</span>
                              <span className={styles.specDetailValue}>{String(value)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Stock Information */}
                  <div className={styles.stockDetails}>
                    <h4 className={styles.sectionTitle}>Stock Information</h4>
                    <div className={styles.stockMetrics}>
                      <div className={styles.stockMetric}>
                        <span className={styles.metricLabel}>Current Stock:</span>
                        <span className={styles.metricValue}>{qty} units</span>
                      </div>
                      <div className={styles.stockMetric}>
                        <span className={styles.metricLabel}>Reorder Level:</span>
                        <span className={styles.metricValue}>{minQty} units</span>
                      </div>
                      <div className={styles.stockMetric}>
                        <span className={styles.metricLabel}>Stock Value:</span>
                        <span className={styles.metricValue}>{formatCurrency((light.price || 0) * qty)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Supplier Information */}
                  {light.supplier && (
                    <div className={styles.supplierDetails}>
                      <h4 className={styles.sectionTitle}>Supplier Information</h4>
                      <div className={styles.supplierMetrics}>
                        <div className={styles.supplierMetric}>
                          <span className={styles.metricLabel}>Supplier:</span>
                          <span className={styles.metricValue}>{light.supplier}</span>
                        </div>
                        {light.cost_price && (
                          <div className={styles.supplierMetric}>
                            <span className={styles.metricLabel}>Last Cost:</span>
                            <span className={styles.metricValue}>{formatCurrency(light.cost_price)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}
