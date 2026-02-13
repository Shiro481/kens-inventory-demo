# Automotive Lights Inventory System - Implementation Guide

## Overview
This guide provides step-by-step instructions for implementing the new automotive lights database schema and enhanced inventory interface in your existing Supabase inventory management system.

## Database Implementation Steps

### 1. Database Schema Setup

1. **Connect to Supabase SQL Editor**
   - Go to your Supabase project dashboard
   - Navigate to SQL Editor
   - Create a new query

2. **Execute the Schema**
   - Copy the entire contents of `database_schema.sql`
   - Paste into the SQL Editor
   - Click "Run" to execute all tables

3. **Verify Table Creation**
   ```sql
   -- List all tables to verify creation
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public' 
   ORDER BY table_name;
   ```

### 2. Data Migration Strategy

#### Option A: Fresh Start (Recommended)
```sql
-- Insert sample data for testing
-- The schema includes sample data insertion statements
-- Run them after table creation
```

#### Option B: Migrate Existing Data
```sql
-- Example migration script (customize based on your current schema)
INSERT INTO products (
    sku, barcode, name, brand, category_id, cost_price, 
    selling_price, stock_quantity, reorder_level
)
SELECT 
    sku, 
    barcode, 
    name, 
    'Aftermarket' as brand, -- Default brand
    (SELECT id FROM product_categories WHERE name = 'Headlight') as category_id,
    cost,
    price,
    stock,
    min_qty
FROM your_current_parts_table;
```

### 3. Update Application Types

Create new TypeScript interfaces for the enhanced schema:

```typescript
// src/types/automotive-lights.ts
export interface AutomotiveLight {
  id: string;
  sku: string;
  barcode?: string;
  name: string;
  brand: string;
  category_id: string;
  category_name?: string;
  bulb_type_id?: string;
  bulb_type_code?: string;
  
  // Technical specifications
  voltage?: number;
  wattage?: number;
  color_temperature?: number;
  lumens?: number;
  beam_type?: string;
  
  // Pricing
  cost_price: number;
  selling_price: number;
  
  // Inventory
  stock_quantity: number;
  reorder_level: number;
  min_stock_level?: number;
  
  // Supplier
  supplier_id?: string;
  supplier_name?: string;
  supplier_sku?: string;
  
  // Media
  image_url?: string;
  images: string[];
  description?: string;
  specifications: Record<string, any>;
  
  // Status
  is_active: boolean;
  
  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface CarCompatibility {
  id: string;
  product_id: string;
  car_model_id: string;
  installation_position?: string;
  beam_type?: string;
  fitment_type?: string;
  notes?: string;
  is_verified: boolean;
  verified_date?: string;
  verified_by?: string;
}

export interface CarModel {
  id: string;
  brand_id: string;
  brand_name?: string;
  name: string;
  year_from: number;
  year_to?: number;
  variant?: string;
  body_type?: string;
  engine_type?: string;
  notes?: string;
}
```

### 4. Frontend Integration

#### Update Dashboard Component
Replace the current inventory table with the enhanced version:

```typescript
// src/pages/Dashboard/Dashboard.tsx
import EnhancedInventoryTable from './components/EnhancedInventoryTable';

// In the inventory view section:
{activeView === 'inventory' && (
  <>
    <header className={styles.header}>
      {/* ... existing header ... */}
    </header>

    {/* ... existing toolbar ... */}

    {/* ENHANCED INVENTORY TABLE */}
    <EnhancedInventoryTable 
      key={`${searchQuery}-${filterStatus}-${sortBy}`}
      items={filteredItems}
      onEdit={handleEditClick}
      onDelete={handleDelete}
    />
  </>
)}
```

#### Update Edit Modal
Enhance the edit modal to support new fields:

```typescript
// src/pages/Dashboard/components/EnhancedEditItemModal.tsx
// Create an enhanced version that includes:
// - Brand selection
// - Technical specifications (voltage, wattage, color temperature)
// - Bulb type selection
// - Beam type selection
// - Image upload
// - Additional specifications (JSON)
```

### 5. Supabase Integration

#### Create Database Functions
```sql
-- Function to get product with compatibility
CREATE OR REPLACE FUNCTION get_product_details(product_uuid UUID)
RETURNS TABLE (
  product_info JSONB,
  compatible_cars JSONB,
  supplier_info JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    row_to_json(p.*) as product_info,
    COALESCE(jsonb_agg(
      jsonb_build_object(
        'car_model', row_to_json(cm.*),
        'brand', cb.name,
        'compatibility', row_to_json(pcc.*)
      )
    ) FILTER (WHERE cm.id IS NOT NULL), '[]') as compatible_cars,
    row_to_json(s.*) as supplier_info
  FROM products p
  LEFT JOIN product_car_compatibility pcc ON p.id = pcc.product_id
  LEFT JOIN car_models cm ON pcc.car_model_id = cm.id
  LEFT JOIN car_brands cb ON cm.brand_id = cb.id
  LEFT JOIN suppliers s ON p.supplier_id = s.id
  WHERE p.id = product_uuid
  GROUP BY p.id, s.id;
END;
$$ LANGUAGE plpgsql;
```

#### Update API Service
```typescript
// src/services/automotiveLightsService.ts
import { supabase } from '../lib/supabase';

export class AutomotiveLightsService {
  async getProducts(filters?: ProductFilters) {
    let query = supabase
      .from('product_details')
      .select('*')
      .eq('is_active', true);

    if (filters?.brand) {
      query = query.eq('brand', filters.brand);
    }
    if (filters?.category) {
      query = query.eq('category_name', filters.category);
    }
    if (filters?.search) {
      query = query.or(`name.ilike.%${filters.search}%,sku.ilike.%${filters.search}%`);
    }

    const { data, error } = await query;
    return { data, error };
  }

  async getProductCompatibility(productId: string) {
    const { data, error } = await supabase
      .from('product_car_compatibility')
      .select(`
        *,
        car_models (
          id,
          name,
          year_from,
          year_to,
          variant,
          car_brands (name)
        )
      `)
      .eq('product_id', productId);

    return { data, error };
  }

  async addCompatibility(compatibility: Omit<CarCompatibility, 'id'>) {
    const { data, error } = await supabase
      .from('product_car_compatibility')
      .insert([compatibility])
      .select();

    return { data, error };
  }
}
```

### 6. New Features Implementation

#### Compatibility Management
Create a new component for managing product-car compatibility:

```typescript
// src/pages/Dashboard/components/CompatibilityManager.tsx
export default function CompatibilityManager({ productId }: { productId: string }) {
  // Implementation for:
  // - Adding new car compatibility
  // - Search cars by brand/model/year
  // - Edit compatibility details
  // - Remove compatibility
}
```

#### Advanced Search
Implement advanced search with multiple filters:

```typescript
// src/pages/Dashboard/components/AdvancedSearch.tsx
export default function AdvancedSearch({ onSearch }: { onSearch: (filters: SearchFilters) => void }) {
  // Filters for:
  // - Brand
  // - Category
  // - Bulb type
  // - Voltage range
  // - Color temperature
  // - Price range
  // - Stock status
}
```

### 7. Testing Strategy

#### Unit Tests
```typescript
// src/tests/automotiveLights.test.ts
describe('Automotive Lights Service', () => {
  test('should fetch products with filters', async () => {
    // Test implementation
  });

  test('should add product compatibility', async () => {
    // Test implementation
  });
});
```

#### Integration Tests
```typescript
// src/tests/integration/inventory.test.ts
describe('Inventory Integration', () => {
  test('should display enhanced product details', async () => {
    // Test implementation
  });
});
```

### 8. Performance Optimization

#### Database Indexes
The schema already includes optimized indexes. Monitor performance with:

```sql
-- Check query performance
EXPLAIN ANALYZE SELECT * FROM product_details WHERE brand = 'GPNE';

-- Monitor slow queries
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;
```

#### Caching Strategy
```typescript
// src/utils/cache.ts
export class ProductCache {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private ttl = 5 * 60 * 1000; // 5 minutes

  set(key: string, data: any) {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  get(key: string) {
    const item = this.cache.get(key);
    if (!item || Date.now() - item.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }
    return item.data;
  }
}
```

### 9. Security Implementation

#### Row Level Security
```sql
-- Enable RLS on sensitive tables
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_car_compatibility ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view products" ON products
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage products" ON products
  FOR ALL USING (auth.role() = 'admin');
```

### 10. Deployment Checklist

#### Pre-deployment
- [ ] Backup existing database
- [ ] Test schema on staging environment
- [ ] Run performance benchmarks
- [ ] Verify all API endpoints
- [ ] Test user permissions

#### Post-deployment
- [ ] Monitor database performance
- [ ] Check error logs
- [ ] Validate data integrity
- [ ] Update documentation
- [ ] Train users on new features

### 11. Monitoring and Maintenance

#### Database Monitoring
```sql
-- Create monitoring view
CREATE VIEW inventory_metrics AS
SELECT 
  COUNT(*) as total_products,
  COUNT(*) FILTER (WHERE is_active = true) as active_products,
  SUM(stock_quantity) as total_stock,
  SUM(stock_quantity * selling_price) as total_value,
  COUNT(*) FILTER (WHERE stock_quantity <= reorder_level) as low_stock_items
FROM products;
```

#### Health Checks
```typescript
// src/utils/healthCheck.ts
export async function performHealthCheck() {
  const checks = [
    checkDatabaseConnection(),
    checkApiEndpoints(),
    checkCachePerformance(),
    checkUserPermissions()
  ];

  const results = await Promise.allSettled(checks);
  return results;
}
```

## Troubleshooting

### Common Issues

1. **UUID Generation Errors**
   - Ensure uuid-ossp extension is enabled
   - Check Supabase extensions in dashboard

2. **Foreign Key Constraint Violations**
   - Verify referenced records exist
   - Check UUID format consistency

3. **Performance Issues**
   - Review query execution plans
   - Add missing indexes
   - Optimize large JSONB fields

4. **Row Level Security Issues**
   - Verify user authentication
   - Check policy definitions
   - Test with different user roles

### Debug Queries

```sql
-- Check table relationships
SELECT 
  tc.table_name, 
  kcu.column_name, 
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY';
```

This implementation guide provides a comprehensive roadmap for upgrading your inventory system to support automotive lights with full technical specifications and car compatibility management.
