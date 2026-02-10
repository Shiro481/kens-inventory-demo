import { X, Receipt, User, CreditCard, Package, Calendar, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import styles from './TransactionDetailModal.module.css';
import type { Sale } from '../../../types/sales';

interface TransactionDetailModalProps {
  isOpen: boolean;
  transaction: Sale | null;
  onClose: () => void;
}

export default function TransactionDetailModal({ isOpen, transaction, onClose }: TransactionDetailModalProps) {
  if (!isOpen || !transaction) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return <CheckCircle size={16} className={styles.statusCompleted} />;
      case 'pending':
        return <AlertCircle size={16} className={styles.statusPending} />;
      case 'cancelled':
        return <AlertCircle size={16} className={styles.statusCancelled} />;
      default:
        return <CheckCircle size={16} className={styles.statusCompleted} />;
    }
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <div className={styles.headerContent}>
            <Receipt size={24} className={styles.receiptIcon} />
            <div>
              <h2>Transaction Details</h2>
              <p className={styles.receiptNumber}>{transaction.receipt_number || `#${transaction.id.slice(0, 8).toUpperCase()}`}</p>
            </div>
          </div>
          <button className={styles.closeButton} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className={styles.modalContent}>
          {/* Transaction Overview */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Transaction Overview</h3>
            <div className={styles.overviewGrid}>
              <div className={styles.overviewItem}>
                <Calendar size={16} className={styles.icon} />
                <div>
                  <p className={styles.label}>Date & Time</p>
                  <p className={styles.value}>{formatDate(transaction.created_at)}</p>
                </div>
              </div>
              <div className={styles.overviewItem}>
                <CreditCard size={16} className={styles.icon} />
                <div>
                  <p className={styles.label}>Payment Method</p>
                  <p className={styles.value}>{transaction.payment_method}</p>
                </div>
              </div>
              <div className={styles.overviewItem}>
                <CheckCircle size={16} className={styles.icon} />
                <div>
                  <p className={styles.label}>Status</p>
                  <div className={styles.statusContainer}>
                    {getStatusIcon(transaction.transaction_status || 'completed')}
                    <span className={styles.statusText}>{transaction.transaction_status || 'completed'}</span>
                  </div>
                </div>
              </div>
              {transaction.staff_id && (
                <div className={styles.overviewItem}>
                  <User size={16} className={styles.icon} />
                  <div>
                    <p className={styles.label}>Staff ID</p>
                    <p className={styles.value}>{transaction.staff_id}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Customer Information */}
          {(transaction.customer_name || transaction.customer_email) && (
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Customer Information</h3>
              <div className={styles.customerInfo}>
                {transaction.customer_name && (
                  <div className={styles.customerField}>
                    <User size={16} className={styles.icon} />
                    <div>
                      <p className={styles.label}>Name</p>
                      <p className={styles.value}>{transaction.customer_name}</p>
                    </div>
                  </div>
                )}
                {transaction.customer_email && (
                  <div className={styles.customerField}>
                    <User size={16} className={styles.icon} />
                    <div>
                      <p className={styles.label}>Email</p>
                      <p className={styles.value}>{transaction.customer_email}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Items Purchased */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Items Purchased</h3>
            <div className={styles.itemsList}>
              {transaction.items.map((item, index) => (
                <div key={index} className={styles.itemRow}>
                  <div className={styles.itemInfo}>
                    <Package size={16} className={styles.itemIcon} />
                    <div>
                      <p className={styles.itemName}>{item.name}</p>
                      <p className={styles.itemSku}>SKU: {item.sku || 'N/A'}</p>
                    </div>
                  </div>
                  <div className={styles.itemDetails}>
                    <div className={styles.itemQuantity}>
                      <span className={styles.quantityLabel}>Qty:</span>
                      <span className={styles.quantityValue}>{item.quantity}</span>
                    </div>
                    <div className={styles.itemPricing}>
                      <p className={styles.itemPrice}>{formatCurrency(item.price)}</p>
                      <p className={styles.itemSubtotal}>{formatCurrency(item.subtotal || (item.price * item.quantity))}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          {transaction.notes && (
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Notes</h3>
              <div className={styles.notesContainer}>
                <FileText size={16} className={styles.icon} />
                <p className={styles.notesText}>{transaction.notes}</p>
              </div>
            </div>
          )}

          {/* Summary */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Payment Summary</h3>
            <div className={styles.summary}>
              <div className={styles.summaryRow}>
                <span className={styles.summaryLabel}>Subtotal</span>
                <span className={styles.summaryValue}>{formatCurrency(transaction.subtotal)}</span>
              </div>
              <div className={styles.summaryRow}>
                <span className={styles.summaryLabel}>Tax</span>
                <span className={styles.summaryValue}>{formatCurrency(transaction.tax)}</span>
              </div>
              <div className={styles.summaryRowTotal}>
                <span className={styles.summaryLabelTotal}>Total</span>
                <span className={styles.summaryValueTotal}>{formatCurrency(transaction.total)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.modalFooter}>
          <button className={styles.printButton} onClick={() => window.print()}>
            <Receipt size={16} />
            Print Receipt
          </button>
          <button className={styles.closeFooterButton} onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
