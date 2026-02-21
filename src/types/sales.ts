export interface SaleItem {
  id: number | string;
  name: string;
  sku?: string;
  price: number;
  quantity: number;
  subtotal?: number;
  variant_dimensions?: Record<string, string>;
  category?: string;
  specifications?: any;
}

export interface Sale {
  id: string;
  created_at: string;
  items: SaleItem[];
  total: number;
  subtotal: number;
  tax: number;
  payment_method: string;
  receipt_number?: string;
  transaction_status?: string;
  customer_name?: string;
  customer_email?: string;
  staff_id?: string;
  notes?: string;
}
