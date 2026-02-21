import * as XLSX from 'xlsx';
import type { Sale } from '../types/sales';

/**
 * Export sales data to Excel with two sheets:
 * 1. "Transactions" — one row per sale
 * 2. "Line Items"   — one row per item sold
 */
export const exportSalesToExcel = (sales: Sale[]) => {
  const wb = XLSX.utils.book_new();

  // ── Sheet 1: Transactions ──────────────────────────────────────────────────
  const summaryRows = sales.map(sale => ({
    'Transaction ID': `#${sale.id.slice(0, 8).toUpperCase()}`,
    'Date':           new Date(sale.created_at).toLocaleString(),
    'Items Sold':     sale.items.reduce((s, i) => s + i.quantity, 0),
    'Subtotal':       sale.subtotal ?? 0,
    'Tax':            sale.tax ?? 0,
    'Total':          sale.total ?? 0,
    'Payment Method': sale.payment_method,
    'Status':         sale.transaction_status || 'completed',
    'Notes':          sale.notes || '',
  }));
  const wsTransactions = XLSX.utils.json_to_sheet(summaryRows);
  autoWidth(wsTransactions, summaryRows);
  XLSX.utils.book_append_sheet(wb, wsTransactions, 'Transactions');

  // ── Sheet 2: Line Items ────────────────────────────────────────────────────
  const lineRows = sales.flatMap(sale =>
    sale.items.map(item => ({
      'Transaction ID': `#${sale.id.slice(0, 8).toUpperCase()}`,
      'Date':           new Date(sale.created_at).toLocaleDateString(),
      'Item Name':      item.name,
      'SKU':            item.sku || '',
      'Qty':            item.quantity,
      'Unit Price':     item.price,
      'Subtotal':       item.subtotal ?? (item.price * item.quantity),
    }))
  );
  const wsLineItems = XLSX.utils.json_to_sheet(lineRows);
  autoWidth(wsLineItems, lineRows);
  XLSX.utils.book_append_sheet(wb, wsLineItems, 'Line Items');

  const filename = `sales_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(wb, filename);
};

function autoWidth(ws: XLSX.WorkSheet, rows: Record<string, any>[]) {
  if (!rows.length) return;
  const keys = Object.keys(rows[0]);
  ws['!cols'] = keys.map(k => ({
    wch: Math.max(k.length, ...rows.map(r => String(r[k] ?? '').length)) + 2,
  }));
}
