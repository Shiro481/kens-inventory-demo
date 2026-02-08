export interface SaleItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
}

export interface Sale {
  id: string;
  created_at: string;
  items: SaleItem[];
  total: number;
  subtotal: number;
  tax: number;
  payment_method: string;
}
