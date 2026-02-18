-- =====================================================
-- AUTOMOTIVE LIGHTS INVENTORY SYSTEM DATABASE SCHEMA
-- =====================================================
-- Designed for Supabase (PostgreSQL) with proper normalization
-- UUID primary keys, foreign key constraints, and indexing
-- NOTE: Excludes suppliers table as it already exists

-- Enable UUID extension (Supabase has this enabled by default)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- CORE LOOKUP TABLES
-- =====================================================

-- Car Brands Table
CREATE TABLE car_brands (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    country VARCHAR(50),
    logo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Car Categories (for product categorization)
CREATE TABLE product_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bulb Types Table
CREATE TABLE bulb_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(20) NOT NULL UNIQUE, -- H4, H7, 9005, etc.
    description TEXT,
    base_type VARCHAR(50), -- PGJ19, P43T, etc.
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- MAIN ENTITY TABLES
-- =====================================================

-- Car Models Table
CREATE TABLE car_models (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    brand_id UUID NOT NULL REFERENCES car_brands(id) ON DELETE RESTRICT,
    name VARCHAR(100) NOT NULL,
    year_from INTEGER NOT NULL,
    year_to INTEGER,
    variant VARCHAR(100), -- EX, LX, Sport, etc.
    body_type VARCHAR(50), -- Sedan, SUV, Truck, etc.
    engine_type VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(brand_id, name, year_from, year_to, variant)
);

-- Products Table (Automotive Lights)
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sku VARCHAR(50) NOT NULL UNIQUE,
    barcode VARCHAR(100),
    name VARCHAR(200) NOT NULL,
    brand VARCHAR(100) NOT NULL, -- GPNE, Philips, Osram, etc.
    category_id UUID NOT NULL REFERENCES product_categories(id),
    bulb_type_id UUID REFERENCES bulb_types(id),
    
    -- Technical Specifications
    voltage DECIMAL(5,2), -- 12V, 24V
    wattage DECIMAL(5,2), -- 55W, 65W, etc.
    color_temperature INTEGER, -- Kelvin: 3000K, 4300K, 6000K
    lumens INTEGER, -- Brightness
    beam_type VARCHAR(20), -- High, Low, High/Low, Fog, etc.
    
    -- Pricing
    cost_price DECIMAL(10,2) NOT NULL,
    selling_price DECIMAL(10,2) NOT NULL,
    
    -- Inventory Management
    stock_quantity INTEGER NOT NULL DEFAULT 0,
    reorder_level INTEGER NOT NULL DEFAULT 10,
    min_stock_level INTEGER DEFAULT 5,
    
    -- Supplier Information (references existing suppliers table)
    supplier_id INTEGER REFERENCES suppliers(id),
    supplier_sku VARCHAR(50),
    
    -- Media and Status
    image_url TEXT,
    images JSONB DEFAULT '[]', -- Array of image URLs
    description TEXT,
    specifications JSONB DEFAULT '{}', -- Additional specs as key-value pairs
    is_active BOOLEAN DEFAULT true,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT positive_cost CHECK (cost_price >= 0),
    CONSTRAINT positive_price CHECK (selling_price >= 0),
    CONSTRAINT positive_stock CHECK (stock_quantity >= 0),
    CONSTRAINT reasonable_reorder CHECK (reorder_level >= 0)
);

-- =====================================================
-- JUNCTION TABLES (Many-to-Many Relationships)
-- =====================================================

-- Product-Car Compatibility Junction Table
CREATE TABLE product_car_compatibility (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    car_model_id UUID NOT NULL REFERENCES car_models(id) ON DELETE CASCADE,
    
    -- Compatibility Details
    installation_position VARCHAR(50), -- Front Left, Front Right, Rear, etc.
    beam_type VARCHAR(20), -- High Beam, Low Beam, Fog Light, etc.
    fitment_type VARCHAR(50), -- Direct Fit, Modification Required, etc.
    notes TEXT,
    
    -- Verification Status
    is_verified BOOLEAN DEFAULT false,
    verified_date TIMESTAMPTZ,
    verified_by VARCHAR(100),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure unique combination
    UNIQUE(product_id, car_model_id, installation_position, beam_type)
);

-- =====================================================
-- INDEXING FOR PERFORMANCE
-- =====================================================

-- Car Brands Indexes
CREATE INDEX idx_car_brands_name ON car_brands(name);

-- Car Models Indexes
CREATE INDEX idx_car_models_brand_id ON car_models(brand_id);
CREATE INDEX idx_car_models_name ON car_models(name);
CREATE INDEX idx_car_models_year_range ON car_models(year_from, year_to);
CREATE INDEX idx_car_models_search ON car_models(brand_id, name, year_from);

-- Products Indexes
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_barcode ON products(barcode);
CREATE INDEX idx_products_brand ON products(brand);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_bulb_type ON products(bulb_type_id);
CREATE INDEX idx_products_active ON products(is_active);
CREATE INDEX idx_products_stock ON products(stock_quantity);
CREATE INDEX idx_products_price ON products(selling_price);
CREATE INDEX idx_products_search ON products(brand, name, sku);
CREATE INDEX idx_products_supplier ON products(supplier_id);

-- Product Categories Indexes
CREATE INDEX idx_product_categories_name ON product_categories(name);

-- Bulb Types Indexes
CREATE INDEX idx_bulb_types_code ON bulb_types(code);

-- Compatibility Table Indexes
CREATE INDEX idx_compatibility_product_id ON product_car_compatibility(product_id);
CREATE INDEX idx_compatibility_car_model_id ON product_car_compatibility(car_model_id);
CREATE INDEX idx_compatibility_position ON product_car_compatibility(installation_position);
CREATE INDEX idx_compatibility_beam_type ON product_car_compatibility(beam_type);
CREATE INDEX idx_compatibility_verified ON product_car_compatibility(is_verified);

-- =====================================================
-- TRIGGERS FOR UPDATED_AT TIMESTAMPS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to tables with updated_at
CREATE TRIGGER update_car_brands_updated_at BEFORE UPDATE ON car_brands 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_car_models_updated_at BEFORE UPDATE ON car_models 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_compatibility_updated_at BEFORE UPDATE ON product_car_compatibility 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- SAMPLE DATA INSERTION (Optional)
-- =====================================================

-- Insert Product Categories
INSERT INTO product_categories (name, description) VALUES
('Headlight', 'Main front lighting assemblies'),
('Fog Light', 'Auxiliary front fog lights'),
('Brake Light', 'Rear brake lighting'),
('Signal Light', 'Turn signal indicators'),
('Parking Light', 'Side marker and parking lights'),
('Interior Light', 'Cabin and interior illumination'),
('LED Light Bar', 'Auxiliary LED lighting bars');

-- Insert Bulb Types
INSERT INTO bulb_types (code, description, base_type) VALUES
('H4', 'Dual filament high/low beam', 'P43T'),
('H7', 'Single filament low beam', 'PX26d'),
('9005', 'Single filament high beam', 'P20d'),
('9006', 'Single filament low beam', 'P22d'),
('9007', 'Dual filament high/low beam', 'P29t'),
('H11', 'Single filament low beam', 'PGJ19-2'),
('D2S', 'HID xenon bulb', 'P32d-2'),
('D4R', 'HID xenon bulb', 'P32d-5');

-- Insert Car Brands
INSERT INTO car_brands (name, country) VALUES
('Toyota', 'Japan'),
('Honda', 'Japan'),
('Mitsubishi', 'Japan'),
('Ford', 'USA'),
('Chevrolet', 'USA'),
('BMW', 'Germany'),
('Mercedes-Benz', 'Germany'),
('Audi', 'Germany');

-- =====================================================
-- VIEWS FOR COMMON QUERIES
-- =====================================================

-- View for Product Details with Compatibility
CREATE VIEW product_details AS
SELECT 
    p.*,
    pc.name as category_name,
    bt.code as bulb_type_code,
    s.name as supplier_name,
    COUNT(pcc.car_model_id) as compatible_car_count
FROM products p
LEFT JOIN product_categories pc ON p.category_id = pc.id
LEFT JOIN bulb_types bt ON p.bulb_type_id = bt.id
LEFT JOIN suppliers s ON p.supplier_id = s.id
LEFT JOIN product_car_compatibility pcc ON p.id = pcc.product_id
WHERE p.is_active = true
GROUP BY p.id, pc.name, bt.code, s.name;

-- View for Car Model Details with Compatible Products
CREATE VIEW car_model_details AS
SELECT 
    cm.*,
    cb.name as brand_name,
    COUNT(pcc.product_id) as compatible_product_count
FROM car_models cm
JOIN car_brands cb ON cm.brand_id = cb.id
LEFT JOIN product_car_compatibility pcc ON cm.id = pcc.car_model_id
GROUP BY cm.id, cb.name;

-- =====================================================
-- SECURITY POLICIES (Row Level Security)
-- =====================================================

-- Enable RLS on main tables (uncomment for production)
-- ALTER TABLE products ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE car_models ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE product_car_compatibility ENABLE ROW LEVEL SECURITY;

-- Example RLS Policies (customize based on your needs)
-- CREATE POLICY "Users can view active products" ON products
--     FOR SELECT USING (is_active = true);

-- CREATE POLICY "Users can insert products" ON products
--     FOR INSERT WITH CHECK (true);

-- CREATE POLICY "Users can update own products" ON products
--     FOR UPDATE USING (true);

-- CREATE POLICY "Users can delete products" ON products
--     FOR DELETE USING (true);
