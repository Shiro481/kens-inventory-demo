# Automotive Lights Inventory System - Database Schema Explanation

## Overview
This database schema is designed for a car maintenance shop inventory system focusing on automotive lights. It follows proper normalization principles with UUID primary keys, foreign key constraints, and optimized indexing for Supabase (PostgreSQL).

## Schema Structure

### Core Lookup Tables
1. **car_brands** - Vehicle manufacturers (Toyota, Honda, etc.)
2. **product_categories** - Light types (Headlight, Fog Light, Brake Light, etc.)
3. **bulb_types** - Standard bulb codes (H4, H7, 9005, etc.)
4. **suppliers** - Vendor information

### Main Entity Tables
1. **car_models** - Specific vehicle models with year ranges
2. **products** - Automotive lights with complete specifications

### Junction Table
1. **product_car_compatibility** - Many-to-many relationship between products and car models

## Why the Junction Table is Necessary

The junction table `product_car_compatibility` is essential because:

1. **Many-to-Many Relationship**: A single light product can fit multiple car models, and a car model can use multiple different lights.

2. **Additional Compatibility Information**: Stores installation-specific details like:
   - Installation position (Front Left, Front Right, Rear)
   - Beam type (High Beam, Low Beam, Fog Light)
   - Fitment requirements (Direct Fit, Modification Required)
   - Verification status and notes

3. **Scalability**: Allows for future expansion without schema changes
4. **Query Performance**: Optimized for compatibility lookups
5. **Data Integrity**: Prevents duplicate compatibility entries

## Key Features

### Normalization Benefits
- **No Data Redundancy**: Car brands and categories are stored once
- **Data Consistency**: Foreign key constraints ensure referential integrity
- **Easy Maintenance**: Updates to brand names or categories affect all related records
- **Scalability**: Easy to add new categories, brands, or attributes

### Performance Optimizations
- **Strategic Indexing**: Indexes on frequently queried columns
- **Composite Indexes**: Multi-column indexes for common search patterns
- **JSONB Fields**: Flexible storage for additional specifications
- **Views**: Pre-optimized queries for common data access patterns

### Production Features
- **Row Level Security**: Ready for multi-tenant implementations
- **Audit Trails**: Created/updated timestamps with automatic triggers
- **Data Validation**: Check constraints for business rules
- **UUID Primary Keys**: Globally unique identifiers for distributed systems

## Relationship Diagram

```
car_brands (1) ──────── (N) car_models (N) ──────── (1) product_car_compatibility (N) ──────── (1) products
                                                                                                    │
                                                                                                    │
                                                                          (1) product_categories (N)┤
                                                                          (1) bulb_types (N)       │
                                                                          (1) suppliers (N)         │
```

## Best Practices for Supabase Implementation

### 1. Database Setup
```sql
-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For fuzzy search
```

### 2. Security Implementation
```sql
-- Enable Row Level Security
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Create policies based on user roles
CREATE POLICY "Authenticated users can view products" 
ON products FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admin users can manage products" 
ON products FOR ALL USING (auth.role() = 'admin');
```

### 3. API Recommendations
- Use Supabase RPC functions for complex queries
- Implement proper error handling and validation
- Use database functions for business logic
- Cache frequently accessed data

### 4. Performance Optimization
- Use database views for complex joins
- Implement proper pagination
- Use connection pooling
- Monitor query performance with pg_stat_statements

## Scaling to Full ERP System

### Phase 1: Core Inventory (Current)
- Products and compatibility management
- Basic supplier relationships
- Stock tracking

### Phase 2: Operations
- Purchase orders
- Sales transactions
- Customer management
- Work orders integration

### Phase 3: Advanced Features
- Multi-location inventory
- Barcode scanning integration
- API integrations with suppliers
- Advanced reporting and analytics
- Mobile app support

### Phase 4: Enterprise Features
- Multi-tenant architecture
- Advanced user permissions
- Workflow automation
- Integration with accounting systems
- AI-powered inventory forecasting

## Implementation Steps

1. **Database Setup**: Run the schema creation script
2. **Data Migration**: Import existing data into new structure
3. **Application Updates**: Modify frontend to use new schema
4. **Testing**: Validate all relationships and constraints
5. **Performance Tuning**: Monitor and optimize queries
6. **Security Setup**: Configure RLS policies
7. **Backup Strategy**: Implement automated backups

## Query Examples

### Find compatible lights for a car
```sql
SELECT p.*, pcc.installation_position, pcc.beam_type
FROM products p
JOIN product_car_compatibility pcc ON p.id = pcc.product_id
JOIN car_models cm ON pcc.car_model_id = cm.id
JOIN car_brands cb ON cm.brand_id = cb.id
WHERE cb.name = 'Toyota' 
  AND cm.name = 'Camry'
  AND cm.year_from <= 2020
  AND (cm.year_to >= 2020 OR cm.year_to IS NULL);
```

### Find cars compatible with a product
```sql
SELECT cb.name as brand, cm.name as model, cm.year_from, cm.year_to, pcc.installation_position
FROM car_brands cb
JOIN car_models cm ON cb.id = cm.brand_id
JOIN product_car_compatibility pcc ON cm.id = pcc.car_model_id
WHERE pcc.product_id = 'your-product-uuid';
```

### Low stock alerts
```sql
SELECT p.name, p.sku, p.stock_quantity, p.reorder_level, s.name as supplier
FROM products p
LEFT JOIN suppliers s ON p.supplier_id = s.id
WHERE p.stock_quantity <= p.reorder_level
  AND p.is_active = true
ORDER BY (p.reorder_level - p.stock_quantity) DESC;
```

This schema provides a solid foundation for your automotive lights inventory system with room for future expansion into a comprehensive ERP solution.
